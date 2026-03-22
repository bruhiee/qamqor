import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/useLanguage";
import type { Language } from "@/lib/i18n";

type NavItem = {
  path: string;
  label: string;
  keywords: string[];
};

type ChatMessage = {
  id: number;
  role: "assistant" | "user";
  text: string;
  action?: { label: string; path: string };
};

const textByLanguage: Record<
  Language,
  {
    title: string;
    subtitle: string;
    placeholder: string;
    openLabel: string;
    send: string;
    empty: string;
    noMatch: string;
    goTo: string;
    quickLabel: string;
  }
> = {
  en: {
    title: "AI Navigation",
    subtitle: "I will quickly take you to the right section.",
    placeholder: "Where do you want to go?",
    openLabel: "Open AI navigation assistant",
    send: "Send",
    empty: "Type a page name, for example: map, articles, consultant.",
    noMatch: "I did not find a matching page. Try: map, articles, forum, profile, admin.",
    goTo: "Open",
    quickLabel: "Quick actions",
  },
  ru: {
    title: "AI Навигация",
    subtitle: "Быстро переведу вас в нужный раздел.",
    placeholder: "Куда хотите перейти?",
    openLabel: "Открыть AI помощник навигации",
    send: "Отправить",
    empty: "Введите название страницы, например: карта, статьи, консультант.",
    noMatch: "Не нашел подходящий раздел. Попробуйте: карта, статьи, форум, профиль, админ.",
    goTo: "Открыть",
    quickLabel: "Быстрые действия",
  },
  kk: {
    title: "AI Навигация",
    subtitle: "Керек бөлімге тез апарамын.",
    placeholder: "Қай бөлімге өтесіз?",
    openLabel: "AI навигация көмекшісін ашу",
    send: "Жіберу",
    empty: "Бөлім атын жазыңыз: карта, мақалалар, кеңесші.",
    noMatch: "Сәйкес бөлім табылмады. Карта, мақалалар, форум, профиль деп көріңіз.",
    goTo: "Ашу",
    quickLabel: "Жылдам өту",
  },
  de: {
    title: "AI-Navigation",
    subtitle: "Ich bringe dich schnell zum richtigen Bereich.",
    placeholder: "Wohin möchtest du gehen?",
    openLabel: "AI-Navigationsassistent öffnen",
    send: "Senden",
    empty: "Gib einen Seitennamen ein, z. B. Karte, Artikel, Berater.",
    noMatch: "Keine passende Seite gefunden. Versuche: Karte, Artikel, Forum, Profil, Admin.",
    goTo: "Öffnen",
    quickLabel: "Schnellaktionen",
  },
  fr: {
    title: "Navigation IA",
    subtitle: "Je vous dirige rapidement vers la bonne section.",
    placeholder: "Où voulez-vous aller ?",
    openLabel: "Ouvrir l'assistant IA de navigation",
    send: "Envoyer",
    empty: "Saisissez une page, par exemple: carte, articles, consultant.",
    noMatch: "Aucune page correspondante. Essayez: carte, articles, forum, profil, admin.",
    goTo: "Ouvrir",
    quickLabel: "Acces rapides",
  },
  es: {
    title: "Navegacion IA",
    subtitle: "Te llevo rapido a la seccion correcta.",
    placeholder: "¿A dónde quieres ir?",
    openLabel: "Abrir asistente IA de navegacion",
    send: "Enviar",
    empty: "Escribe una pagina, por ejemplo: mapa, articulos, consultor.",
    noMatch: "No encontre una pagina adecuada. Prueba: mapa, articulos, foro, perfil, admin.",
    goTo: "Abrir",
    quickLabel: "Accesos rapidos",
  },
};

const greetingByLanguage: Record<Language, string> = {
  en: "Hi! I am your navigation assistant. Ask me where to go.",
  ru: "Привет. Я навигационный помощник. Напишите, куда перейти.",
  kk: "Салем. Мен навигация көмекшісімін. Қайда өту керегін жазыңыз.",
  de: "Hallo! Ich bin dein Navigationsassistent. Schreib, wohin du willst.",
  fr: "Bonjour. Je suis votre assistant de navigation. Ecrivez ou aller.",
  es: "Hola. Soy tu asistente de navegacion. Escribe a donde quieres ir.",
};

