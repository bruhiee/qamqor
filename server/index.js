import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { nanoid } from "nanoid";
import { randomInt } from "crypto";

dotenv.config();

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
];
let overpassCooldownUntil = 0;
const OVERPASS_DEBUG = process.env.OVERPASS_DEBUG === "1";
const OVERPASS_ENABLED = process.env.OVERPASS_ENABLED !== "0";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "data", "db.json");
const JWT = "qamqorS";
const PORT = Number(process.env.PORT || 4000);
const SUPABASE_FUNCTION_URL = process.env.SUPABASE_FUNCTION_URL;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || "";
let db = null;

const emptyDb = {
  users: [],
  doctor_applications: [],
  medicines: [],
  medicine_history: [],
  medicine_notifications: [],
  medicine_notification_prefs: [],
  forum_posts: [],
  forum_replies: [],
  symptom_logs: [],
  clinical_cases: [],
  case_collections: [],
  ai_chat_evaluations: [],
  ai_chat_sessions: [],
  ai_chat_histories: [],
  doctor_reply_training_samples: [],
  two_factor_challenges: [],
  email_verification_challenges: [],
  user_profiles: [],
  bookmarks: [],
  tutorial_status: [],
  admin_logs: [],
  health_articles: [],
  health_news_events: [],
  medical_facilities: [],
};

const DEFAULT_MEDICAL_FACILITIES = [
  {
    id: "fallback-astana-hospital",
    name: "Astana City Hospital",
    type: "hospital",
    coordinates: [71.4306, 51.1283],
    address: "Astana, Kazakhstan",
    phone: "+7 (7172) 70-00-00",
    hours: "24/7",
    specializations: ["Emergency", "Surgery", "Cardiology"],
  },
  {
    id: "fallback-almaty-clinic",
    name: "Almaty Family Clinic",
    type: "clinic",
    coordinates: [76.9286, 43.222],
    address: "Almaty, Kazakhstan",
    phone: "+7 (727) 250-00-00",
    hours: "Mon-Sat: 08:00-20:00",
    specializations: ["General Practice", "Pediatrics"],
  },
  {
    id: "fallback-shymkent-pharmacy",
    name: "Shymkent Central Pharmacy",
    type: "pharmacy",
    coordinates: [69.5901, 42.3242],
    address: "Shymkent, Kazakhstan",
    phone: "+7 (7252) 55-12-34",
    hours: "08:00-23:00",
  },
  {
    id: "fallback-ny-hospital",
    name: "NYC General Hospital",
    type: "hospital",
    coordinates: [-73.9857, 40.7484],
    address: "New York, USA",
    phone: "+1 (212) 555-0100",
    hours: "24/7",
    specializations: ["Emergency", "Cardiology", "Oncology"],
  },
  {
    id: "fallback-london-hospital",
    name: "London General Hospital",
    type: "hospital",
    coordinates: [-0.1276, 51.5074],
    address: "London, United Kingdom",
    phone: "+44 20 7188 7188",
    hours: "24/7",
    specializations: ["Emergency", "Internal Medicine"],
  },
  {
    id: "fallback-berlin-clinic",
    name: "Berlin Medical Clinic",
    type: "clinic",
    coordinates: [13.4049, 52.52],
    address: "Berlin, Germany",
    phone: "+49 30 1234 5678",
    hours: "Mon-Fri: 08:00-19:00",
    specializations: ["Family Medicine", "Diagnostics"],
  },
];

function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
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
  const textFields = [
    "title",
    "content",
    "body",
    "answer",
    "summary",
    "description",
    "symptom_description",
    "symptom_duration",
    "additional_details",
  ];
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
const REGION_KEYWORDS = [
  { label: "Kazakhstan", aliases: ["kazakhstan", "Р°СЃС‚Р°РЅР°", "almaty", "Р°Р»РјР°С‚С‹", "С€С‹РјРєРµРЅС‚", "shymkent", "Р°РєС‚РѕР±Рµ", "aktobe", "Р°С‚С‹СЂР°Сѓ", "atyrau"] },
  { label: "Russia", aliases: ["russia", "СЂРѕСЃСЃРёСЏ", "moscow", "РјРѕСЃРєРІР°"] },
  { label: "United States", aliases: ["usa", "united states", "america", "new york", "nyc", "chicago"] },
  { label: "United Kingdom", aliases: ["uk", "united kingdom", "england", "london"] },
  { label: "Germany", aliases: ["germany", "berlin", "РіРµСЂРјР°РЅРёСЏ", "Р±РµСЂР»РёРЅ"] },
  { label: "Central Asia", aliases: ["uzbekistan", "kyrgyzstan", "tajikistan", "turkmenistan"] },
];
const SYMPTOM_KEYWORDS = [
  "fever", "cough", "headache", "nausea", "vomit", "rash", "sore", "throat", "pain",
  "fatigue", "dizziness", "diarrhea", "cold", "flu", "infection", "temperature", "breath",
  "Р¶Р°СЂ", "РєР°С€РµР»СЊ", "РіРѕР»РѕРІР°", "Р±РѕР»СЊ", "РіРѕСЂР»Рѕ", "СЃС‹РїСЊ", "С‚РѕС€РЅРѕС‚Р°", "СЂРІРѕС‚Р°", "СЃР»Р°Р±РѕСЃС‚СЊ",
];

const POST_PENDING_STATUS = "pending";
const POST_VISIBLE_STATUS = "open";
const POST_REJECTED_STATUS = "rejected";
const FORUM_POST_COOLDOWN_MS = 5 * 60 * 1000;
const forumPostCreationLocks = new Set();
const HIDDEN_FORUM_STATUSES = new Set([POST_PENDING_STATUS, "flagged", POST_REJECTED_STATUS]);
const REPLY_PENDING_STATUS = "pending";
const REPLY_VISIBLE_STATUS = "open";
const REPLY_REJECTED_STATUS = "rejected";
const HIDDEN_FORUM_REPLY_STATUSES = new Set([REPLY_PENDING_STATUS, REPLY_REJECTED_STATUS]);
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
const DOCTOR_APPLICATION_PENDING = "pending";
const DOCTOR_APPLICATION_APPROVED = "approved";
const DOCTOR_APPLICATION_REJECTED = "rejected";
const DOCTOR_APPLICATION_STATUSES = new Set([
  DOCTOR_APPLICATION_PENDING,
  DOCTOR_APPLICATION_APPROVED,
  DOCTOR_APPLICATION_REJECTED,
]);

const isForumPostVisible = (post) => !HIDDEN_FORUM_STATUSES.has(post?.status);
const isForumReplyVisible = (reply) => !HIDDEN_FORUM_REPLY_STATUSES.has(reply?.status) && !reply?.hidden;

function refreshPostStatusFromReplies(post) {
  if (!post) return;
  const relatedReplies = (db?.forum_replies || []).filter((reply) => reply.post_id === post.id);
  const hasPendingReply = relatedReplies.some((reply) => reply.status === REPLY_PENDING_STATUS);
  const hasVisibleDoctorReply = relatedReplies.some(
    (reply) => reply.is_doctor_reply && isForumReplyVisible(reply),
  );

  if (hasPendingReply) {
    post.statusBeforeModeration = post.statusBeforeModeration || post.status || POST_VISIBLE_STATUS;
    post.status = POST_PENDING_STATUS;
    post.flagged = true;
    return;
  }

  if (post.status === POST_PENDING_STATUS && post.statusBeforeModeration) {
    post.status = post.statusBeforeModeration;
    delete post.statusBeforeModeration;
  }

  if (post.status === POST_VISIBLE_STATUS && hasVisibleDoctorReply) {
    post.status = "answered";
  }

  if (!hasPendingReply && post.status !== POST_REJECTED_STATUS) {
    post.flagged = false;
  }
}

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
  const severityDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const keywordRecentCounts = new Map();
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  let highRiskCount = 0;

  sessions.forEach((session) => {
    const question = String(session.question || "").trim();
    if (question) {
      queryCounts.set(question, (queryCounts.get(question) || 0) + 1);
    }
    if (Array.isArray(session.keywords)) {
      session.keywords.forEach((keyword) => {
        if (!keyword) return;
        keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
        const createdAt = Number(new Date(session.created_at || 0));
        if (Number.isFinite(createdAt) && createdAt >= oneWeekAgo) {
          keywordRecentCounts.set(keyword, (keywordRecentCounts.get(keyword) || 0) + 1);
        }
      });
    }
    const triageScore = Math.max(1, Math.min(5, Number(session.triage_score) || 1));
    severityDistribution[triageScore] = (severityDistribution[triageScore] || 0) + 1;
    if (triageScore >= 4) {
      highRiskCount += 1;
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

  const outbreakSignals = [...keywordRecentCounts.entries()]
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, count]) => ({ label, mentions: count }));

  const highRiskRatio = sessionCount ? Number((highRiskCount / sessionCount).toFixed(2)) : 0;

  return {
    sessionCount,
    topQueries,
    commonKeywords,
    severityDistribution,
    outbreakSignals,
    highRiskRatio,
  };
}

function inferRegionFromSession(session) {
  const content = sanitizeText(
    `${String(session?.question || "")} ${(Array.isArray(session?.keywords) ? session.keywords.join(" ") : "")}`,
  ).toLowerCase();
  const matched = REGION_KEYWORDS.find((entry) =>
    entry.aliases.some((alias) => content.includes(alias.toLowerCase())),
  );
  if (matched) return matched.label;
  if (session?.language === "kk") return "Kazakhstan (inferred)";
  if (session?.language === "ru") return "CIS (inferred)";
  if (session?.language === "en") return "Global (inferred)";
  return "Unknown";
}

function buildRegionalChatAnalytics() {
  const sessions = Array.isArray(db?.ai_chat_sessions) ? db.ai_chat_sessions : [];
  const regionMap = new Map();

  sessions.forEach((session) => {
    const region = inferRegionFromSession(session);
    const bucket = regionMap.get(region) || {
      region,
      totalSessions: 0,
      highRiskCount: 0,
      severitySum: 0,
      symptoms: new Map(),
      languages: new Map(),
    };
    const triage = Math.max(1, Math.min(5, Number(session.triage_score) || 1));
    bucket.totalSessions += 1;
    bucket.severitySum += triage;
    if (triage >= 4 || session.human_review_flag) {
      bucket.highRiskCount += 1;
    }
    const lang = sanitizeText(String(session.language || "unknown")).toLowerCase();
    if (lang) {
      bucket.languages.set(lang, (bucket.languages.get(lang) || 0) + 1);
    }

    const words = [
      ...extractSignificantWords(session.question || ""),
      ...((Array.isArray(session.keywords) ? session.keywords : []).map((item) =>
        sanitizeText(String(item || "")).toLowerCase().trim(),
      )),
    ];
    words.forEach((word) => {
      if (!word || !SYMPTOM_KEYWORDS.some((kw) => word.includes(kw) || kw.includes(word))) return;
      bucket.symptoms.set(word, (bucket.symptoms.get(word) || 0) + 1);
    });

    regionMap.set(region, bucket);
  });

  return [...regionMap.values()]
    .map((item) => ({
      region: item.region,
      sessionCount: item.totalSessions,
      avgSeverity: item.totalSessions ? Number((item.severitySum / item.totalSessions).toFixed(2)) : 0,
      highRiskRatio: item.totalSessions ? Number((item.highRiskCount / item.totalSessions).toFixed(2)) : 0,
      topSymptoms: [...item.symptoms.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([symptom, mentions]) => ({ symptom, mentions })),
      languageMix: [...item.languages.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([language, count]) => ({ language, count })),
    }))
    .sort((a, b) => (b.highRiskRatio - a.highRiskRatio) || (b.avgSeverity - a.avgSeverity) || (b.sessionCount - a.sessionCount));
}

