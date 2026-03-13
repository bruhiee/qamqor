import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Bot, 
  Send, 
  Image as ImageIcon, 
  Loader2,
  User,
  AlertTriangle,
  Shield,
  ArrowRight,
  X,
  Activity,
  Stethoscope,
  Clock,
  MapPin,
  ClipboardCheck
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { DisclaimerBanner } from "@/components/layout/DisclaimerBanner";
import { VoiceInputButton } from "@/components/chat/VoiceInputButton";
import { apiFetch } from "@/lib/api";
import { useLanguage } from "@/contexts/useLanguage";
import { useAuth } from "@/contexts/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface AIReport {
  riskLevel: "low" | "medium" | "high";
  severityScore?: number;
  assessmentExplanation?: string;
  possibleCauses?: string[];
  possibleConditions: string[];
  recommendations: string[];
  whenToSeeDoctor: string;
  doctorAdvice?: string;
}

interface AITriage {
  triageScore: number;
  triageLevelLabel: string;
  humanReviewFlag: boolean;
  humanReviewReason?: string | null;
}

interface AISummary {
  summaryText: string;
  possibleConditions: string[];
  recommendations: string[];
  whenToSeeDoctor: string;
  keywords: string[];
  severityScore?: number;
  humanReviewFlag?: boolean;
}

interface AIReviewMaker {
  chiefComplaint?: string;
  symptomTimeline?: string;
  reportedSymptoms?: string[];
  redFlags?: string[];
  selfCareAttempted?: string[];
  recommendedNextStep?: string;
  doctorVisitPriority?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  image?: string;
  report?: AIReport;
  triage?: AITriage;
  summary?: AISummary;
  reviewMaker?: AIReviewMaker | null;
  mode?: "triage" | "review-maker";
}

