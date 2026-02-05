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
const JWT_SECRET = process.env.JWT_SECRET || "qamqor-secret";
const PORT = process.env.PORT || 4000;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
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

async function moderateForumContentWithAI(text) {
  if (!GOOGLE_API_KEY || !text?.trim()) return null;

  const model = "models/gemini-2.5-flash";
  const prompt = `You are a strict forum safety moderator.
Classify whether this forum text should be flagged for human review.

Flag when content contains: self-harm intent, violence threats, hate speech, harassment, explicit sexual content, dangerous medical advice, or illegal activity instructions.

Return ONLY valid JSON:
{
  "flagged": boolean,
  "severity": "low" | "medium" | "high",
  "reasons": string[]
}

Text:
${String(text).slice(0, 3500)}`;

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${GOOGLE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0 },
      }),
    },
  );

  if (!resp.ok) return null;

  const data = await resp.json().catch(() => null);
  const rawText =
    data?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text || "")
      .join("")
      .trim() || "";
  if (!rawText) return null;

  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      flagged: Boolean(parsed?.flagged),
      severity: ["low", "medium", "high"].includes(parsed?.severity) ? parsed.severity : "low",
      reasons: Array.isArray(parsed?.reasons)
        ? parsed.reasons.map((reason) => String(reason)).slice(0, 5)
        : [],
    };
  } catch {
    return null;
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
    return JSON.parse(text);
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
    JWT_SECRET,
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
    return jwt.verify(token, JWT_SECRET);
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
    return res.json({
      moderated: result.text,
      flagged: result.flagged || Boolean(aiModeration?.flagged),
      aiModeration,
    });
  });

  app.post("/api/forum/posts", requireAuth, async (req, res) => {
    const cleaned = sanitizeRequestBody(req.body);
    const keywordFlagged = isBodyFlagged(req.body);
    const aiModeration = await moderateForumContentWithAI(`${req.body?.title || ""}\n${req.body?.content || ""}`);
    const flagged = keywordFlagged || Boolean(aiModeration?.flagged);
    const post = {
      id: nanoid(),
      user_id: req.user.id,
      created_at: new Date().toISOString(),
      status: flagged ? "flagged" : "open",
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
    return res.status(201).json({ data: post });
  });

  app.post("/api/forum/posts/:postId/replies", requireAuth, async (req, res) => {
    const post = db.forum_posts.find((p) => p.id === req.params.postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    const cleaned = sanitizeRequestBody(req.body);
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
      post.status = "flagged";
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
    const flaggedPosts = db.forum_posts.filter((post) => post.status === "flagged").length;
    const pendingArticles = db.health_articles.filter((article) => article.needs_review).length;
    return res.json({
      stats: { totalUsers, totalPosts, flaggedPosts, pendingArticles },
    });
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
    if (!GOOGLE_API_KEY) {
      return res.json({
        response:
          "AI assistant is temporarily unavailable because the GOOGLE_API_KEY is not configured.",
      });
    }

    const { messages, language = "en" } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: "Messages are required" });
    }

    const contents = [
      {
        role: "user",
        parts: [{ text: `${systemPrompt}\n\nLanguage: ${language}` }],
      },
      ...messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: String(m.content ?? "") }],
      })),
    ];

    const model = "models/gemini-2.5-flash"; 

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
          },
        }),
      }
    );

    if (!resp.ok) {
      const errorBody = await resp.text().catch(() => "");
      console.error("Gemini error", resp.status, resp.statusText, errorBody);

      const message =
        resp.status === 429
          ? "Rate limit exceeded. Please try again later."
          : resp.status === 402
            ? "AI usage limit reached."
            : "AI service unavailable";

      return res.status(resp.status).json({ message });
    }

    const data = await resp.json();

    const text =
      data.candidates?.[0]?.content?.parts
        ?.map((p) => p.text || "")
        .join("") || "";

    return res.json({ response: text });
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
(node["amenity"="pharmacy"](around:${radius},${lat},${lon});
way["amenity"="pharmacy"](around:${radius},${lat},${lon});
relation["amenity"="pharmacy"](around:${radius},${lat},${lon});
);
out center;`;

  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
    body: query,
  });

  if (!res.ok) {
    throw new Error("Overpass request failed");
  }

  const data = await res.json();
  console.log(data);
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
          name: el.tags?.name || "Аптека",
          type: "pharmacy",
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
}

async function start() {
  db = await loadDb();
  await ensureAdminUser();
  const app = createRouter();
  app.listen(PORT, () => {
    console.log(`Qamqor API running on http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
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
const JWT_SECRET = process.env.JWT_SECRET || "qamqor-secret";
const PORT = process.env.PORT || 4000;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
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
    return JSON.parse(text);
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
    JWT_SECRET,
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
    return jwt.verify(token, JWT_SECRET);
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
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(sanitizeForumRecord);
    return res.json({ data: posts });
  });

  app.post("/api/forum/moderate", requireAuth, (req, res) => {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: "Text is required for moderation" });
    }
    const result = moderateText(text);
    return res.json({ moderated: result.text, flagged: result.flagged });
  });

  app.post("/api/forum/posts", requireAuth, async (req, res) => {
    const cleaned = sanitizeRequestBody(req.body);
    const post = {
      id: nanoid(),
      user_id: req.user.id,
      created_at: new Date().toISOString(),
      status: "open",
      views_count: 0,
      replies_count: 0,
      ...cleaned,
      flagged: isBodyFlagged(req.body),
    };
    db.forum_posts.push(post);
    await persistDb();
    return res.status(201).json({ data: post });
  });

  app.post("/api/forum/posts/:postId/replies", requireAuth, async (req, res) => {
    const post = db.forum_posts.find((p) => p.id === req.params.postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    const cleaned = sanitizeRequestBody(req.body);
    const reply = {
      id: nanoid(),
      post_id: post.id,
      user_id: req.user.id,
      created_at: new Date().toISOString(),
      is_doctor_reply: req.user.roles.includes("doctor"),
      ...cleaned,
      flagged: isBodyFlagged(req.body),
    };
    db.forum_replies.push(reply);
    post.replies_count = (post.replies_count || 0) + 1;
    if (reply.is_doctor_reply) {
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
    const flaggedPosts = db.forum_posts.filter((post) => post.status === "flagged").length;
    const pendingArticles = db.health_articles.filter((article) => article.needs_review).length;
    return res.json({
      stats: { totalUsers, totalPosts, flaggedPosts, pendingArticles },
    });
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
    if (!GOOGLE_API_KEY) {
      return res.json({
        response:
          "AI assistant is temporarily unavailable because the GOOGLE_API_KEY is not configured.",
      });
    }

    const { messages, language = "en" } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: "Messages are required" });
    }

    const contents = [
      {
        role: "user",
        parts: [{ text: `${systemPrompt}\n\nLanguage: ${language}` }],
      },
      ...messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: String(m.content ?? "") }],
      })),
    ];

    const model = "models/gemini-2.5-flash"; 

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
          },
        }),
      }
    );

    if (!resp.ok) {
      const errorBody = await resp.text().catch(() => "");
      console.error("Gemini error", resp.status, resp.statusText, errorBody);

      const message =
        resp.status === 429
          ? "Rate limit exceeded. Please try again later."
          : resp.status === 402
            ? "AI usage limit reached."
            : "AI service unavailable";

      return res.status(resp.status).json({ message });
    }

    const data = await resp.json();

    const text =
      data.candidates?.[0]?.content?.parts
        ?.map((p) => p.text || "")
        .join("") || "";

    return res.json({ response: text });
  });

  return app;
}

async function fetchFacilitiesOverpass(lat, lon, radius) {
  const query = `[out:json][timeout:25];
(node["amenity"="pharmacy"](around:${radius},${lat},${lon});
way["amenity"="pharmacy"](around:${radius},${lat},${lon});
relation["amenity"="pharmacy"](around:${radius},${lat},${lon});
);
out center;`;

  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
    body: query,
  });

  if (!res.ok) {
    throw new Error("Overpass request failed");
  }

  const data = await res.json();
  console.log(data);
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
          name: el.tags?.name || "Аптека",
          type: "pharmacy",
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
}

async function start() {
  db = await loadDb();
  await ensureAdminUser();
  const app = createRouter();
  app.listen(PORT, () => {
    console.log(`Qamqor API running on http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
