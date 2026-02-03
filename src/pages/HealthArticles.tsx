import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Search,
  Clock,
  User,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Globe,
  AlertTriangle
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

interface Article {
  id: string;
  title: string;
  titleKz?: string;
  titleRu?: string;
  summary: string;
  summaryKz?: string;
  summaryRu?: string;
  keyTakeaways: string[];
  keyTakeawaysKz?: string[];
  keyTakeawaysRu?: string[];
  author: string;
  date: string;
  readTime: string;
  category: string;
  image: string;
}

const articles: Article[] = [
  {
    id: "1",
    title: "Understanding Heart Health: A Comprehensive Guide",
    titleRu: "Понимание здоровья сердца: Полное руководство",
    titleKz: "Жүрек денсаулығын түсіну: Толық нұсқаулық",
    summary: "Learn about the key factors that contribute to heart health and how to maintain a healthy cardiovascular system through diet, exercise, and lifestyle choices.",
    summaryRu: "Узнайте о ключевых факторах, способствующих здоровью сердца, и о том, как поддерживать здоровую сердечно-сосудистую систему с помощью диеты, упражнений и образа жизни.",
    summaryKz: "Жүрек денсаулығына ықпал ететін негізгі факторлар және тамақтану, жаттығулар мен өмір салты арқылы жүрек-қан тамырлары жүйесін сау сақтау туралы біліңіз.",
    keyTakeaways: [
      "Regular exercise reduces heart disease risk by 30-40%",
      "Mediterranean diet is linked to lower cardiovascular mortality",
      "Managing stress is crucial for heart health"
    ],
    keyTakeawaysRu: [
      "Регулярные упражнения снижают риск сердечных заболеваний на 30-40%",
      "Средиземноморская диета связана с более низкой смертностью от сердечно-сосудистых заболеваний",
      "Управление стрессом имеет решающее значение для здоровья сердца"
    ],
    keyTakeawaysKz: [
      "Тұрақты жаттығулар жүрек ауруларының қаупін 30-40% төмендетеді",
      "Жерорта теңізі диетасы жүрек-қан тамырлары ауруларынан өлім-жітімнің төмендеуімен байланысты",
      "Стрессті басқару жүрек денсаулығы үшін өте маңызды"
    ],
    author: "Dr. Maria Johnson",
    date: "2024-01-15",
    readTime: "8 min",
    category: "Cardiology",
    image: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400"
  },
  {
    id: "2",
    title: "The Science of Sleep: Why Rest Matters",
    titleRu: "Наука сна: Почему отдых важен",
    titleKz: "Ұйқы ғылымы: Демалыстың маңыздылығы",
    summary: "Discover the importance of quality sleep for physical and mental health, and learn practical tips for improving your sleep habits.",
    summaryRu: "Откройте для себя важность качественного сна для физического и психического здоровья и узнайте практические советы по улучшению привычек сна.",
    summaryKz: "Физикалық және психикалық денсаулық үшін сапалы ұйқының маңыздылығын біліңіз және ұйқы әдеттерін жақсартудың практикалық кеңестерін алыңыз.",
    keyTakeaways: [
      "Adults need 7-9 hours of sleep per night",
      "Poor sleep is linked to increased inflammation",
      "Consistent sleep schedule improves sleep quality"
    ],
    keyTakeawaysRu: [
      "Взрослым нужно 7-9 часов сна в сутки",
      "Плохой сон связан с повышенным воспалением",
      "Постоянный режим сна улучшает качество сна"
    ],
    keyTakeawaysKz: [
      "Ересектерге түнде 7-9 сағат ұйқы қажет",
      "Нашар ұйқы қабынудың жоғарылауымен байланысты",
      "Тұрақты ұйқы режимі ұйқы сапасын жақсартады"
    ],
    author: "Dr. Alex Chen",
    date: "2024-01-10",
    readTime: "6 min",
    category: "Wellness",
    image: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400"
  },
  {
    id: "3",
    title: "Nutrition Basics: Building a Balanced Diet",
    titleRu: "Основы питания: Сбалансированная диета",
    titleKz: "Тамақтану негіздері: Теңдестірілген тамақтану",
    summary: "A guide to understanding macronutrients, micronutrients, and how to create a balanced diet that supports your health goals.",
    summaryRu: "Руководство по пониманию макронутриентов, микронутриентов и созданию сбалансированной диеты, поддерживающей ваши цели здоровья.",
    summaryKz: "Макроэлементтерді, микроэлементтерді түсіну және денсаулық мақсаттарыңызды қолдайтын теңдестірілген тамақтану жүйесін құру нұсқаулығы.",
    keyTakeaways: [
      "Include all food groups in daily meals",
      "Hydration is as important as nutrition",
      "Processed foods should be limited"
    ],
    keyTakeawaysRu: [
      "Включайте все группы продуктов в ежедневный рацион",
      "Гидратация так же важна, как и питание",
      "Обработанные продукты следует ограничить"
    ],
    keyTakeawaysKz: [
      "Күнделікті тамаққа барлық тағам топтарын қосыңыз",
      "Гидратация тамақтану сияқты маңызды",
      "Өңделген тағамдарды шектеу керек"
    ],
    author: "Dr. Sarah Williams",
    date: "2024-01-05",
    readTime: "10 min",
    category: "Nutrition",
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400"
  }
];

