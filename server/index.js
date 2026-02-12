import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { nanoid } from "nanoid";

dotenv.config();

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "data", "db.json");
const JWT = "qamqorS";
const PORT = 4000;
const SUPABASE_FUNCTION_URL = process.env.SUPABASE_FUNCTION_URL;
let db = null;

const emptyDb = {
  users: [],
  doctor_applications: [],
  medicines: [],
  forum_posts: [],
  forum_replies: [],
  symptom_logs: [],
  clinical_cases: [],
  case_collections: [],
  ai_chat_evaluations: [],
  ai_chat_sessions: [],
  admin_logs: [],
  health_articles: [],
};
const bannedWords = [
  "fuck",
  "shit",
  "bitch",
  "damn",
  "idiot",
  "stupid",
  "crazy",
  "retard",
  "dumb",
  "nonsense",
  "trash",
];

const escapeRegExp = (value) => typeof value === "string" ? value.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&") : value;

const sanitizeText = (value) => {
  if (typeof value !== "string") return value;
  let text = value;
  bannedWords.forEach((word) => {
    const pattern = new RegExp(`(?<!\\p{L})${escapeRegExp(word)}(?!\\p{L})`, "giu");
    text = text.replace(pattern, "***");
  });
  return text;
};

const sanitizeRequestBody = (body) => {
  return Object.fromEntries(
    Object.entries(body).map(([key, value]) => [
      key,
      typeof value === "string" ? sanitizeText(value) : value,
    ]),
  );
};

const sanitizeForumRecord = (record) => {
  if (!record) return record;
  const sanitized = { ...record };
  const textFields = ["title", "content", "body", "answer", "summary", "description"];
  textFields.forEach((key) => {
    if (sanitized[key]) {
      sanitized[key] = sanitizeText(sanitized[key]);
    }
  });
  if (Array.isArray(sanitized.tags)) {
    sanitized.tags = sanitized.tags.map((tag) => sanitizeText(tag));
  }
  sanitized.flagged = record.flagged || false;
  return sanitized;
};

const moderateText = (value) => {
  if (typeof value !== "string") return { text: value, flagged: false };
  const lowered = value.toLowerCase();
  const found = bannedWords.some((word) => lowered.includes(word));
  return { text: sanitizeText(value), flagged: found };
};

const isBodyFlagged = (body) => {
  return Object.values(body).some((value) => {
    if (typeof value !== "string") return false;
    return moderateText(value).flagged;
  });
};
const FORUM_MODERATOR_ROLES = new Set(["admin", "moderator"]);

const userHasForumModeration = (user) =>
  Boolean(
    user?.roles?.some((role) => FORUM_MODERATOR_ROLES.has(role)),
  );

const canManageForumPost = (user, post) =>
  Boolean(user) && (userHasForumModeration(user) || user.id === post.user_id);

const canManageForumReply = (user, reply) =>
  Boolean(user) && (userHasForumModeration(user) || user.id === reply.user_id);

const STOP_WORDS = new Set([
  "and", "the", "for", "with", "this", "that", "from", "your", "you",
  "will", "have", "has", "not", "are", "our", "can", "all", "how", "why",
  "more", "when", "what", "where", "who", "about", "each", "over",
]);

const POST_PENDING_STATUS = "pending";
const POST_VISIBLE_STATUS = "open";
const POST_REJECTED_STATUS = "rejected";
const HIDDEN_FORUM_STATUSES = new Set([POST_PENDING_STATUS, "flagged", POST_REJECTED_STATUS]);
const MODERATION_WARNING_MESSAGE =
  "Your post is awaiting moderator review and will only appear on the forum after a moderator approves it.";
const HEALTH_ONLY_FORUM_MESSAGE =
  "Only health-related content is allowed in the forum. Off-topic content is automatically removed.";
const HEALTH_TOPIC_KEYWORDS = [
  "health", "medical", "medicine", "symptom", "symptoms", "pain", "fever", "cough", "cold",
  "flu", "infection", "doctor", "hospital", "clinic", "disease", "diagnosis", "treatment",
  "therapy", "mental", "anxiety", "depression", "stress", "blood", "pressure", "heart",
  "diabetes", "asthma", "allergy", "pregnancy", "nutrition", "diet", "sleep", "headache",
  "nausea", "vomit", "stomach", "rash", "injury", "medicine", "drug", "dose", "recovery",
];

const isForumPostVisible = (post) => !HIDDEN_FORUM_STATUSES.has(post?.status);

function extractSignificantWords(text) {
  if (!text) return [];
  const normalized = sanitizeText(String(text)).toLowerCase();
  const matches = normalized.match(/\p{L}{3,}/gu);
  if (!matches) return [];
  return matches.filter((word) => !STOP_WORDS.has(word));
}

