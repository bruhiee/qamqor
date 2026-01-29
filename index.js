import express from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ dest: "uploads/" });

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY
});

const chatSessions = new Map();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function generateSessionId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

async function detectAgeCategory(imageData, mimeType) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { 
              text: "Определите, является ли человек на изображении ребенком (до 18 лет) или взрослым. Ответьте ТОЛЬКО одним словом: 'ребенок' или 'взрослый'. Если на изображении нет человека, напишите 'неизвестно'." 
            },
            {
              inlineData: {
                mimeType,
                data: imageData,
              },
            },
          ],
        },
      ],
    });
    
    const text = response.text.toLowerCase().trim();
    
    if (text.includes("ребенок") || text.includes("ребёнок") || text.includes("детск")) {
      return "child";
    } else if (text.includes("взрослый") || text.includes("взросл")) {
      return "adult";
    } else {
      return "unknown";
    }
  } catch (err) {
    console.error("Ошибка определения возраста:", err);
    return "unknown";
  }
}

async function generateMedicalAnalysis(imageData, mimeType, ageCategory, conversationHistory = []) {
  while (true) {
    try {
      let prompt = "";
      
      if (ageCategory === "child") {
        prompt = "Это ребенок (до 18 лет). Назовите только одно возможное заболевание, показанное на изображении. Напишите симптомы и как лечить ОЧЕНЬ КРАТКО. ВАЖНО: используйте простой язык, подходящий для родителей. Обязательно укажите, что нужна консультация педиатра.";
      } else if (ageCategory === "adult") {
        prompt = "Это взрослый человек. Назовите только одно возможное заболевание, показанное на изображении. Напишите симптомы и как лечить очень кратко. Обязательно укажите, что нужна консультация врача.";
      } else {
        prompt = "Назовите только одно возможное заболевание, показанное на изображении. Напишите симптомы и как лечить очень кратко. Обязательно укажите, что нужна консультация врача.";
      }

      prompt += " Если эта фотография не содержит никаких болезней/людей или симптомов, то ответь ТОЛЬКО одним предложением 'Арсен не мучай GEMINI'";

      const contents = [];
      
      conversationHistory.forEach(msg => {
        contents.push({
          role: msg.role,
          parts: [{ text: msg.text }]
        });
      });
      
      contents.push({
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: imageData,
            },
          },
        ],
      });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
      });
      
      const text = response.text;
      
      if (text.includes("UNAVAILABLE") && text.includes("503")) {
        return await generateMedicalAnalysis(imageData, mimeType, ageCategory, conversationHistory);
      }
      
      const clean = text.replace(/\*/g, "");
      return clean;
    } catch (err) {
      if (err.status === "UNAVAILABLE" || err.code === 503) {
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      throw err;
    }
  }
}

async function continueConversation(sessionId, userMessage) {
  const session = chatSessions.get(sessionId);
  if (!session) {
    throw new Error("Сессия не найдена");
  }

  while (true) {
    try {
      const contents = [];
      
      session.history.forEach(msg => {
        contents.push({
          role: msg.role,
          parts: [{ text: msg.text }]
        });
      });
      
      contents.push({
        role: "user",
        parts: [{ text: userMessage }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
      });
      
      const text = response.text;
      
      if (text.includes("UNAVAILABLE") && text.includes("503")) {
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      
      const clean = text.replace(/\*/g, "");
      
      session.history.push({ role: "user", text: userMessage });
      session.history.push({ role: "model", text: clean });
      
      return clean;
    } catch (err) {
      if (err.status === "UNAVAILABLE" || err.code === 503) {
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      throw err;
    }
  }
}

app.post("/analyze", upload.single("image"), async (req, res) => {
  try {
    const imageData = fs.readFileSync(req.file.path).toString("base64");
    
    const ageCategory = await detectAgeCategory(imageData, req.file.mimetype);
    
    const result = await generateMedicalAnalysis(imageData, req.file.mimetype, ageCategory);
    
    const sessionId = generateSessionId();
    chatSessions.set(sessionId, {
      id: sessionId,
      ageCategory: ageCategory,
      imageData: imageData,
      mimeType: req.file.mimetype,
      history: [
        { role: "user", text: "Проанализируйте изображение" },
        { role: "model", text: result }
      ],
      createdAt: new Date()
    });
    
    fs.unlinkSync(req.file.path);
    
    res.json({
      sessionId: sessionId,
      ageCategory: ageCategory,
      result: result
    });
  } catch (err) {
    console.error("Ошибка анализа:", err);
    res.status(500).send(err.message);
  }
});

app.post("/continue", async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    
    if (!sessionId || !message) {
      return res.status(400).json({ error: "Требуется sessionId и message" });
    }
    
    const result = await continueConversation(sessionId, message);
    
    res.json({
      result: result,
      sessionId: sessionId
    });
  } catch (err) {
    console.error("Ошибка продолжения диалога:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/history/:sessionId", (req, res) => {
  const session = chatSessions.get(req.params.sessionId);
  
  if (!session) {
    return res.status(404).json({ error: "Сессия не найдена" });
  }
  
  res.json({
    sessionId: session.id,
    ageCategory: session.ageCategory,
    history: session.history,
    createdAt: session.createdAt
  });
});

app.delete("/session/:sessionId", (req, res) => {
  const deleted = chatSessions.delete(req.params.sessionId);
  
  if (deleted) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Сессия не найдена" });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

setInterval(() => {
  const now = new Date();
  for (const [sessionId, session] of chatSessions.entries()) {
    const age = now - session.createdAt;
    if (age > 24 * 60 * 60 * 1000) { 
      chatSessions.delete(sessionId);
    }
  }
}, 60 * 60 * 1000); 

app.listen(3000, () => console.log("Works. NODE JS LAUNCHED"));