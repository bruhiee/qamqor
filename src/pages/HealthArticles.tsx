import { useMemo, useState } from "react";
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
  AlertTriangle,
  FileDown,
  Brain
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
  libraryType: "health-blog" | "symptom-guide" | "knowledge-base" | "medical-dictionary";
  tags: string[];
  image: string;
  content: string[];
  contentKz?: string[];
  contentRu?: string[];
}

type SortOption = "relevance" | "newest" | "oldest" | "short-read";

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
    libraryType: "knowledge-base",
    tags: ["heart", "cardiology", "prevention", "exercise"],
    content: [
      "The heart is a muscle that works around the clock to deliver oxygen-rich blood throughout the body; high blood pressure, high cholesterol, smoking, diabetes, and inactivity are the most common risk factors for heart disease.",
      "Regular exercise, a Mediterranean-style diet rich in vegetables, lean proteins, and whole grains, and maintaining a healthy weight help lower blood pressure and inflammation.",
      "Keep track of blood pressure, cholesterol, and blood sugar with regular checkups and discuss medication adjustments with your doctor."
    ],
    contentRu: [
      "Сердце — это мышца, работающая круглосуточно, а основные факторы риска — высокое давление, холестерин, курение, диабет и малоподвижный образ жизни.",
      "Регулярные упражнения, средиземноморская диета с овощами, нежирным белком и цельными зернами, а также поддержание здорового веса снижают кровяное давление и воспаление.",
      "Контролируйте давление, холестерин и уровень сахара, регулярно проходя обследования и обсуждая лекарства с врачом."
    ],
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
    libraryType: "health-blog",
    tags: ["sleep", "recovery", "wellness", "stress"],
    content: [
      "Sleep supports brain clearance, hormone balance, and immune defense; chronic disruptions raise inflammation and worsen mood.",
      "Stick to a consistent bedtime, dim screens at least an hour before sleep, and keep the bedroom cool, dark, and quiet.",
      "If problems persist, track your habits and talk to a provider about sleep apnea, restless legs, or stress-related insomnia."
    ],
    contentRu: [
      "Сон помогает очищать мозг, регулировать гормоны и поддерживать иммунитет; хронические нарушения сна повышают воспаление и ухудшают самочувствие.",
      "Соблюдайте постоянный режим, отключайте экраны за час до сна и обеспечьте прохладу, темноту и тишину в спальне.",
      "Если трудности не проходят, фиксируйте привычки и обсудите их с врачом — возможно, это апноэ, синдром беспокойных ног или стресс."
    ],
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
    libraryType: "symptom-guide",
    tags: ["nutrition", "diet", "hydration", "activity"],
    content: [
      "Understanding macronutrients — carbohydrates, proteins, and fats — helps you build meals that support steady energy and satiety.",
      "Hydration matters as much as nutrition; choose mostly water, limit sugary beverages, and respond to your body's thirst cues.",
      "Swap highly processed foods for whole ingredients, check labels for sodium and added sugar, and practice portion control."
    ],
    contentRu: [
      "Понимание макроэлементов — углеводов, белков и жиров — помогает составить рацион, поддерживающий стабильную энергию и сытость.",
      "Гидратация важна, как и питание; выбирайте в основном воду, сократите сладкие напитки и прислушивайтесь к жажде.",
      "Заменяйте обработанные продукты цельными ингредиентами, изучайте этикетки на соль и сахар и контролируйте размеры порций."
    ],
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400"
  },
  {
    id: "4",
    title: "Medical Terms Dictionary: Essential Words for Patients",
    summary: "A plain-language mini dictionary of common medical terms you may hear during consultations.",
    keyTakeaways: [
      "Diagnosis means identifying the condition based on symptoms and tests",
      "Prognosis is the expected course or outcome of a condition",
      "Contraindication means a reason to avoid a treatment or medicine"
    ],
    author: "Editorial Medical Team",
    date: "2024-02-01",
    readTime: "5 min",
    category: "Medical Dictionary",
    libraryType: "medical-dictionary",
    tags: ["dictionary", "terms", "patient-education", "health-literacy"],
    content: [
      "Diagnosis: the process clinicians use to identify what may be causing your symptoms.",
      "Prognosis: an estimate of how a disease may progress over time.",
      "Contraindication: a condition or factor that makes a treatment unsafe for a person."
    ],
    image: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=400"
  },
  {
    id: "5",
    title: "Blood Pressure 101: How to Measure and Interpret Numbers",
    summary: "Learn what systolic and diastolic values mean, how to measure blood pressure correctly at home, and when to seek care.",
    keyTakeaways: [
      "Use a validated arm cuff and rest for 5 minutes before checking",
      "Track readings at the same time each day for trends",
      "Very high readings with symptoms require urgent care"
    ],
    author: "Dr. Elena Park",
    date: "2024-02-14",
    readTime: "7 min",
    category: "Cardiology",
    libraryType: "symptom-guide",
    tags: ["blood pressure", "hypertension", "monitoring", "heart"],
    content: [
      "Blood pressure has two numbers: systolic pressure when the heart contracts and diastolic pressure when it relaxes between beats.",
      "For accurate home readings, avoid caffeine and smoking for 30 minutes, sit with feet flat, and keep the cuff at heart level.",
      "Bring your blood pressure log to appointments so your clinician can adjust lifestyle or treatment plans based on patterns, not a single reading."
    ],
    image: "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=400"
  },
  {
    id: "6",
    title: "Understanding Fever in Children and Adults",
    summary: "A practical guide to fever thresholds, warning signs, hydration, and safe home care before a clinic visit.",
    keyTakeaways: [
      "Fever is often a sign of immune response, not always dangerous",
      "Hydration and symptom comfort are key in home care",
      "Seek urgent help for breathing issues, confusion, or dehydration"
    ],
    author: "Dr. Omar Rakhimov",
    date: "2024-02-20",
    readTime: "8 min",
    category: "Family Medicine",
    libraryType: "symptom-guide",
    tags: ["fever", "infection", "children", "home care"],
    content: [
      "Fever commonly reflects the body fighting infection; the overall clinical picture matters more than one number.",
      "Use age-appropriate dosing for fever reducers, encourage fluids, and monitor urine output, alertness, and breathing.",
      "Call emergency services if severe symptoms appear, including stiff neck, persistent vomiting, seizure, or altered consciousness."
    ],
    image: "https://images.unsplash.com/photo-1584515933487-779824d29309?w=400"
  },
  {
    id: "7",
    title: "Managing Type 2 Diabetes Day by Day",
    summary: "Build a daily diabetes routine around nutrition, activity, glucose checks, and medication adherence.",
    keyTakeaways: [
      "Small daily habits improve long-term glucose control",
      "Consistent meals and movement help reduce glucose spikes",
      "Foot checks and eye exams prevent complications"
    ],
    author: "Dr. Linda Gomez",
    date: "2024-02-26",
    readTime: "9 min",
    category: "Endocrinology",
    libraryType: "knowledge-base",
    tags: ["diabetes", "glucose", "nutrition", "prevention"],
    content: [
      "Type 2 diabetes management combines medication, food planning, activity, stress control, and regular lab follow-up.",
      "Aim for realistic changes: shorter post-meal walks, regular sleep, and balanced plates with fiber and lean protein.",
      "Prevent complications by checking feet daily, scheduling retinal exams, and discussing kidney and cholesterol monitoring with your clinician."
    ],
    image: "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400"
  },
  {
    id: "8",
    title: "Migraine or Tension Headache: How to Tell the Difference",
    summary: "Recognize key patterns of common headaches and learn when red flags suggest urgent evaluation.",
    keyTakeaways: [
      "Migraine often includes nausea, light sensitivity, or aura",
      "Tension headaches are usually pressure-like and bilateral",
      "Sudden worst-ever headache needs emergency assessment"
    ],
    author: "Dr. Priya Anand",
    date: "2024-03-02",
    readTime: "6 min",
    category: "Neurology",
    libraryType: "symptom-guide",
    tags: ["headache", "migraine", "neurology", "symptoms"],
    content: [
      "Migraines can be pulsating, one-sided, and linked to nausea or sensitivity to light and sound, while tension headaches feel like a tight band.",
      "Track triggers such as sleep debt, dehydration, skipped meals, stress, and hormonal changes to reduce attack frequency.",
      "Seek urgent care for thunderclap headache, neurologic deficits, fever with neck stiffness, or head injury."
    ],
    image: "https://images.unsplash.com/photo-1477332552946-cfb384aeaf1c?w=400"
  },
  {
    id: "9",
    title: "Respiratory Symptoms: Cough, Wheeze, and Shortness of Breath",
    summary: "Understand common respiratory symptoms and identify warning patterns that should not be ignored.",
    keyTakeaways: [
      "Duration and trigger patterns help narrow likely causes",
      "Shortness of breath at rest can indicate serious illness",
      "Pulse oximetry is useful but does not replace clinical exam"
    ],
    author: "Dr. Jacob Miller",
    date: "2024-03-07",
    readTime: "8 min",
    category: "Pulmonology",
    libraryType: "knowledge-base",
    tags: ["cough", "asthma", "breathing", "lungs"],
    content: [
      "Respiratory complaints can result from infections, asthma, allergies, reflux, or chronic lung disease, so history and exam are essential.",
      "Note whether symptoms worsen with exercise, cold air, smoke exposure, or nighttime patterns to help with diagnosis.",
      "Emergency care is needed for chest pain, blue lips, severe breathlessness, confusion, or rapidly worsening symptoms."
    ],
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400"
  },
  {
    id: "10",
    title: "Gut Health Basics: Bloating, Constipation, and IBS",
    summary: "A practical introduction to common digestive complaints and structured self-monitoring before doctor visits.",
    keyTakeaways: [
      "Fiber and hydration improve bowel regularity",
      "Food and stress diaries can reveal symptom triggers",
      "Blood in stool or unexplained weight loss are red flags"
    ],
    author: "Dr. Hannah Reed",
    date: "2024-03-13",
    readTime: "7 min",
    category: "Gastroenterology",
    libraryType: "health-blog",
    tags: ["digestion", "ibs", "bloating", "nutrition"],
    content: [
      "Digestive symptoms are common and often multifactorial, involving diet, gut motility, stress, and microbiome balance.",
      "Increase fiber gradually, drink enough water, and use symptom diaries to identify foods or situations linked to discomfort.",
      "See a clinician promptly for persistent vomiting, severe abdominal pain, fever, rectal bleeding, or unexplained weight loss."
    ],
    image: "https://images.unsplash.com/photo-1559757175-08f7b7f6aaf2?w=400"
  },
  {
    id: "11",
    title: "Mental Health Check-In: Recognizing Burnout Early",
    summary: "Understand the signs of burnout and build a recovery plan with boundaries, sleep, and professional support.",
    keyTakeaways: [
      "Burnout affects mood, sleep, focus, and physical energy",
      "Recovery requires workload and lifestyle changes",
      "Persistent hopelessness needs urgent mental health support"
    ],
    author: "Dr. Aisha Karim",
    date: "2024-03-18",
    readTime: "6 min",
    category: "Mental Health",
    libraryType: "health-blog",
    tags: ["burnout", "stress", "mental health", "sleep"],
    content: [
      "Burnout often appears as emotional exhaustion, reduced effectiveness, cynicism, irritability, and physical fatigue.",
      "Structured routines, clear boundaries, social support, and therapy can improve resilience and reduce symptom recurrence.",
      "If thoughts of self-harm or severe depression are present, contact emergency services or crisis support immediately."
    ],
    image: "https://images.unsplash.com/photo-1493836512294-502baa1986e2?w=400"
  },
  {
    id: "12",
    title: "Allergy Season Survival Guide",
    summary: "Reduce allergy symptoms using environmental controls, medication timing, and trigger forecasting.",
    keyTakeaways: [
      "Pollen exposure can be lowered with simple home routines",
      "Preventive treatment works better than late treatment",
      "Breathing difficulty may indicate severe allergic reaction"
    ],
    author: "Dr. Eric Choi",
    date: "2024-03-24",
    readTime: "5 min",
    category: "Immunology",
    libraryType: "symptom-guide",
    tags: ["allergy", "pollen", "rhinitis", "prevention"],
    content: [
      "Seasonal allergies cause sneezing, itching, watery eyes, and congestion, often worse on high pollen days.",
      "Shower after outdoor exposure, keep windows closed during peak pollen times, and consider HEPA filtration indoors.",
      "Use antihistamines or nasal therapies as advised; seek urgent care for wheezing, swelling, or breathing compromise."
    ],
    image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400"
  },
  {
    id: "13",
    title: "First Signs of Dehydration and How to Rehydrate Safely",
    summary: "Learn to spot dehydration early and choose effective fluid replacement strategies.",
    keyTakeaways: [
      "Thirst, dark urine, and dizziness are common early signs",
      "Oral rehydration can be more effective than plain water alone",
      "Children and older adults dehydrate faster"
    ],
    author: "Dr. Matthew Silva",
    date: "2024-03-29",
    readTime: "5 min",
    category: "Emergency Basics",
    libraryType: "symptom-guide",
    tags: ["dehydration", "fluids", "heat", "first aid"],
    content: [
      "Mild dehydration can cause fatigue, headache, dry mouth, and reduced urine output, especially during heat or illness.",
      "Use oral rehydration solutions after vomiting or diarrhea; take small frequent sips instead of large volumes at once.",
      "Get immediate care for confusion, fainting, inability to keep fluids down, or signs of severe dehydration."
    ],
    image: "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400"
  },
  {
    id: "14",
    title: "Understanding Laboratory Tests: CBC, CRP, and Glucose",
    summary: "A patient-friendly explanation of common lab tests and how to discuss results with your doctor.",
    keyTakeaways: [
      "One abnormal result does not always mean disease",
      "Trends over time are often more informative than single values",
      "Interpretation depends on symptoms and medical history"
    ],
    author: "Dr. Kevin Stone",
    date: "2024-04-04",
    readTime: "8 min",
    category: "Diagnostics",
    libraryType: "knowledge-base",
    tags: ["labs", "cbc", "crp", "glucose"],
    content: [
      "Complete blood count helps evaluate infection, anemia, and platelet status, while CRP reflects inflammation patterns.",
      "Glucose and HbA1c provide complementary information about current and long-term sugar regulation.",
      "Review all results with context: medications, hydration, recent illness, and baseline values can affect interpretation."
    ],
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400"
  },
  {
    id: "15",
    title: "Women's Health: Tracking Cycle-Related Symptoms",
    summary: "Use symptom tracking to better understand menstrual patterns, pain, and hormonal changes.",
    keyTakeaways: [
      "Cycle tracking can improve diagnosis of recurrent symptoms",
      "Severe pain is common but not always normal",
      "Irregular bleeding should be evaluated clinically"
    ],
    author: "Dr. Natalia Sokolova",
    date: "2024-04-10",
    readTime: "7 min",
    category: "Gynecology",
    libraryType: "health-blog",
    tags: ["women's health", "cycle", "pain", "tracking"],
    content: [
      "Recording cycle length, bleeding intensity, mood changes, and pain allows more precise conversations with healthcare professionals.",
      "Lifestyle factors like sleep, stress, and exercise can influence symptoms and should be included in your tracking log.",
      "Seek care for very heavy bleeding, severe pain unresponsive to usual measures, or cycles that become persistently irregular."
    ],
    image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=400"
  },
  {
    id: "16",
    title: "Joint Pain Guide: Inflammation vs Overuse",
    summary: "Differentiate mechanical pain from inflammatory patterns and choose safe first-line management.",
    keyTakeaways: [
      "Morning stiffness duration can suggest inflammatory causes",
      "Load management and movement aid recovery in overuse injuries",
      "Hot swollen joints with fever require urgent evaluation"
    ],
    author: "Dr. Robert Kline",
    date: "2024-04-16",
    readTime: "7 min",
    category: "Rheumatology",
    libraryType: "knowledge-base",
    tags: ["joint pain", "arthritis", "inflammation", "mobility"],
    content: [
      "Joint pain may result from strain, degeneration, autoimmune inflammation, or infection, each requiring different treatment strategies.",
      "Gentle motion, graded strengthening, and temporary load reduction often help mechanical pain recover faster.",
      "Do not delay care if a joint becomes acutely red, hot, and swollen, especially with fever or inability to bear weight."
    ],
    image: "https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=400"
  },
  {
    id: "17",
    title: "Skin Rash Basics: What Photos Can and Cannot Tell",
    summary: "Understand the limits of visual self-assessment and when in-person dermatology review is needed.",
    keyTakeaways: [
      "Rash appearance changes with skin tone and lighting",
      "Itch, pain, fever, and spread pattern are key context clues",
      "Rapid swelling or breathing issues may signal emergency allergy"
    ],
    author: "Dr. Melissa Tran",
    date: "2024-04-21",
    readTime: "6 min",
    category: "Dermatology",
    libraryType: "symptom-guide",
    tags: ["rash", "skin", "allergy", "dermatology"],
    content: [
      "Photos can help track progression, but diagnosis requires history, physical exam, and sometimes laboratory tests.",
      "Document onset, new products, medications, recent infections, and exposure history to improve diagnostic accuracy.",
      "Seek urgent care for facial swelling, mucosal lesions, high fever, rapidly spreading rash, or breathing symptoms."
    ],
    image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400"
  },
  {
    id: "18",
    title: "Vaccination Q&A: Timing, Side Effects, and Myths",
    summary: "A clear guide to vaccine schedules, expected reactions, and when post-vaccination symptoms need attention.",
    keyTakeaways: [
      "Mild side effects are common and usually short-lived",
      "Vaccination protects both individuals and communities",
      "Severe reactions are rare but require immediate treatment"
    ],
    author: "Dr. Daniel Foster",
    date: "2024-04-27",
    readTime: "8 min",
    category: "Preventive Medicine",
    libraryType: "knowledge-base",
    tags: ["vaccination", "prevention", "immunity", "public health"],
    content: [
      "Vaccines train immune memory to recognize serious infections and reduce disease severity, hospitalization, and complications.",
      "Common reactions include arm soreness, mild fever, and fatigue; these usually resolve within one to two days.",
      "Discuss timing, pregnancy, chronic conditions, and prior reactions with your clinician to personalize recommendations."
    ],
    image: "https://images.unsplash.com/photo-1600959907703-125ba1374a12?w=400"
  },
  {
    id: "19",
    title: "Medical Dictionary: Triage, Comorbidity, and Acute Care",
    summary: "Key terms frequently used in emergency and hospital settings explained in plain language.",
    keyTakeaways: [
      "Triage prioritizes patients by urgency and risk",
      "Comorbidity means multiple conditions present together",
      "Acute care focuses on immediate short-term treatment"
    ],
    author: "Editorial Medical Team",
    date: "2024-05-03",
    readTime: "4 min",
    category: "Medical Dictionary",
    libraryType: "medical-dictionary",
    tags: ["dictionary", "triage", "hospital", "terms"],
    content: [
      "Triage: a structured process used to decide which patients need immediate care first.",
      "Comorbidity: the presence of one or more additional health conditions alongside a primary diagnosis.",
      "Acute care: short-term medical treatment for sudden or severe illness and injury."
    ],
    image: "https://images.unsplash.com/photo-1516549655669-df83a0774514?w=400"
  },
  {
    id: "20",
    title: "Medical Dictionary: Screening, Sensitivity, and Specificity",
    summary: "Understand core screening concepts that appear in test recommendations and result interpretation.",
    keyTakeaways: [
      "Screening detects risk before symptoms appear",
      "Sensitivity measures true positive detection",
      "Specificity measures true negative identification"
    ],
    author: "Editorial Medical Team",
    date: "2024-05-08",
    readTime: "4 min",
    category: "Medical Dictionary",
    libraryType: "medical-dictionary",
    tags: ["dictionary", "screening", "diagnostics", "health literacy"],
    content: [
      "Screening: testing people without symptoms to identify disease risk early.",
      "Sensitivity: how well a test correctly identifies people who have a condition.",
      "Specificity: how well a test correctly identifies people who do not have a condition."
    ],
    image: "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400"
  },
  {
    id: "21",
    title: "Back Pain at Work: Ergonomics and Recovery",
    summary: "Prevent and reduce office-related back pain using posture, breaks, and progressive strengthening.",
    keyTakeaways: [
      "Prolonged static posture increases pain risk",
      "Micro-breaks and movement snacks reduce stiffness",
      "Neurologic deficits require urgent assessment"
    ],
    author: "Dr. Irene Volkova",
    date: "2024-05-14",
    readTime: "6 min",
    category: "Musculoskeletal",
    libraryType: "health-blog",
    tags: ["back pain", "ergonomics", "exercise", "workplace"],
    content: [
      "Most office-related back pain improves with movement, load management, and targeted strength work rather than prolonged rest.",
      "Adjust chair height, monitor level, and keyboard position to keep a neutral spine and reduce repetitive strain.",
      "Seek immediate medical care for new weakness, numbness in saddle area, or bowel and bladder control changes."
    ],
    image: "https://images.unsplash.com/photo-1584467735871-8f7f2d3d6f54?w=400"
  },
  {
    id: "22",
    title: "Antibiotics: When They Help and When They Do Not",
    summary: "Learn why antibiotics are essential for bacterial infections but ineffective for most viral illnesses.",
    keyTakeaways: [
      "Antibiotics do not treat colds or most flu cases",
      "Incomplete courses increase resistance risk",
      "Side effects should be reported early"
    ],
    author: "Dr. Samuel Greene",
    date: "2024-05-20",
    readTime: "7 min",
    category: "Infectious Disease",
    libraryType: "knowledge-base",
    tags: ["antibiotics", "infection", "resistance", "medication safety"],
    content: [
      "Antibiotics target bacteria, not viruses, so unnecessary use offers little benefit and can cause harm.",
      "Take medications exactly as prescribed and never share leftovers, since dosing and drug choice are diagnosis-specific.",
      "Contact your clinician if you develop rash, severe diarrhea, persistent fever, or no improvement after expected time."
    ],
    image: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=400"
  },
  {
    id: "23",
    title: "Healthy Aging: Preventive Care After 50",
    summary: "A preventive roadmap covering mobility, cognition, vaccination, bone health, and screening priorities.",
    keyTakeaways: [
      "Strength and balance training lowers fall risk",
      "Routine screening supports early detection",
      "Social connection improves physical and mental outcomes"
    ],
    author: "Dr. Grace Liu",
    date: "2024-05-27",
    readTime: "9 min",
    category: "Geriatrics",
    libraryType: "health-blog",
    tags: ["aging", "prevention", "screening", "mobility"],
    content: [
      "Healthy aging is built on preventive habits: exercise, sleep, nutrition, vaccination, and regular medication review.",
      "Prioritize resistance training, balance work, vision checks, and home safety modifications to reduce injury risk.",
      "Discuss age-appropriate cancer screening, bone density, hearing, and memory concerns with your healthcare team."
    ],
    image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400"
  },
  {
    id: "24",
    title: "Medical Dictionary: Chronic, Remission, and Relapse",
    summary: "Common long-term care terms explained for patients and families navigating ongoing treatment.",
    keyTakeaways: [
      "Chronic conditions last months or years",
      "Remission means reduced or absent disease activity",
      "Relapse means symptoms or disease activity return"
    ],
    author: "Editorial Medical Team",
    date: "2024-06-02",
    readTime: "4 min",
    category: "Medical Dictionary",
    libraryType: "medical-dictionary",
    tags: ["dictionary", "chronic care", "terms", "patient education"],
    content: [
      "Chronic: a condition that persists for a long period and often needs ongoing management.",
      "Remission: a phase when disease signs are minimal or absent, though follow-up may still be required.",
      "Relapse: the return of symptoms or disease activity after improvement."
    ],
    image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400"
  }
];