function buildForumAnalytics() {
  const posts = Array.isArray(db?.forum_posts) ? db.forum_posts : [];
  const totalPosts = posts.length;
  const statusBreakdown = {};
  let hiddenPosts = 0;

  const wordCounts = new Map();
  const tagCounts = new Map();
  const contributorMap = new Map();

  posts.forEach((post) => {
    const status = post.status || POST_VISIBLE_STATUS;
    statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
    if (HIDDEN_FORUM_STATUSES.has(status)) {
      hiddenPosts += 1;
    }

    extractSignificantWords(`${post.title || ""} ${post.content || ""}`).forEach((word) => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    });

    if (Array.isArray(post.tags)) {
      post.tags.forEach((tag) => {
        if (!tag) return;
        const cleaned = String(tag).toLowerCase().trim();
        if (!cleaned) return;
        tagCounts.set(cleaned, (tagCounts.get(cleaned) || 0) + 1);
      });
    }

    const userId = post.user_id;
    if (!userId) return;
    const contributor = contributorMap.get(userId) || {
      userId,
      displayName: "Unknown",
      postCount: 0,
      flaggedCount: 0,
    };
    contributor.postCount += 1;
    if (post.flagged || HIDDEN_FORUM_STATUSES.has(status)) {
      contributor.flaggedCount += 1;
    }
    const user = db.users?.find((user) => user.id === userId);
    if (user) {
      contributor.displayName = user.displayName || user.email || "Unknown";
    }
    contributorMap.set(userId, contributor);
  });

  const sortByCount = (entries) =>
    entries
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(({ label, count }) => ({ label, mentions: count }));

  const trendingTopics = sortByCount(
    [...wordCounts.entries()].map(([label, count]) => ({ label, count })),
  );
  const popularTags = sortByCount(
    [...tagCounts.entries()].map(([label, count]) => ({ label, count })),
  );
  const topContributors = [...contributorMap.values()]
    .sort((a, b) => b.postCount - a.postCount)
    .slice(0, 5);

  const mostPopularQuestionPost = posts
    .filter((post) => post.title && String(post.title).trim())
    .sort((a, b) => {
      const score = (b.views_count || 0) + (b.replies_count || 0) - ((a.views_count || 0) + (a.replies_count || 0));
      return score;
    })[0];

  const mostPopularQuestion = mostPopularQuestionPost
    ? {
        id: mostPopularQuestionPost.id,
        title: sanitizeText(String(mostPopularQuestionPost.title)).slice(0, 200),
        views: mostPopularQuestionPost.views_count || 0,
        replies: mostPopularQuestionPost.replies_count || 0,
      }
    : null;

  return {
    totalPosts,
    visiblePosts: totalPosts - hiddenPosts,
    hiddenPosts,
    statusBreakdown,
    trendingTopics,
    popularTags,
    topContributors,
    mostPopularQuestion,
  };
}

function buildAiConsultantAnalytics() {
  const evaluations = Array.isArray(db?.ai_chat_evaluations) ? db.ai_chat_evaluations : [];
  const evaluationCount = evaluations.length;
  const totals = {
    urgency: 0,
    safety: 0,
    handling: 0,
    consistency: 0,
  };
  const keywordCounts = new Map();

  evaluations.forEach((evaluation) => {
    totals.urgency += Number(evaluation.urgency_assessment_correctness) || 0;
    totals.safety += Number(evaluation.safety_of_recommendations) || 0;
    totals.handling += Number(evaluation.handling_of_uncertainty) || 0;
    totals.consistency += Number(evaluation.consistency_across_similar_cases) || 0;

    if (Array.isArray(evaluation.chat_sample)) {
      evaluation.chat_sample.forEach((item) => {
        extractSignificantWords(item.content).forEach((word) => {
          keywordCounts.set(word, (keywordCounts.get(word) || 0) + 1);
        });
      });
    }
  });

  const averages = {
    urgency: evaluationCount ? +(totals.urgency / evaluationCount).toFixed(2) : 0,
    safety: evaluationCount ? +(totals.safety / evaluationCount).toFixed(2) : 0,
    handling: evaluationCount ? +(totals.handling / evaluationCount).toFixed(2) : 0,
    consistency: evaluationCount ? +(totals.consistency / evaluationCount).toFixed(2) : 0,
  };

  const commonKeywords = [...keywordCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, count]) => ({ label, mentions: count }));

  return {
    evaluationCount,
    averages,
    commonKeywords,
  };
}

function buildMedicineAnalytics() {
  const medicines = Array.isArray(db?.medicines) ? db.medicines : [];
  const totalMedicines = medicines.length;
  const userCounts = new Map();
  const nameCounts = new Map();

  medicines.forEach((medicine) => {
    const userId = medicine.user_id;
    if (userId) {
      userCounts.set(userId, (userCounts.get(userId) || 0) + 1);
    }
    const normalized = sanitizeText(String(medicine.name || "")).toLowerCase().trim();
    if (normalized) {
      nameCounts.set(normalized, (nameCounts.get(normalized) || 0) + 1);
    }
  });

  const uniqueUsers = userCounts.size;
  const averagePerUser = uniqueUsers ? +(totalMedicines / uniqueUsers).toFixed(2) : 0;

  const topMedicines = [...nameCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count]) => ({ label, mentions: count }));

  return {
    totalMedicines,
    uniqueUsers,
    averagePerUser,
    topMedicines,
  };
}

function buildAiChatAnalytics() {
  const sessions = Array.isArray(db?.ai_chat_sessions) ? db.ai_chat_sessions : [];
  const sessionCount = sessions.length;
  const queryCounts = new Map();
  const keywordCounts = new Map();

  sessions.forEach((session) => {
    const question = String(session.question || "").trim();
    if (question) {
      queryCounts.set(question, (queryCounts.get(question) || 0) + 1);
    }
    if (Array.isArray(session.keywords)) {
      session.keywords.forEach((keyword) => {
        if (!keyword) return;
        keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
      });
    }
  });

  const topQueries = [...queryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count]) => ({ label, mentions: count }));

  const commonKeywords = [...keywordCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, count]) => ({ label, mentions: count }));

  return {
    sessionCount,
    topQueries,
    commonKeywords,
  };
}

