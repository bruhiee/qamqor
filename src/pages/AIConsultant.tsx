import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  MapPin
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { DisclaimerBanner } from "@/components/layout/DisclaimerBanner";
import { VoiceInputButton } from "@/components/chat/VoiceInputButton";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";

interface AIReport {
  riskLevel: "low" | "medium" | "high";
  possibleConditions: string[];
  recommendations: string[];
  whenToSeeDoctor: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  image?: string;
  report?: AIReport;
}

export default function AIConsultant() {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: language === 'ru' 
        ? "Здравствуйте! Я ваш ИИ-помощник по здоровью на базе продвинутого ИИ. Я помогу вам понять ваши симптомы и предоставлю общую информацию о здоровье. Вы можете ввести симптомы, загрузить изображение или использовать голосовой ввод. Чем могу помочь?"
        : language === 'kk'
        ? "Сәлеметсіз бе! Мен сіздің ЖИ денсаулық көмекшіңізбін. Мен симптомдарыңызды түсінуге және жалпы денсаулық туралы ақпарат беруге көмектесемін. Симптомдарды жаза аласыз, сурет жүктей аласыз немесе дауыспен енгізуді қолдана аласыз. Сізге қалай көмектесе аламын?"
        : "Hello! I'm your AI health assistant powered by advanced AI. I'm here to help you understand your symptoms and provide general health information. You can type your symptoms, upload an image, or use voice input. How can I assist you today?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

      const { data, error } = await supabase.functions.invoke("medical-chat", {
        body: {
          messages: messageHistory,
          image: currentImage,
          language,
        },
      });

      if (error) {
        throw error;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || data.error || t.error,
        timestamp: new Date(),
        report: data.report,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error calling AI:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: t.error,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
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
                  <p className="text-sm text-muted-foreground">Powered by Gemini AI</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                Online
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
                        {/* Risk Level */}
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${getRiskColor(message.report.riskLevel)}`}>
                          <Shield className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {getRiskLabel(message.report.riskLevel)}
                          </span>
                        </div>

                        {/* Possible Conditions */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Stethoscope className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">{t.possibleConditions}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {message.report.possibleConditions.map((condition, i) => (
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

                        {/* When to See Doctor */}
                        <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="w-4 h-4 text-warning" />
                            <span className="text-sm font-medium text-warning">{t.whenToSeeDoctor}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{message.report.whenToSeeDoctor}</p>
                        </div>

                        {/* Find Care Button */}
                        {message.report.riskLevel !== "low" && (
                          <Link to="/map">
                            <Button variant="outline" size="sm" className="w-full gap-2">
                              <MapPin className="w-4 h-4" />
                              {t.findCare}
                            </Button>
                          </Link>
                        )}
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