export default function AIConsultant() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { isDoctor } = useUserRoles();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: language === 'ru' 
        ? "Р—РґСЂР°РІСЃС‚РІСѓР№С‚Рµ! РЇ РІР°С€ РР-РїРѕРјРѕС‰РЅРёРє РїРѕ Р·РґРѕСЂРѕРІСЊСЋ РЅР° Р±Р°Р·Рµ РїСЂРѕРґРІРёРЅСѓС‚РѕРіРѕ РР. РЇ РїРѕРјРѕРіСѓ РІР°Рј РїРѕРЅСЏС‚СЊ РІР°С€Рё СЃРёРјРїС‚РѕРјС‹ Рё РїСЂРµРґРѕСЃС‚Р°РІР»СЋ РѕР±С‰СѓСЋ РёРЅС„РѕСЂРјР°С†РёСЋ Рѕ Р·РґРѕСЂРѕРІСЊРµ. Р’С‹ РјРѕР¶РµС‚Рµ РІРІРµСЃС‚Рё СЃРёРјРїС‚РѕРјС‹, Р·Р°РіСЂСѓР·РёС‚СЊ РёР·РѕР±СЂР°Р¶РµРЅРёРµ РёР»Рё РёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ РіРѕР»РѕСЃРѕРІРѕР№ РІРІРѕРґ. Р§РµРј РјРѕРіСѓ РїРѕРјРѕС‡СЊ?"
        : language === 'kk'
        ? "РЎУ™Р»РµРјРµС‚СЃС–Р· Р±Рµ! РњРµРЅ СЃС–Р·РґС–ТЈ Р–Р РґРµРЅСЃР°СѓР»С‹Т› РєУ©РјРµРєС€С–ТЈС–Р·Р±С–РЅ. РњРµРЅ СЃРёРјРїС‚РѕРјРґР°СЂС‹ТЈС‹Р·РґС‹ С‚ТЇСЃС–РЅСѓРіРµ Р¶У™РЅРµ Р¶Р°Р»РїС‹ РґРµРЅСЃР°СѓР»С‹Т› С‚СѓСЂР°Р»С‹ Р°Т›РїР°СЂР°С‚ Р±РµСЂСѓРіРµ РєУ©РјРµРєС‚РµСЃРµРјС–РЅ. РЎРёРјРїС‚РѕРјРґР°СЂРґС‹ Р¶Р°Р·Р° Р°Р»Р°СЃС‹Р·, СЃСѓСЂРµС‚ Р¶ТЇРєС‚РµР№ Р°Р»Р°СЃС‹Р· РЅРµРјРµСЃРµ РґР°СѓС‹СЃРїРµРЅ РµРЅРіС–Р·СѓРґС– Т›РѕР»РґР°РЅР° Р°Р»Р°СЃС‹Р·. РЎС–Р·РіРµ Т›Р°Р»Р°Р№ РєУ©РјРµРєС‚РµСЃРµ Р°Р»Р°РјС‹РЅ?"
        : "Hello! I'm your AI health assistant powered by advanced AI. I'm here to help you understand your symptoms and provide general health information. You can type your symptoms, upload an image, or use voice input. How can I assist you today?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFinalizingSummary, setIsFinalizingSummary] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mode, setMode] = useState<"triage" | "review-maker">("triage");
  const [finalSummary, setFinalSummary] = useState<AISummary | null>(null);
  const [finalReviewMaker, setFinalReviewMaker] = useState<AIReviewMaker | null>(null);
  const [isEvaluationOpen, setIsEvaluationOpen] = useState(false);
  const [doctorEvaluation, setDoctorEvaluation] = useState({
    urgencyAssessmentCorrectness: "",
    safetyOfRecommendations: "",
    handlingOfUncertainty: "",
    consistencyAcrossSimilarCases: "",
    notes: "",
  });
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDoctorUser = Boolean(user && isDoctor());

  const evaluationLabelMap = {
    en: {
      title: "Doctor QA Evaluation",
      subtitle: "Rate this chat from 1 to 100 and add notes if needed.",
      urgencyAssessmentCorrectness: "Urgency Assessment Correctness",
      safetyOfRecommendations: "Safety of Recommendations",
      handlingOfUncertainty: "Handling of Uncertainty",
      consistencyAcrossSimilarCases: "Consistency Across Similar Cases",
      notes: "Comment (optional)",
      notesPlaceholder: "Explain your score if needed...",
      submit: "Submit Evaluation",
    },
    ru: {
      title: "РћС†РµРЅРєР° С‡Р°С‚Р° РІСЂР°С‡РѕРј",
      subtitle: "РџРѕСЃС‚Р°РІСЊС‚Рµ РѕС†РµРЅРєСѓ РѕС‚ 1 РґРѕ 100 Рё РїСЂРё РЅРµРѕР±С…РѕРґРёРјРѕСЃС‚Рё РѕСЃС‚Р°РІСЊС‚Рµ РєРѕРјРјРµРЅС‚Р°СЂРёР№.",
      urgencyAssessmentCorrectness: "РљРѕСЂСЂРµРєС‚РЅРѕСЃС‚СЊ РѕС†РµРЅРєРё СЃСЂРѕС‡РЅРѕСЃС‚Рё",
      safetyOfRecommendations: "Р‘РµР·РѕРїР°СЃРЅРѕСЃС‚СЊ СЂРµРєРѕРјРµРЅРґР°С†РёР№",
      handlingOfUncertainty: "Р Р°Р±РѕС‚Р° СЃ РЅРµРѕРїСЂРµРґРµР»С‘РЅРЅРѕСЃС‚СЊСЋ",
      consistencyAcrossSimilarCases: "РЎРѕРіР»Р°СЃРѕРІР°РЅРЅРѕСЃС‚СЊ РІ РїРѕС…РѕР¶РёС… СЃР»СѓС‡Р°СЏС…",
      notes: "РљРѕРјРјРµРЅС‚Р°СЂРёР№ (РЅРµРѕР±СЏР·Р°С‚РµР»СЊРЅРѕ)",
      notesPlaceholder: "РџСЂРё РЅРµРѕР±С…РѕРґРёРјРѕСЃС‚Рё РїРѕСЏСЃРЅРёС‚Рµ СЃРІРѕСЋ РѕС†РµРЅРєСѓ...",
      submit: "РћС‚РїСЂР°РІРёС‚СЊ РѕС†РµРЅРєСѓ",
    },
    kk: {
      title: "Р”У™СЂС–РіРµСЂРґС–ТЈ С‡Р°С‚ Р±Р°Т“Р°СЃС‹",
      subtitle: "Р§Р°С‚С‚С‹ 1-РґРµРЅ 100-РіРµ РґРµР№С–РЅ Р±Р°Т“Р°Р»Р°Рї, Т›Р°Р¶РµС‚ Р±РѕР»СЃР° С‚ТЇСЃС–РЅС–РєС‚РµРјРµ Т›РѕСЃС‹ТЈС‹Р·.",
      urgencyAssessmentCorrectness: "РЁТ±Т“С‹Р»РґС‹Т›С‚С‹ Р±Р°Т“Р°Р»Р°Сѓ РґТ±СЂС‹СЃС‚С‹Т“С‹",
      safetyOfRecommendations: "Т°СЃС‹РЅС‹СЃС‚Р°СЂРґС‹ТЈ Т›Р°СѓС–РїСЃС–Р·РґС–РіС–",
      handlingOfUncertainty: "Р‘РµР»РіС–СЃС–Р·РґС–РєРїРµРЅ Р¶Т±РјС‹СЃ",
      consistencyAcrossSimilarCases: "Т°Т›СЃР°СЃ Р¶Р°Т“РґР°Р№Р»Р°СЂРґР°Т“С‹ Р±С–СЂС–Р·РґС–Р»С–Рє",
      notes: "РўТЇСЃС–РЅС–РєС‚РµРјРµ (РјС–РЅРґРµС‚С‚С– РµРјРµСЃ)",
      notesPlaceholder: "ТљР°Р¶РµС‚ Р±РѕР»СЃР° Р±Р°Т“Р°ТЈС‹Р·РґС‹ С‚ТЇСЃС–РЅРґС–СЂС–ТЈС–Р·...",
      submit: "Р‘Р°Т“Р°РЅС‹ Р¶С–Р±РµСЂСѓ",
    },
  };

  const evaluationLabels =
    evaluationLabelMap[language as keyof typeof evaluationLabelMap] ?? evaluationLabelMap.en;

  const openEvaluationLabel = language === "ru"
    ? "РћС†РµРЅРёС‚СЊ С‡Р°С‚"
    : language === "kk"
      ? "Р§Р°С‚С‚С‹ Р±Р°Т“Р°Р»Р°Сѓ"
      : "Evaluate Chat";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const exportSummaryAsPdf = (message?: Message, summaryOverride?: AISummary | null, reviewOverride?: AIReviewMaker | null) => {
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    const triageLine = message?.triage
      ? `Triage: ${message.triage.triageScore}/5 (${message.triage.triageLevelLabel})`
      : summaryOverride?.severityScore
        ? `Triage: ${summaryOverride.severityScore}/5`
      : "";
    const summary = summaryOverride || message?.summary || null;
    const review = reviewOverride || message?.reviewMaker || null;
    const content = `
      <html>
      <head><title>Qamqor AI Summary</title></head>
      <body style="font-family: Arial, sans-serif; padding: 24px; line-height: 1.5;">
        <h2>Qamqor AI Consultation Summary</h2>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>${triageLine}</strong></p>
        <h3>Assistant Response</h3>
        <p>${(message?.content || summary?.summaryText || "").replace(/\n/g, "<br/>")}</p>
        <h3>Possible Conditions</h3>
        <p>${summary?.possibleConditions?.join(", ") || "-"}</p>
        <h3>Recommendations</h3>
        <p>${summary?.recommendations?.join("; ") || "-"}</p>
        <h3>When To See Doctor</h3>
        <p>${summary?.whenToSeeDoctor || "-"}</p>
        <h3>AI Review Maker</h3>
        <p><strong>Chief complaint:</strong> ${review?.chiefComplaint || "-"}</p>
        <p><strong>Timeline:</strong> ${review?.symptomTimeline || "-"}</p>
        <p><strong>Red flags:</strong> ${review?.redFlags?.join(", ") || "-"}</p>
        <p><strong>Next step:</strong> ${review?.recommendedNextStep || "-"}</p>
        <h3>Medical Disclaimer</h3>
        <p>This summary is informational and does not replace professional medical diagnosis.</p>
      </body>
      </html>
    `;
    win.document.open();
    win.document.write(content);
    win.document.close();
    win.focus();
    win.print();
  };

  const handleSend = async () => {
    if (!input.trim() && !selectedImage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
      image: selectedImage || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    const currentImage = selectedImage;
    setInput("");
    setSelectedImage(null);
    setIsLoading(true);

    try {
      // Build message history for context
      const messageHistory = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      // Add current message
      messageHistory.push({
        role: "user",
        content: currentInput,
      });

      const data = await apiFetch<{
        response?: string;
        report?: AIReport;
        triage?: AITriage;
        summary?: AISummary;
        reviewMaker?: AIReviewMaker;
        mode?: "triage" | "review-maker";
      }>("/ai/medical-chat", {
        method: "POST",
        body: {
          messages: messageHistory,
          image: currentImage,
          language,
          mode,
        },
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || t.error,
        timestamp: new Date(),
        report: data.report,
        triage: data.triage,
        summary: data.summary,
        reviewMaker: data.reviewMaker ?? null,
        mode: data.mode || mode,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      if (data.summary) {
        setFinalSummary(data.summary);
      }
      if (data.reviewMaker) {
        setFinalReviewMaker(data.reviewMaker);
      }
    } catch (error) {
      console.error("Error calling AI:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: error instanceof Error ? error.message : t.error,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const finalizeSummary = async () => {
    const history = messages
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.content }));
    if (history.length === 0) {
      return;
    }
    setIsFinalizingSummary(true);
    try {
      const data = await apiFetch<{ summary?: AISummary; reviewMaker?: AIReviewMaker }>("/ai/medical-summary", {
        method: "POST",
        body: { messages: history, language },
      });
      if (data.summary) {
        setFinalSummary(data.summary);
      }
      if (data.reviewMaker) {
        setFinalReviewMaker(data.reviewMaker);
      }
      toast({
        title: "Summary ready",
        description: "Structured summary generated for doctor visit.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t.error,
        description: error instanceof Error ? error.message : t.errorOccurred,
      });
    } finally {
      setIsFinalizingSummary(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVoiceTranscript = (text: string) => {
    setInput((prev) => prev + (prev ? ' ' : '') + text);
  };

  const handleDoctorEvaluationSubmit = async () => {
    if (!isDoctorUser) return;

    const fields: Array<keyof typeof doctorEvaluation> = [
      "urgencyAssessmentCorrectness",
      "safetyOfRecommendations",
      "handlingOfUncertainty",
      "consistencyAcrossSimilarCases",
    ];

    const hasInvalidScore = fields.some((field) => {
      const value = Number(doctorEvaluation[field]);
      return !Number.isFinite(value) || value < 1 || value > 100;
    });

    if (hasInvalidScore) {
      toast({
        variant: "destructive",
        title: t.error,
        description: language === "ru"
          ? "РЈРєР°Р¶РёС‚Рµ РєРѕСЂСЂРµРєС‚РЅС‹Рµ РѕС†РµРЅРєРё РѕС‚ 1 РґРѕ 100 РґР»СЏ РІСЃРµС… РєСЂРёС‚РµСЂРёРµРІ."
          : language === "kk"
            ? "Р‘Р°СЂР»С‹Т› РєСЂРёС‚РµСЂРёР№Р»РµСЂ ТЇС€С–РЅ 1-РґРµРЅ 100-РіРµ РґРµР№С–РЅ РґТ±СЂС‹СЃ Р±Р°Т“Р° РµРЅРіС–Р·С–ТЈС–Р·."
            : "Please enter valid scores from 1 to 100 for all criteria.",
      });
      return;
    }

    setEvaluationLoading(true);
    try {
      await apiFetch("/ai/chat-evaluations", {
        method: "POST",
        body: {
          ...doctorEvaluation,
          chatSample: messages
            .filter((m) => m.id !== "welcome")
            .slice(-10)
            .map((m) => ({ role: m.role, content: m.content })),
        },
      });
      setDoctorEvaluation({
        urgencyAssessmentCorrectness: "",
        safetyOfRecommendations: "",
        handlingOfUncertainty: "",
        consistencyAcrossSimilarCases: "",
        notes: "",
      });
      setIsEvaluationOpen(false);
      toast({
        title: t.success,
        description: language === "ru"
          ? "РћС†РµРЅРєР° СЃРѕС…СЂР°РЅРµРЅР°."
          : language === "kk"
            ? "Р‘Р°Т“Р° СЃР°Т›С‚Р°Р»РґС‹."
            : "Evaluation saved.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t.error,
        description: error instanceof Error ? error.message : t.errorOccurred,
      });
    } finally {
      setEvaluationLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low": return "bg-success/10 text-success border-success/20";
      case "medium": return "bg-warning/10 text-warning border-warning/20";
      case "high": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case "low": return t.lowRisk;
      case "medium": return t.mediumRisk;
      case "high": return t.highRisk;
      default: return risk;
    }
  };

  const getSeverityLabel = (score?: number) => {
    switch (score) {
      case 1: return "1 вЂ” Situation is not urgent";
      case 2: return "2 вЂ” Low risk level";
      case 3: return "3 вЂ” Medium risk level";
      case 4: return "4 вЂ” Elevated risk";
      case 5: return "5 вЂ” Potentially critical";
      default: return "Not assessed";
    }
  };

  const getSeverityColor = (score?: number) => {
    if (!score) return "bg-muted text-muted-foreground border-border";
    if (score <= 2) return "bg-success/10 text-success border-success/30";
    if (score === 3) return "bg-warning/10 text-warning border-warning/30";
    return "bg-destructive/10 text-destructive border-destructive/30";
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 pt-20 pb-4">
        <div className="container mx-auto px-4 h-full flex flex-col" style={{ height: "calc(100vh - 6rem)" }}>
          {/* Header */}
          <div className="py-4 border-b border-border mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl medical-gradient flex items-center justify-center shadow-medical">
                  <Bot className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="font-display text-xl font-semibold">{t.aiConsultant}</h1>
                  <p className="text-sm text-muted-foreground">{t.aiPoweredBy}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center gap-1 rounded-lg border border-border p-1">
                  <Button
                    size="sm"
                    variant={mode === "triage" ? "default" : "ghost"}
                    className={mode === "triage" ? "medical-gradient" : ""}
                    onClick={() => setMode("triage")}
                  >
                    AI Triage
                  </Button>
                  <Button
                    size="sm"
                    variant={mode === "review-maker" ? "default" : "ghost"}
                    className={mode === "review-maker" ? "medical-gradient" : ""}
                    onClick={() => setMode("review-maker")}
                  >
                    AI Review Maker
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={finalizeSummary}
                  disabled={isLoading || isFinalizingSummary || messages.length < 2}
                >
                  {isFinalizingSummary ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Finalize Summary
                </Button>
                {isDoctorUser && (
                  <Dialog open={isEvaluationOpen} onOpenChange={setIsEvaluationOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" title={openEvaluationLabel} aria-label={openEvaluationLabel}>
                        <ClipboardCheck className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{evaluationLabels.title}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-xs text-muted-foreground">{evaluationLabels.subtitle}</p>

                        <div className="grid md:grid-cols-2 gap-3">
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            value={doctorEvaluation.urgencyAssessmentCorrectness}
                            onChange={(e) => setDoctorEvaluation((prev) => ({ ...prev, urgencyAssessmentCorrectness: e.target.value }))}
                            placeholder={`${evaluationLabels.urgencyAssessmentCorrectness} (1-100)`}
                          />
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            value={doctorEvaluation.safetyOfRecommendations}
                            onChange={(e) => setDoctorEvaluation((prev) => ({ ...prev, safetyOfRecommendations: e.target.value }))}
                            placeholder={`${evaluationLabels.safetyOfRecommendations} (1-100)`}
                          />
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            value={doctorEvaluation.handlingOfUncertainty}
                            onChange={(e) => setDoctorEvaluation((prev) => ({ ...prev, handlingOfUncertainty: e.target.value }))}
                            placeholder={`${evaluationLabels.handlingOfUncertainty} (1-100)`}
                          />
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            value={doctorEvaluation.consistencyAcrossSimilarCases}
                            onChange={(e) => setDoctorEvaluation((prev) => ({ ...prev, consistencyAcrossSimilarCases: e.target.value }))}
                            placeholder={`${evaluationLabels.consistencyAcrossSimilarCases} (1-100)`}
                          />
                        </div>

                        <div>
                          <p className="text-sm font-medium mb-2">{evaluationLabels.notes}</p>
                          <Textarea
                            value={doctorEvaluation.notes}
                            onChange={(e) => setDoctorEvaluation((prev) => ({ ...prev, notes: e.target.value }))}
                            placeholder={evaluationLabels.notesPlaceholder}
                            className="min-h-24"
                          />
                        </div>

                        <Button
                          onClick={handleDoctorEvaluationSubmit}
                          disabled={evaluationLoading}
                          className="w-full md:w-auto"
                        >
                          {evaluationLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          {evaluationLabels.submit}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  {t.onlineStatus}
                </div>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mb-4">
            <DisclaimerBanner compact />
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto space-y-4 pb-4 scrollbar-hide">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  
                  <div className={`max-w-2xl ${message.role === "user" ? "order-first" : ""}`}>
                    <div
                      className={`rounded-2xl p-4 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-muted rounded-tl-none"
                      }`}
                    >
                      {message.image && (
                        <img
                          src={message.image}
                          alt="Uploaded"
                          className="max-w-xs rounded-lg mb-2"
                        />
                      )}
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    
                    {/* AI Report Card */}
                    {message.report && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-3 bg-card border border-border rounded-xl p-4 space-y-4"
                      >
                        {/* Severity 1-5 */}
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${getSeverityColor(message.triage?.triageScore || message.report.severityScore)}`}>
                          <Shield className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {getSeverityLabel(message.triage?.triageScore || message.report.severityScore)}
                          </span>
                        </div>
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ml-2 ${getRiskColor(message.report.riskLevel)}`}>
                          <span className="text-sm font-medium">{getRiskLabel(message.report.riskLevel)}</span>
                        </div>
                        {message.triage && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Triage score: <span className="font-semibold">{message.triage.triageScore}/5</span> ({message.triage.triageLevelLabel})
                          </div>
                        )}
                        {message.triage?.humanReviewFlag && (
                          <div className="mt-2 bg-destructive/10 border border-destructive/30 rounded-lg p-2 text-xs text-destructive">
                            Human Review Flag: consult a licensed doctor as soon as possible.
                            {message.triage.humanReviewReason ? ` Reason: ${message.triage.humanReviewReason}` : ""}
                          </div>
                        )}
                        {message.report.assessmentExplanation && (
                          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">{message.report.assessmentExplanation}</p>
                          </div>
                        )}

                        {/* Possible Causes */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Stethoscope className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">Possible causes</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(message.report.possibleCauses?.length ? message.report.possibleCauses : message.report.possibleConditions).map((condition, i) => (
                              <span key={i} className="text-xs bg-muted px-2 py-1 rounded-full">
                                {condition}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Recommendations */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-4 h-4 text-accent" />
                            <span className="text-sm font-medium">{t.recommendations}</span>
                          </div>
                          <ul className="space-y-1">
                            {message.report.recommendations.map((rec, i) => (
                              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                                <ArrowRight className="w-3 h-3 mt-0.5 text-primary flex-shrink-0" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Doctor Advice */}
                        <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="w-4 h-4 text-warning" />
                            <span className="text-sm font-medium text-warning">{t.whenToSeeDoctor}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{message.report.doctorAdvice || message.report.whenToSeeDoctor}</p>
                        </div>

                        {message.reviewMaker && (
                          <div className="bg-muted/60 border border-border rounded-lg p-3 space-y-1">
                            <p className="text-xs font-semibold">AI Review Maker</p>
                            {message.reviewMaker.chiefComplaint ? <p className="text-xs text-muted-foreground">Chief complaint: {message.reviewMaker.chiefComplaint}</p> : null}
                            {message.reviewMaker.symptomTimeline ? <p className="text-xs text-muted-foreground">Timeline: {message.reviewMaker.symptomTimeline}</p> : null}
                            {message.reviewMaker.recommendedNextStep ? <p className="text-xs text-muted-foreground">Next step: {message.reviewMaker.recommendedNextStep}</p> : null}
                          </div>
                        )}

                        {/* Find Care Button */}
                        {(message.triage?.triageScore || 1) >= 3 && (
                          <Link to="/map">
                            <Button variant="outline" size="sm" className="w-full gap-2">
                              <MapPin className="w-4 h-4" />
                              {t.findCare}
                            </Button>
                          </Link>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => exportSummaryAsPdf(message, message.summary, message.reviewMaker)}
                        >
                          Export Summary (PDF)
                        </Button>
                      </motion.div>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-1 px-1">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-secondary-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-none p-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">{t.analyzing}</span>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {finalSummary && (
            <div className="mb-3 bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">Final Structured Summary</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportSummaryAsPdf(undefined, finalSummary, finalReviewMaker)}
                >
                  Save as PDF
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{finalSummary.summaryText}</p>
              <p className="text-xs"><span className="font-medium">Possible conditions:</span> {finalSummary.possibleConditions.join(", ") || "-"}</p>
              <p className="text-xs"><span className="font-medium">Recommendations:</span> {finalSummary.recommendations.join("; ") || "-"}</p>
              <p className="text-xs"><span className="font-medium">Doctor advice:</span> {finalSummary.whenToSeeDoctor || "-"}</p>
              {finalSummary.severityScore ? (
                <p className="text-xs"><span className="font-medium">Severity:</span> {finalSummary.severityScore}/5</p>
              ) : null}
              {finalSummary.humanReviewFlag ? (
                <p className="text-xs text-destructive">Human Review Flag is active.</p>
              ) : null}
            </div>
          )}

          {/* Selected Image Preview */}
          {selectedImage && (
            <div className="relative inline-block mb-2">
              <img src={selectedImage} alt="Selected" className="h-20 rounded-lg" />
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 w-6 h-6"
                onClick={() => setSelectedImage(null)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-border pt-4">
            <div className="md:hidden flex items-center gap-2 mb-3">
              <Button
                size="sm"
                variant={mode === "triage" ? "default" : "outline"}
                className={mode === "triage" ? "medical-gradient" : ""}
                onClick={() => setMode("triage")}
              >
                AI Triage
              </Button>
              <Button
                size="sm"
                variant={mode === "review-maker" ? "default" : "outline"}
                className={mode === "review-maker" ? "medical-gradient" : ""}
                onClick={() => setMode("review-maker")}
              >
                AI Review Maker
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0"
                title={t.uploadImage}
              >
                <ImageIcon className="w-4 h-4" />
              </Button>
              <VoiceInputButton 
                onTranscript={handleVoiceTranscript}
                disabled={isLoading}
              />
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder={t.typeSymptoms}
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={(!input.trim() && !selectedImage) || isLoading}
                className="medical-gradient shadow-medical flex-shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