function buildAnalyticsPayload() {
  if (!db) return null;
  return {
    timestamp: new Date().toISOString(),
    forum: buildForumAnalytics(),
    aiConsultant: buildAiConsultantAnalytics(),
    medicineCabinet: buildMedicineAnalytics(),
    aiChat: buildAiChatAnalytics(),
  };
}

function extractStructuredResponse(rawText) {
  const raw = String(rawText || "").trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  let parsed = null;
  if (jsonMatch) {
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      // ignore invalid JSON
    }
  }

  const fallbackText = raw.replace(jsonMatch?.[0] || "", "").trim();
  const candidate =
    (parsed?.response && String(parsed.response).trim()) ||
    fallbackText ||
    raw;

  const report =
    parsed?.report && typeof parsed.report === "object" ? parsed.report : null;

  return {
    text: String(candidate || "").trim(),
    report,
    parsed,
  };
}

async function makeSupabaseChatRequest(payload) {
  if (!SUPABASE_FUNCTION_URL) {
    throw new Error("AI assistant is not configured.");
  }

  const resp = await fetch(SUPABASE_FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const raw = await resp.text();

  if (!resp.ok) {
    const errorText = raw || resp.statusText;
    throw new Error(errorText || "AI service unavailable");
  }

  let parsed = null;
  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }
  }

  const candidate =
    parsed?.choices?.[0]?.message?.content ??
    parsed?.message?.content ??
    parsed?.response ??
    raw;

  const structured = extractStructuredResponse(candidate);
  return {
    raw,
    data: parsed,
    text: structured.text,
    report: structured.report,
    parsed: structured.parsed ?? parsed,
  };
}

function parseJsonSafe(value) {
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function moderateForumContentWithAI(text) {
  if (!text?.trim()) return null;

  try {
    const { text: aiText, data } = await makeSupabaseChatRequest({
      model: "google/gemini-3-flash-preview",
      stream: false,
      messages: [
        {
          role: "system",
          content: `You are a strict forum safety moderator for a medical platform. Classify whether this text should be flagged for human review. Flag when it contains self-harm intent, violence threats, hate speech, harassment, explicit sexual content, dangerous medical advice, or illegal instructions. Reply ONLY with valid JSON like {"flagged": true|false, "severity": "low"|"medium"|"high", "reasons": ["reason1","reason2"]}.`,
        },
        {
          role: "user",
          content: String(text).slice(0, 3500),
        },
      ],
    });

    const parsed = data ?? parseJsonSafe(aiText);
    if (!parsed) return null;

    return {
      flagged: Boolean(parsed.flagged),
      severity: ["low", "medium", "high"].includes(parsed.severity) ? parsed.severity : "low",
      reasons: Array.isArray(parsed.reasons)
        ? parsed.reasons.map((reason) => String(reason)).slice(0, 5)
        : [],
    };
  } catch (error) {
    console.error("Moderation AI failure", error);
    return null;
  }
}

function isLikelyHealthRelated(text) {
  if (!text?.trim()) return false;
  const lowered = sanitizeText(String(text)).toLowerCase();
  return HEALTH_TOPIC_KEYWORDS.some((keyword) => lowered.includes(keyword));
}

async function moderateForumTopicWithAI(text) {
  if (!text?.trim()) {
    return {
      healthRelated: false,
      confidence: "high",
      reasons: ["empty-content"],
      source: "validation",
    };
  }

  const heuristicHealthRelated = isLikelyHealthRelated(text);
  const aiEnabled = Boolean(SUPABASE_FUNCTION_URL);
  const buildFallbackResponse = (extraReasons = []) => {
    const reasons = [...extraReasons];
    if (heuristicHealthRelated) {
      reasons.push("keyword-match");
    } else {
      reasons.push("topic-check-fallback");
    }
    return {
      healthRelated: heuristicHealthRelated,
      confidence: heuristicHealthRelated ? "medium" : "high",
      reasons,
      source: "validation",
    };
  };

  if (!aiEnabled) {
    return buildFallbackResponse(["ai-disabled"]);
  }

  try {
    const { text: aiText, data } = await makeSupabaseChatRequest({
      model: "google/gemini-3-flash-preview",
      stream: false,
      messages: [
        {
          role: "system",
          content: `You are a strict forum topic moderator for a medical platform. Determine whether text is health-related. Health-related means symptoms, diseases, treatment, doctors, medications, mental health, nutrition, preventive care, or personal medical support. Reply ONLY with valid JSON: {"healthRelated": true|false, "confidence": "low"|"medium"|"high", "reasons": ["reason1","reason2"]}.`,
        },
        {
          role: "user",
          content: String(text).slice(0, 3500),
        },
      ],
    });

    const parsed = data ?? parseJsonSafe(aiText);
    if (!parsed || typeof parsed !== "object") {
      return buildFallbackResponse();
    }

    const parsedDecision =
      typeof parsed.healthRelated === "boolean"
        ? parsed.healthRelated
        : typeof parsed.isHealthRelated === "boolean"
          ? parsed.isHealthRelated
          : null;

    if (parsedDecision === null) {
      return buildFallbackResponse();
    }

    return {
      healthRelated: parsedDecision,
      confidence: ["low", "medium", "high"].includes(parsed.confidence) ? parsed.confidence : "low",
      reasons: Array.isArray(parsed.reasons)
        ? parsed.reasons.map((reason) => String(reason)).slice(0, 5)
        : [],
      source: "ai",
    };
  } catch (error) {
    console.error("Forum topic moderation AI failure", error);
    return buildFallbackResponse(["topic-check-error"]);
  }
}

const systemPrompt = `You are a professional AI health assistant for Qamqor, a medical information platform. Your role is to provide helpful, accurate, and safety-focused health information.

CRITICAL GUIDELINES:
1. NEVER provide medical diagnoses. You can only suggest possible conditions and recommend professional consultation.
2. Always use cautious, non-definitive language like "may indicate", "could be related to", "consider discussing with a doctor".
3. When risk seems high, strongly encourage immediate medical attention.
4. Be empathetic but professional.
5. Focus on education and awareness, not treatment recommendations.

For each user query about symptoms, you MUST respond with a structured JSON report:
{
  "response": "Your conversational response text here",
  "report": {
    "riskLevel": "low" | "medium" | "high",
    "possibleConditions": ["condition1", "condition2", "condition3"],
    "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
    "whenToSeeDoctor": "Specific guidance on when professional help is needed"
  }
}

Risk Level Guidelines:
- LOW: Common symptoms that typically resolve on their own (mild headache, minor cold symptoms)
- MEDIUM: Symptoms that warrant monitoring and possible doctor visit (persistent pain, moderate fever)
- HIGH: Symptoms that require prompt medical attention (severe pain, difficulty breathing, chest pain)

If the user's message is a greeting or general question not about symptoms, respond conversationally without the report object.

IMPORTANT DISCLAIMER that must be understood: This platform provides informational support only and does not replace professional medical advice.`;

async function loadDb() {
  try {
    const text = await fs.readFile(DB_PATH, "utf-8");
    const parsed = JSON.parse(text);
    parsed.ai_chat_evaluations = Array.isArray(parsed.ai_chat_evaluations) ? parsed.ai_chat_evaluations : [];
    parsed.ai_chat_sessions = Array.isArray(parsed.ai_chat_sessions) ? parsed.ai_chat_sessions : [];
    return parsed;
  } catch {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(emptyDb, null, 2));
    return JSON.parse(JSON.stringify(emptyDb));
  }
}