function buildFallbackAdminChatReport(snapshot) {
  const highestRiskRegion = snapshot.regionalInsights[0] || null;
  const severeRegions = snapshot.regionalInsights
    .filter((item) => item.avgSeverity >= 3.5 || item.highRiskRatio >= 0.35)
    .slice(0, 5);
  return {
    summary: highestRiskRegion
      ? `Highest chat-based risk signal is in ${highestRiskRegion.region} with avg severity ${highestRiskRegion.avgSeverity} and high-risk ratio ${highestRiskRegion.highRiskRatio}.`
      : "Not enough anonymized chat data for a stable regional conclusion.",
    executiveRiskLevel: severeRegions.length >= 3 ? "high" : severeRegions.length >= 1 ? "moderate" : "low",
    globalSignals: [
      `Analyzed ${snapshot.sessionCount} anonymized chat sessions.`,
      `Global high-risk ratio: ${snapshot.highRiskRatio}.`,
      `Most frequent chat keywords: ${snapshot.commonKeywords.slice(0, 5).map((item) => item.label).join(", ") || "none"}.`,
    ],
    regionalInsights: severeRegions.map((item) => ({
      region: item.region,
      riskLevel: item.avgSeverity >= 4 || item.highRiskRatio >= 0.5 ? "high" : "moderate",
      summary: `Sessions: ${item.sessionCount}, avg severity: ${item.avgSeverity}, high-risk ratio: ${item.highRiskRatio}.`,
      likelyDrivers: item.topSymptoms.slice(0, 4).map((entry) => entry.symptom),
      recommendedActions: [
        "Increase monitoring of incoming triage chats for this region.",
        "Escalate uncertain/high-risk chat outcomes to human review faster.",
      ],
    })),
    diseaseTrends: snapshot.topSymptoms.slice(0, 10).map((item) => ({
      symptom: item.label,
      trend: item.mentions >= 5 ? "rising" : "stable",
      signalStrength: item.mentions,
    })),
    recommendedAdminActions: [
      "Review high-risk chat transcripts flagged for human follow-up.",
      "Cross-check chat symptom spikes with health news map events.",
      "Tune triage prompts for symptoms with rapidly increasing frequency.",
    ],
    limitations: [
      "Regional mapping is partially inferred from language and location keywords in anonymized text.",
      "Findings are observational and not a clinical diagnosis.",
    ],
    confidence: snapshot.sessionCount >= 50 ? 78 : snapshot.sessionCount >= 20 ? 62 : 45,
    generatedAt: new Date().toISOString(),
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
  const reviewMaker =
    parsed?.reviewMaker && typeof parsed.reviewMaker === "object" ? parsed.reviewMaker : null;
  const summary =
    parsed?.summary && typeof parsed.summary === "object" ? parsed.summary : null;

  return {
    text: String(candidate || "").trim(),
    report,
    reviewMaker,
    summary,
    parsed,
  };
}

function buildHealthNewsMapInsights(events, lookbackDays = 30) {
  const now = Date.now();
  const lookbackStart = now - lookbackDays * 24 * 60 * 60 * 1000;
  const recent7Start = now - 7 * 24 * 60 * 60 * 1000;
  const prev7Start = now - 14 * 24 * 60 * 60 * 1000;

  const relevant = (events || []).filter((event) => {
    const ts = Number(new Date(event.published_at || event.created_at || 0));
    return Number.isFinite(ts) && ts >= lookbackStart;
  });

  const regionStats = new Map();
  const symptomCounts = new Map();

  relevant.forEach((event) => {
    const region = String(event.region || "Unknown").trim() || "Unknown";
    const ts = Number(new Date(event.published_at || event.created_at || 0));
    const stat = regionStats.get(region) || {
      region,
      totalEvents: 0,
      severitySum: 0,
      recent7: 0,
      previous7: 0,
      sampleSymptoms: new Map(),
    };
    stat.totalEvents += 1;
    stat.severitySum += Number(event.severity_level) || 0;
    if (ts >= recent7Start) {
      stat.recent7 += 1;
    } else if (ts >= prev7Start) {
      stat.previous7 += 1;
    }

    (Array.isArray(event.symptoms) ? event.symptoms : []).forEach((symptom) => {
      const key = sanitizeText(String(symptom || "")).toLowerCase().trim();
      if (!key) return;
      symptomCounts.set(key, (symptomCounts.get(key) || 0) + 1);
      stat.sampleSymptoms.set(key, (stat.sampleSymptoms.get(key) || 0) + 1);
    });
    regionStats.set(region, stat);
  });

  const regions = [...regionStats.values()].map((item) => {
    const averageSeverity = item.totalEvents ? Number((item.severitySum / item.totalEvents).toFixed(2)) : 0;
    const growthRatio = item.previous7 > 0
      ? Number((item.recent7 / item.previous7).toFixed(2))
      : item.recent7 > 0 ? 99 : 1;
    const topSymptoms = [...item.sampleSymptoms.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([symptom]) => symptom);
    return {
      region: item.region,
      totalEvents: item.totalEvents,
      averageSeverity,
      recent7: item.recent7,
      previous7: item.previous7,
      growthRatio,
      topSymptoms,
    };
  });

  const outbreaks = regions
    .filter((region) => region.recent7 >= 2 && (region.growthRatio >= 1.8 || region.averageSeverity >= 4))
    .sort((a, b) => (b.recent7 - a.recent7) || (b.averageSeverity - a.averageSeverity))
    .slice(0, 10);

  const anomalies = regions
    .filter((region) => region.growthRatio >= 3 || (region.averageSeverity >= 4.5 && region.recent7 >= 1))
    .sort((a, b) => b.growthRatio - a.growthRatio)
    .slice(0, 10);

  const topSymptoms = [...symptomCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([symptom, mentions]) => ({ symptom, mentions }));

  return {
    lookbackDays,
    eventCount: relevant.length,
    outbreaks,
    anomalies,
    topSymptoms,
    regions,
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
    reviewMaker: structured.reviewMaker,
    summary: structured.summary,
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

function normalizeInstructionText(value, maxLength = 5000) {
  const text = sanitizeText(String(value || ""))
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, maxLength);
}

function normalizeInstructionList(items, maxItems = 12, maxLength = 220) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => normalizeInstructionText(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function normalizeInstructionStructured(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  return {
    indications: normalizeInstructionList(src.indications),
    dosage: normalizeInstructionList(src.dosage),
    contraindications: normalizeInstructionList(src.contraindications),
    side_effects: normalizeInstructionList(src.side_effects),
    interactions: normalizeInstructionList(src.interactions),
    warnings: normalizeInstructionList(src.warnings),
    storage: normalizeInstructionList(src.storage),
    pregnancy: normalizeInstructionList(src.pregnancy),
    children: normalizeInstructionList(src.children),
    overdose: normalizeInstructionList(src.overdose),
    missed_dose: normalizeInstructionList(src.missed_dose),
  };
}

function buildInstructionContext(medicine) {
  const entries = Array.isArray(medicine?.instruction_images) ? medicine.instruction_images : [];
  const sections = {
    indications: new Set(),
    dosage: new Set(),
    contraindications: new Set(),
    side_effects: new Set(),
    interactions: new Set(),
    warnings: new Set(),
    storage: new Set(),
    pregnancy: new Set(),
    children: new Set(),
    overdose: new Set(),
    missed_dose: new Set(),
  };

  entries.forEach((entry) => {
    const structured = normalizeInstructionStructured(entry?.structured || {});
    Object.keys(sections).forEach((key) => {
      structured[key].forEach((item) => sections[key].add(item));
    });
  });

  const toLine = (label, key) => {
    const values = [...sections[key]].slice(0, 8);
    return values.length > 0 ? `${label}: ${values.join("; ")}` : null;
  };

  return [
    toLine("Indications", "indications"),
    toLine("Dosage", "dosage"),
    toLine("Contraindications", "contraindications"),
    toLine("Side effects", "side_effects"),
    toLine("Interactions", "interactions"),
    toLine("Warnings", "warnings"),
    toLine("Storage", "storage"),
    toLine("Pregnancy", "pregnancy"),
    toLine("Children", "children"),
    toLine("Overdose", "overdose"),
    toLine("Missed dose", "missed_dose"),
  ]
    .filter(Boolean)
    .join("\n");
}

function extractCriticalWarnings(warnings) {
  const criticalKeywords = [
    "stop",
    "emergency",
    "urgent",
    "severe",
    "allergic",
    "anaphyl",
    "bleeding",
    "chest pain",
    "shortness of breath",
    "pregnan",
    "do not",
    "contraind",
    "overdose",
    "child",
    "danger",
    "critical",
  ];
  return normalizeInstructionList(warnings, 10, 220).filter((warning) => {
    const lower = warning.toLowerCase();
    return criticalKeywords.some((key) => lower.includes(key));
  });
}

function enforceConciseSafeAnswer(rawAnswer, warnings) {
  const normalized = normalizeInstructionText(rawAnswer || "", 1200);
  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
  const compact = (sentences.length > 0 ? sentences : [normalized]).slice(0, 4);
  let answer = compact.join(" ");
  const criticalWarnings = extractCriticalWarnings(warnings);

  if (criticalWarnings.length > 0) {
    const warningSentence = `Critical warning: ${criticalWarnings[0]}.`;
    const alreadyIncluded = answer.toLowerCase().includes(criticalWarnings[0].toLowerCase());
    if (!alreadyIncluded) {
      const current = answer
        .split(/(?<=[.!?])\s+/)
        .map((item) => item.trim())
        .filter(Boolean);
      const limited = [...current, warningSentence].slice(-4);
      answer = limited.join(" ");
    }
  }

  if (!answer) {
    return criticalWarnings.length > 0
      ? `Critical warning: ${criticalWarnings[0]}.`
      : "No instruction details available. Ask a pharmacist or doctor before use.";
  }
  return answer.slice(0, 1000);
}

function enforceVerySimpleAnswer(rawAnswer, warnings, language = "en") {
  const base = enforceConciseSafeAnswer(rawAnswer, warnings)
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(" ");

  const maxLen = 260;
  let answer = base.slice(0, maxLen);
  const critical = extractCriticalWarnings(warnings);
  if (critical.length > 0 && !answer.toLowerCase().includes("critical warning")) {
    const prefix = String(language || "").toLowerCase().startsWith("ru")
      ? "Важно: "
      : "Important: ";
    answer = `${answer} ${prefix}${critical[0]}`.trim().slice(0, maxLen);
  }
  return answer;
}

function getUserMedicineNotificationPrefs(userId) {
  const existing = db.medicine_notification_prefs.find((entry) => entry.user_id === userId);
  if (existing) return existing;
  const fallback = {
    id: nanoid(),
    user_id: userId,
    email_enabled: true,
    telegram_enabled: false,
    telegram_chat_id: "",
    remind_days_before: 30,
    updated_at: new Date().toISOString(),
  };
  db.medicine_notification_prefs.push(fallback);
  return fallback;
}

function trackMedicineHistory(action, medicine, userId, changes = null) {
  if (!Array.isArray(db.medicine_history)) {
    db.medicine_history = [];
  }
  db.medicine_history.push({
    id: nanoid(),
    user_id: userId,
    medicine_id: medicine.id,
    action,
    medicine_name: sanitizeText(String(medicine.name || "")),
    dosage: medicine.dosage || null,
    quantity: Number(medicine.quantity) || 0,
    expiration_date: medicine.expiration_date || null,
    changes,
    created_at: new Date().toISOString(),
  });
}

async function sendExpiryNotification({ user, medicine, prefs, daysLeft }) {
  const result = {
    email: "skipped",
    telegram: "skipped",
  };
  const safeName = sanitizeText(String(medicine.name || "Medicine"));
  const expiryDate = medicine.expiration_date || "";
  const message = `Qamqor reminder: "${safeName}" expires in ${daysLeft} day(s) on ${expiryDate}.`;

  if (prefs.email_enabled) {
    if (process.env.MEDICINE_EMAIL_WEBHOOK_URL) {
      try {
        await fetch(process.env.MEDICINE_EMAIL_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: user.email,
            subject: "Qamqor medicine expiry reminder",
            message,
            medicine: safeName,
            expires_on: expiryDate,
            days_left: daysLeft,
          }),
        });
        result.email = "sent";
      } catch (error) {
        console.error("Email reminder failed", error);
        result.email = "failed";
      }
    } else {
      result.email = "configured-off";
    }
  }

  if (prefs.telegram_enabled && prefs.telegram_chat_id) {
    if (process.env.TELEGRAM_BOT_TOKEN) {
      try {
        const tgUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
        const tgResponse = await fetch(tgUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: prefs.telegram_chat_id,
            text: message,
          }),
        });
        let tgPayload = null;
        try {
          tgPayload = await tgResponse.json();
        } catch {
          tgPayload = null;
        }

        const isTelegramOk = tgResponse.ok && tgPayload?.ok === true;
        if (isTelegramOk) {
          result.telegram = "sent";
        } else {
          const description = sanitizeText(String(tgPayload?.description || "")).slice(0, 120);
          result.telegram = description ? `failed:${description}` : "failed";
          console.error("Telegram reminder failed", {
            status: tgResponse.status,
            payload: tgPayload,
          });
        }
      } catch (error) {
        console.error("Telegram reminder failed", error);
        result.telegram = "failed";
      }
    } else {
      result.telegram = "configured-off";
    }
  }

  return result;
}

async function processMedicineExpiryNotificationsForUser(user) {
  if (!user) return [];
  const now = new Date();
  const prefs = getUserMedicineNotificationPrefs(user.id);
  const remindDays = Math.max(1, Math.min(120, Number(prefs.remind_days_before) || 30));
  const userMedicines = db.medicines.filter((med) => med.user_id === user.id);
  const triggered = [];

  for (const medicine of userMedicines) {
    const expiry = new Date(medicine.expiration_date);
    if (Number.isNaN(expiry.getTime())) continue;
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0 || daysLeft > remindDays) continue;

    const dedupeKey = `${user.id}:${medicine.id}:${expiry.toISOString().slice(0, 10)}:${daysLeft}`;
    const alreadySent = db.medicine_notifications.find((entry) => entry.dedupe_key === dedupeKey);
    if (alreadySent) continue;

    const delivery = await sendExpiryNotification({ user, medicine, prefs, daysLeft });
    const notification = {
      id: nanoid(),
      user_id: user.id,
      medicine_id: medicine.id,
      medicine_name: sanitizeText(String(medicine.name || "")),
      expiration_date: medicine.expiration_date,
      days_left: daysLeft,
      channels: delivery,
      dedupe_key: dedupeKey,
      created_at: new Date().toISOString(),
    };
    db.medicine_notifications.push(notification);
    triggered.push(notification);
  }

  return triggered;
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

const systemPrompt = `You are a professional AI health assistant for Qamqor. Provide safe, cautious, medically-aware informational guidance. Never diagnose.

CRITICAL RULES:
1. Never provide definitive diagnosis.
2. Use cautious language.
3. If risk is high or uncertain, recommend urgent professional care.
4. Return ONLY valid JSON.
5. Keep output concise, clinically useful, and structured.
6. Do NOT predict or list diseases/diagnoses. Explain danger and risk factors instead.

For symptom-related requests, return:
{
  "response": "short explanation for user",
  "report": {
    "severityScore": 1|2|3|4|5,
    "dangerExplanation": "brief explanation of why this can be dangerous",
    "riskFactors": ["risk factor 1", "risk factor 2", "risk factor 3"],
    "recommendations": ["step 1", "step 2", "step 3"],
    "doctorAdvice": "advice about doctor visit or emergency care",
    "riskLevel": "low" | "medium" | "high",
    "whenToSeeDoctor": "when to seek care"
  },
  "reviewMaker": {
    "chiefComplaint": "main complaint",
    "symptomTimeline": "timing and progression",
    "reportedSymptoms": ["symptom 1", "symptom 2"],
    "redFlags": ["red flag 1"],
    "selfCareAttempted": ["what user already tried"],
    "recommendedNextStep": "clear next step"
  }
}

Severity scale meaning:
1 = non-urgent
2 = low risk
3 = medium risk
4 = elevated risk
5 = potentially critical emergency

If message is non-medical greeting, still return JSON with only "response".`;

const reviewMakerPrompt = `You are in AI Review Maker mode. Build a clean doctor-ready structured summary.
Do NOT predict or list diseases/diagnoses. Focus on risk and urgency reasoning.
Return ONLY valid JSON:
{
  "response": "short plain-language note for patient",
  "reviewMaker": {
    "chiefComplaint": "...",
    "symptomTimeline": "...",
    "reportedSymptoms": ["..."],
    "redFlags": ["..."],
    "selfCareAttempted": ["..."],
    "recommendedNextStep": "...",
    "doctorVisitPriority": "routine|soon|urgent|emergency"
  },
  "summary": {
    "summaryText": "compact structured summary",
    "dangerExplanation": "why this situation can be dangerous",
    "riskFactors": ["..."],
    "recommendations": ["..."],
    "whenToSeeDoctor": "...",
    "keywords": ["..."]
  }
}`;

