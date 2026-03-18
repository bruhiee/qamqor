import dotenv from "dotenv";
import express from "express";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
app.use(express.json({ limit: "256kb" }));

const PORT = Number(process.env.EMAIL_WEBHOOK_PORT || 5000);
const MAIL_USER = String(process.env.MAIL_USER || "").trim();
const MAIL_APP_PASS = String(process.env.MAIL_APP_PASS || "").trim();
const MAIL_FROM = String(process.env.MAIL_FROM || MAIL_USER).trim();
const SMTP_REJECT_UNAUTHORIZED = String(process.env.SMTP_REJECT_UNAUTHORIZED || "true").toLowerCase() !== "false";

if (!MAIL_USER || !MAIL_APP_PASS || !MAIL_FROM) {
  console.error("Missing MAIL_USER / MAIL_APP_PASS / MAIL_FROM in .env");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: MAIL_USER,
    pass: MAIL_APP_PASS,
  },
  tls: {
    rejectUnauthorized: SMTP_REJECT_UNAUTHORIZED,
  },
});

async function sendCodeEmail(to, code, subject, purpose) {
  await transporter.sendMail({
    from: MAIL_FROM,
    to,
    subject,
    text: `Your code is: ${code}\nPurpose: ${purpose}\nThis code expires in 10 minutes.`,
  });
}

function validatePayload(body) {
  const to = String(body?.to || "").trim();
  const code = String(body?.code || "").trim();
  const purpose = String(body?.purpose || "").trim();
  if (!to || !code) {
    return { ok: false, message: "to and code are required" };
  }
  return { ok: true, to, code, purpose: purpose || "verification" };
}

app.post("/webhooks/email-verification", async (req, res) => {
  const parsed = validatePayload(req.body);
  if (!parsed.ok) {
    return res.status(400).json({ message: parsed.message });
  }
  try {
    await sendCodeEmail(parsed.to, parsed.code, "Qamqor email verification code", parsed.purpose);
    return res.json({ success: true });
  } catch (error) {
    console.error("Failed to send email verification code:", error);
    return res.status(500).json({ message: "Failed to send email" });
  }
});

app.post("/webhooks/two-factor", async (req, res) => {
  const parsed = validatePayload(req.body);
  if (!parsed.ok) {
    return res.status(400).json({ message: parsed.message });
  }
  try {
    await sendCodeEmail(parsed.to, parsed.code, "Qamqor 2FA code", parsed.purpose);
    return res.json({ success: true });
  } catch (error) {
    console.error("Failed to send 2FA code:", error);
    return res.status(500).json({ message: "Failed to send email" });
  }
});

app.get("/health", (_req, res) => {
  return res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Email webhook is running on http://localhost:${PORT}`);
});