async function persistDb() {
  if (!db) return;
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
}

function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return {
    ...rest,
    banned: Boolean(user.banned),
    user_metadata: user.user_metadata || { display_name: user.displayName },
    app_metadata: user.app_metadata || { provider: "email", roles: user.roles },
  };
}

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      roles: user.roles,
    },
    JWT,
    { expiresIn: "7d" },
  );
}

function getAuthHeader(req) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");
  if (type?.toLowerCase() !== "bearer") {
    return null;
  }
  return token;
}

function decodeToken(token) {
  try {
    return jwt.verify(token, JWT);
  } catch {
    return null;
  }
}

function requireAuth(req, res, next) {
  const token = getAuthHeader(req);
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }
  const payload = decodeToken(token);
  if (!payload) {
    return res.status(401).json({ message: "Invalid token" });
  }
  const user = db.users.find((u) => u.id === payload.id);
  if (!user) {
    return res.status(401).json({ message: "User no longer exists" });
  }
  req.user = user;
  return next();
}

function ensureRoles(user) {
  if (!user.roles?.length) {
    user.roles = ["user"];
  }
  return user.roles;
}

function requireAdmin(req, res, next) {
  if (!req.user.roles?.includes("admin")) {
    return res.status(403).json({ message: "Admins only" });
  }
  return next();
}

function requireForumModerator(req, res, next) {
  if (!userHasForumModeration(req.user)) {
    return res.status(403).json({ message: "Forum moderator access required" });
  }
  return next();
}

function logAdminAction(adminId, action, target_type = null, target_id = null, details = null) {
  if (!db) return;
  db.admin_logs.push({
    id: nanoid(),
    admin_id: adminId,
    action,
    target_type,
    target_id,
    details,
    created_at: new Date().toISOString(),
  });
}

async function ensureAdminUser() {
  if (!db.users.find((u) => u.email === "admin@qamqor.local")) {
    const passwordHash = await bcrypt.hash("Admin123!", 10);
    const adminUser = {
      id: nanoid(),
      email: "admin@qamqor.local",
      displayName: "Admin",
      passwordHash,
      roles: ["admin", "doctor", "user", "moderator"],
      user_metadata: { display_name: "Admin" },
      app_metadata: { provider: "email", roles: ["admin", "doctor", "user", "moderator"] },
      created_at: new Date().toISOString(),
      banned: false,
    };
    db.users.push(adminUser);
    await persistDb();
  }
}