const firstAidArticles: Article[] = [
  {
    id: "fa-cpr",
    title: "First Aid: CPR (Cardiopulmonary Resuscitation)",
    summary: "Step-by-step CPR actions for unresponsive people who are not breathing normally.",
    keyTakeaways: [
      "Call emergency services immediately",
      "Use hard and fast chest compressions",
      "Continue until professionals arrive"
    ],
    author: "First Aid Team",
    date: "2024-03-01",
    readTime: "6 min",
    category: "Emergency Basics",
    libraryType: "symptom-guide",
    tags: ["first aid", "cpr", "emergency", "resuscitation"],
    image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=400",
    content: [
      "Check responsiveness and normal breathing, then call emergency services and put your phone on speaker.",
      "Place the person on a firm surface and start chest compressions in the center of the chest at 100-120 per minute with sufficient depth.",
      "If trained, use rescue breaths in a 30:2 cycle. Keep going until the person recovers or medical help takes over."
    ]
  },
  {
    id: "fa-choking",
    title: "First Aid: Choking (Heimlich Maneuver)",
    summary: "How to identify severe choking and perform abdominal thrusts safely.",
    keyTakeaways: [
      "Act quickly when a person cannot breathe or speak",
      "Use repeated inward-upward thrusts",
      "Call emergency services if obstruction persists"
    ],
    author: "First Aid Team",
    date: "2024-03-01",
    readTime: "5 min",
    category: "Emergency Basics",
    libraryType: "symptom-guide",
    tags: ["first aid", "choking", "heimlich", "airway"],
    image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400",
    content: [
      "Recognize signs of severe choking: inability to cough, speak, or breathe, often with throat clutching and panic.",
      "Stand behind the person, place a fist above the navel, and perform forceful inward and upward abdominal thrusts.",
      "Repeat until the object is expelled or the person becomes unresponsive, then switch to emergency response and call for urgent help."
    ]
  },
  {
    id: "fa-burns",
    title: "First Aid: Burns and Scalds",
    summary: "Immediate cooling and practical burn care to reduce tissue damage.",
    keyTakeaways: [
      "Cool with running water for at least 20 minutes",
      "Do not apply ice, oils, or toothpaste",
      "Seek care for large, deep, or sensitive-area burns"
    ],
    author: "First Aid Team",
    date: "2024-03-02",
    readTime: "6 min",
    category: "Emergency Basics",
    libraryType: "symptom-guide",
    tags: ["first aid", "burns", "scalds", "wound care"],
    image: "https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=400",
    content: [
      "Remove the source of heat and cool the burn under cool running water for at least 20 minutes.",
      "Cover loosely with a clean, non-fluffy dressing and monitor pain, swelling, and signs of shock.",
      "Do not break blisters or remove stuck clothing. Urgent evaluation is needed for severe, chemical, electrical, or large burns."
    ]
  },
  {
    id: "fa-bleeding",
    title: "First Aid: Severe Bleeding Control",
    summary: "How to stop heavy bleeding fast with direct pressure and safe wound handling.",
    keyTakeaways: [
      "Apply firm direct pressure immediately",
      "Add layers without removing soaked dressing",
      "Call emergency services for ongoing heavy bleeding"
    ],
    author: "First Aid Team",
    date: "2024-03-02",
    readTime: "5 min",
    category: "Emergency Basics",
    libraryType: "symptom-guide",
    tags: ["first aid", "bleeding", "trauma", "emergency"],
    image: "https://images.unsplash.com/photo-1583947582886-f40ec95dd752?w=400",
    content: [
      "Ensure scene safety and apply firm direct pressure with clean cloth or bandage without frequent checking.",
      "If blood soaks through, place more material on top and keep pressure continuous to support clot formation.",
      "Elevate the injured area when possible and seek emergency care for spurting blood, shock signs, or uncontrolled bleeding."
    ]
  },
  {
    id: "fa-stroke",
    title: "First Aid: Stroke Recognition (FAST)",
    summary: "Use FAST signs to identify stroke quickly and reduce delay to emergency treatment.",
    keyTakeaways: [
      "Face droop, Arm weakness, Speech change, Time to call",
      "Do not give food, drink, or aspirin",
      "Every minute matters for brain protection"
    ],
    author: "First Aid Team",
    date: "2024-03-03",
    readTime: "5 min",
    category: "Emergency Basics",
    libraryType: "symptom-guide",
    tags: ["first aid", "stroke", "fast", "neurology"],
    image: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=400",
    content: [
      "Check FAST signs: facial asymmetry, arm drift, and abnormal speech. If any sign is positive, call emergency services now.",
      "Note symptom start time, keep the person safe and comfortable, and monitor breathing.",
      "Avoid giving oral intake or unprescribed medication while waiting for medical responders."
    ]
  },
  {
    id: "fa-fractures",
    title: "First Aid: Suspected Fractures",
    summary: "Safe immobilization principles for possible broken bones before medical care.",
    keyTakeaways: [
      "Immobilize in found position",
      "Use padded splinting when needed",
      "Do not attempt bone realignment"
    ],
    author: "First Aid Team",
    date: "2024-03-03",
    readTime: "6 min",
    category: "Emergency Basics",
    libraryType: "symptom-guide",
    tags: ["first aid", "fracture", "splint", "injury"],
    image: "https://images.unsplash.com/photo-1612277795421-9bc7706a4a41?w=400",
    content: [
      "Suspect fracture with deformity, swelling, severe pain, or inability to move. Keep the limb still.",
      "Apply a cold pack wrapped in cloth and immobilize using a padded splint extending beyond joints above and below injury.",
      "Do not straighten the limb or move a person with possible spine injury unless absolutely necessary for safety."
    ]
  },
  {
    id: "fa-anaphylaxis",
    title: "First Aid: Severe Allergic Reaction (Anaphylaxis)",
    summary: "Emergency response for life-threatening allergic reactions and airway risk.",
    keyTakeaways: [
      "Recognize breathing and swelling danger signs early",
      "Use epinephrine promptly if available",
      "Always call emergency services"
    ],
    author: "First Aid Team",
    date: "2024-03-04",
    readTime: "5 min",
    category: "Emergency Basics",
    libraryType: "symptom-guide",
    tags: ["first aid", "allergy", "anaphylaxis", "epipen"],
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400",
    content: [
      "Watch for throat swelling, breathing difficulty, hives, dizziness, and rapid progression of symptoms.",
      "Call emergency services immediately and assist with epinephrine auto-injector use if prescribed.",
      "Keep the person under close observation and prepare for CPR if breathing stops."
    ]
  },
  {
    id: "fa-poisoning",
    title: "First Aid: Poisoning and Overdose",
    summary: "Immediate safety steps and poison-control actions for suspected toxic exposure.",
    keyTakeaways: [
      "Identify substance and exposure details",
      "Contact poison control or emergency services fast",
      "Do not induce vomiting unless instructed"
    ],
    author: "First Aid Team",
    date: "2024-03-04",
    readTime: "6 min",
    category: "Emergency Basics",
    libraryType: "symptom-guide",
    tags: ["first aid", "poisoning", "overdose", "toxicology"],
    image: "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400",
    content: [
      "Collect key details: substance name, amount, route of exposure, and time since contact.",
      "Follow poison control instructions exactly. For inhaled toxins, move to fresh air; for skin exposure, rinse thoroughly.",
      "Do not use home remedies or force fluids unless instructed by professionals."
    ]
  }
];