const healthFacts = [
  {
    type: "fact",
    content: "Laughing 100 times is equivalent to 15 minutes of exercise on a stationary bicycle.",
    contentRu: "Смех 100 раз эквивалентен 15 минутам упражнений на велотренажере.",
    contentKz: "100 рет күлу велотренажерде 15 минут жаттығу жасауға тең."
  },
  {
    type: "myth",
    content: "MYTH: You need 8 glasses of water daily. FACT: Water needs vary by person, activity, and climate.",
    contentRu: "МИФ: Вам нужно 8 стаканов воды в день. ФАКТ: Потребность в воде зависит от человека, активности и климата.",
    contentKz: "МИФ: Күніне 8 стақан су ішу керек. ФАКТ: Су қажеттілігі адамға, белсенділікке және климатқа байланысты."
  },
  {
    type: "fact",
    content: "The human brain uses about 20% of the body's total energy despite being only 2% of body weight.",
    contentRu: "Человеческий мозг использует около 20% общей энергии тела, составляя всего 2% массы тела.",
    contentKz: "Адам миы дене салмағының тек 2% құрағанымен, жалпы энергияның шамамен 20% пайдаланады."
  },
  {
    type: "myth",
    content: "MYTH: Cracking knuckles causes arthritis. FACT: Studies show no link between knuckle cracking and arthritis.",
    contentRu: "МИФ: Хруст пальцами вызывает артрит. ФАКТ: Исследования не показывают связи между хрустом пальцами и артритом.",
    contentKz: "МИФ: Саусақтарды сытырлату артритке әкеледі. ФАКТ: Зерттеулер саусақтарды сытырлату мен артрит арасында байланыс жоқ екенін көрсетеді."
  }
];

export default function HealthArticles() {
  const [searchQuery, setSearchQuery] = useState("");
  const [language, setLanguage] = useState<"en" | "ru" | "kz">("en");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);

  const filteredArticles = articles.filter((article) => {
    const title = language === "ru" ? article.titleRu : language === "kz" ? article.titleKz : article.title;
    const summary = language === "ru" ? article.summaryRu : language === "kz" ? article.summaryKz : article.summary;
    return (
      (title?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (summary?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      article.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getTitle = (article: Article) => {
    if (language === "ru") return article.titleRu || article.title;
    if (language === "kz") return article.titleKz || article.title;
    return article.title;
  };

  const getSummary = (article: Article) => {
    if (language === "ru") return article.summaryRu || article.summary;
    if (language === "kz") return article.summaryKz || article.summary;
    return article.summary;
  };

  const getTakeaways = (article: Article) => {
    if (language === "ru") return article.keyTakeawaysRu || article.keyTakeaways;
    if (language === "kz") return article.keyTakeawaysKz || article.keyTakeaways;
    return article.keyTakeaways;
  };

  const getFact = () => {
    const fact = healthFacts[currentFactIndex];
    if (language === "ru") return fact.contentRu || fact.content;
    if (language === "kz") return fact.contentKz || fact.content;
    return fact.content;
  };

  const nextFact = () => {
    setCurrentFactIndex((prev) => (prev + 1) % healthFacts.length);
  };

  const languageLabels = {
    en: "English",
    ru: "Русский",
    kz: "Қазақша"
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-medical-pulse/20 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-medical-pulse" />
                </div>
                <div>
                  <h1 className="font-display text-3xl font-bold">Health Articles</h1>
                  <p className="text-muted-foreground">Evidence-based health information</p>
                </div>
              </div>

              {/* Language Selector */}
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <div className="flex bg-muted rounded-lg p-1">
                  {(["en", "ru", "kz"] as const).map((lang) => (
                    <Button
                      key={lang}
                      variant={language === lang ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setLanguage(lang)}
                      className="text-xs"
                    >
                      {languageLabels[lang]}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Health Myth/Fact Widget */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-6 border border-primary/20"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-semibold mb-1">
                    {healthFacts[currentFactIndex].type === "myth" ? "Health Myth Busted!" : "Did You Know?"}
                  </h3>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={currentFactIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-sm text-muted-foreground"
                    >
                      {getFact()}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={nextFact}
                className="gap-2 flex-shrink-0"
              >
                <RefreshCw className="w-4 h-4" />
                Next
              </Button>
            </div>
          </motion.div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Articles Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedArticle(article)}
                className="bg-card rounded-xl border border-border overflow-hidden cursor-pointer hover:shadow-medical transition-all group"
              >
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={article.image}
                    alt={getTitle(article)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                      {article.category}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-display font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {getTitle(article)}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {getSummary(article)}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3" />
                      {article.author}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {article.readTime}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredArticles.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No articles found</p>
            </div>
          )}

          {/* Article Detail Modal */}
          <AnimatePresence>
            {selectedArticle && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => setSelectedArticle(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-card rounded-2xl border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <img
                    src={selectedArticle.image}
                    alt={getTitle(selectedArticle)}
                    className="w-full aspect-video object-cover"
                  />
                  <div className="p-6 md:p-8">
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                        {selectedArticle.category}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {selectedArticle.readTime}
                      </span>
                    </div>

                    <h2 className="font-display text-2xl font-bold mb-4">
                      {getTitle(selectedArticle)}
                    </h2>

                    <p className="text-muted-foreground mb-6">
                      {getSummary(selectedArticle)}
                    </p>

                    <div className="bg-muted rounded-xl p-4 mb-6">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <ChevronRight className="w-4 h-4 text-primary" />
                        Key Takeaways
                      </h4>
                      <ul className="space-y-2">
                        {getTakeaways(selectedArticle).map((takeaway, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                            {takeaway}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Medical Disclaimer */}
                    <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
                        <div>
                          <h5 className="font-medium text-warning text-sm mb-1">Medical Disclaimer</h5>
                          <p className="text-xs text-muted-foreground">
                            This article is for informational purposes only and does not constitute medical advice. 
                            Always consult with a qualified healthcare provider for medical concerns.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="w-4 h-4" />
                        {selectedArticle.author}
                      </div>
                      <Button onClick={() => setSelectedArticle(null)}>
                        Close
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  );
}