function createRouter() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.post("/api/auth/register", async (req, res) => {
    const { email, password, displayName, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const normalizedEmail = email.toLowerCase();
    if (db.users.some((u) => u.email === normalizedEmail)) {
      return res.status(409).json({ message: "User already exists" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const roles = ["user"];
    if (role === "doctor") {
      roles.push("doctor");
    }
    const newUser = {
      id: nanoid(),
      email: normalizedEmail,
      displayName: displayName || normalizedEmail.split("@")[0],
      passwordHash,
      roles,
      user_metadata: { display_name: displayName || normalizedEmail.split("@")[0] },
      app_metadata: { provider: "email", roles },
      created_at: new Date().toISOString(),
      banned: false,
    };
    db.users.push(newUser);
    await persistDb();
    const token = createToken(newUser);
    return res.status(201).json({ user: sanitizeUser(newUser), token });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const normalizedEmail = email.toLowerCase();
    const user = db.users.find((u) => u.email === normalizedEmail);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    if (user.banned) {
      return res.status(403).json({ message: "Account is banned" });
    }
    ensureRoles(user);
    await persistDb();
    const token = createToken(user);
    return res.json({ user: sanitizeUser(user), token });
  });

  app.get("/api/auth/me", requireAuth, (req, res) => {
    ensureRoles(req.user);
    return res.json({ user: sanitizeUser(req.user) });
  });

  app.post("/api/auth/logout", (req, res) => {
    return res.json({ success: true });
  });

  app.post("/api/doctor-applications", requireAuth, async (req, res) => {
    const { fullName, specialization, licenseNumber, bio, country, region, yearsOfExperience, workplace } = req.body;
    const application = {
      id: nanoid(),
      user_id: req.user.id,
      full_name: fullName || req.user.displayName,
      specialization: specialization || "",
      license_number: licenseNumber || null,
      bio: bio || null,
      country: country || null,
      region: region || null,
      years_of_experience: yearsOfExperience ? Number(yearsOfExperience) : null,
      workplace: workplace || null,
      status: "pending",
      submitted_at: new Date().toISOString(),
    };
    db.doctor_applications.push(application);
    if (!req.user.roles.includes("doctor")) {
      req.user.roles.push("doctor");
    }
    await persistDb();
    return res.status(201).json({ application });
  });

  app.get("/api/medicines", requireAuth, (req, res) => {
    const medicines = db.medicines.filter((med) => med.user_id === req.user.id);
    return res.json({ data: medicines });
  });

  app.post("/api/medicines", requireAuth, async (req, res) => {
    const medicine = {
      id: nanoid(),
      user_id: req.user.id,
      created_at: new Date().toISOString(),
      ...req.body,
    };
    db.medicines.push(medicine);
    await persistDb();
    return res.status(201).json({ data: medicine });
  });

  app.put("/api/medicines/:id", requireAuth, async (req, res) => {
    const medicine = db.medicines.find((med) => med.id === req.params.id && med.user_id === req.user.id);
    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }
    Object.assign(medicine, req.body);
    await persistDb();
    return res.json({ data: medicine });
  });

  app.delete("/api/medicines/:id", requireAuth, async (req, res) => {
    const index = db.medicines.findIndex((med) => med.id === req.params.id && med.user_id === req.user.id);
    if (index === -1) {
      return res.status(404).json({ message: "Medicine not found" });
    }
    db.medicines.splice(index, 1);
    await persistDb();
    return res.json({ success: true });
  });

  app.get("/api/symptom-logs", requireAuth, (req, res) => {
    const logs = db.symptom_logs.sort((a, b) => (new Date(b.symptom_date)) - (new Date(a.symptom_date)));
    return res.json({ data: logs });
  });

  app.post("/api/symptom-logs", requireAuth, async (req, res) => {
    const log = {
      id: nanoid(),
      created_at: new Date().toISOString(),
      ...req.body,
    };
    db.symptom_logs.push(log);
    await persistDb();
    return res.status(201).json({ data: log });
  });

  app.delete("/api/symptom-logs/:id", requireAuth, async (req, res) => {
    const index = db.symptom_logs.findIndex((log) => log.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: "Log not found" });
    }
    db.symptom_logs.splice(index, 1);
    await persistDb();
    return res.json({ success: true });
  });

  app.get("/api/forum/posts", (req, res) => {
    const posts = [...db.forum_posts]
      .filter(isForumPostVisible)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(sanitizeForumRecord);
    return res.json({ data: posts });
  });

  app.post("/api/forum/moderate", requireAuth, async (req, res) => {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: "Text is required for moderation" });
    }
    const result = moderateText(text);
    const aiModeration = await moderateForumContentWithAI(text);
    const topicModeration = await moderateForumTopicWithAI(text);
    return res.json({
      moderated: result.text,
      flagged: result.flagged || Boolean(aiModeration?.flagged) || !topicModeration.healthRelated,
      aiModeration,
      topicModeration,
    });
  });

  app.post("/api/forum/posts", requireAuth, async (req, res) => {
    const cleaned = sanitizeRequestBody(req.body);
    const topicModeration = await moderateForumTopicWithAI(`${req.body?.title || ""}\n${req.body?.content || ""}`);
    if (!topicModeration.healthRelated) {
      return res.status(422).json({
        message: HEALTH_ONLY_FORUM_MESSAGE,
        topicModeration,
      });
    }
    const keywordFlagged = isBodyFlagged(req.body);
    const aiModeration = await moderateForumContentWithAI(`${req.body?.title || ""}\n${req.body?.content || ""}`);
    const flagged = keywordFlagged || Boolean(aiModeration?.flagged);
    const postStatus = flagged ? POST_PENDING_STATUS : POST_VISIBLE_STATUS;
    const post = {
      id: nanoid(),
      user_id: req.user.id,
      created_at: new Date().toISOString(),
      status: postStatus,
      ...(flagged ? { statusBeforeModeration: POST_VISIBLE_STATUS } : {}),
      views_count: 0,
      replies_count: 0,
      ...cleaned,
      flagged,
      moderation: aiModeration
        ? { source: "ai", ...aiModeration }
        : keywordFlagged
          ? { source: "keyword", severity: "low", reasons: ["keyword-match"] }
          : null,
    };
    db.forum_posts.push(post);
    await persistDb();
    const responsePayload = { data: post };
    if (flagged) {
      responsePayload.warning = MODERATION_WARNING_MESSAGE;
    }
    return res.status(201).json(responsePayload);
  });

  app.post("/api/forum/posts/:postId/replies", requireAuth, async (req, res) => {
    const post = db.forum_posts.find((p) => p.id === req.params.postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    const isDoctor = req.user.roles?.includes("doctor");
    const isAdmin = req.user.roles?.includes("admin");
    if (!isDoctor && !isAdmin) {
      return res.status(403).json({ message: "Only doctors can reply to forum questions" });
    }
    const cleaned = sanitizeRequestBody(req.body);
    const topicModeration = await moderateForumTopicWithAI(req.body?.content || "");
    if (!topicModeration.healthRelated) {
      return res.status(422).json({
        message: HEALTH_ONLY_FORUM_MESSAGE,
        topicModeration,
      });
    }
    const keywordFlagged = isBodyFlagged(req.body);
    const aiModeration = await moderateForumContentWithAI(req.body?.content || "");
    const flagged = keywordFlagged || Boolean(aiModeration?.flagged);
    const reply = {
      id: nanoid(),
      post_id: post.id,
      user_id: req.user.id,
      created_at: new Date().toISOString(),
      is_doctor_reply: req.user.roles.includes("doctor"),
      ...cleaned,
      flagged,
      moderation: aiModeration
        ? { source: "ai", ...aiModeration }
        : keywordFlagged
          ? { source: "keyword", severity: "low", reasons: ["keyword-match"] }
          : null,
    };
    db.forum_replies.push(reply);
    post.replies_count = (post.replies_count || 0) + 1;
    if (reply.flagged) {
      post.statusBeforeModeration = post.statusBeforeModeration || post.status || POST_VISIBLE_STATUS;
      post.status = POST_PENDING_STATUS;
      post.flagged = true;
    } else if (reply.is_doctor_reply) {
      post.status = "answered";
    }
    await persistDb();
    return res.status(201).json({ data: reply });
  });

  app.get("/api/forum/posts/:postId/replies", (req, res) => {
    const replies = db.forum_replies
      .filter((reply) => reply.post_id === req.params.postId)
      .map(sanitizeForumRecord);
    return res.json({ data: replies });
  });

  app.post("/api/forum/posts/:postId/views", async (req, res) => {
    const post = db.forum_posts.find((p) => p.id === req.params.postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    post.views_count = (post.views_count || 0) + 1;
    await persistDb();
    return res.json({ data: post });
  });

  app.get("/api/forum/moderation/pending", requireAuth, requireForumModerator, (req, res) => {
    const pendingPosts = [...db.forum_posts]
      .filter((post) => HIDDEN_FORUM_STATUSES.has(post.status))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(sanitizeForumRecord);
    return res.json({ data: pendingPosts });
  });

  app.patch("/api/forum/posts/:postId/moderation", requireAuth, requireForumModerator, async (req, res) => {
    const post = db.forum_posts.find((p) => p.id === req.params.postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    const decision = String(req.body?.decision || "").toLowerCase();
    if (!["approve", "reject"].includes(decision)) {
      return res.status(400).json({ message: "Decision must be approve or reject" });
    }
    const note = req.body?.note ? String(req.body.note) : null;
    const now = new Date().toISOString();
    if (!Array.isArray(post.moderationHistory)) {
      post.moderationHistory = [];
    }
    post.moderationHistory.push({
      id: nanoid(),
      moderator_id: req.user.id,
      decision,
      note,
      created_at: now,
    });
    if (decision === "approve") {
      post.status = post.statusBeforeModeration || POST_VISIBLE_STATUS;
      delete post.statusBeforeModeration;
      post.flagged = false;
      post.moderationReview = {
        status: "approved",
        moderator_id: req.user.id,
        note,
        created_at: now,
      };
    } else {
      post.status = POST_REJECTED_STATUS;
      delete post.statusBeforeModeration;
      post.flagged = true;
      post.moderationReview = {
        status: "rejected",
        moderator_id: req.user.id,
        note,
        created_at: now,
      };
    }
    await persistDb();
    return res.json({ data: sanitizeForumRecord(post) });
  });

  app.patch("/api/forum/posts/:postId", requireAuth, async (req, res) => {
    const post = db.forum_posts.find((p) => p.id === req.params.postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (!canManageForumPost(req.user, post)) {
      return res.status(403).json({ message: "Not allowed" });
    }
    Object.assign(post, sanitizeRequestBody(req.body));
    await persistDb();
    return res.json({ data: post });
  });

  app.delete("/api/forum/posts/:postId", requireAuth, async (req, res) => {
    const postIndex = db.forum_posts.findIndex((p) => p.id === req.params.postId);
    if (postIndex === -1) {
      return res.status(404).json({ message: "Post not found" });
    }
    const post = db.forum_posts[postIndex];
    if (!canManageForumPost(req.user, post)) {
      return res.status(403).json({ message: "Not allowed" });
    }
    db.forum_posts.splice(postIndex, 1);
    db.forum_replies = db.forum_replies.filter((reply) => reply.post_id !== post.id);
    await persistDb();
    return res.json({ success: true });
  });

  app.delete("/api/forum/replies/:replyId", requireAuth, async (req, res) => {
    const replyIndex = db.forum_replies.findIndex((reply) => reply.id === req.params.replyId);
    if (replyIndex === -1) {
      return res.status(404).json({ message: "Reply not found" });
    }
    const reply = db.forum_replies[replyIndex];
    if (!canManageForumReply(req.user, reply)) {
      return res.status(403).json({ message: "Not allowed" });
    }
    db.forum_replies.splice(replyIndex, 1);
    const parentPost = db.forum_posts.find((p) => p.id === reply.post_id);
    if (parentPost) {
      parentPost.replies_count = Math.max(0, (parentPost.replies_count || 1) - 1);
    }
    await persistDb();
    return res.json({ success: true });
  });

  app.get("/api/clinical-cases", requireAuth, (req, res) => {
    return res.json({ data: db.clinical_cases });
  });

  app.get("/api/case-collections", requireAuth, (req, res) => {
    return res.json({ data: db.case_collections });
  });

  app.post("/api/clinical-cases", requireAuth, async (req, res) => {
    if (!req.user.roles.includes("doctor")) {
      return res.status(403).json({ message: "Doctors only" });
    }
    const clinicalCase = {
      id: nanoid(),
      doctor_id: req.user.id,
      created_at: new Date().toISOString(),
      symptoms: [],
      tags: [],
      ...req.body,
    };
    db.clinical_cases.push(clinicalCase);
    await persistDb();
    return res.status(201).json({ data: clinicalCase });
  });

  app.get("/api/admin/stats", requireAuth, (req, res) => {
    if (!req.user.roles.includes("admin")) {
      return res.status(403).json({ message: "Admins only" });
    }
    const totalUsers = db.users.length;
    const totalPosts = db.forum_posts.length;
    const flaggedPosts = db.forum_posts.filter((post) => HIDDEN_FORUM_STATUSES.has(post.status)).length;
    const pendingArticles = db.health_articles.filter((article) => article.needs_review).length;
    return res.json({
      stats: { totalUsers, totalPosts, flaggedPosts, pendingArticles },
    });
  });

  app.get("/api/admin/analytics", requireAuth, requireAdmin, (req, res) => {
    const payload = buildAnalyticsPayload();
    if (!payload) {
      return res.status(503).json({ message: "Analytics data unavailable" });
    }
    return res.json({ data: payload });
  });

  app.get("/api/admin/logs", requireAuth, (req, res) => {
    if (!req.user.roles.includes("admin")) {
      return res.status(403).json({ message: "Admins only" });
    }
    const logs = [...db.admin_logs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return res.json({ data: logs });
  });

  app.get("/api/admin/users", requireAuth, requireAdmin, (req, res) => {
    const users = db.users.map((user) => sanitizeUser(user));
    return res.json({ data: users });
  });

  app.post("/api/admin/users/:userId/ban", requireAuth, requireAdmin, async (req, res) => {
    const target = db.users.find((user) => user.id === req.params.userId);
    if (!target) {
      return res.status(404).json({ message: "User not found" });
    }
    if (target.banned) {
      return res.status(400).json({ message: "User already banned" });
    }
    target.banned = true;
    logAdminAction(req.user.id, `Banned user ${target.email}`, "user", target.id, null);
    await persistDb();
    return res.json({ data: sanitizeUser(target) });
  });

  app.post("/api/admin/users/:userId/unban", requireAuth, requireAdmin, async (req, res) => {
    const target = db.users.find((user) => user.id === req.params.userId);
    if (!target) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!target.banned) {
      return res.status(400).json({ message: "User is not banned" });
    }
    target.banned = false;
    logAdminAction(req.user.id, `Unbanned user ${target.email}`, "user", target.id, null);
    await persistDb();
    return res.json({ data: sanitizeUser(target) });
  });

  app.post("/api/admin/logs", requireAuth, async (req, res) => {
    if (!req.user.roles.includes("admin")) {
      return res.status(403).json({ message: "Admins only" });
    }
    const log = {
      id: nanoid(),
      admin_id: req.user.id,
      created_at: new Date().toISOString(),
      ...req.body,
    };
    db.admin_logs.push(log);
    await persistDb();
    return res.status(201).json({ data: log });
  });

  app.get("/api/facilities", async (req, res) => {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    const radius = Number(req.query.radius) || 5000;

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return res.status(400).json({ message: "lat/lon required" });
    }

    try {
      const facilities = await fetchFacilitiesOverpass(lat, lon, radius);
      return res.json({ data: facilities });
    } catch (error) {
      console.error("Failed to load facilities:", error);
      return res.status(502).json({ message: "Failed to query facilities" });
    }
  });

  app.post("/api/ai/medical-chat", async (req, res) => {
    if (!SUPABASE_FUNCTION_URL) {
      return res.json({
        response:
          "AI assistant is temporarily unavailable because the SUPABASE_FUNCTION_URL is not configured.",
      });
    }

    const { messages, language = "en" } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: "Messages are required" });
    }

    const payloadMessages = [
      {
        role: "system",
        content: `${systemPrompt}\n\nLanguage: ${language}`,
      },
      ...messages
        .map((message) => ({
          role: message.role === "assistant" ? "assistant" : "user",
          content: sanitizeText(String(message.content ?? "")),
        })),
    ];

    let responseText = "";
    let assistantReport = null;
    try {
      const { text, report } = await makeSupabaseChatRequest({
        messages: payloadMessages,
        language,
        model: "google/gemini-3-flash-preview",
        stream: false,
      });
      responseText = text;
      assistantReport = report ?? null;
    } catch (error) {
      console.error("Supabase chat error", error);
      const message = error instanceof Error ? error.message : "AI service unavailable";
      return res.status(502).json({ message });
    }

    const userMessage =
      messages?.find((message) => message.role === "user")?.content || "";
    const sanitizedQuestion = sanitizeText(String(userMessage || "")).trim().slice(0, 400);
    const keywords = extractSignificantWords(userMessage).slice(0, 6);

    if (!Array.isArray(db.ai_chat_sessions)) {
      db.ai_chat_sessions = [];
    }
    db.ai_chat_sessions.push({
      id: nanoid(),
      question: sanitizedQuestion,
      keywords,
      language,
      response_summary: sanitizeText(responseText).slice(0, 400),
      created_at: new Date().toISOString(),
    });
    await persistDb();

    const safeResponse = responseText || "AI assistant did not return a response.";
    return res.json({
      response: safeResponse,
      report: assistantReport,
    });
  });

  app.post("/api/ai/chat-evaluations", requireAuth, async (req, res) => {
    if (!req.user.roles.includes("doctor")) {
      return res.status(403).json({ message: "Doctors only" });
    }

    const {
      urgencyAssessmentCorrectness,
      safetyOfRecommendations,
      handlingOfUncertainty,
      consistencyAcrossSimilarCases,
      notes,
      chatSample,
    } = req.body || {};

    const scoreFields = {
      urgencyAssessmentCorrectness,
      safetyOfRecommendations,
      handlingOfUncertainty,
      consistencyAcrossSimilarCases,
    };

    for (const [key, value] of Object.entries(scoreFields)) {
      const numericValue = Number(value);
      if (!Number.isFinite(numericValue) || numericValue < 1 || numericValue > 100) {
        return res.status(400).json({
          message: `Invalid score for ${key}. Expected a number between 1 and 100.`,
        });
      }
    }

    if (notes != null && typeof notes !== "string") {
      return res.status(400).json({ message: "Notes must be a string" });
    }

    if (chatSample != null && !Array.isArray(chatSample)) {
      return res.status(400).json({ message: "chatSample must be an array" });
    }

    if (!Array.isArray(db.ai_chat_evaluations)) {
      db.ai_chat_evaluations = [];
    }

    const evaluation = {
      id: nanoid(),
      doctor_id: req.user.id,
      urgency_assessment_correctness: Number(urgencyAssessmentCorrectness),
      safety_of_recommendations: Number(safetyOfRecommendations),
      handling_of_uncertainty: Number(handlingOfUncertainty),
      consistency_across_similar_cases: Number(consistencyAcrossSimilarCases),
      notes: sanitizeText((notes || "").trim()),
      chat_sample: (chatSample || []).slice(0, 20).map((item) => ({
        role: item?.role === "assistant" ? "assistant" : "user",
        content: sanitizeText(String(item?.content || "")).slice(0, 1000),
      })),
      created_at: new Date().toISOString(),
    };

    db.ai_chat_evaluations.push(evaluation);
    await persistDb();
    return res.status(201).json({ data: evaluation });
  });

  return app;
}