const allArticles: Article[] = [...articles, ...firstAidArticles];

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

const articlePageCopy = {
  en: {
    title: "Health Articles",
    subtitle: "Evidence-based health information",
    mythTitle: "Health Myth Busted!",
    factTitle: "Did You Know?",
    searchPlaceholder: "Search articles...",
    noArticles: "No articles found",
    keyTakeaways: "Key Takeaways",
    medicalDisclaimerTitle: "Medical Disclaimer",
    medicalDisclaimerText:
      "This article is for informational purposes only and does not constitute medical advice. Always consult with a qualified healthcare provider for medical concerns.",
    nextFact: "Next",
    close: "Close",
  },
  ru: {
    title: "Статьи о здоровье",
    subtitle: "Информация, основанная на доказательствах",
    mythTitle: "Миф о здоровье развенчан!",
    factTitle: "Знаете ли вы?",
    searchPlaceholder: "Поиск статей...",
    noArticles: "Статьи не найдены",
    keyTakeaways: "Основные выводы",
    medicalDisclaimerTitle: "Медицинская оговорка",
    medicalDisclaimerText:
      "Эта статья предназначена только для информации и не заменяет консультацию врача. Обратитесь к квалифицированному специалисту по медицинским вопросам.",
    nextFact: "Далее",
    close: "Закрыть",
  },
  kz: {
    title: "Денсаулық мақалалары",
    subtitle: "Дәлелді денсаулық ақпараты",
    mythTitle: "Денсаулық мифы жоққа шығарылды!",
    factTitle: "Сіз білдіңіз бе?",
    searchPlaceholder: "Мақалаларды іздеу...",
    noArticles: "Мақалалар табылмады",
    keyTakeaways: "Негізгі тұжырымдар",
    medicalDisclaimerTitle: "Медициналық ескерту",
    medicalDisclaimerText:
      "Бұл мақала ақпараттық сипатта және дәрігерлік кеңес орнына шықпайды. Денсаулық мәселелері бойынша білікті маманға жүгініңіз.",
    nextFact: "Келесі",
    close: "Жабу",
  },
};