function buildNavItems(t: ReturnType<typeof useLanguage>["t"]): NavItem[] {
  return [
    { path: "/consultant", label: t.aiConsultant, keywords: ["consult", "ai", "assistant", "консульт", "кеңесші"] },
    { path: "/cabinet", label: t.medicineCabinet, keywords: ["cabinet", "medicine", "аптеч", "медикамент", "дәрі"] },
    { path: "/map", label: t.map, keywords: ["map", "care", "карта", "больниц", "клиник", "аурухана"] },
    { path: "/symptom-tracker", label: t.symptomTracker, keywords: ["symptom", "tracker", "симптом", "белгі"] },
    { path: "/forum", label: t.forum, keywords: ["forum", "doctor", "врач", "форум", "дәрігер"] },
    { path: "/articles", label: t.articles, keywords: ["article", "blog", "guide", "стать", "мақала"] },
    { path: "/profile", label: "Profile", keywords: ["profile", "аккаунт", "профиль"] },
    { path: "/admin", label: t.adminPanel, keywords: ["admin", "analytics", "админ", "баскар"] },
  ];
}

export function NavigationAssistant() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, t } = useLanguage();
  const ui = textByLanguage[language];
  const navItems = useMemo(() => buildNavItems(t), [t]);
  const hiddenOnRoutes = ["/auth", "/consultant", "/doctor-workplace"];
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, role: "assistant", text: greetingByLanguage[language] },
  ]);

  if (hiddenOnRoutes.includes(location.pathname)) {
    return null;
  }

  const quickActions = navItems.slice(0, 5);

  const findTarget = (value: string) => {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return null;
    }

    return navItems.find((item) => {
      const labelMatch = item.label.toLowerCase().includes(normalized);
      const keywordMatch = item.keywords.some((keyword) => normalized.includes(keyword));
      return labelMatch || keywordMatch;
    });
  };

  const pushAssistantMessage = (message: Omit<ChatMessage, "id" | "role">) => {
    setMessages((prev) => [...prev, { id: Date.now() + Math.random(), role: "assistant", ...message }]);
  };

  const handleQuickJump = (item: NavItem) => {
    navigate(item.path);
    pushAssistantMessage({
      text: `${ui.goTo}: ${item.label}`,
      action: { label: item.label, path: item.path },
    });
    setIsOpen(false);
  };

  const handleSend = () => {
    const value = query.trim();
    if (!value) {
      pushAssistantMessage({ text: ui.empty });
      return;
    }

    const userMessage: ChatMessage = { id: Date.now(), role: "user", text: value };
    const target = findTarget(value);

    setMessages((prev) => [...prev, userMessage]);
    setQuery("");

    if (!target) {
      pushAssistantMessage({ text: ui.noMatch });
      return;
    }

    pushAssistantMessage({
      text: `${ui.goTo}: ${target.label}`,
      action: { label: target.label, path: target.path },
    });
    navigate(target.path);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-5 right-5 z-[90]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.97 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="mb-3 w-[min(92vw,390px)] overflow-hidden rounded-2xl border border-border/70 bg-background/92 shadow-[0_25px_80px_-28px_hsl(var(--primary)/0.45)] backdrop-blur-xl"
          >
            <div className="medical-gradient flex items-center justify-between px-4 py-3 text-white">
              <div>
                <p className="text-sm font-semibold">{ui.title}</p>
                <p className="text-xs text-white/85">{ui.subtitle}</p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-lg text-white hover:bg-white/20 hover:text-white"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="max-h-[320px] space-y-2 overflow-y-auto px-3 py-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-xl px-3 py-2 text-sm ${
                    message.role === "assistant"
                      ? "mr-6 border border-primary/20 bg-primary/10 text-foreground"
                      : "ml-10 bg-secondary/90 text-secondary-foreground"
                  }`}
                >
                  <p>{message.text}</p>
                  {message.action && (
                    <button
                      type="button"
                      onClick={() => handleQuickJump({ path: message.action!.path, label: message.action!.label, keywords: [] })}
                      className="mt-1 text-xs font-semibold text-primary hover:underline"
                    >
                      {message.action.label}
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-border/70 px-3 py-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">{ui.quickLabel}</p>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {quickActions.map((item) => (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => handleQuickJump(item)}
                    className="rounded-full border border-border/70 bg-muted/55 px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/35 hover:bg-primary/10"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={ui.placeholder}
                  className="h-10 rounded-xl border-border/70 bg-background/70"
                />
                <Button type="submit" size="icon" className="h-10 w-10 rounded-xl medical-gradient">
                  <Send className="h-4 w-4" />
                  <span className="sr-only">{ui.send}</span>
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }}>
        <Button
          onClick={() => setIsOpen((prev) => !prev)}
          className="group relative h-14 rounded-2xl medical-gradient px-5 shadow-[0_18px_40px_-18px_hsl(var(--primary)/0.9)]"
          aria-label={ui.openLabel}
        >
          <span className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-primary/25 ring-offset-2 ring-offset-background/40 group-hover:ring-primary/45" />
          <MessageCircle className="mr-2 h-5 w-5" />
          <span className="text-sm font-semibold">AI</span>
          <Bot className="ml-2 h-4 w-4 opacity-90" />
        </Button>
      </motion.div>
    </div>
  );
}