async function fetchFacilitiesOverpass(lat, lon, radius) {
  const query = `[out:json][timeout:25];
(node["amenity"~"pharmacy|hospital|clinic"](around:${radius},${lat},${lon});
way["amenity"~"pharmacy|hospital|clinic"](around:${radius},${lat},${lon});
relation["amenity"~"pharmacy|hospital|clinic"](around:${radius},${lat},${lon});
);
out center;`;

  const body = new URLSearchParams({ data: query }).toString();

  try {
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body,
    });

    if (!res.ok) {
      console.error("Overpass response not ok", await res.text());
      return [];
    }

    const data = await res.json();
    return (data.elements || [])
      .map((el) => {
        const latlon =
          el.type === "node"
            ? { lat: el.lat, lon: el.lon }
            : el.center
              ? { lat: el.center.lat, lon: el.center.lon }
              : null;
        if (!latlon) return null;
        const addressParts = [];
        if (el.tags?.["addr:street"]) addressParts.push(el.tags["addr:street"]);
        if (el.tags?.["addr:housenumber"]) addressParts.push(el.tags["addr:housenumber"]);
        if (el.tags?.["addr:city"]) addressParts.push(el.tags["addr:city"]);
        return {
          id: `${el.type}-${el.id}`,
          name: el.tags?.name || "Место",
          type:
            el.tags?.amenity === "hospital"
              ? "hospital"
              : el.tags?.amenity === "clinic"
                ? "clinic"
                : "pharmacy",
          coordinates: [latlon.lon, latlon.lat],
          address: addressParts.join(", ") || el.tags?.village || el.tags?.city || "",
          phone: el.tags?.phone || el.tags?.["contact:phone"] || "",
          hours: el.tags?.opening_hours || "—",
          website: el.tags?.website || el.tags?.url,
          specializations: [],
          doctorSummary: "",
        };
      })
      .filter(Boolean);
  } catch (error) {
    console.error("Overpass request failed", error);
    return [];
  }
}

async function start() {
  db = await loadDb();
  await ensureAdminUser();
  const app = createRouter();
  app.listen(PORT, () => {
    console.log(`Qamqor API running`);
  });
}

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