export default function HealthArticles() {
  const [searchQuery, setSearchQuery] = useState("");
  const [language, setLanguage] = useState<"en" | "ru" | "kz">("en");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState<"all" | Article["libraryType"]>("all");
  const [activeTag, setActiveTag] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const copy = articlePageCopy[language];
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const categoryLabels =
    language === "ru"
      ? {
          all: "Все",
          "health-blog": "Блог о здоровье",
          "symptom-guide": "Руководство по симптомам",
          "knowledge-base": "База медицинских знаний",
          "medical-dictionary": "Словарь медицинских терминов",
        }
      : language === "kz"
        ? {
            all: "Барлығы",
            "health-blog": "Денсаулық блогы",
            "symptom-guide": "Симптом нұсқаулығы",
            "knowledge-base": "Медициналық білім базасы",
            "medical-dictionary": "Медициналық терминдер сөздігі",
          }
        : {
            all: "All",
            "health-blog": "Health Blog",
            "symptom-guide": "Symptom Guide",
            "knowledge-base": "Medical Knowledge Base",
            "medical-dictionary": "Medical Dictionary",
          };

  const allTags = useMemo(
    () => Array.from(new Set(allArticles.flatMap((article) => article.tags))).sort(),
    [],
  );

  const getReadTimeMinutes = (readTime: string) => Number.parseInt(readTime, 10) || 999;

  const filteredArticles = useMemo(() => {
    const getLocalizedTitle = (article: Article) =>
      language === "ru" ? article.titleRu || article.title : language === "kz" ? article.titleKz || article.title : article.title;
    const getLocalizedSummary = (article: Article) =>
      language === "ru" ? article.summaryRu || article.summary : language === "kz" ? article.summaryKz || article.summary : article.summary;
    const getLocalizedTakeaways = (article: Article) =>
      language === "ru" ? article.keyTakeawaysRu || article.keyTakeaways : language === "kz" ? article.keyTakeawaysKz || article.keyTakeaways : article.keyTakeaways;
    const getLocalizedContent = (article: Article) =>
      language === "ru" ? article.contentRu || article.content : language === "kz" ? article.contentKz || article.content : article.content;

    const getRelevanceScore = (article: Article) => {
      if (!normalizedQuery) return 0;
      const title = getLocalizedTitle(article).toLowerCase();
      const summary = getLocalizedSummary(article).toLowerCase();
      const takeaways = getLocalizedTakeaways(article).join(" ").toLowerCase();
      const content = getLocalizedContent(article).join(" ").toLowerCase();
      const tags = article.tags.join(" ").toLowerCase();
      const category = article.category.toLowerCase();

      let score = 0;
      if (title.includes(normalizedQuery)) score += 6;
      if (summary.includes(normalizedQuery)) score += 4;
      if (takeaways.includes(normalizedQuery)) score += 3;
      if (content.includes(normalizedQuery)) score += 2;
      if (tags.includes(normalizedQuery)) score += 3;
      if (category.includes(normalizedQuery)) score += 2;
      return score;
    };

    const filtered = allArticles.filter((article) => {
      const categoryMatch = activeCategory === "all" || article.libraryType === activeCategory;
      const tagMatch = activeTag === "all" || article.tags.includes(activeTag);
      if (!categoryMatch || !tagMatch) return false;
      if (!normalizedQuery) return true;
      return getRelevanceScore(article) > 0;
    });

    return filtered.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortBy === "short-read") {
        return getReadTimeMinutes(a.readTime) - getReadTimeMinutes(b.readTime);
      }
      if (normalizedQuery) {
        return getRelevanceScore(b) - getRelevanceScore(a);
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [activeCategory, activeTag, language, normalizedQuery, sortBy]);

  const resetFilters = () => {
    setSearchQuery("");
    setActiveCategory("all");
    setActiveTag("all");
    setSortBy("relevance");
  };

  const hasActiveFilters = Boolean(normalizedQuery) || activeCategory !== "all" || activeTag !== "all" || sortBy !== "relevance";

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

  const getContent = (article: Article) => {
    if (language === "ru") return article.contentRu || article.content;
    if (language === "kz") return article.contentKz || article.content;
    return article.content;
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

  const downloadArticleAsPdf = (article: Article) => {
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    const html = `
      <html>
      <head><title>${getTitle(article)}</title></head>
      <body style="font-family: Arial, sans-serif; padding: 24px; line-height: 1.5;">
        <h1>${getTitle(article)}</h1>
        <p><strong>Category:</strong> ${article.category}</p>
        <p><strong>Author:</strong> ${article.author}</p>
        <p><strong>Date:</strong> ${article.date}</p>
        <p>${getSummary(article)}</p>
        ${getContent(article).map((paragraph) => `<p>${paragraph}</p>`).join("")}
        <h3>${copy.keyTakeaways}</h3>
        <ul>${getTakeaways(article).map((item) => `<li>${item}</li>`).join("")}</ul>
      </body>
      </html>
    `;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
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
                  <h1 className="font-display text-3xl font-bold">
                    {copy.title}
                  </h1>
                  <p className="text-muted-foreground">{copy.subtitle}</p>
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
                    {healthFacts[currentFactIndex].type === "myth" ? copy.mythTitle : copy.factTitle}
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
                {copy.nextFact}
              </Button>
            </div>
          </motion.div>

          {/* Search */}
          <div className="mb-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <p className="text-sm text-muted-foreground">
                {language === "ru"
                  ? `Найдено: ${filteredArticles.length}`
                  : language === "kz"
                    ? `Табылды: ${filteredArticles.length}`
                    : `Showing: ${filteredArticles.length}`}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  {language === "ru" ? "Сбросить фильтры" : language === "kz" ? "Сүзгілерді тазарту" : "Clear filters"}
                </Button>
              )}
            </div>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={copy.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {([
                { key: "relevance", label: language === "ru" ? "По релевантности" : language === "kz" ? "Өзектілігі бойынша" : "Relevance" },
                { key: "newest", label: language === "ru" ? "Сначала новые" : language === "kz" ? "Жаңалары алдымен" : "Newest" },
                { key: "oldest", label: language === "ru" ? "Сначала старые" : language === "kz" ? "Ескілері алдымен" : "Oldest" },
                { key: "short-read", label: language === "ru" ? "Короткое чтение" : language === "kz" ? "Қысқа оқу" : "Short reads" },
              ] as Array<{ key: SortOption; label: string }>).map((option) => (
                <Button
                  key={option.key}
                  variant={sortBy === option.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy(option.key)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {(
                ["all", "health-blog", "symptom-guide", "knowledge-base", "medical-dictionary"] as const
              ).map((category) => (
                <Button
                  key={category}
                  variant={activeCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(category)}
                >
                  {categoryLabels[category]}
                </Button>
              ))}
            </div>
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">
                {language === "ru" ? "Популярные теги" : language === "kz" ? "Танымал тегтер" : "Popular tags"}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={activeTag === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTag("all")}
                >
                  All
                </Button>
                {allTags.map((tag) => (
                  <Button
                    key={tag}
                    variant={activeTag === tag ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveTag(tag)}
                  >
                    #{tag}
                  </Button>
                ))}
              </div>
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
                  <div className="flex flex-wrap gap-1 mt-3">
                    {article.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-muted">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredArticles.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">{copy.noArticles}</p>
            </div>
          )}

          <div className="mt-10 bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Brain className="w-5 h-5 text-primary" />
              <h3 className="font-display text-xl font-semibold">
                {language === "ru" ? "Медицинские викторины (планируется)" : language === "kz" ? "Медициналық викториналар (жоспарлануда)" : "Medical Quizzes (Planned)"}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {language === "ru"
                ? "Скоро пользователи смогут проверять знания о здоровье и распространённых медицинских мифах."
                : language === "kz"
                  ? "Жақында пайдаланушылар денсаулық және кең таралған медициналық мифтер бойынша білімін тексере алады."
                  : "Soon users will be able to test their knowledge about health and common medical myths."}
            </p>
            <div className="grid md:grid-cols-3 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-muted">Nutrition myths quiz</div>
              <div className="p-3 rounded-lg bg-muted">Sleep and recovery quiz</div>
              <div className="p-3 rounded-lg bg-muted">Symptom awareness quiz</div>
            </div>
          </div>

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
                    {getContent(selectedArticle).map((paragraph, index) => (
                      <p key={`content-${index}`} className="text-muted-foreground mb-4">
                        {paragraph}
                      </p>
                    ))}

                    <div className="bg-muted rounded-xl p-4 mb-6">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <ChevronRight className="w-4 h-4 text-primary" />
                        {copy.keyTakeaways}
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
                          <h5 className="font-medium text-warning text-sm mb-1">{copy.medicalDisclaimerTitle}</h5>
                          <p className="text-xs text-muted-foreground">
                            {copy.medicalDisclaimerText}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="w-4 h-4" />
                        {selectedArticle.author}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={() => downloadArticleAsPdf(selectedArticle)}
                        >
                          <FileDown className="w-4 h-4" />
                          {language === "ru" ? "Скачать PDF" : language === "kz" ? "PDF жүктеу" : "Download PDF"}
                        </Button>
                        <Button onClick={() => setSelectedArticle(null)}>
                          {copy.close}
                        </Button>
                      </div>
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