async function loadDb() {
  try {
    const text = await fs.readFile(DB_PATH, "utf-8");
    const parsed = JSON.parse(text.replace(/^\uFEFF/, ""));
    parsed.ai_chat_evaluations = Array.isArray(parsed.ai_chat_evaluations) ? parsed.ai_chat_evaluations : [];
    parsed.ai_chat_sessions = Array.isArray(parsed.ai_chat_sessions) ? parsed.ai_chat_sessions : [];
    parsed.ai_chat_histories = Array.isArray(parsed.ai_chat_histories) ? parsed.ai_chat_histories : [];
    parsed.doctor_reply_training_samples = Array.isArray(parsed.doctor_reply_training_samples) ? parsed.doctor_reply_training_samples : [];
    parsed.two_factor_challenges = Array.isArray(parsed.two_factor_challenges) ? parsed.two_factor_challenges : [];
    parsed.email_verification_challenges = Array.isArray(parsed.email_verification_challenges) ? parsed.email_verification_challenges : [];
    parsed.user_profiles = Array.isArray(parsed.user_profiles) ? parsed.user_profiles : [];
    parsed.bookmarks = Array.isArray(parsed.bookmarks) ? parsed.bookmarks : [];
    parsed.tutorial_status = Array.isArray(parsed.tutorial_status) ? parsed.tutorial_status : [];
    parsed.doctor_applications = Array.isArray(parsed.doctor_applications) ? parsed.doctor_applications : [];
    parsed.health_news_events = Array.isArray(parsed.health_news_events) ? parsed.health_news_events : [];
    parsed.medical_facilities = Array.isArray(parsed.medical_facilities) ? parsed.medical_facilities : [];
    parsed.medicine_history = Array.isArray(parsed.medicine_history) ? parsed.medicine_history : [];
    parsed.medicine_notifications = Array.isArray(parsed.medicine_notifications) ? parsed.medicine_notifications : [];
    parsed.medicine_notification_prefs = Array.isArray(parsed.medicine_notification_prefs) ? parsed.medicine_notification_prefs : [];
    parsed.medicines = Array.isArray(parsed.medicines)
      ? parsed.medicines.map((medicine) => ({
          ...medicine,
          instruction_images: Array.isArray(medicine.instruction_images)
            ? medicine.instruction_images.map((entry) => ({
                id: String(entry?.id || nanoid()),
                created_at: entry?.created_at || new Date().toISOString(),
                image_data_url: String(entry?.image_data_url || "").slice(0, 4_000_000),
                extracted_text: normalizeInstructionText(entry?.extracted_text || ""),
                structured: normalizeInstructionStructured(entry?.structured || {}),
              }))
            : [],
        }))
      : [];
    parsed.users = Array.isArray(parsed.users)
      ? parsed.users.map((user) => ({
          ...user,
          email_verified:
            typeof user.email_verified === "boolean"
              ? user.email_verified
              : true,
        }))
      : [];
    return parsed;
  } catch (error) {
    if (error && error.code === "ENOENT") {
      await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
      await fs.writeFile(DB_PATH, JSON.stringify(emptyDb, null, 2));
      return JSON.parse(JSON.stringify(emptyDb));
    }
    console.error("Failed to load DB file. Starting with in-memory empty DB.", error);
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
  const latestApplication = getLatestDoctorApplication(user.id);
  const doctorApplicationStatus = latestApplication?.status || null;
  const doctorVerified = user.roles?.includes("doctor") || doctorApplicationStatus === DOCTOR_APPLICATION_APPROVED;
  return {
    ...rest,
    banned: Boolean(user.banned),
    email_verified: Boolean(user.email_verified),
    two_factor_enabled: Boolean(user.two_factor_enabled),
    doctor_application_status: doctorApplicationStatus,
    doctor_verified: Boolean(doctorVerified),
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

function issueTwoFactorCode() {
  return String(randomInt(100000, 999999));
}

function issueEmailVerificationCode() {
  return String(randomInt(100000, 999999));
}

async function verifyGoogleIdToken(idToken) {
  const token = String(idToken || "").trim();
  if (!token) {
    throw new Error("Google id token is required");
  }

  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`);
  if (!response.ok) {
    throw new Error("Invalid Google token");
  }
  const payload = await response.json();

  const issuer = String(payload.iss || "");
  if (issuer !== "accounts.google.com" && issuer !== "https://accounts.google.com") {
    throw new Error("Invalid Google issuer");
  }

  if (GOOGLE_CLIENT_ID && String(payload.aud || "") !== GOOGLE_CLIENT_ID) {
    throw new Error("Google client mismatch");
  }

  const emailVerified = String(payload.email_verified || "").toLowerCase() === "true";
  const email = String(payload.email || "").toLowerCase().trim();
  if (!email || !emailVerified) {
    throw new Error("Google account email is not verified");
  }

  return {
    email,
    name: String(payload.name || payload.given_name || "").trim(),
    sub: String(payload.sub || "").trim(),
  };
}

async function sendTwoFactorCode(user, code, purpose = "login") {
  const webhook = process.env.TWO_FACTOR_EMAIL_WEBHOOK_URL;
  if (!webhook) {
    return { delivery: "configured-off" };
  }
  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: user.email,
        type: "two_factor_code",
        purpose,
        code,
        expires_in_minutes: 10,
      }),
    });
    return { delivery: "sent" };
  } catch (error) {
    console.error("2FA email webhook failed", error);
    return { delivery: "failed" };
  }
}

function createEmailVerificationChallenge(user) {
  const code = issueEmailVerificationCode();
  const challenge = {
    id: nanoid(),
    user_id: user.id,
    code,
    purpose: "email-verification",
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    used: false,
  };
  db.email_verification_challenges = (db.email_verification_challenges || []).filter(
    (item) =>
      item.user_id !== user.id &&
      Number(new Date(item.expires_at || 0)) > Date.now() - 60 * 1000 &&
      !item.used,
  );
  db.email_verification_challenges.push(challenge);
  return { challenge, code };
}

async function sendEmailVerificationCode(user, code, purpose = "verify-email") {
  const webhook = process.env.EMAIL_VERIFICATION_WEBHOOK_URL || process.env.TWO_FACTOR_EMAIL_WEBHOOK_URL;
  if (!webhook) {
    return { delivery: "configured-off" };
  }
  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: user.email,
        type: "email_verification_code",
        purpose,
        code,
        expires_in_minutes: 10,
      }),
    });
    return { delivery: "sent" };
  } catch (error) {
    console.error("Email verification webhook failed", error);
    return { delivery: "failed" };
  }
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

function getOptionalAuthUser(req) {
  const token = getAuthHeader(req);
  if (!token) return null;
  const payload = decodeToken(token);
  if (!payload?.id) return null;
  const user = db.users.find((u) => u.id === payload.id);
  if (!user || user.banned) return null;
  return user;
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

function getLatestDoctorApplication(userId) {
  if (!db || !Array.isArray(db.doctor_applications)) return null;
  const applications = db.doctor_applications
    .filter((application) => application.user_id === userId)
    .sort((a, b) => new Date(b.submitted_at || b.created_at || 0) - new Date(a.submitted_at || a.created_at || 0));
  return applications[0] || null;
}

function canUseDoctorFeatures(user) {
  if (!user) return false;
  if (user.roles?.includes("admin")) return true;
  if (!user.roles?.includes("doctor")) return false;
  const latestApplication = getLatestDoctorApplication(user.id);
  if (!latestApplication) return true;
  return latestApplication.status === DOCTOR_APPLICATION_APPROVED;
}

function requireVerifiedDoctor(req, res, next) {
  if (!canUseDoctorFeatures(req.user)) {
    return res.status(403).json({ message: "Verified doctor access required" });
  }
  return next();
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

function deriveTriageFromReport(report, responseText) {
  const normalizedRisk = String(report?.riskLevel || "").toLowerCase();
  const scoreByRisk = { low: 2, medium: 3, high: 4 };
  const emergencyPattern = /(chest pain|cannot breathe|difficulty breathing|severe bleeding|loss of consciousness|stroke|seizure|suicide|self-harm|anaphylaxis|heart attack)/i;
  const uncertaintyPattern = /(not sure|uncertain|cannot determine|insufficient|unknown|seek professional evaluation)/i;
  const body = `${responseText || ""} ${report?.whenToSeeDoctor || ""} ${report?.doctorAdvice || ""}`;
  const reportScore = Number(report?.severityScore);
  let triageScore = Number.isFinite(reportScore)
    ? Math.max(1, Math.min(5, reportScore))
    : (scoreByRisk[normalizedRisk] || (report ? 3 : 1));
  if (emergencyPattern.test(body)) {
    triageScore = 5;
  }
  const humanReviewFlag = triageScore >= 4 || !report || uncertaintyPattern.test(body);
  const triageLevelLabel = triageScore === 1
    ? "situation is not urgent"
    : triageScore === 2
      ? "low risk level"
      : triageScore === 3
        ? "medium risk level"
        : triageScore === 4
          ? "elevated risk"
          : "potentially critical situation";
  const humanReviewReason = triageScore >= 5
    ? "Potential emergency indicators detected."
    : triageScore >= 4
      ? "Elevated risk requires professional review."
      : !report
        ? "Structured report missing."
        : uncertaintyPattern.test(body)
          ? "AI uncertainty detected."
          : null;
  return {
    triageScore,
    triageLevelLabel,
    humanReviewFlag,
    humanReviewReason,
  };
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
      email_verified: true,
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
    const payload = sanitizeRequestBody(req.body || {});
    const email = sanitizeText(String(payload.email || "")).trim();
    const password = String(payload.password || "");
    const displayName = sanitizeText(String(payload.displayName || "")).trim();
    const role = payload.role;
    const rawProfile = payload.profile;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const profile = rawProfile && typeof rawProfile === "object" ? sanitizeRequestBody(rawProfile) : {};
    const parseNumberOrNull = (value, min, max) => {
      if (value === null || value === undefined || value === "") return null;
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return null;
      return Math.min(max, Math.max(min, parsed));
    };
    const age = parseNumberOrNull(profile.age, 0, 120);
    const gender = profile.gender ? sanitizeText(String(profile.gender)).trim().slice(0, 32) : "";
    const city = profile.city ? sanitizeText(String(profile.city)).trim().slice(0, 120) : "";
    const heightCm = parseNumberOrNull(profile.height_cm, 30, 260);
    const weightKg = parseNumberOrNull(profile.weight_kg, 1, 500);
    if (!displayName || age === null || !gender || !city || heightCm === null || weightKg === null) {
      return res.status(400).json({
        message: "Display name, age, gender, city, height and weight are required",
      });
    }
    const normalizedEmail = email.toLowerCase();
    const existingUser = db.users.find((u) => u.email === normalizedEmail);
    if (existingUser) {
      if (existingUser.banned) {
        return res.status(403).json({ message: "Account is banned" });
      }
      if (!existingUser.email_verified) {
        const { challenge, code } = createEmailVerificationChallenge(existingUser);
        const delivery = await sendEmailVerificationCode(existingUser, code, "signup-existing");
        await persistDb();
        return res.status(200).json({
          email_verification_required: true,
          challenge_id: challenge.id,
          delivery: delivery.delivery,
          ...(delivery.delivery !== "sent" ? { debug_code: code } : {}),
        });
      }
      return res.status(409).json({ message: "User already exists" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const roles = ["user"];
    const newUser = {
      id: nanoid(),
      email: normalizedEmail,
      displayName,
      passwordHash,
      roles,
      user_metadata: { display_name: displayName },
      app_metadata: { provider: "email", roles },
      created_at: new Date().toISOString(),
      banned: false,
      email_verified: false,
      two_factor_enabled: false,
      requested_role: role === "doctor" ? "doctor" : "user",
    };
    const normalizeStringList = (items, maxItems, maxLen) =>
      Array.isArray(items)
        ? items
            .map((item) => sanitizeText(String(item || "")).trim().slice(0, maxLen))
            .filter(Boolean)
            .slice(0, maxItems)
        : [];

    db.users.push(newUser);
    db.user_profiles.push({
      id: nanoid(),
      user_id: newUser.id,
      age,
      gender,
      city,
      height_cm: heightCm,
      weight_kg: weightKg,
      additional_info: profile.additional_info ? String(profile.additional_info).slice(0, 1000) : null,
      emergency_contact_name: null,
      emergency_contact_phone: null,
      blood_type: null,
      allergies: normalizeStringList(profile.allergies, 30, 100),
      lifestyle_factors: normalizeStringList(profile.lifestyle_factors, 30, 100),
      chronic_conditions: [],
      medications: [],
      notes: null,
      updated_at: new Date().toISOString(),
    });
    const { challenge, code } = createEmailVerificationChallenge(newUser);
    const delivery = await sendEmailVerificationCode(newUser, code, "signup");
    await persistDb();
    return res.status(201).json({
      email_verification_required: true,
      challenge_id: challenge.id,
      delivery: delivery.delivery,
      ...(delivery.delivery !== "sent" ? { debug_code: code } : {}),
    });
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
    if (!user.email_verified) {
      const { challenge, code } = createEmailVerificationChallenge(user);
      const delivery = await sendEmailVerificationCode(user, code, "login");
      await persistDb();
      return res.status(403).json({
        message: "Email is not verified",
        email_verification_required: true,
        challenge_id: challenge.id,
        delivery: delivery.delivery,
        ...(delivery.delivery !== "sent" ? { debug_code: code } : {}),
      });
    }
    ensureRoles(user);
    if (user.two_factor_enabled) {
      const code = issueTwoFactorCode();
      const challenge = {
        id: nanoid(),
        user_id: user.id,
        code,
        purpose: "login",
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        used: false,
      };
      db.two_factor_challenges = (db.two_factor_challenges || []).filter(
        (item) => Number(new Date(item.expires_at || 0)) > Date.now() - 60 * 1000 && !item.used,
      );
      db.two_factor_challenges.push(challenge);
      const delivery = await sendTwoFactorCode(user, code, "login");
      await persistDb();
      return res.status(202).json({
        two_factor_required: true,
        challenge_id: challenge.id,
        delivery: delivery.delivery,
        ...(delivery.delivery !== "sent" ? { debug_code: code } : {}),
      });
    }
    await persistDb();
    const token = createToken(user);
    return res.json({ user: sanitizeUser(user), token });
  });

  app.post("/api/auth/google", async (req, res) => {
    const idToken = sanitizeText(String(req.body?.id_token || "")).trim();
    if (!idToken) {
      return res.status(400).json({ message: "id_token is required" });
    }

    let googleUser;
    try {
      googleUser = await verifyGoogleIdToken(idToken);
    } catch (error) {
      return res.status(401).json({
        message: error instanceof Error ? error.message : "Google authentication failed",
      });
    }

    let user = db.users.find((u) => u.email === googleUser.email);
    if (!user) {
      const generatedPasswordHash = await bcrypt.hash(`${googleUser.sub}:${Date.now()}:${nanoid()}`, 10);
      const roles = ["user"];
      user = {
        id: nanoid(),
        email: googleUser.email,
        displayName: googleUser.name || googleUser.email.split("@")[0],
        passwordHash: generatedPasswordHash,
        roles,
        user_metadata: { display_name: googleUser.name || googleUser.email.split("@")[0] },
        app_metadata: { provider: "google", roles },
        created_at: new Date().toISOString(),
        banned: false,
        email_verified: true,
        two_factor_enabled: false,
        oauth_provider: "google",
        oauth_sub: googleUser.sub || null,
      };
      db.users.push(user);
    } else {
      ensureRoles(user);
      user.user_metadata = user.user_metadata || { display_name: user.displayName };
      if (!user.user_metadata.display_name && googleUser.name) {
        user.user_metadata.display_name = googleUser.name;
      }
      user.app_metadata = {
        ...(user.app_metadata || {}),
        provider: user.app_metadata?.provider || "google",
        roles: user.roles,
      };
      if (googleUser.sub && !user.oauth_sub) {
        user.oauth_sub = googleUser.sub;
      }
      user.email_verified = true;
    }

    if (user.banned) {
      return res.status(403).json({ message: "Account is banned" });
    }

    ensureRoles(user);
    if (user.two_factor_enabled) {
      const code = issueTwoFactorCode();
      const challenge = {
        id: nanoid(),
        user_id: user.id,
        code,
        purpose: "login",
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        used: false,
      };
      db.two_factor_challenges = (db.two_factor_challenges || []).filter(
        (item) => Number(new Date(item.expires_at || 0)) > Date.now() - 60 * 1000 && !item.used,
      );
      db.two_factor_challenges.push(challenge);
      const delivery = await sendTwoFactorCode(user, code, "login");
      await persistDb();
      return res.status(202).json({
        two_factor_required: true,
        challenge_id: challenge.id,
        delivery: delivery.delivery,
        ...(delivery.delivery !== "sent" ? { debug_code: code } : {}),
      });
    }

    await persistDb();
    const token = createToken(user);
    return res.json({ user: sanitizeUser(user), token });
  });

  app.post("/api/auth/email-verification/verify", async (req, res) => {
    const challengeId = sanitizeText(String(req.body?.challenge_id || "")).trim();
    const email = sanitizeText(String(req.body?.email || "")).trim().toLowerCase();
    const code = sanitizeText(String(req.body?.code || "")).trim();
    if (!code || (!challengeId && !email)) {
      return res.status(400).json({ message: "code and (challenge_id or email) are required" });
    }
    let challenge = null;
    if (challengeId) {
      challenge = (db.email_verification_challenges || []).find(
        (item) => item.id === challengeId && item.purpose === "email-verification",
      );
    } else {
      const userByEmail = db.users.find((entry) => entry.email === email);
      if (!userByEmail) {
        return res.status(404).json({ message: "User no longer exists" });
      }
      challenge = (db.email_verification_challenges || [])
        .filter(
          (item) =>
            item.user_id === userByEmail.id &&
            item.purpose === "email-verification" &&
            !item.used &&
            Number(new Date(item.expires_at || 0)) >= Date.now(),
        )
        .sort((a, b) => Number(new Date(b.expires_at || 0)) - Number(new Date(a.expires_at || 0)))[0] || null;
    }
    if (!challenge || challenge.used) {
      return res.status(400).json({ message: "Invalid or expired email verification challenge" });
    }
    if (Number(new Date(challenge.expires_at || 0)) < Date.now()) {
      return res.status(400).json({ message: "Verification code expired" });
    }
    if (String(challenge.code) !== code) {
      return res.status(401).json({ message: "Invalid verification code" });
    }
    const user = db.users.find((entry) => entry.id === challenge.user_id);
    if (!user) {
      return res.status(404).json({ message: "User no longer exists" });
    }
    if (user.banned) {
      return res.status(403).json({ message: "Account is banned" });
    }
    challenge.used = true;
    user.email_verified = true;
    ensureRoles(user);
    const token = createToken(user);
    await persistDb();
    return res.json({ user: sanitizeUser(user), token });
  });

  app.post("/api/auth/email-verification/resend", async (req, res) => {
    const challengeId = sanitizeText(String(req.body?.challenge_id || "")).trim();
    const email = sanitizeText(String(req.body?.email || "")).trim().toLowerCase();
    if (!challengeId && !email) {
      return res.status(400).json({ message: "challenge_id or email is required" });
    }
    let user = null;
    if (challengeId) {
      const activeChallenge = (db.email_verification_challenges || []).find(
        (item) => item.id === challengeId && item.purpose === "email-verification",
      );
      if (!activeChallenge) {
        return res.status(400).json({ message: "Invalid or expired email verification challenge" });
      }
      user = db.users.find((entry) => entry.id === activeChallenge.user_id);
    } else {
      user = db.users.find((entry) => entry.email === email);
    }
    if (!user) {
      return res.status(404).json({ message: "User no longer exists" });
    }
    if (user.banned) {
      return res.status(403).json({ message: "Account is banned" });
    }
    if (user.email_verified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    const { challenge, code } = createEmailVerificationChallenge(user);
    const delivery = await sendEmailVerificationCode(user, code, "resend");
    await persistDb();
    return res.json({
      challenge_id: challenge.id,
      delivery: delivery.delivery,
      ...(delivery.delivery !== "sent" ? { debug_code: code } : {}),
    });
  });

  app.post("/api/auth/2fa/verify-login", async (req, res) => {
    const challengeId = sanitizeText(String(req.body?.challenge_id || "")).trim();
    const code = sanitizeText(String(req.body?.code || "")).trim();
    if (!challengeId || !code) {
      return res.status(400).json({ message: "challenge_id and code are required" });
    }
    const challenge = (db.two_factor_challenges || []).find((item) => item.id === challengeId);
    if (!challenge || challenge.used) {
      return res.status(400).json({ message: "Invalid or expired 2FA challenge" });
    }
    if (Number(new Date(challenge.expires_at || 0)) < Date.now()) {
      return res.status(400).json({ message: "2FA code expired" });
    }
    if (String(challenge.code) !== code) {
      return res.status(401).json({ message: "Invalid 2FA code" });
    }
    const user = db.users.find((entry) => entry.id === challenge.user_id);
    if (!user) {
      return res.status(404).json({ message: "User no longer exists" });
    }
    challenge.used = true;
    const token = createToken(user);
    await persistDb();
    return res.json({ user: sanitizeUser(user), token });
  });

  app.post("/api/auth/2fa/resend-login", async (req, res) => {
    const challengeId = sanitizeText(String(req.body?.challenge_id || "")).trim();
    if (!challengeId) {
      return res.status(400).json({ message: "challenge_id is required" });
    }
    const challenge = (db.two_factor_challenges || []).find(
      (item) => item.id === challengeId && item.purpose === "login" && !item.used,
    );
    if (!challenge) {
      return res.status(400).json({ message: "Invalid or expired 2FA challenge" });
    }
    const user = db.users.find((entry) => entry.id === challenge.user_id);
    if (!user) {
      return res.status(404).json({ message: "User no longer exists" });
    }
    if (user.banned) {
      return res.status(403).json({ message: "Account is banned" });
    }

    const code = issueTwoFactorCode();
    challenge.code = code;
    challenge.expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const delivery = await sendTwoFactorCode(user, code, "login-resend");
    await persistDb();
    return res.json({
      challenge_id: challenge.id,
      delivery: delivery.delivery,
      ...(delivery.delivery !== "sent" ? { debug_code: code } : {}),
    });
  });

  app.get("/api/auth/me", requireAuth, (req, res) => {
    ensureRoles(req.user);
    return res.json({ user: sanitizeUser(req.user) });
  });

  app.post("/api/auth/logout", (req, res) => {
    return res.json({ success: true });
  });

  app.post("/api/auth/2fa/request-enable", requireAuth, async (req, res) => {
    const code = issueTwoFactorCode();
    const challenge = {
      id: nanoid(),
      user_id: req.user.id,
      code,
      purpose: "enable",
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      used: false,
    };
    db.two_factor_challenges = (db.two_factor_challenges || []).filter(
      (item) => item.user_id !== req.user.id || item.purpose !== "enable" || !item.used,
    );
    db.two_factor_challenges.push(challenge);
    const delivery = await sendTwoFactorCode(req.user, code, "enable");
    await persistDb();
    return res.json({
      data: {
        challenge_id: challenge.id,
        delivery: delivery.delivery,
        ...(delivery.delivery !== "sent" ? { debug_code: code } : {}),
      },
    });
  });

  app.post("/api/auth/2fa/confirm-enable", requireAuth, async (req, res) => {
    const challengeId = sanitizeText(String(req.body?.challenge_id || "")).trim();
    const code = sanitizeText(String(req.body?.code || "")).trim();
    const challenge = (db.two_factor_challenges || []).find(
      (item) => item.id === challengeId && item.user_id === req.user.id && item.purpose === "enable",
    );
    if (!challenge || challenge.used || Number(new Date(challenge.expires_at || 0)) < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired enable challenge" });
    }
    if (String(challenge.code) !== code) {
      return res.status(401).json({ message: "Invalid 2FA code" });
    }
    challenge.used = true;
    req.user.two_factor_enabled = true;
    await persistDb();
    return res.json({ user: sanitizeUser(req.user) });
  });

  app.post("/api/auth/2fa/disable", requireAuth, async (req, res) => {
    req.user.two_factor_enabled = false;
    await persistDb();
    return res.json({ user: sanitizeUser(req.user) });
  });

  app.get("/api/ai/chat-history", requireAuth, (req, res) => {
    const histories = (db.ai_chat_histories || [])
      .filter((item) => item.user_id === req.user.id)
      .sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0))
      .slice(0, 100)
      .map((item) => ({
        id: item.id,
        title: item.title || "New consultation",
        language: item.language || "en",
        mode: item.mode || "triage",
        created_at: item.created_at,
        updated_at: item.updated_at || item.created_at,
        last_message: item.last_message || "",
      }));
    return res.json({ data: histories });
  });

  app.get("/api/ai/chat-history/:id", requireAuth, (req, res) => {
    const session = (db.ai_chat_histories || []).find(
      (item) => item.id === req.params.id && item.user_id === req.user.id,
    );
    if (!session) {
      return res.status(404).json({ message: "Chat history not found" });
    }
    return res.json({ data: session });
  });

  app.delete("/api/ai/chat-history/:id", requireAuth, async (req, res) => {
    const index = (db.ai_chat_histories || []).findIndex(
      (item) => item.id === req.params.id && item.user_id === req.user.id,
    );
    if (index === -1) {
      return res.status(404).json({ message: "Chat history not found" });
    }
    db.ai_chat_histories.splice(index, 1);
    await persistDb();
    return res.json({ success: true });
  });

  app.get("/api/profile", requireAuth, (req, res) => {
    let profile = (db.user_profiles || []).find((item) => item.user_id === req.user.id);
    if (!profile) {
      profile = {
        id: nanoid(),
        user_id: req.user.id,
        age: null,
        gender: null,
        city: null,
        height_cm: null,
        weight_kg: null,
        additional_info: null,
        emergency_contact_name: null,
        emergency_contact_phone: null,
        blood_type: null,
        allergies: [],
        lifestyle_factors: [],
        chronic_conditions: [],
        medications: [],
        notes: null,
        updated_at: new Date().toISOString(),
      };
      db.user_profiles.push(profile);
    }
    return res.json({ data: profile });
  });

  app.put("/api/profile", requireAuth, async (req, res) => {
    const payload = sanitizeRequestBody(req.body || {});
    let profile = (db.user_profiles || []).find((item) => item.user_id === req.user.id);
    if (!profile) {
      profile = { id: nanoid(), user_id: req.user.id };
      db.user_profiles.push(profile);
    }
    const parseNumberOrNull = (value, min, max) => {
      if (value === null || value === undefined || value === "") return null;
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return null;
      return Math.min(max, Math.max(min, parsed));
    };
    profile.age = parseNumberOrNull(payload.age, 0, 120);
    profile.gender = payload.gender ? String(payload.gender).slice(0, 32) : null;
    profile.city = payload.city ? String(payload.city).slice(0, 120) : null;
    profile.height_cm = parseNumberOrNull(payload.height_cm, 30, 260);
    profile.weight_kg = parseNumberOrNull(payload.weight_kg, 1, 500);
    profile.additional_info = payload.additional_info ? String(payload.additional_info).slice(0, 1000) : null;
    profile.emergency_contact_name = payload.emergency_contact_name ? String(payload.emergency_contact_name).slice(0, 120) : null;
    profile.emergency_contact_phone = payload.emergency_contact_phone ? String(payload.emergency_contact_phone).slice(0, 60) : null;
    profile.blood_type = payload.blood_type ? String(payload.blood_type).slice(0, 8) : null;
    profile.allergies = Array.isArray(payload.allergies) ? payload.allergies.map((item) => String(item).slice(0, 100)).slice(0, 30) : [];
    profile.lifestyle_factors = Array.isArray(payload.lifestyle_factors) ? payload.lifestyle_factors.map((item) => String(item).slice(0, 100)).slice(0, 30) : [];
    profile.chronic_conditions = Array.isArray(payload.chronic_conditions) ? payload.chronic_conditions.map((item) => String(item).slice(0, 100)).slice(0, 30) : [];
    profile.medications = Array.isArray(payload.medications) ? payload.medications.map((item) => String(item).slice(0, 100)).slice(0, 40) : [];
    profile.notes = payload.notes ? String(payload.notes).slice(0, 1500) : null;
    profile.updated_at = new Date().toISOString();
    await persistDb();
    return res.json({ data: profile });
  });

  app.get("/api/bookmarks", requireAuth, (req, res) => {
    const items = (db.bookmarks || [])
      .filter((item) => item.user_id === req.user.id)
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return res.json({ data: items });
  });

  app.post("/api/bookmarks", requireAuth, async (req, res) => {
    const payload = sanitizeRequestBody(req.body || {});
    if (!payload.target_type || !payload.target_id || !payload.title) {
      return res.status(400).json({ message: "target_type, target_id and title are required" });
    }
    const existing = (db.bookmarks || []).find(
      (item) =>
        item.user_id === req.user.id &&
        item.target_type === String(payload.target_type) &&
        item.target_id === String(payload.target_id),
    );
    if (existing) {
      return res.json({ data: existing });
    }
    const bookmark = {
      id: nanoid(),
      user_id: req.user.id,
      target_type: String(payload.target_type).slice(0, 40),
      target_id: String(payload.target_id).slice(0, 120),
      title: String(payload.title).slice(0, 180),
      url: payload.url ? String(payload.url).slice(0, 400) : null,
      metadata: payload.metadata && typeof payload.metadata === "object" ? payload.metadata : null,
      created_at: new Date().toISOString(),
    };
    db.bookmarks.push(bookmark);
    await persistDb();
    return res.status(201).json({ data: bookmark });
  });

  app.delete("/api/bookmarks/:id", requireAuth, async (req, res) => {
    const idx = (db.bookmarks || []).findIndex((item) => item.id === req.params.id && item.user_id === req.user.id);
    if (idx === -1) {
      return res.status(404).json({ message: "Bookmark not found" });
    }
    db.bookmarks.splice(idx, 1);
    await persistDb();
    return res.json({ success: true });
  });

  app.get("/api/tutorial/status", requireAuth, (req, res) => {
    const status = (db.tutorial_status || []).find((item) => item.user_id === req.user.id) || {
      user_id: req.user.id,
      completed: false,
      skipped: false,
      completed_at: null,
      updated_at: null,
    };
    return res.json({ data: status });
  });

  app.post("/api/tutorial/status", requireAuth, async (req, res) => {
    const payload = sanitizeRequestBody(req.body || {});
    let status = (db.tutorial_status || []).find((item) => item.user_id === req.user.id);
    if (!status) {
      status = { user_id: req.user.id };
      db.tutorial_status.push(status);
    }
    status.completed = Boolean(payload.completed);
    status.skipped = Boolean(payload.skipped);
    status.completed_at = status.completed ? new Date().toISOString() : null;
    status.updated_at = new Date().toISOString();
    await persistDb();
    return res.json({ data: status });
  });

  app.post("/api/doctor-applications", requireAuth, async (req, res) => {
    const { fullName, specialization, licenseNumber, bio, country, region, yearsOfExperience, workplace } = req.body;
    const latestApplication = getLatestDoctorApplication(req.user.id);
    if (latestApplication?.status === DOCTOR_APPLICATION_PENDING) {
      return res.status(409).json({ message: "Doctor application is already pending review" });
    }
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
      status: DOCTOR_APPLICATION_PENDING,
      submitted_at: new Date().toISOString(),
      reviewed_at: null,
      reviewed_by: null,
      review_note: null,
    };
    db.doctor_applications.push(application);
    if (process.env.DOCTOR_APPLICATION_EMAIL_WEBHOOK_URL) {
      try {
        await fetch(process.env.DOCTOR_APPLICATION_EMAIL_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "doctor_application_submitted",
            submitted_at: application.submitted_at,
            applicant_email: req.user.email,
            applicant_name: application.full_name,
            specialization: application.specialization,
            country: application.country,
            region: application.region,
            workplace: application.workplace,
            years_of_experience: application.years_of_experience,
          }),
        });
      } catch (error) {
        console.error("Doctor application email webhook failed", error);
      }
    }
    await persistDb();
    return res.status(201).json({ application });
  });

  app.get("/api/doctor-applications/me", requireAuth, (req, res) => {
    const mine = db.doctor_applications
      .filter((application) => application.user_id === req.user.id)
      .sort((a, b) => new Date(b.submitted_at || b.created_at || 0) - new Date(a.submitted_at || a.created_at || 0));
    return res.json({ data: mine });
  });

  app.get("/api/admin/doctor-applications", requireAuth, requireAdmin, (req, res) => {
    const applications = [...db.doctor_applications].sort(
      (a, b) => new Date(b.submitted_at || b.created_at || 0) - new Date(a.submitted_at || a.created_at || 0),
    );
    return res.json({ data: applications });
  });

  app.patch("/api/admin/doctor-applications/:applicationId", requireAuth, requireAdmin, async (req, res) => {
    const application = db.doctor_applications.find((entry) => entry.id === req.params.applicationId);
    if (!application) {
      return res.status(404).json({ message: "Doctor application not found" });
    }
    const decision = String(req.body?.decision || "").toLowerCase();
    if (!["approve", "reject"].includes(decision)) {
      return res.status(400).json({ message: "Decision must be approve or reject" });
    }
    const targetUser = db.users.find((user) => user.id === application.user_id);
    if (!targetUser) {
      return res.status(404).json({ message: "Application owner not found" });
    }

    application.status = decision === "approve" ? DOCTOR_APPLICATION_APPROVED : DOCTOR_APPLICATION_REJECTED;
    application.reviewed_at = new Date().toISOString();
    application.reviewed_by = req.user.id;
    application.review_note = req.body?.note ? sanitizeText(String(req.body.note).slice(0, 1000)) : null;

    ensureRoles(targetUser);
    if (application.status === DOCTOR_APPLICATION_APPROVED) {
      if (!targetUser.roles.includes("doctor")) {
        targetUser.roles.push("doctor");
      }
    } else {
      targetUser.roles = targetUser.roles.filter((roleName) => roleName !== "doctor");
      if (!targetUser.roles.length) {
        targetUser.roles = ["user"];
      }
    }
    targetUser.app_metadata = {
      ...(targetUser.app_metadata || { provider: "email" }),
      roles: targetUser.roles,
    };

    logAdminAction(
      req.user.id,
      `Doctor application ${application.status}`,
      "doctor_application",
      application.id,
      { user_id: targetUser.id },
    );

    await persistDb();
    return res.json({ data: application, user: sanitizeUser(targetUser) });
  });

  app.get("/api/medicines", requireAuth, (req, res) => {
    const medicines = db.medicines
      .filter((med) => med.user_id === req.user.id)
      .map((med) => ({
        ...med,
        instruction_images: Array.isArray(med.instruction_images) ? med.instruction_images : [],
      }));
    return res.json({ data: medicines });
  });

  app.get("/api/medicines/history", requireAuth, (req, res) => {
    const history = (db.medicine_history || [])
      .filter((item) => item.user_id === req.user.id)
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 200);
    return res.json({ data: history });
  });

  app.get("/api/medicines/notifications", requireAuth, (req, res) => {
    const prefs = getUserMedicineNotificationPrefs(req.user.id);
    const history = (db.medicine_notifications || [])
      .filter((item) => item.user_id === req.user.id)
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 100);
    return res.json({ prefs, history });
  });

  app.put("/api/medicines/notifications", requireAuth, async (req, res) => {
    const prefs = getUserMedicineNotificationPrefs(req.user.id);
    prefs.email_enabled = Boolean(req.body?.email_enabled);
    prefs.telegram_enabled = Boolean(req.body?.telegram_enabled);
    prefs.telegram_chat_id = sanitizeText(String(req.body?.telegram_chat_id || "")).slice(0, 120);
    prefs.remind_days_before = Math.max(1, Math.min(120, Number(req.body?.remind_days_before) || 30));
    prefs.updated_at = new Date().toISOString();
    await persistDb();
    return res.json({ prefs });
  });

  app.post("/api/medicines/notifications/run", requireAuth, async (req, res) => {
    const triggered = await processMedicineExpiryNotificationsForUser(req.user);
    await persistDb();
    return res.json({ data: triggered, count: triggered.length });
  });

  app.post("/api/medicines", requireAuth, async (req, res) => {
    const payload = sanitizeRequestBody(req.body || {});
    const medicine = {
      id: nanoid(),
      user_id: req.user.id,
      created_at: new Date().toISOString(),
      name: sanitizeText(String(payload.name || "")).slice(0, 200),
      purpose: payload.purpose ? sanitizeText(String(payload.purpose)).slice(0, 300) : null,
      dosage: payload.dosage ? sanitizeText(String(payload.dosage)).slice(0, 200) : null,
      quantity: Math.max(0, Number(payload.quantity) || 0),
      form_type: sanitizeText(String(payload.form_type || "tablet")).slice(0, 40),
      tags: Array.isArray(payload.tags)
        ? payload.tags.map((tag) => sanitizeText(String(tag)).slice(0, 40)).slice(0, 12)
        : [],
      expiration_date: payload.expiration_date ? String(payload.expiration_date).slice(0, 20) : null,
      notes: payload.notes ? sanitizeText(String(payload.notes)).slice(0, 1200) : null,
      instruction_images: [],
    };
    if (!medicine.name || !medicine.expiration_date) {
      return res.status(400).json({ message: "name and expiration_date are required" });
    }
    db.medicines.push(medicine);
    trackMedicineHistory("created", medicine, req.user.id);
    await processMedicineExpiryNotificationsForUser(req.user);
    await persistDb();
    return res.status(201).json({ data: medicine });
  });

  app.put("/api/medicines/:id", requireAuth, async (req, res) => {
    const medicine = db.medicines.find((med) => med.id === req.params.id && med.user_id === req.user.id);
    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }
    const payload = sanitizeRequestBody(req.body || {});
    const before = { ...medicine };
    Object.assign(medicine, {
      ...medicine,
      ...(payload.name != null ? { name: sanitizeText(String(payload.name)).slice(0, 200) } : {}),
      ...(payload.purpose != null ? { purpose: payload.purpose ? sanitizeText(String(payload.purpose)).slice(0, 300) : null } : {}),
      ...(payload.dosage != null ? { dosage: payload.dosage ? sanitizeText(String(payload.dosage)).slice(0, 200) : null } : {}),
      ...(payload.quantity != null ? { quantity: Math.max(0, Number(payload.quantity) || 0) } : {}),
      ...(payload.form_type != null ? { form_type: sanitizeText(String(payload.form_type)).slice(0, 40) } : {}),
      ...(payload.tags != null ? { tags: Array.isArray(payload.tags) ? payload.tags.map((tag) => sanitizeText(String(tag)).slice(0, 40)).slice(0, 12) : [] } : {}),
      ...(payload.expiration_date != null ? { expiration_date: String(payload.expiration_date).slice(0, 20) } : {}),
      ...(payload.notes != null ? { notes: payload.notes ? sanitizeText(String(payload.notes)).slice(0, 1200) : null } : {}),
      ...(payload.instruction_images != null
        ? {
            instruction_images: Array.isArray(payload.instruction_images)
              ? payload.instruction_images.map((entry) => ({
                  id: String(entry?.id || nanoid()),
                  created_at: entry?.created_at || new Date().toISOString(),
                  image_data_url: String(entry?.image_data_url || "").slice(0, 4_000_000),
                  extracted_text: normalizeInstructionText(entry?.extracted_text || ""),
                  structured: normalizeInstructionStructured(entry?.structured || {}),
                }))
              : [],
          }
        : {}),
    });
    trackMedicineHistory("updated", medicine, req.user.id, {
      previous_expiration_date: before.expiration_date || null,
      previous_quantity: Number(before.quantity) || 0,
    });
    await processMedicineExpiryNotificationsForUser(req.user);
    await persistDb();
    return res.json({ data: medicine });
  });

  app.delete("/api/medicines/:id", requireAuth, async (req, res) => {
    const index = db.medicines.findIndex((med) => med.id === req.params.id && med.user_id === req.user.id);
    if (index === -1) {
      return res.status(404).json({ message: "Medicine not found" });
    }
    const medicine = db.medicines[index];
    trackMedicineHistory("deleted", medicine, req.user.id);
    db.medicines.splice(index, 1);
    await persistDb();
    return res.json({ success: true });
  });

  app.get("/api/symptom-logs", requireAuth, (req, res) => {
    const logs = [...db.symptom_logs]
      .filter((log) => log.user_id === req.user.id)
      .sort((a, b) => (new Date(b.symptom_date)) - (new Date(a.symptom_date)));
    return res.json({ data: logs });
  });

  app.post("/api/symptom-logs", requireAuth, async (req, res) => {
    const payload = sanitizeRequestBody(req.body || {});
    const symptomDate = String(payload.symptom_date || "").slice(0, 20);
    const symptoms = Array.isArray(payload.symptoms)
      ? payload.symptoms
        .map((item) => sanitizeText(String(item || "")).trim().slice(0, 80))
        .filter(Boolean)
        .slice(0, 20)
      : [];
    if (!symptomDate || symptoms.length === 0) {
      return res.status(400).json({ message: "symptom_date and at least one symptom are required" });
    }
    const severity = Math.max(1, Math.min(10, Number(payload.severity) || 5));
    const details = payload.details && typeof payload.details === "object" ? payload.details : {};
    const normalizedDetails = {
      fever: details.fever && typeof details.fever === "object"
        ? {
            temperature_c: Number.isFinite(Number(details.fever.temperature_c))
              ? Number(Number(details.fever.temperature_c).toFixed(1))
              : null,
            measured_at_time: details.fever.measured_at_time
              ? sanitizeText(String(details.fever.measured_at_time)).slice(0, 20)
              : null,
            medications: Array.isArray(details.fever.medications)
              ? details.fever.medications
                  .map((item) => sanitizeText(String(item || "")).trim().slice(0, 80))
                  .filter(Boolean)
                  .slice(0, 12)
              : [],
          }
        : null,
      headache: details.headache && typeof details.headache === "object"
        ? {
            pain_level: Number.isFinite(Number(details.headache.pain_level))
              ? Math.max(1, Math.min(10, Number(details.headache.pain_level)))
              : null,
            duration_minutes: Number.isFinite(Number(details.headache.duration_minutes))
              ? Math.max(0, Math.min(24 * 60, Number(details.headache.duration_minutes)))
              : null,
            triggers: Array.isArray(details.headache.triggers)
              ? details.headache.triggers
                  .map((item) => sanitizeText(String(item || "")).trim().slice(0, 80))
                  .filter(Boolean)
                  .slice(0, 12)
              : [],
          }
        : null,
    };

    const log = {
      id: nanoid(),
      user_id: req.user.id,
      symptom_date: symptomDate,
      symptoms,
      severity,
      notes: payload.notes ? sanitizeText(String(payload.notes)).slice(0, 1200) : null,
      mood: payload.mood ? sanitizeText(String(payload.mood)).slice(0, 40) : null,
      sleep_hours: Number.isFinite(Number(payload.sleep_hours)) ? Math.max(0, Math.min(24, Number(payload.sleep_hours))) : null,
      details: normalizedDetails,
      created_at: new Date().toISOString(),
    };
    db.symptom_logs.push(log);
    await persistDb();
    return res.status(201).json({ data: log });
  });

  app.delete("/api/symptom-logs/:id", requireAuth, async (req, res) => {
    const index = db.symptom_logs.findIndex((log) => log.id === req.params.id && log.user_id === req.user.id);
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

  app.post("/api/forum/question-improve", requireAuth, async (req, res) => {
    const title = sanitizeText(String(req.body?.title || "")).trim().slice(0, 160);
    const content = sanitizeText(String(req.body?.content || "")).trim().slice(0, 6000);
    const symptomDescription = sanitizeText(String(req.body?.symptom_description || "")).trim().slice(0, 2000);
    const symptomDuration = sanitizeText(String(req.body?.symptom_duration || "")).trim().slice(0, 400);
    const problemCategory = sanitizeText(String(req.body?.problem_category || "")).trim().slice(0, 80);
    const ageGroup = sanitizeText(String(req.body?.age_group || "")).trim().slice(0, 80);
    const language = sanitizeText(String(req.body?.language || "en")).slice(0, 10);
    const baseContent = content || symptomDescription;
    if (!baseContent) {
      return res.status(400).json({ message: "content is required" });
    }

    const fallbackTitle =
      title
      || baseContent.split(/[.!?\n]/).map((item) => item.trim()).find(Boolean)?.slice(0, 80)
      || "Medical question";
    const fallbackContent = [
      problemCategory ? `Category: ${problemCategory}` : null,
      `Case summary: ${baseContent}`,
      symptomDuration ? `Duration: ${symptomDuration}` : null,
      ageGroup ? `Age group: ${ageGroup}` : null,
    ].filter(Boolean).join("\n");

    if (!SUPABASE_FUNCTION_URL) {
      return res.json({
        data: {
          title: fallbackTitle,
          content: fallbackContent,
        },
      });
    }

    try {
      const { parsed, text } = await makeSupabaseChatRequest({
        model: "google/gemini-3-flash-preview",
        stream: false,
        messages: [
          {
            role: "system",
            content: `You improve medical forum questions.
Return ONLY valid JSON:
{
  "title": "short clear title",
  "content": "structured, concise medical case summary"
}
Use a neutral clinical style and never write in first person (avoid: I, my, me, mine; я, мой, меня; мен, менің).
Keep it factual. No diagnosis. Language: ${language}.`,
          },
          {
            role: "user",
            content: `Title:\n${title || "not provided"}\n\nCategory:\n${problemCategory || "not provided"}\n\nCase details:\n${baseContent}\n\nDuration:\n${symptomDuration || "not provided"}\n\nAge group:\n${ageGroup || "not provided"}`,
          },
        ],
      });
      const normalized = parsed && typeof parsed === "object" ? parsed : parseJsonSafe(text);
      return res.json({
        data: {
          title: sanitizeText(String(normalized?.title || fallbackTitle)).slice(0, 160),
          content: sanitizeText(String(normalized?.content || fallbackContent)).slice(0, 6000),
        },
      });
    } catch (error) {
      console.error("Forum question improvement failed", error);
      return res.json({
        data: {
          title: fallbackTitle,
          content: fallbackContent,
        },
      });
    }
  });

  app.post("/api/forum/posts", requireAuth, async (req, res) => {
    const userId = req.user.id;
    if (forumPostCreationLocks.has(userId)) {
      return res.status(429).json({
        message: "Your previous forum question is still being processed. Please wait a few seconds.",
      });
    }
    forumPostCreationLocks.add(userId);
    try {
      const latestUserPost = [...db.forum_posts]
        .filter((post) => post.user_id === userId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
      if (latestUserPost?.created_at) {
        const elapsedMs = Date.now() - new Date(latestUserPost.created_at).getTime();
        if (elapsedMs < FORUM_POST_COOLDOWN_MS) {
          const retryAfterMs = FORUM_POST_COOLDOWN_MS - elapsedMs;
          const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
          const retryAfterMinutes = Math.ceil(retryAfterMs / 60000);
          return res.status(429).json({
            message: `You can create the next forum question in ${retryAfterMinutes} minute(s).`,
            retry_after_seconds: retryAfterSeconds,
            next_allowed_at: new Date(Date.now() + retryAfterMs).toISOString(),
          });
        }
      }

      const cleaned = sanitizeRequestBody(req.body);
      const problemCategory = sanitizeText(String(cleaned.problem_category || "")).toLowerCase().trim().slice(0, 80);
      const ageGroup = sanitizeText(String(cleaned.age_group || "")).toLowerCase().trim().slice(0, 80);
      const symptomDescription = sanitizeText(String(cleaned.symptom_description || "")).trim().slice(0, 2000);
      const symptomDuration = sanitizeText(String(cleaned.symptom_duration || "")).trim().slice(0, 400);
      const additionalDetails = sanitizeText(String(cleaned.additional_details || "")).trim().slice(0, 2500);
      const symptomTags = Array.isArray(cleaned.symptom_tags)
        ? cleaned.symptom_tags.map((tag) => sanitizeText(String(tag || "")).toLowerCase().trim().slice(0, 40)).filter(Boolean).slice(0, 12)
        : [];
      const photoDataUrl = typeof cleaned.photo_data_url === "string"
        ? String(cleaned.photo_data_url).slice(0, 1_500_000)
        : null;
      const photoLooksValid = !photoDataUrl || /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(photoDataUrl);
      if (!photoLooksValid) {
        return res.status(400).json({ message: "Invalid photo format. Use image upload." });
      }
      if (!problemCategory) {
        return res.status(400).json({ message: "Problem category is required" });
      }
      if (!ageGroup) {
        return res.status(400).json({ message: "Age group is required" });
      }

      const contentFromStructured = [
        `Category: ${problemCategory}`,
        symptomDescription ? `Symptoms: ${symptomDescription}` : null,
        symptomDuration ? `Duration: ${symptomDuration}` : null,
        `Age group: ${ageGroup}`,
        symptomTags.length ? `Symptom tags: ${symptomTags.join(", ")}` : null,
        additionalDetails ? `Additional details: ${additionalDetails}` : null,
      ].filter(Boolean).join("\n");
      const normalizedContent = sanitizeText(String(cleaned.content || contentFromStructured)).slice(0, 6000);
      if (!normalizedContent) {
        return res.status(400).json({ message: "Content is required" });
      }

      const topicModeration = await moderateForumTopicWithAI(`${cleaned.title || ""}\n${normalizedContent}`);
      if (!topicModeration.healthRelated) {
        return res.status(422).json({
          message: HEALTH_ONLY_FORUM_MESSAGE,
          topicModeration,
        });
      }
      const keywordFlagged = isBodyFlagged({
        title: cleaned.title || "",
        content: normalizedContent,
        symptom_description: symptomDescription,
        symptom_duration: symptomDuration,
        additional_details: additionalDetails,
      });
      const aiModeration = await moderateForumContentWithAI(`${cleaned.title || ""}\n${normalizedContent}`);
      const flagged = keywordFlagged || Boolean(aiModeration?.flagged);
      const postStatus = flagged ? POST_PENDING_STATUS : POST_VISIBLE_STATUS;
      const post = {
        id: nanoid(),
        user_id: userId,
        created_at: new Date().toISOString(),
        status: postStatus,
        ...(flagged ? { statusBeforeModeration: POST_VISIBLE_STATUS } : {}),
        views_count: 0,
        replies_count: 0,
        title: sanitizeText(String(cleaned.title || "Medical question")).slice(0, 160),
        content: normalizedContent,
        tags: Array.isArray(cleaned.tags)
          ? cleaned.tags.map((tag) => sanitizeText(String(tag || "")).toLowerCase().trim().slice(0, 40)).filter(Boolean).slice(0, 12)
          : [],
        problem_category: problemCategory,
        age_group: ageGroup,
        symptom_tags: symptomTags,
        photo_data_url: photoDataUrl,
        is_urgent: Boolean(cleaned.is_urgent),
        symptom_description: symptomDescription,
        symptom_duration: symptomDuration || null,
        additional_details: additionalDetails || null,
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
    } finally {
      forumPostCreationLocks.delete(userId);
    }
  });

  app.post("/api/forum/posts/:postId/replies", requireAuth, async (req, res) => {
    const post = db.forum_posts.find((p) => p.id === req.params.postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    const isDoctor = canUseDoctorFeatures(req.user);
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
      status: flagged ? REPLY_PENDING_STATUS : REPLY_VISIBLE_STATUS,
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
    refreshPostStatusFromReplies(post);

    if (reply.is_doctor_reply && !reply.flagged) {
      if (!Array.isArray(db.doctor_reply_training_samples)) {
        db.doctor_reply_training_samples = [];
      }
      db.doctor_reply_training_samples.push({
        id: nanoid(),
        source: "forum_doctor_reply",
        created_at: new Date().toISOString(),
        question: {
          title: sanitizeText(String(post.title || "")).slice(0, 160),
          symptom_description: sanitizeText(String(post.symptom_description || "")).slice(0, 500),
          symptom_duration: sanitizeText(String(post.symptom_duration || "")).slice(0, 160),
          tags: Array.isArray(post.tags) ? post.tags.slice(0, 8) : [],
          is_urgent: Boolean(post.is_urgent),
        },
        doctor_answer: sanitizeText(String(reply.content || "")).slice(0, 2000),
      });
    }
    await persistDb();
    return res.status(201).json({ data: reply });
  });

  app.get("/api/forum/posts/:postId/replies", (req, res) => {
    const replies = db.forum_replies
      .filter((reply) => reply.post_id === req.params.postId)
      .filter(isForumReplyVisible)
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

  app.get("/api/forum/moderation/pending-replies", requireAuth, requireForumModerator, (req, res) => {
    const pendingReplies = [...db.forum_replies]
      .filter((reply) => HIDDEN_FORUM_REPLY_STATUSES.has(reply.status || (reply.flagged ? REPLY_PENDING_STATUS : REPLY_VISIBLE_STATUS)))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map((reply) => {
        const parentPost = db.forum_posts.find((post) => post.id === reply.post_id);
        return sanitizeForumRecord({
          ...reply,
          post_title: parentPost?.title || "Unknown post",
        });
      });
    return res.json({ data: pendingReplies });
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

  app.patch("/api/forum/replies/:replyId/moderation", requireAuth, requireForumModerator, async (req, res) => {
    const reply = db.forum_replies.find((item) => item.id === req.params.replyId);
    if (!reply) {
      return res.status(404).json({ message: "Reply not found" });
    }
    const decision = String(req.body?.decision || "").toLowerCase();
    if (!["approve", "reject"].includes(decision)) {
      return res.status(400).json({ message: "Decision must be approve or reject" });
    }
    const note = req.body?.note ? String(req.body.note).slice(0, 600) : null;
    const now = new Date().toISOString();

    if (!Array.isArray(reply.moderationHistory)) {
      reply.moderationHistory = [];
    }
    reply.moderationHistory.push({
      id: nanoid(),
      moderator_id: req.user.id,
      decision,
      note,
      created_at: now,
    });

    if (decision === "approve") {
      reply.status = REPLY_VISIBLE_STATUS;
      reply.flagged = false;
      reply.hidden = false;
    } else {
      reply.status = REPLY_REJECTED_STATUS;
      reply.flagged = true;
      reply.hidden = true;
    }

    reply.moderationReview = {
      status: decision === "approve" ? "approved" : "rejected",
      moderator_id: req.user.id,
      note,
      created_at: now,
    };

    const parentPost = db.forum_posts.find((post) => post.id === reply.post_id);
    if (parentPost) {
      refreshPostStatusFromReplies(parentPost);
    }

    logAdminAction(
      req.user.id,
      `Moderator ${decision}d forum reply`,
      "forum_reply",
      reply.id,
      { post_id: reply.post_id, is_doctor_reply: Boolean(reply.is_doctor_reply) },
    );
    await persistDb();
    return res.json({ data: sanitizeForumRecord(reply) });
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
    if (!canUseDoctorFeatures(req.user)) {
      return res.status(403).json({ message: "Verified doctors only" });
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
    const flaggedPosts = db.forum_posts.filter((post) => HIDDEN_FORUM_STATUSES.has(post.status)).length
      + db.forum_replies.filter((reply) => HIDDEN_FORUM_REPLY_STATUSES.has(reply.status || (reply.flagged ? REPLY_PENDING_STATUS : REPLY_VISIBLE_STATUS))).length;
    const pendingArticles = db.health_articles.filter((article) => article.needs_review).length;
    const pendingDoctorApplications = db.doctor_applications.filter(
      (application) => application.status === DOCTOR_APPLICATION_PENDING,
    ).length;
    return res.json({
      stats: { totalUsers, totalPosts, flaggedPosts, pendingArticles, pendingDoctorApplications },
    });
  });

  app.get("/api/admin/analytics", requireAuth, requireAdmin, (req, res) => {
    const payload = buildAnalyticsPayload();
    if (!payload) {
      return res.status(503).json({ message: "Analytics data unavailable" });
    }
    return res.json({ data: payload });
  });

  app.post("/api/admin/analyze-chats", requireAuth, requireAdmin, async (req, res) => {
    const analytics = buildAiChatAnalytics();
    const regionalInsights = buildRegionalChatAnalytics();
    const topSymptoms = analytics.commonKeywords;
    const snapshot = {
      generatedAt: new Date().toISOString(),
      sessionCount: analytics.sessionCount,
      highRiskRatio: analytics.highRiskRatio,
      severityDistribution: analytics.severityDistribution,
      commonKeywords: analytics.commonKeywords,
      outbreakSignals: analytics.outbreakSignals,
      topSymptoms,
      regionalInsights,
    };

    if (!analytics.sessionCount) {
      return res.status(400).json({ message: "No anonymized chat sessions available for analysis." });
    }

    let report = null;
    if (SUPABASE_FUNCTION_URL) {
      try {
        const aiResult = await makeSupabaseChatRequest({
          model: "google/gemini-3-flash-preview",
          stream: false,
          messages: [
            {
              role: "system",
              content:
                `You are an epidemiology-focused AI assistant generating an admin disease surveillance report.
Use ONLY provided anonymized aggregate data.
Return ONLY valid JSON with this exact shape:
{
  "summary": "short executive summary",
  "executiveRiskLevel": "low|moderate|high|critical",
  "globalSignals": ["..."],
  "regionalInsights": [
    {
      "region": "...",
      "riskLevel": "low|moderate|high|critical",
      "summary": "...",
      "likelyDrivers": ["..."],
      "recommendedActions": ["..."]
    }
  ],
  "diseaseTrends": [
    { "symptom": "...", "trend": "rising|stable|declining", "signalStrength": 0 }
  ],
  "recommendedAdminActions": ["..."],
  "limitations": ["..."],
  "confidence": 0
}
Never include personal data. Never invent user identities.`,
            },
            {
              role: "user",
              content: JSON.stringify(snapshot).slice(0, 25000),
            },
          ],
        });
        report = aiResult.parsed && typeof aiResult.parsed === "object"
          ? aiResult.parsed
          : parseJsonSafe(aiResult.text);
      } catch (error) {
        console.error("Admin AI chat analysis failed; falling back to rule-based summary.", error);
      }
    }

    const normalized = report && typeof report === "object"
      ? {
          ...buildFallbackAdminChatReport(snapshot),
          ...report,
          generatedAt: new Date().toISOString(),
        }
      : buildFallbackAdminChatReport(snapshot);

    logAdminAction(
      req.user.id,
      "Ran anonymized AI chat analysis",
      "ai_chat_sessions",
      null,
      {
        sessionCount: analytics.sessionCount,
        risk: normalized.executiveRiskLevel,
      },
    );
    await persistDb();
    return res.json({ data: { snapshot, report: normalized } });
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

  app.get("/api/admin/doctor-reply-samples", requireAuth, requireAdmin, (req, res) => {
    const samples = [...(db.doctor_reply_training_samples || [])]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 50);
    return res.json({ data: samples });
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

  app.get("/api/health-news-events", (req, res) => {
    const events = [...(db.health_news_events || [])]
      .sort((a, b) => new Date(b.published_at || b.created_at || 0) - new Date(a.published_at || a.created_at || 0));
    return res.json({ data: events });
  });

  app.get("/api/health-news-map-insights", (req, res) => {
    const days = Math.max(7, Math.min(120, Number(req.query.days) || 30));
    const events = [...(db.health_news_events || [])];
    const insights = buildHealthNewsMapInsights(events, days);
    return res.json({ data: insights });
  });

  app.post("/api/admin/health-news-events", requireAuth, requireAdmin, async (req, res) => {
    const payload = sanitizeRequestBody(req.body || {});
    if (!payload.title || !payload.region || !payload.source_url) {
      return res.status(400).json({ message: "title, region and source_url are required" });
    }
    const event = {
      id: nanoid(),
      title: String(payload.title).slice(0, 250),
      region: String(payload.region).slice(0, 120),
      country: payload.country ? String(payload.country).slice(0, 120) : null,
      summary: payload.summary ? String(payload.summary).slice(0, 1200) : null,
      symptoms: Array.isArray(payload.symptoms)
        ? payload.symptoms.map((symptom) => String(symptom).slice(0, 80)).slice(0, 20)
        : [],
      severity_level: Math.max(1, Math.min(5, Number(payload.severity_level) || 3)),
      source_url: String(payload.source_url).slice(0, 500),
      latitude: Number.isFinite(Number(payload.latitude)) ? Number(payload.latitude) : null,
      longitude: Number.isFinite(Number(payload.longitude)) ? Number(payload.longitude) : null,
      published_at: payload.published_at || new Date().toISOString(),
      created_at: new Date().toISOString(),
      created_by: req.user.id,
    };
    db.health_news_events.push(event);
    await persistDb();
    return res.status(201).json({ data: event });
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
      if (facilities.length > 0) {
        return res.json({ data: facilities });
      }

      const customFacilities =
        Array.isArray(db.medical_facilities) && db.medical_facilities.length > 0
          ? db.medical_facilities
          : DEFAULT_MEDICAL_FACILITIES;
      const nearbyFallback = customFacilities
        .filter((item) => {
          const [fLon, fLat] = item.coordinates || [];
          if (!Number.isFinite(fLat) || !Number.isFinite(fLon)) return false;
          return distanceMeters(lat, lon, Number(fLat), Number(fLon)) <= radius * 2.5;
        })
        .slice(0, 80);
      return res.json({ data: nearbyFallback.length > 0 ? nearbyFallback : customFacilities.slice(0, 40) });
    } catch (error) {
      console.error("Failed to load facilities:", error);
      return res.status(502).json({ message: "Failed to query facilities" });
    }
  });

  app.get("/api/geocode", async (req, res) => {
    const q = String(req.query.q || "").trim();
    const limitRaw = Number(req.query.limit);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(8, Math.round(limitRaw))) : 3;
    const nearLat = Number(req.query.near_lat);
    const nearLon = Number(req.query.near_lon);

    if (!q) {
      return res.status(400).json({ message: "q is required" });
    }

    const params = new URLSearchParams({
      q,
      format: "jsonv2",
      addressdetails: "1",
      limit: String(limit),
      dedupe: "1",
      "accept-language": "ru,en",
    });

    if (Number.isFinite(nearLat) && Number.isFinite(nearLon)) {
      params.set("lat", String(nearLat));
      params.set("lon", String(nearLon));
    }

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        headers: {
          "User-Agent": "Qamqor/1.0 (medical facilities search)",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        return res.status(502).json({ message: `Geocoding provider error: ${response.status}` });
      }

      const payload = await response.json();
      const results = Array.isArray(payload)
        ? payload
            .map((item) => {
              const lat = Number(item?.lat);
              const lon = Number(item?.lon);
              if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
              return {
                name: String(item?.name || item?.display_name || "Unknown place"),
                address: String(item?.display_name || ""),
                coordinates: [lon, lat],
              };
            })
            .filter(Boolean)
        : [];

      return res.json({ data: results });
    } catch (error) {
      console.error("Geocode failed:", error);
      return res.status(502).json({ message: "Failed to geocode place" });
    }
  });

  app.post("/api/ai/medicine-instruction-scan", requireAuth, async (req, res) => {
    if (!SUPABASE_FUNCTION_URL) {
      return res.status(503).json({ message: "AI assistant is unavailable." });
    }
    const { image, question = "", language = "en", medicine_id: medicineIdRaw } = req.body || {};
    const medicineId = sanitizeText(String(medicineIdRaw || "")).trim();
    const medicine = medicineId
      ? db.medicines.find((med) => med.id === medicineId && med.user_id === req.user.id)
      : null;
    if (medicineId && !medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }
    if (image != null && typeof image !== "string") {
      return res.status(400).json({ message: "Instruction image must be a base64 data URL string." });
    }
    const safeQuestion = sanitizeText(String(question || "")).slice(0, 800);
    const safeImage = typeof image === "string" ? image.slice(0, 4_000_000) : "";
    if (!safeImage && !safeQuestion) {
      return res.status(400).json({ message: "Provide instruction image or question." });
    }
    const existingContext = medicine ? buildInstructionContext(medicine).slice(0, 6000) : "";

    let extractedText = "";
    let plainExplanation = "";
    let warnings = [];
    let structured = normalizeInstructionStructured({});
    let directAnswer = "";

    try {
      if (safeImage) {
        const truncatedImage = safeImage.slice(0, 25000);
        const { parsed, text } = await makeSupabaseChatRequest({
          model: "google/gemini-3-flash-preview",
          stream: false,
          messages: [
            {
              role: "system",
              content: `You extract medicine instruction text from uploaded medicine leaflet images.
Return ONLY JSON:
{
  "extractedText": "clean concise extracted instruction text",
  "plainExplanation": "short plain-language explanation",
  "structured": {
    "indications": ["..."],
    "dosage": ["..."],
    "contraindications": ["..."],
    "side_effects": ["..."],
    "interactions": ["..."],
    "warnings": ["..."],
    "storage": ["..."],
    "pregnancy": ["..."],
    "children": ["..."],
    "overdose": ["..."],
    "missed_dose": ["..."]
  },
  "warnings": ["warning 1", "warning 2"],
  "answer": "2-4 short sentences max; include critical warnings if relevant"
}
Never diagnose.
Keep text clean and compact.
If a critical safety warning appears, include it clearly.
Language: ${language}`,
            },
            {
              role: "user",
              content: `Instruction image (base64 data URL, truncated): ${truncatedImage}\n\nUser question: ${safeQuestion || "No specific question. Summarize instruction."}`,
            },
          ],
        });

        const data = parsed || parseJsonSafe(text) || {};
        extractedText = normalizeInstructionText(data.extractedText || text || "", 2500);
        plainExplanation = normalizeInstructionText(data.plainExplanation || "", 600);
        structured = normalizeInstructionStructured(data.structured || {});
        warnings = normalizeInstructionList(
          Array.isArray(data.warnings) ? data.warnings : structured.warnings,
          10,
          220,
        );
        directAnswer = normalizeInstructionText(data.answer || "", 700);

        if (medicine) {
          medicine.instruction_images = Array.isArray(medicine.instruction_images)
            ? medicine.instruction_images
            : [];
          medicine.instruction_images.push({
            id: nanoid(),
            created_at: new Date().toISOString(),
            image_data_url: safeImage,
            extracted_text: extractedText,
            structured,
          });
          medicine.instruction_images = medicine.instruction_images.slice(-20);
        }
      }

      const latestFromStorage =
        medicine && Array.isArray(medicine.instruction_images) && medicine.instruction_images.length > 0
          ? medicine.instruction_images[medicine.instruction_images.length - 1]
          : null;

      if (!extractedText && latestFromStorage) {
        extractedText = normalizeInstructionText(latestFromStorage.extracted_text || "");
      }
      if (!plainExplanation && latestFromStorage) {
        plainExplanation = normalizeInstructionText(latestFromStorage.extracted_text || "", 500);
      }
      if (warnings.length === 0 && latestFromStorage) {
        warnings = normalizeInstructionList(latestFromStorage.structured?.warnings || [], 10, 220);
      }

      let answer = directAnswer;
      if (safeQuestion || !answer) {
        const contextBlock = [
          existingContext ? `Stored instruction context:\n${existingContext}` : "",
          extractedText ? `Latest extracted text:\n${extractedText.slice(0, 3000)}` : "",
        ]
          .filter(Boolean)
          .join("\n\n");
        const { parsed: answerParsed, text: answerText } = await makeSupabaseChatRequest({
          model: "google/gemini-3-flash-preview",
          stream: false,
          messages: [
            {
              role: "system",
              content: `You are a strict medicine instruction assistant.
Answer in 1-2 very short sentences maximum.
Use very simple words so a 5-year-old can understand.
Be concise and safety-first.
If there are critical warnings in context relevant to the question, include them explicitly.
Return ONLY JSON: {"answer":"...","criticalWarnings":["..."]}.
Never diagnose.`,
            },
            {
              role: "user",
              content: `Question: ${safeQuestion || "Summarize key safe usage points."}\n\n${contextBlock || "No instruction context available."}`,
            },
          ],
        });
        const answerData = answerParsed || parseJsonSafe(answerText) || {};
        answer = normalizeInstructionText(answerData.answer || answerText || "", 700);
        const criticalWarnings = normalizeInstructionList(answerData.criticalWarnings || [], 3, 220);
        warnings = [...new Set([...warnings, ...criticalWarnings])].slice(0, 3);
      }
      answer = enforceVerySimpleAnswer(answer, warnings, language);
      plainExplanation = enforceVerySimpleAnswer(plainExplanation, warnings, language);

      if (medicine && safeImage) {
        await persistDb();
      }

      return res.json({
        extractedText,
        plainExplanation,
        structured,
        warnings,
        answer,
        imagesStored: medicine ? (medicine.instruction_images || []).length : 0,
      });
    } catch (error) {
      console.error("Medicine instruction scan failed", error);
      return res.status(502).json({ message: error instanceof Error ? error.message : "Instruction scan failed" });
    }
  });

  app.post("/api/ai/medical-chat", async (req, res) => {
    if (!SUPABASE_FUNCTION_URL) {
      return res.json({
        response:
          "AI assistant is temporarily unavailable because the SUPABASE_FUNCTION_URL is not configured.",
      });
    }

    const { messages, language = "en", mode = "triage", session_id: sessionIdRaw } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: "Messages are required" });
    }

    const isReviewMode = String(mode).toLowerCase() === "review-maker";
    const modePrompt = isReviewMode ? reviewMakerPrompt : systemPrompt;
    const payloadMessages = [
      {
        role: "system",
        content: `${modePrompt}\n\nLanguage: ${language}`,
      },
      ...messages
        .map((message) => ({
          role: message.role === "assistant" ? "assistant" : "user",
          content: sanitizeText(String(message.content ?? "")),
        })),
    ];

    let responseText = "";
    let assistantReport = null;
    let assistantReviewMaker = null;
    let assistantSummary = null;
    try {
      const { text, report, reviewMaker, summary } = await makeSupabaseChatRequest({
        messages: payloadMessages,
        language,
        model: "google/gemini-3-flash-preview",
        stream: false,
      });
      responseText = text;
      assistantReport = report ?? null;
      assistantReviewMaker = reviewMaker ?? null;
      assistantSummary = summary ?? null;
    } catch (error) {
      console.error("Supabase chat error", error);
      const message = error instanceof Error ? error.message : "AI service unavailable";
      return res.status(502).json({ message });
    }

    const userMessage =
      [...messages]
        .reverse()
        .find((message) => message.role === "user")?.content || "";
    const sanitizedQuestion = sanitizeText(String(userMessage || "")).trim().slice(0, 400);
    const keywords = extractSignificantWords(userMessage).slice(0, 6);
    const triage = isReviewMode ? null : deriveTriageFromReport(assistantReport, responseText);
    const doctorAdvice = assistantReport?.doctorAdvice
      || assistantReport?.whenToSeeDoctor
      || (triage?.triageScore >= 4
        ? "Seek urgent medical care and contact emergency services if symptoms worsen."
        : "Consult a doctor if symptoms persist, worsen, or new warning signs appear.");
    const dangerExplanation = assistantReport?.dangerExplanation
      || assistantReport?.assessmentExplanation
      || "Initial triage is based on reported symptoms and potential red flags.";
    const riskFactors = Array.isArray(assistantReport?.riskFactors)
      ? assistantReport.riskFactors.slice(0, 6)
      : Array.isArray(assistantReport?.possibleCauses)
        ? assistantReport.possibleCauses.slice(0, 6)
      : Array.isArray(assistantReport?.possibleConditions)
        ? assistantReport.possibleConditions.slice(0, 6)
        : [];
    const normalizedReport = isReviewMode
      ? null
      : {
          riskLevel: assistantReport?.riskLevel || (triage?.triageScore >= 4 ? "high" : triage?.triageScore >= 3 ? "medium" : "low"),
          severityScore: triage?.triageScore || 1,
          dangerExplanation: sanitizeText(String(dangerExplanation)).slice(0, 400),
          assessmentExplanation: sanitizeText(String(dangerExplanation)).slice(0, 400),
          riskFactors: riskFactors.map((item) => sanitizeText(String(item)).slice(0, 120)),
          possibleCauses: [],
          recommendations: Array.isArray(assistantReport?.recommendations)
            ? assistantReport.recommendations.map((item) => sanitizeText(String(item)).slice(0, 160)).slice(0, 8)
            : [],
          doctorAdvice: sanitizeText(String(doctorAdvice)).slice(0, 500),
          possibleConditions: [],
          whenToSeeDoctor: sanitizeText(String(assistantReport?.whenToSeeDoctor || doctorAdvice)).slice(0, 500),
        };

    const normalizedReviewMaker = assistantReviewMaker
      ? {
          chiefComplaint: sanitizeText(String(assistantReviewMaker.chiefComplaint || "")).slice(0, 200),
          symptomTimeline: sanitizeText(String(assistantReviewMaker.symptomTimeline || "")).slice(0, 300),
          reportedSymptoms: Array.isArray(assistantReviewMaker.reportedSymptoms)
            ? assistantReviewMaker.reportedSymptoms.map((item) => sanitizeText(String(item)).slice(0, 100)).slice(0, 10)
            : [],
          redFlags: Array.isArray(assistantReviewMaker.redFlags)
            ? assistantReviewMaker.redFlags.map((item) => sanitizeText(String(item)).slice(0, 100)).slice(0, 10)
            : [],
          selfCareAttempted: Array.isArray(assistantReviewMaker.selfCareAttempted)
            ? assistantReviewMaker.selfCareAttempted.map((item) => sanitizeText(String(item)).slice(0, 100)).slice(0, 8)
            : [],
          recommendedNextStep: sanitizeText(String(assistantReviewMaker.recommendedNextStep || "")).slice(0, 240),
          doctorVisitPriority: sanitizeText(String(assistantReviewMaker.doctorVisitPriority || "")).slice(0, 24),
        }
      : null;

    const structuredSummary = {
      summaryText: sanitizeText(
        String(assistantSummary?.summaryText || responseText || "Structured consultation summary"),
      ).slice(0, 700),
      dangerExplanation: sanitizeText(
        String(assistantSummary?.dangerExplanation || normalizedReport?.dangerExplanation || ""),
      ).slice(0, 400),
      riskFactors: Array.isArray(assistantSummary?.riskFactors)
        ? assistantSummary.riskFactors.map((item) => sanitizeText(String(item)).slice(0, 120)).slice(0, 8)
        : (normalizedReport?.riskFactors || []),
      possibleConditions: [],
      recommendations: Array.isArray(assistantSummary?.recommendations)
        ? assistantSummary.recommendations.map((item) => sanitizeText(String(item)).slice(0, 160)).slice(0, 8)
        : (normalizedReport?.recommendations || []),
      whenToSeeDoctor: sanitizeText(String(assistantSummary?.whenToSeeDoctor || normalizedReport?.whenToSeeDoctor || "")).slice(0, 400),
      keywords,
      severityScore: triage?.triageScore,
      humanReviewFlag: triage?.humanReviewFlag,
    };

    if (!Array.isArray(db.ai_chat_sessions)) {
      db.ai_chat_sessions = [];
    }
    db.ai_chat_sessions.push({
      id: nanoid(),
      question: sanitizedQuestion,
      keywords,
      language,
      mode: isReviewMode ? "review-maker" : "triage",
      response_summary: sanitizeText(responseText).slice(0, 400),
      triage_score: triage?.triageScore || null,
      human_review_flag: triage?.humanReviewFlag || false,
      anonymized_symptoms: keywords,
      created_at: new Date().toISOString(),
    });

    const authUser = getOptionalAuthUser(req);
    let historySessionId = null;
    if (authUser) {
      if (!Array.isArray(db.ai_chat_histories)) {
        db.ai_chat_histories = [];
      }
      const nowIso = new Date().toISOString();
      const requestedSessionId = sanitizeText(String(sessionIdRaw || "")).trim();
      let session = requestedSessionId
        ? db.ai_chat_histories.find(
            (item) => item.id === requestedSessionId && item.user_id === authUser.id,
          )
        : null;

      if (!session) {
        const titleSource =
          sanitizeText(String(sanitizedQuestion || "")).trim()
          || sanitizeText(String(userMessage || "")).trim()
          || "New consultation";
        session = {
          id: nanoid(),
          user_id: authUser.id,
          title: titleSource.slice(0, 80),
          language: sanitizeText(String(language || "en")).slice(0, 10),
          mode: isReviewMode ? "review-maker" : "triage",
          created_at: nowIso,
          updated_at: nowIso,
          last_message: "",
          messages: [],
        };
        db.ai_chat_histories.push(session);
      }

      const userHistoryMessage = {
        id: nanoid(),
        role: "user",
        content: sanitizeText(String(userMessage || "")).slice(0, 8000),
        timestamp: nowIso,
        mode: isReviewMode ? "review-maker" : "triage",
      };
      const assistantHistoryMessage = {
        id: nanoid(),
        role: "assistant",
        content: sanitizeText(String(responseText || "")).slice(0, 8000),
        timestamp: nowIso,
        report: normalizedReport,
        triage,
        summary: structuredSummary,
        reviewMaker: normalizedReviewMaker,
        mode: isReviewMode ? "review-maker" : "triage",
      };

      const currentMessages = Array.isArray(session.messages) ? session.messages : [];
      session.messages = [...currentMessages, userHistoryMessage, assistantHistoryMessage].slice(-200);
      session.updated_at = nowIso;
      session.language = sanitizeText(String(language || session.language || "en")).slice(0, 10);
      session.mode = isReviewMode ? "review-maker" : "triage";
      session.last_message = sanitizeText(String(responseText || "")).slice(0, 240);
      historySessionId = session.id;
    }

    await persistDb();

    const safeResponse = responseText || "AI assistant did not return a response.";
    return res.json({
      response: safeResponse,
      report: normalizedReport || undefined,
      triage: triage || undefined,
      summary: structuredSummary,
      reviewMaker: normalizedReviewMaker,
      mode: isReviewMode ? "review-maker" : "triage",
      session_id: historySessionId,
    });
  });

  app.post("/api/ai/medical-summary", async (req, res) => {
    if (!SUPABASE_FUNCTION_URL) {
      return res.status(503).json({ message: "AI summary service is unavailable." });
    }
    const { messages, language = "en" } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: "Messages are required" });
    }

    const condensedTranscript = messages
      .slice(-20)
      .map((item) => `${item.role === "assistant" ? "Assistant" : "User"}: ${sanitizeText(String(item.content || ""))}`)
      .join("\n");

    try {
      const { summary, reviewMaker, text } = await makeSupabaseChatRequest({
        model: "google/gemini-3-flash-preview",
        stream: false,
        messages: [
          {
            role: "system",
            content: `${reviewMakerPrompt}\nCreate a final compact medical summary for doctor handoff.\nLanguage: ${language}`,
          },
          {
            role: "user",
            content: condensedTranscript.slice(0, 9000),
          },
        ],
      });

      return res.json({
        summary: summary || {
          summaryText: sanitizeText(String(text || "Consultation summary.")).slice(0, 700),
          dangerExplanation: "",
          riskFactors: [],
          possibleConditions: [],
          recommendations: [],
          whenToSeeDoctor: "",
          keywords: [],
        },
        reviewMaker: reviewMaker || null,
      });
    } catch (error) {
      console.error("Failed to create medical summary", error);
      return res.status(502).json({
        message: error instanceof Error ? error.message : "AI summary generation failed",
      });
    }
  });

  app.post("/api/ai/chat-evaluations", requireAuth, requireVerifiedDoctor, async (req, res) => {

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
  if (!OVERPASS_ENABLED) {
    return [];
  }

  if (Date.now() < overpassCooldownUntil) {
    return [];
  }

  const query = `[out:json][timeout:30];
(
  node["amenity"~"pharmacy|hospital|clinic|doctors|dentist"](around:${radius},${lat},${lon});
  way["amenity"~"pharmacy|hospital|clinic|doctors|dentist"](around:${radius},${lat},${lon});
  relation["amenity"~"pharmacy|hospital|clinic|doctors|dentist"](around:${radius},${lat},${lon});
  node["healthcare"~"hospital|clinic|doctor|dentist|physiotherapist|laboratory|pharmacy"](around:${radius},${lat},${lon});
  way["healthcare"~"hospital|clinic|doctor|dentist|physiotherapist|laboratory|pharmacy"](around:${radius},${lat},${lon});
  relation["healthcare"~"hospital|clinic|doctor|dentist|physiotherapist|laboratory|pharmacy"](around:${radius},${lat},${lon});
  node["shop"~"chemist|drugstore|medical_supply"](around:${radius},${lat},${lon});
  way["shop"~"chemist|drugstore|medical_supply"](around:${radius},${lat},${lon});
  relation["shop"~"chemist|drugstore|medical_supply"](around:${radius},${lat},${lon});
);
out center;`;

  const body = new URLSearchParams({ data: query }).toString();

  const inferFacilityType = (tags = {}) => {
    const amenity = String(tags.amenity || "").toLowerCase();
    const healthcare = String(tags.healthcare || "").toLowerCase();
    const shop = String(tags.shop || "").toLowerCase();

    if (amenity === "hospital" || healthcare === "hospital") return "hospital";
    if (
      amenity === "clinic" ||
      amenity === "doctors" ||
      amenity === "dentist" ||
      healthcare === "clinic" ||
      healthcare === "doctor" ||
      healthcare === "dentist" ||
      healthcare === "physiotherapist" ||
      healthcare === "laboratory"
    ) {
      return "clinic";
    }
    if (
      amenity === "pharmacy" ||
      healthcare === "pharmacy" ||
      shop === "chemist" ||
      shop === "drugstore" ||
      shop === "medical_supply"
    ) {
      return "pharmacy";
    }
    return null;
  };

  const toFacilities = (elements) => {
    const seen = new Set();
    return (elements || [])
      .map((el) => {
        const latlon =
          el.type === "node"
            ? { lat: el.lat, lon: el.lon }
            : el.center
              ? { lat: el.center.lat, lon: el.center.lon }
              : null;
        if (!latlon) return null;
        const inferredType = inferFacilityType(el.tags || {});
        if (!inferredType) return null;

        const addressParts = [];
        if (el.tags?.["addr:full"]) addressParts.push(el.tags["addr:full"]);
        if (el.tags?.["addr:street"]) addressParts.push(el.tags["addr:street"]);
        if (el.tags?.["addr:housenumber"]) addressParts.push(el.tags["addr:housenumber"]);
        if (el.tags?.["addr:city"]) addressParts.push(el.tags["addr:city"]);

        const rawName = el.tags?.name || el.tags?.["name:en"] || "";
        const name = rawName || (inferredType === "hospital" ? "Hospital" : inferredType === "clinic" ? "Clinic" : "Pharmacy");
        const dedupeKey = `${inferredType}:${name.toLowerCase()}:${latlon.lat.toFixed(5)}:${latlon.lon.toFixed(5)}`;
        if (seen.has(dedupeKey)) return null;
        seen.add(dedupeKey);

        const specializationsRaw =
          el.tags?.["healthcare:speciality"] ||
          el.tags?.speciality ||
          el.tags?.specialization ||
          "";

        const specializations = String(specializationsRaw)
          .split(/[;,]/)
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 8);

        const mainPhone = el.tags?.phone || el.tags?.["contact:phone"] || "";
        const departments = {
          reception: el.tags?.["contact:phone"] || mainPhone || "",
          emergency: el.tags?.["emergency:phone"] || "",
          pharmacy: el.tags?.["pharmacy:phone"] || "",
        };

        return {
          id: `${el.type}-${el.id}`,
          name,
          type: inferredType,
          coordinates: [latlon.lon, latlon.lat],
          address: addressParts.join(", ") || el.tags?.village || el.tags?.city || "",
          phone: mainPhone,
          hours: el.tags?.opening_hours || "-",
          website: el.tags?.website || el.tags?.url,
          specializations,
          departments,
          doctorSummary: "",
        };
      })
      .filter(Boolean);
  };

  let hadRateLimit = false;
  let hadAnyNetworkFailure = false;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        body,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        hadAnyNetworkFailure = true;
        if (res.status === 429 || res.status === 504) {
          hadRateLimit = true;
        }
        if (OVERPASS_DEBUG) {
          console.warn(`Overpass ${res.status} from ${endpoint}`);
        }
        continue;
      }

      const text = await res.text();
      const parsed = JSON.parse(text);
      const facilities = toFacilities(parsed.elements);
      if (facilities.length > 0) {
        return facilities;
      }

      if (OVERPASS_DEBUG) {
        console.warn(`Overpass returned empty dataset from ${endpoint}`);
      }
    } catch (error) {
      clearTimeout(timeout);
      hadAnyNetworkFailure = true;
      const message = error instanceof Error ? error.message : String(error);
      if (OVERPASS_DEBUG) {
        console.warn(`Overpass request failed for ${endpoint}: ${message}`);
      }
    }
  }

  if (hadAnyNetworkFailure) {
    overpassCooldownUntil = Date.now() + (hadRateLimit ? 10 * 60 * 1000 : 2 * 60 * 1000);
  }

  return [];
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

