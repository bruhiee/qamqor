export type Language = 'en' | 'ru' | 'kk';

export const languageNames: Record<Language, string> = {
  en: 'English',
  ru: 'Русский',
  kk: 'Қазақша',
};

export function getTranslation(language: Language): Translations {
  return translations[language];
}

export interface Translations {
  // Navigation
  home: string;
  aiConsultant: string;
  medicineCabinet: string;
  map: string;
  firstAid: string;
  symptomTracker: string;
  articles: string;
  about: string;
  signIn: string;
  signUp: string;
  signOut: string;
  forum: string;
  doctorWorkplace: string;
  adminPanel: string;
  
  // Common
  search: string;
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  add: string;
  loading: string;
  error: string;
  success: string;
  submit: string;
  close: string;
  back: string;
  next: string;
  previous: string;
  viewAll: string;
  noResults: string;
  confirm: string;
  required: string;
  optional: string;
  or: string;
  learnMore: string;
  
  // Auth
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  createAccount: string;
  alreadyHaveAccount: string;
  dontHaveAccount: string;
  forgotPassword: string;
  welcomeBack: string;
  createYourAccount: string;
  
  // Role Selection (Registration)
  selectAccountType: string;
  registerAsUser: string;
  registerAsDoctor: string;
  userAccountDesc: string;
  doctorAccountDesc: string;
  doctorVerificationRequired: string;
  
  // Doctor Application
  doctorApplication: string;
  fullName: string;
  specialization: string;
  licenseNumber: string;
  uploadLicense: string;
  professionalBio: string;
  country: string;
  region: string;
  yearsOfExperience: string;
  workplace: string;
  applicationPending: string;
  applicationApproved: string;
  applicationRejected: string;
  applicationSubmitted: string;
  pendingVerification: string;
  verificationPendingDesc: string;
  
  // Specializations
  generalPractitioner: string;
  cardiologist: string;
  dermatologist: string;
  pediatrician: string;
  neurologist: string;
  psychiatrist: string;
  surgeon: string;
  gynecologist: string;
  urologist: string;
  endocrinologist: string;
  ophthalmologist: string;
  otherSpecialty: string;
  
  // Roles
  user: string;
  doctor: string;
  admin: string;
  verifiedDoctor: string;
  
  // AI Consultant
  askQuestion: string;
  typeSymptoms: string;
  voiceInput: string;
  uploadImage: string;
  analyzing: string;
  riskLevel: string;
  possibleConditions: string;
  recommendations: string;
  whenToSeeDoctor: string;
  aiDisclaimer: string;
  
  // Risk Levels
  lowRisk: string;
  mediumRisk: string;
  highRisk: string;
  emergency: string;
  selfMonitoring: string;
  doctorVisitNeeded: string;
  
  // Medicine Cabinet
  addMedicine: string;
  medicineName: string;
  purpose: string;
  dosage: string;
  quantity: string;
  expirationDate: string;
  expired: string;
  expiringSoon: string;
  findPharmacy: string;
  formType: string;
  tags: string;
  notes: string;
  lowStock: string;
  inStock: string;
  
  // Form Types
  tablet: string;
  capsule: string;
  liquid: string;
  injection: string;
  cream: string;
  drops: string;
  inhaler: string;
  patch: string;
  powder: string;
  
  // Map
  findCare: string;
  nearbyFacilities: string;
  pharmacy: string;
  hospital: string;
  clinic: string;
  getDirections: string;
  openNow: string;
  closed: string;
  distance: string;
  contactInfo: string;
  website: string;
  address: string;
  
  // Symptom Tracker
  logSymptoms: string;
  severity: string;
  mood: string;
  sleepHours: string;
  symptoms: string;
  trends: string;
  improving: string;
  worsening: string;
  stable: string;
  
  // First Aid
  firstAidGuide: string;
  emergencyProcedures: string;
  stepByStep: string;
  callEmergency: string;
  doNot: string;
  
  // Disclaimer
  medicalDisclaimer: string;
  disclaimerText: string;
  
  // Language names
  english: string;
  russian: string;
  kazakh: string;
  
  // Forum
  forumTitle: string;
  askCommunity: string;
  newQuestion: string;
  postQuestion: string;
  yourQuestion: string;
  questionTitle: string;
  questionDetails: string;
  selectTags: string;
  markAsUrgent: string;
  replies: string;
  reply: string;
  writeReply: string;
  replyAnonymously: string;
  doctorAnswer: string;
  views: string;
  answered: string;
  open: string;
  flagged: string;
  seekProfessionalHelp: string;
  communityGuidelines: string;
  
  // Doctor Workplace
  clinicalCases: string;
  newCase: string;
  caseDetails: string;
  ageRange: string;
  keySymptoms: string;
  duration: string;
  diagnosticMarkers: string;
  clinicalInsights: string;
  addToCollection: string;
  myCollections: string;
  createCollection: string;
  collectionName: string;
  patternMatching: string;
  similarCases: string;
  aiSuggestions: string;
  privateCase: string;
  
  // Admin Panel
  dashboard: string;
  userManagement: string;
  contentModeration: string;
  analytics: string;
  activityLogs: string;
  totalUsers: string;
  activeToday: string;
  pendingReviews: string;
  flaggedContent: string;
  aggregatedData: string;
  regionBreakdown: string;
  trendingTopics: string;
  doctorApplications: string;
  approveDoctor: string;
  rejectDoctor: string;
  
  // Privacy
  privacySettings: string;
  analyticsOptIn: string;
  analyticsDescription: string;
  dataUsageInfo: string;
  
  // Articles
  healthArticles: string;
  readMore: string;
  readTime: string;
  publishedBy: string;
  relatedArticles: string;
  mythOrFact: string;
  didYouKnow: string;
  
  // Notifications
  expirationAlert: string;
  lowStockAlert: string;
  newReply: string;
  
  // Errors
  errorOccurred: string;
  tryAgain: string;
  networkError: string;
  unauthorized: string;
  notFound: string;
  serverError: string;
  
  // Home Page
  heroTagline: string;
  heroTitle1: string;
  heroTitle2: string;
  heroDescription: string;
  startConsultation: string;
  exploreArticles: string;
  aiAvailable: string;
  languages: string;
  safePrivate: string;
  freeToUse: string;
  
  // Features
  featureAiTitle: string;
  featureAiDesc: string;
  featureSymptomTitle: string;
  featureSymptomDesc: string;
  featureFirstAidTitle: string;
  featureFirstAidDesc: string;
  featureMedicineTitle: string;
  featureMedicineDesc: string;
  featureMapTitle: string;
  featureMapDesc: string;
  featureEducationTitle: string;
  featureEducationDesc: string;
  
  // Why Choose Us
  whyChooseTitle1: string;
  whyChooseTitle2: string;
  whyChooseDesc: string;
  privacyFirst: string;
  privacyFirstDesc: string;
  instantInsights: string;
  instantInsightsDesc: string;
  expertReviewed: string;
  expertReviewedDesc: string;
  
  // CTA
  ctaTitle: string;
  ctaDesc: string;
  getStartedFree: string;
  
  // Chat messages
  aiGreeting: string;
  userHeadacheExample: string;
  aiFollowUp: string;
  riskAssessment: string;
  suggestedActions: string;
  stayHydrated: string;
  restQuiet: string;
  monitorSymptoms: string;
  
  // Health Report
  healthReport: string;
  generatedByAi: string;
  initialAssessment: string;
  tensionHeadache: string;
  dehydration: string;
  eyeStrain: string;
  recommendedActions: string;
  drinkWater: string;
  takeBreaks: string;
  considerPainRelief: string;
  
  // Email verification
  checkEmailVerification: string;
  emailVerificationSent: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // Navigation
    home: 'Home',
    aiConsultant: 'AI Consultant',
    medicineCabinet: 'Medicine Cabinet',
    map: 'Find Care',
    firstAid: 'First Aid',
    symptomTracker: 'Symptom Tracker',
    articles: 'Health Articles',
    about: 'About',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    signOut: 'Sign Out',
    forum: 'Forum',
    doctorWorkplace: 'Doctor Workplace',
    adminPanel: 'Admin Panel',
    
    // Common
    search: 'Search',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    submit: 'Submit',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    viewAll: 'View All',
    noResults: 'No results found',
    confirm: 'Confirm',
    required: 'Required',
    optional: 'Optional',
    or: 'or',
    learnMore: 'Learn more',
    
    // Auth
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    displayName: 'Display Name',
    createAccount: 'Create Account',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
    forgotPassword: 'Forgot password?',
    welcomeBack: 'Welcome back',
    createYourAccount: 'Create your account',
    
    // Role Selection
    selectAccountType: 'Select Account Type',
    registerAsUser: 'Register as User',
    registerAsDoctor: 'Apply as Doctor',
    userAccountDesc: 'Access AI triage, medicine cabinet, health journal, map, and forum',
    doctorAccountDesc: 'Publish articles, answer forum questions, access clinical workplace',
    doctorVerificationRequired: 'Doctor verification required',
    
    // Doctor Application
    doctorApplication: 'Doctor Application',
    fullName: 'Full Name',
    specialization: 'Medical Specialization',
    licenseNumber: 'License / Qualification Number',
    uploadLicense: 'Upload License Document',
    professionalBio: 'Professional Bio',
    country: 'Country',
    region: 'Region / City',
    yearsOfExperience: 'Years of Experience',
    workplace: 'Current Workplace',
    applicationPending: 'Application Pending',
    applicationApproved: 'Application Approved',
    applicationRejected: 'Application Rejected',
    applicationSubmitted: 'Application Submitted Successfully',
    pendingVerification: 'Pending Verification',
    verificationPendingDesc: 'Your doctor application is under review. You will be notified once approved.',
    
    // Specializations
    generalPractitioner: 'General Practitioner',
    cardiologist: 'Cardiologist',
    dermatologist: 'Dermatologist',
    pediatrician: 'Pediatrician',
    neurologist: 'Neurologist',
    psychiatrist: 'Psychiatrist',
    surgeon: 'Surgeon',
    gynecologist: 'Gynecologist',
    urologist: 'Urologist',
    endocrinologist: 'Endocrinologist',
    ophthalmologist: 'Ophthalmologist',
    otherSpecialty: 'Other Specialty',
    
    // Roles
    user: 'User',
    doctor: 'Doctor',
    admin: 'Administrator',
    verifiedDoctor: 'Verified Doctor',
    
    // AI Consultant
    askQuestion: 'Ask a question',
    typeSymptoms: 'Describe your symptoms...',
    voiceInput: 'Voice Input',
    uploadImage: 'Upload Image',
    analyzing: 'Analyzing...',
    riskLevel: 'Risk Level',
    possibleConditions: 'Possible Conditions',
    recommendations: 'Recommendations',
    whenToSeeDoctor: 'When to See a Doctor',
    aiDisclaimer: 'AI provides guidance only and does not replace professional medical advice.',
    
    // Risk Levels
    lowRisk: 'Low Risk',
    mediumRisk: 'Medium Risk',
    highRisk: 'High Risk',
    emergency: 'Emergency',
    selfMonitoring: 'Self-Monitoring',
    doctorVisitNeeded: 'Doctor Visit Needed',
    
    // Medicine Cabinet
    addMedicine: 'Add Medicine',
    medicineName: 'Medicine Name',
    purpose: 'Purpose / Symptoms',
    dosage: 'Dosage Instructions',
    quantity: 'Quantity',
    expirationDate: 'Expiration Date',
    expired: 'Expired',
    expiringSoon: 'Expiring Soon',
    findPharmacy: 'Find Nearby Pharmacies',
    formType: 'Form Type',
    tags: 'Tags',
    notes: 'Notes / Warnings',
    lowStock: 'Low Stock',
    inStock: 'In Stock',
    
    // Form Types
    tablet: 'Tablet',
    capsule: 'Capsule',
    liquid: 'Liquid',
    injection: 'Injection',
    cream: 'Cream/Ointment',
    drops: 'Drops',
    inhaler: 'Inhaler',
    patch: 'Patch',
    powder: 'Powder',
    
    // Map
    findCare: 'Find Care',
    nearbyFacilities: 'Nearby medical facilities',
    pharmacy: 'Pharmacy',
    hospital: 'Hospital',
    clinic: 'Clinic',
    getDirections: 'Get Directions',
    openNow: 'Open Now',
    closed: 'Closed',
    distance: 'Distance',
    contactInfo: 'Contact Information',
    website: 'Website',
    address: 'Address',
    
    // Symptom Tracker
    logSymptoms: 'Log Symptoms',
    severity: 'Severity',
    mood: 'Mood',
    sleepHours: 'Hours of Sleep',
    symptoms: 'Symptoms',
    trends: 'Trends',
    improving: 'Improving',
    worsening: 'Worsening',
    stable: 'Stable',
    
    // First Aid
    firstAidGuide: 'First Aid Guide',
    emergencyProcedures: 'Emergency Procedures',
    stepByStep: 'Step-by-step instructions',
    callEmergency: 'Call Emergency Services',
    doNot: 'What NOT to Do',
    
    // Disclaimer
    medicalDisclaimer: 'Medical Disclaimer',
    disclaimerText: 'This platform provides informational triage guidance and does not replace professional medical diagnosis.',
    
    // Language names
    english: 'English',
    russian: 'Русский',
    kazakh: 'Қазақша',
    
    // Forum
    forumTitle: 'Health Forum',
    askCommunity: 'Ask the Community',
    newQuestion: 'New Question',
    postQuestion: 'Post Question',
    yourQuestion: 'Your Question',
    questionTitle: 'Question Title',
    questionDetails: 'Question Details',
    selectTags: 'Select Tags',
    markAsUrgent: 'Mark as Urgent',
    replies: 'Replies',
    reply: 'Reply',
    writeReply: 'Write a reply...',
    replyAnonymously: 'Reply Anonymously',
    doctorAnswer: 'Doctor\'s Answer',
    views: 'Views',
    answered: 'Answered',
    open: 'Open',
    flagged: 'Flagged',
    seekProfessionalHelp: 'This question may require professional medical attention. Please consult a healthcare provider.',
    communityGuidelines: 'Community Guidelines',
    
    // Doctor Workplace
    clinicalCases: 'Clinical Cases',
    newCase: 'New Case',
    caseDetails: 'Case Details',
    ageRange: 'Age Range',
    keySymptoms: 'Key Symptoms',
    duration: 'Duration',
    diagnosticMarkers: 'Diagnostic Markers',
    clinicalInsights: 'Clinical Insights',
    addToCollection: 'Add to Collection',
    myCollections: 'My Collections',
    createCollection: 'Create Collection',
    collectionName: 'Collection Name',
    patternMatching: 'Pattern Matching',
    similarCases: 'Similar Cases',
    aiSuggestions: 'AI Suggestions',
    privateCase: 'Private Case',
    
    // Admin Panel
    dashboard: 'Dashboard',
    userManagement: 'User Management',
    contentModeration: 'Content Moderation',
    analytics: 'Analytics',
    activityLogs: 'Activity Logs',
    totalUsers: 'Total Users',
    activeToday: 'Active Today',
    pendingReviews: 'Pending Reviews',
    flaggedContent: 'Flagged Content',
    aggregatedData: 'Aggregated Data',
    regionBreakdown: 'Region Breakdown',
    trendingTopics: 'Trending Topics',
    doctorApplications: 'Doctor Applications',
    approveDoctor: 'Approve Doctor',
    rejectDoctor: 'Reject Doctor',
    
    // Privacy
    privacySettings: 'Privacy Settings',
    analyticsOptIn: 'Analytics Opt-In',
    analyticsDescription: 'Allow anonymized data collection for health trend analysis',
    dataUsageInfo: 'Your data is anonymized and used only for aggregate trend detection.',
    
    // Articles
    healthArticles: 'Health Articles',
    readMore: 'Read More',
    readTime: 'min read',
    publishedBy: 'Published by',
    relatedArticles: 'Related Articles',
    mythOrFact: 'Health Myth Busted!',
    didYouKnow: 'Did You Know?',
    
    // Notifications
    expirationAlert: 'Medicine expiration alert',
    lowStockAlert: 'Low stock alert',
    newReply: 'New reply to your question',
    
    // Errors
    errorOccurred: 'An error occurred',
    tryAgain: 'Try again',
    networkError: 'Network error. Please check your connection.',
    unauthorized: 'You are not authorized to perform this action.',
    notFound: 'Resource not found',
    serverError: 'Server error. Please try again later.',
    
    // Home Page
    heroTagline: 'AI-Powered Health Assistant',
    heroTitle1: 'Your Personal',
    heroTitle2: 'Health Companion',
    heroDescription: 'Get instant health insights, manage your medications, and find nearby care—all powered by advanced AI technology designed with your safety in mind.',
    startConsultation: 'Start Consultation',
    exploreArticles: 'Explore Articles',
    aiAvailable: 'AI Available',
    languages: 'Languages',
    safePrivate: 'Safe & Private',
    freeToUse: 'Free To Use',
    
    // Features
    featureAiTitle: 'AI Medical Consultant',
    featureAiDesc: 'Chat with our Gemini-powered AI assistant to get instant health insights and guidance.',
    featureSymptomTitle: 'Symptom Tracker',
    featureSymptomDesc: 'Log daily symptoms, track severity trends, and monitor your health over time.',
    featureFirstAidTitle: 'First Aid Guide',
    featureFirstAidDesc: 'Step-by-step emergency procedures for CPR, choking, burns, and more.',
    featureMedicineTitle: 'Medicine Cabinet',
    featureMedicineDesc: 'Store and manage your medications with expiration tracking and alerts.',
    featureMapTitle: 'Find Nearby Care',
    featureMapDesc: 'Locate pharmacies, hospitals, and clinics near you with detailed information.',
    featureEducationTitle: 'Health Education',
    featureEducationDesc: 'Access trusted health articles in Russian and Kazakh with expert insights.',
    
    // Why Choose Us
    whyChooseTitle1: 'Built with Your',
    whyChooseTitle2: 'Safety in Mind',
    whyChooseDesc: 'We understand that health information is sensitive. That\'s why we\'ve designed Disease Detector with safety, privacy, and accuracy as our top priorities.',
    privacyFirst: 'Privacy First',
    privacyFirstDesc: 'Your health data stays on your device',
    instantInsights: 'Instant Insights',
    instantInsightsDesc: 'Get AI-powered responses in seconds',
    expertReviewed: 'Expert-Reviewed',
    expertReviewedDesc: 'Content reviewed by medical professionals',
    
    // CTA
    ctaTitle: 'Ready to Take Control of Your Health?',
    ctaDesc: 'Join thousands of users who trust Disease Detector for their health information needs. It\'s free, private, and always available.',
    getStartedFree: 'Get Started Free',
    
    // Chat messages
    aiGreeting: 'Hello! I\'m your AI health assistant. How can I help you today?',
    userHeadacheExample: 'I\'ve been having headaches for the past few days...',
    aiFollowUp: 'I understand. Let me ask you a few questions to better understand your symptoms...',
    riskAssessment: 'Risk Assessment',
    suggestedActions: 'Suggested Actions',
    stayHydrated: 'Stay hydrated',
    restQuiet: 'Rest in quiet environment',
    monitorSymptoms: 'Monitor symptoms',
    
    // Health Report
    healthReport: 'Health Report',
    generatedByAi: 'Generated by AI',
    initialAssessment: 'Based on your symptoms, the risk level appears low.',
    tensionHeadache: 'Tension Headache',
    dehydration: 'Dehydration',
    eyeStrain: 'Eye Strain',
    recommendedActions: 'Recommended Actions',
    drinkWater: 'Stay hydrated - drink 8 glasses of water',
    takeBreaks: 'Take regular breaks from screens',
    considerPainRelief: 'Consider over-the-counter pain relief',
    
    // Email verification
    checkEmailVerification: 'Please check your email to verify your account.',
    emailVerificationSent: 'Verification email sent',
  },
  
  ru: {
    // Navigation
    home: 'Главная',
    aiConsultant: 'ИИ Консультант',
    medicineCabinet: 'Аптечка',
    map: 'Найти помощь',
    firstAid: 'Первая помощь',
    symptomTracker: 'Дневник симптомов',
    articles: 'Статьи о здоровье',
    about: 'О нас',
    signIn: 'Войти',
    signUp: 'Регистрация',
    signOut: 'Выйти',
    forum: 'Форум',
    doctorWorkplace: 'Кабинет врача',
    adminPanel: 'Панель администратора',
    
    // Common
    search: 'Поиск',
    save: 'Сохранить',
    cancel: 'Отмена',
    delete: 'Удалить',
    edit: 'Редактировать',
    add: 'Добавить',
    loading: 'Загрузка...',
    error: 'Ошибка',
    success: 'Успешно',
    submit: 'Отправить',
    close: 'Закрыть',
    back: 'Назад',
    next: 'Далее',
    previous: 'Назад',
    viewAll: 'Смотреть все',
    noResults: 'Ничего не найдено',
    confirm: 'Подтвердить',
    required: 'Обязательно',
    optional: 'Необязательно',
    or: 'или',
    learnMore: 'Подробнее',
    
    // Auth
    email: 'Электронная почта',
    password: 'Пароль',
    confirmPassword: 'Подтвердите пароль',
    displayName: 'Имя пользователя',
    createAccount: 'Создать аккаунт',
    alreadyHaveAccount: 'Уже есть аккаунт?',
    dontHaveAccount: 'Нет аккаунта?',
    forgotPassword: 'Забыли пароль?',
    welcomeBack: 'С возвращением',
    createYourAccount: 'Создайте свой аккаунт',
    
    // Role Selection
    selectAccountType: 'Выберите тип аккаунта',
    registerAsUser: 'Зарегистрироваться как пользователь',
    registerAsDoctor: 'Подать заявку как врач',
    userAccountDesc: 'Доступ к ИИ-триажу, аптечке, дневнику здоровья, карте и форуму',
    doctorAccountDesc: 'Публикация статей, ответы на форуме, клинический кабинет',
    doctorVerificationRequired: 'Требуется верификация врача',
    
    // Doctor Application
    doctorApplication: 'Заявка врача',
    fullName: 'Полное имя',
    specialization: 'Медицинская специализация',
    licenseNumber: 'Номер лицензии / квалификации',
    uploadLicense: 'Загрузить документ лицензии',
    professionalBio: 'Профессиональная биография',
    country: 'Страна',
    region: 'Регион / Город',
    yearsOfExperience: 'Лет опыта',
    workplace: 'Текущее место работы',
    applicationPending: 'Заявка на рассмотрении',
    applicationApproved: 'Заявка одобрена',
    applicationRejected: 'Заявка отклонена',
    applicationSubmitted: 'Заявка успешно отправлена',
    pendingVerification: 'Ожидание проверки',
    verificationPendingDesc: 'Ваша заявка врача на рассмотрении. Вы получите уведомление после одобрения.',
    
    // Specializations
    generalPractitioner: 'Терапевт',
    cardiologist: 'Кардиолог',
    dermatologist: 'Дерматолог',
    pediatrician: 'Педиатр',
    neurologist: 'Невролог',
    psychiatrist: 'Психиатр',
    surgeon: 'Хирург',
    gynecologist: 'Гинеколог',
    urologist: 'Уролог',
    endocrinologist: 'Эндокринолог',
    ophthalmologist: 'Офтальмолог',
    otherSpecialty: 'Другая специальность',
    
    // Roles
    user: 'Пользователь',
    doctor: 'Врач',
    admin: 'Администратор',
    verifiedDoctor: 'Верифицированный врач',
    
    // AI Consultant
    askQuestion: 'Задать вопрос',
    typeSymptoms: 'Опишите ваши симптомы...',
    voiceInput: 'Голосовой ввод',
    uploadImage: 'Загрузить фото',
    analyzing: 'Анализирую...',
    riskLevel: 'Уровень риска',
    possibleConditions: 'Возможные состояния',
    recommendations: 'Рекомендации',
    whenToSeeDoctor: 'Когда обратиться к врачу',
    aiDisclaimer: 'ИИ предоставляет только рекомендации и не заменяет профессиональную медицинскую консультацию.',
    
    // Risk Levels
    lowRisk: 'Низкий риск',
    mediumRisk: 'Средний риск',
    highRisk: 'Высокий риск',
    emergency: 'Экстренная ситуация',
    selfMonitoring: 'Самонаблюдение',
    doctorVisitNeeded: 'Требуется визит к врачу',
    
    // Medicine Cabinet
    addMedicine: 'Добавить лекарство',
    medicineName: 'Название лекарства',
    purpose: 'Назначение / Симптомы',
    dosage: 'Инструкция по дозировке',
    quantity: 'Количество',
    expirationDate: 'Срок годности',
    expired: 'Истёк срок годности',
    expiringSoon: 'Скоро истечёт',
    findPharmacy: 'Найти ближайшие аптеки',
    formType: 'Форма выпуска',
    tags: 'Теги',
    notes: 'Заметки / Предупреждения',
    lowStock: 'Мало на складе',
    inStock: 'В наличии',
    
    // Form Types
    tablet: 'Таблетка',
    capsule: 'Капсула',
    liquid: 'Жидкость',
    injection: 'Инъекция',
    cream: 'Крем/Мазь',
    drops: 'Капли',
    inhaler: 'Ингалятор',
    patch: 'Пластырь',
    powder: 'Порошок',
    
    // Map
    findCare: 'Найти помощь',
    nearbyFacilities: 'Ближайшие медучреждения',
    pharmacy: 'Аптека',
    hospital: 'Больница',
    clinic: 'Клиника',
    getDirections: 'Построить маршрут',
    openNow: 'Открыто',
    closed: 'Закрыто',
    distance: 'Расстояние',
    contactInfo: 'Контактная информация',
    website: 'Веб-сайт',
    address: 'Адрес',
    
    // Symptom Tracker
    logSymptoms: 'Записать симптомы',
    severity: 'Тяжесть',
    mood: 'Настроение',
    sleepHours: 'Часы сна',
    symptoms: 'Симптомы',
    trends: 'Тенденции',
    improving: 'Улучшение',
    worsening: 'Ухудшение',
    stable: 'Стабильно',
    
    // First Aid
    firstAidGuide: 'Справочник первой помощи',
    emergencyProcedures: 'Экстренные процедуры',
    stepByStep: 'Пошаговые инструкции',
    callEmergency: 'Вызвать скорую помощь',
    doNot: 'Чего НЕ делать',
    
    // Disclaimer
    medicalDisclaimer: 'Медицинский отказ от ответственности',
    disclaimerText: 'Эта платформа предоставляет информационную поддержку и не заменяет профессиональную медицинскую диагностику.',
    
    // Language names
    english: 'English',
    russian: 'Русский',
    kazakh: 'Қазақша',
    
    // Forum
    forumTitle: 'Форум здоровья',
    askCommunity: 'Спросить сообщество',
    newQuestion: 'Новый вопрос',
    postQuestion: 'Опубликовать вопрос',
    yourQuestion: 'Ваш вопрос',
    questionTitle: 'Заголовок вопроса',
    questionDetails: 'Детали вопроса',
    selectTags: 'Выберите теги',
    markAsUrgent: 'Отметить как срочный',
    replies: 'Ответы',
    reply: 'Ответить',
    writeReply: 'Написать ответ...',
    replyAnonymously: 'Ответить анонимно',
    doctorAnswer: 'Ответ врача',
    views: 'Просмотры',
    answered: 'Отвечен',
    open: 'Открыт',
    flagged: 'Помечен',
    seekProfessionalHelp: 'Этот вопрос может требовать профессиональной медицинской помощи. Пожалуйста, обратитесь к врачу.',
    communityGuidelines: 'Правила сообщества',
    
    // Doctor Workplace
    clinicalCases: 'Клинические случаи',
    newCase: 'Новый случай',
    caseDetails: 'Детали случая',
    ageRange: 'Возрастной диапазон',
    keySymptoms: 'Ключевые симптомы',
    duration: 'Продолжительность',
    diagnosticMarkers: 'Диагностические маркеры',
    clinicalInsights: 'Клинические наблюдения',
    addToCollection: 'Добавить в коллекцию',
    myCollections: 'Мои коллекции',
    createCollection: 'Создать коллекцию',
    collectionName: 'Название коллекции',
    patternMatching: 'Сопоставление паттернов',
    similarCases: 'Похожие случаи',
    aiSuggestions: 'Предложения ИИ',
    privateCase: 'Приватный случай',
    
    // Admin Panel
    dashboard: 'Панель управления',
    userManagement: 'Управление пользователями',
    contentModeration: 'Модерация контента',
    analytics: 'Аналитика',
    activityLogs: 'Журнал активности',
    totalUsers: 'Всего пользователей',
    activeToday: 'Активных сегодня',
    pendingReviews: 'Ожидают проверки',
    flaggedContent: 'Помеченный контент',
    aggregatedData: 'Агрегированные данные',
    regionBreakdown: 'Разбивка по регионам',
    trendingTopics: 'Трендовые темы',
    doctorApplications: 'Заявки врачей',
    approveDoctor: 'Одобрить врача',
    rejectDoctor: 'Отклонить врача',
    
    // Privacy
    privacySettings: 'Настройки конфиденциальности',
    analyticsOptIn: 'Согласие на аналитику',
    analyticsDescription: 'Разрешить сбор анонимных данных для анализа тенденций здоровья',
    dataUsageInfo: 'Ваши данные анонимизируются и используются только для обнаружения общих тенденций.',
    
    // Articles
    healthArticles: 'Статьи о здоровье',
    readMore: 'Читать далее',
    readTime: 'мин чтения',
    publishedBy: 'Опубликовано',
    relatedArticles: 'Связанные статьи',
    mythOrFact: 'Развенчиваем мифы!',
    didYouKnow: 'Знаете ли вы?',
    
    // Notifications
    expirationAlert: 'Истекает срок годности лекарства',
    lowStockAlert: 'Заканчивается запас',
    newReply: 'Новый ответ на ваш вопрос',
    
    // Errors
    errorOccurred: 'Произошла ошибка',
    tryAgain: 'Попробовать снова',
    networkError: 'Ошибка сети. Проверьте подключение.',
    unauthorized: 'У вас нет прав для выполнения этого действия.',
    notFound: 'Ресурс не найден',
    serverError: 'Ошибка сервера. Попробуйте позже.',
    
    // Home Page
    heroTagline: 'Медицинский помощник на основе ИИ',
    heroTitle1: 'Ваш Персональный',
    heroTitle2: 'Помощник Здоровья',
    heroDescription: 'Получайте мгновенные медицинские консультации, управляйте лекарствами и находите ближайшую помощь — всё на основе передовых технологий ИИ.',
    startConsultation: 'Начать консультацию',
    exploreArticles: 'Читать статьи',
    aiAvailable: 'ИИ Доступен',
    languages: 'Языки',
    safePrivate: 'Безопасно',
    freeToUse: 'Бесплатно',
    
    // Features
    featureAiTitle: 'ИИ Медицинский Консультант',
    featureAiDesc: 'Общайтесь с нашим ИИ-помощником на базе Gemini для получения мгновенных медицинских рекомендаций.',
    featureSymptomTitle: 'Дневник симптомов',
    featureSymptomDesc: 'Записывайте ежедневные симптомы, отслеживайте тяжесть и мониторьте здоровье со временем.',
    featureFirstAidTitle: 'Справочник первой помощи',
    featureFirstAidDesc: 'Пошаговые инструкции для СЛР, удушья, ожогов и других экстренных ситуаций.',
    featureMedicineTitle: 'Аптечка',
    featureMedicineDesc: 'Храните и управляйте лекарствами с отслеживанием сроков годности и уведомлениями.',
    featureMapTitle: 'Найти помощь рядом',
    featureMapDesc: 'Находите аптеки, больницы и клиники поблизости с подробной информацией.',
    featureEducationTitle: 'Медицинское образование',
    featureEducationDesc: 'Доступ к проверенным статьям о здоровье на русском и казахском языках.',
    
    // Why Choose Us
    whyChooseTitle1: 'Создано с заботой',
    whyChooseTitle2: 'о вашей безопасности',
    whyChooseDesc: 'Мы понимаем, что медицинская информация конфиденциальна. Поэтому Disease Detector разработан с приоритетом безопасности, конфиденциальности и точности.',
    privacyFirst: 'Конфиденциальность',
    privacyFirstDesc: 'Ваши данные остаются на вашем устройстве',
    instantInsights: 'Мгновенные ответы',
    instantInsightsDesc: 'Получайте ответы ИИ за секунды',
    expertReviewed: 'Проверено экспертами',
    expertReviewedDesc: 'Контент проверен медицинскими специалистами',
    
    // CTA
    ctaTitle: 'Готовы взять здоровье под контроль?',
    ctaDesc: 'Присоединяйтесь к тысячам пользователей, которые доверяют Disease Detector. Это бесплатно, конфиденциально и всегда доступно.',
    getStartedFree: 'Начать бесплатно',
    
    // Chat messages
    aiGreeting: 'Здравствуйте! Я ваш ИИ-помощник по здоровью. Чем могу помочь?',
    userHeadacheExample: 'У меня болит голова уже несколько дней...',
    aiFollowUp: 'Понимаю. Позвольте задать несколько вопросов, чтобы лучше понять ваши симптомы...',
    riskAssessment: 'Оценка риска',
    suggestedActions: 'Рекомендуемые действия',
    stayHydrated: 'Пейте больше воды',
    restQuiet: 'Отдохните в тихом месте',
    monitorSymptoms: 'Наблюдайте за симптомами',
    
    // Health Report
    healthReport: 'Отчёт о здоровье',
    generatedByAi: 'Сгенерировано ИИ',
    initialAssessment: 'По вашим симптомам уровень риска представляется низким.',
    tensionHeadache: 'Головная боль напряжения',
    dehydration: 'Обезвоживание',
    eyeStrain: 'Усталость глаз',
    recommendedActions: 'Рекомендуемые действия',
    drinkWater: 'Пейте 8 стаканов воды в день',
    takeBreaks: 'Делайте перерывы от экранов',
    considerPainRelief: 'Рассмотрите обезболивающее',
    
    // Email verification
    checkEmailVerification: 'Пожалуйста, проверьте почту для подтверждения аккаунта.',
    emailVerificationSent: 'Письмо для подтверждения отправлено',
  },
  
  kk: {
    // Navigation
    home: 'Басты бет',
    aiConsultant: 'ЖИ Кеңесші',
    medicineCabinet: 'Дәрі қорабы',
    map: 'Көмек табу',
    firstAid: 'Алғашқы көмек',
    symptomTracker: 'Симптом журналы',
    articles: 'Денсаулық мақалалары',
    about: 'Біз туралы',
    signIn: 'Кіру',
    signUp: 'Тіркелу',
    signOut: 'Шығу',
    forum: 'Форум',
    doctorWorkplace: 'Дәрігер кабинеті',
    adminPanel: 'Әкімші панелі',
    
    // Common
    search: 'Іздеу',
    save: 'Сақтау',
    cancel: 'Бас тарту',
    delete: 'Жою',
    edit: 'Өңдеу',
    add: 'Қосу',
    loading: 'Жүктелуде...',
    error: 'Қате',
    success: 'Сәтті',
    submit: 'Жіберу',
    close: 'Жабу',
    back: 'Артқа',
    next: 'Келесі',
    previous: 'Алдыңғы',
    viewAll: 'Барлығын көру',
    noResults: 'Нәтиже табылмады',
    confirm: 'Растау',
    required: 'Міндетті',
    optional: 'Міндетті емес',
    or: 'немесе',
    learnMore: 'Толығырақ',
    
    // Auth
    email: 'Электрондық пошта',
    password: 'Құпия сөз',
    confirmPassword: 'Құпия сөзді растаңыз',
    displayName: 'Көрсетілетін аты',
    createAccount: 'Аккаунт жасау',
    alreadyHaveAccount: 'Аккаунтыңыз бар ма?',
    dontHaveAccount: 'Аккаунтыңыз жоқ па?',
    forgotPassword: 'Құпия сөзді ұмыттыңыз ба?',
    welcomeBack: 'Қайта келгеніңізбен',
    createYourAccount: 'Аккаунтыңызды жасаңыз',
    
    // Role Selection
    selectAccountType: 'Аккаунт түрін таңдаңыз',
    registerAsUser: 'Пайдаланушы ретінде тіркелу',
    registerAsDoctor: 'Дәрігер ретінде өтініш беру',
    userAccountDesc: 'ЖИ-триаж, дәрі қорабы, денсаулық журналы, карта және форумға қол жеткізу',
    doctorAccountDesc: 'Мақала жариялау, форумда жауап беру, клиникалық кабинет',
    doctorVerificationRequired: 'Дәрігер верификациясы қажет',
    
    // Doctor Application
    doctorApplication: 'Дәрігер өтінімі',
    fullName: 'Толық аты-жөні',
    specialization: 'Медициналық мамандық',
    licenseNumber: 'Лицензия / біліктілік нөмірі',
    uploadLicense: 'Лицензия құжатын жүктеу',
    professionalBio: 'Кәсіби өмірбаян',
    country: 'Ел',
    region: 'Аймақ / Қала',
    yearsOfExperience: 'Тәжірибе жылдары',
    workplace: 'Қазіргі жұмыс орны',
    applicationPending: 'Өтінім қаралуда',
    applicationApproved: 'Өтінім мақұлданды',
    applicationRejected: 'Өтінім қабылданбады',
    applicationSubmitted: 'Өтінім сәтті жіберілді',
    pendingVerification: 'Тексеруді күтуде',
    verificationPendingDesc: 'Дәрігер өтінімі қаралуда. Мақұлданғаннан кейін хабарлама аласыз.',
    
    // Specializations
    generalPractitioner: 'Жалпы практика дәрігері',
    cardiologist: 'Кардиолог',
    dermatologist: 'Дерматолог',
    pediatrician: 'Педиатр',
    neurologist: 'Невролог',
    psychiatrist: 'Психиатр',
    surgeon: 'Хирург',
    gynecologist: 'Гинеколог',
    urologist: 'Уролог',
    endocrinologist: 'Эндокринолог',
    ophthalmologist: 'Офтальмолог',
    otherSpecialty: 'Басқа мамандық',
    
    // Roles
    user: 'Пайдаланушы',
    doctor: 'Дәрігер',
    admin: 'Әкімші',
    verifiedDoctor: 'Расталған дәрігер',
    
    // AI Consultant
    askQuestion: 'Сұрақ қою',
    typeSymptoms: 'Симптомдарыңызды сипаттаңыз...',
    voiceInput: 'Дауыспен енгізу',
    uploadImage: 'Сурет жүктеу',
    analyzing: 'Талдау...',
    riskLevel: 'Тәуекел деңгейі',
    possibleConditions: 'Мүмкін жағдайлар',
    recommendations: 'Ұсыныстар',
    whenToSeeDoctor: 'Дәрігерге қашан бару керек',
    aiDisclaimer: 'ЖИ тек ұсыныстар береді және кәсіби медициналық кеңесті алмастырмайды.',
    
    // Risk Levels
    lowRisk: 'Төмен тәуекел',
    mediumRisk: 'Орташа тәуекел',
    highRisk: 'Жоғары тәуекел',
    emergency: 'Төтенше жағдай',
    selfMonitoring: 'Өзін-өзі бақылау',
    doctorVisitNeeded: 'Дәрігерге бару қажет',
    
    // Medicine Cabinet
    addMedicine: 'Дәрі қосу',
    medicineName: 'Дәрі атауы',
    purpose: 'Мақсаты / Симптомдар',
    dosage: 'Дозалау нұсқаулары',
    quantity: 'Саны',
    expirationDate: 'Жарамдылық мерзімі',
    expired: 'Мерзімі өткен',
    expiringSoon: 'Мерзімі аяқталуда',
    findPharmacy: 'Жақын дәріханаларды табу',
    formType: 'Шығарылу түрі',
    tags: 'Тегтер',
    notes: 'Ескертулер',
    lowStock: 'Қалдық аз',
    inStock: 'Қоймада бар',
    
    // Form Types
    tablet: 'Таблетка',
    capsule: 'Капсула',
    liquid: 'Сұйықтық',
    injection: 'Инъекция',
    cream: 'Крем/Жақпа май',
    drops: 'Тамшылар',
    inhaler: 'Ингалятор',
    patch: 'Пластырь',
    powder: 'Ұнтақ',
    
    // Map
    findCare: 'Көмек табу',
    nearbyFacilities: 'Жақын медициналық мекемелер',
    pharmacy: 'Дәріхана',
    hospital: 'Аурухана',
    clinic: 'Клиника',
    getDirections: 'Бағыт салу',
    openNow: 'Қазір ашық',
    closed: 'Жабық',
    distance: 'Қашықтық',
    contactInfo: 'Байланыс ақпараты',
    website: 'Веб-сайт',
    address: 'Мекенжай',
    
    // Symptom Tracker
    logSymptoms: 'Симптомдарды жазу',
    severity: 'Ауырлық',
    mood: 'Көңіл-күй',
    sleepHours: 'Ұйқы сағаттары',
    symptoms: 'Симптомдар',
    trends: 'Үрдістер',
    improving: 'Жақсаруда',
    worsening: 'Нашарлауда',
    stable: 'Тұрақты',
    
    // First Aid
    firstAidGuide: 'Алғашқы көмек нұсқаулығы',
    emergencyProcedures: 'Төтенше жағдай процедуралары',
    stepByStep: 'Қадамдық нұсқаулар',
    callEmergency: 'Жедел жәрдем шақыру',
    doNot: 'Не істемеу керек',
    
    // Disclaimer
    medicalDisclaimer: 'Медициналық ескерту',
    disclaimerText: 'Бұл платформа ақпараттық қолдау көрсетеді және кәсіби медициналық диагностиканы алмастырмайды.',
    
    // Language names
    english: 'English',
    russian: 'Русский',
    kazakh: 'Қазақша',
    
    // Forum
    forumTitle: 'Денсаулық форумы',
    askCommunity: 'Қоғамдастықтан сұрау',
    newQuestion: 'Жаңа сұрақ',
    postQuestion: 'Сұрақ жариялау',
    yourQuestion: 'Сіздің сұрағыңыз',
    questionTitle: 'Сұрақ тақырыбы',
    questionDetails: 'Сұрақ мәліметтері',
    selectTags: 'Тегтерді таңдаңыз',
    markAsUrgent: 'Шұғыл деп белгілеу',
    replies: 'Жауаптар',
    reply: 'Жауап беру',
    writeReply: 'Жауап жазу...',
    replyAnonymously: 'Жасырын жауап беру',
    doctorAnswer: 'Дәрігер жауабы',
    views: 'Қаралымдар',
    answered: 'Жауап берілді',
    open: 'Ашық',
    flagged: 'Белгіленген',
    seekProfessionalHelp: 'Бұл сұрақ кәсіби медициналық көмекті қажет етуі мүмкін. Дәрігерге хабарласыңыз.',
    communityGuidelines: 'Қоғамдастық ережелері',
    
    // Doctor Workplace
    clinicalCases: 'Клиникалық жағдайлар',
    newCase: 'Жаңа жағдай',
    caseDetails: 'Жағдай мәліметтері',
    ageRange: 'Жас аралығы',
    keySymptoms: 'Негізгі симптомдар',
    duration: 'Ұзақтығы',
    diagnosticMarkers: 'Диагностикалық маркерлер',
    clinicalInsights: 'Клиникалық түсініктер',
    addToCollection: 'Жинаққа қосу',
    myCollections: 'Менің жинақтарым',
    createCollection: 'Жинақ жасау',
    collectionName: 'Жинақ атауы',
    patternMatching: 'Үлгі сәйкестігі',
    similarCases: 'Ұқсас жағдайлар',
    aiSuggestions: 'ЖИ ұсыныстары',
    privateCase: 'Жеке жағдай',
    
    // Admin Panel
    dashboard: 'Басқару панелі',
    userManagement: 'Пайдаланушыларды басқару',
    contentModeration: 'Мазмұнды модерациялау',
    analytics: 'Аналитика',
    activityLogs: 'Белсенділік журналы',
    totalUsers: 'Барлық пайдаланушылар',
    activeToday: 'Бүгін белсенді',
    pendingReviews: 'Тексеруді күтуде',
    flaggedContent: 'Белгіленген мазмұн',
    aggregatedData: 'Жиынтық деректер',
    regionBreakdown: 'Аймақтық бөлу',
    trendingTopics: 'Трендтегі тақырыптар',
    doctorApplications: 'Дәрігер өтінімдері',
    approveDoctor: 'Дәрігерді мақұлдау',
    rejectDoctor: 'Дәрігерді қабылдамау',
    
    // Privacy
    privacySettings: 'Құпиялылық параметрлері',
    analyticsOptIn: 'Аналитикаға келісім',
    analyticsDescription: 'Денсаулық үрдістерін талдау үшін анонимді деректерді жинауға рұқсат беру',
    dataUsageInfo: 'Сіздің деректеріңіз анонимделеді және тек жалпы үрдістерді анықтау үшін пайдаланылады.',
    
    // Articles
    healthArticles: 'Денсаулық мақалалары',
    readMore: 'Толығырақ оқу',
    readTime: 'мин оқу',
    publishedBy: 'Жариялаған',
    relatedArticles: 'Байланысты мақалалар',
    mythOrFact: 'Мифтерді жоққа шығару!',
    didYouKnow: 'Сіз білесіз бе?',
    
    // Notifications
    expirationAlert: 'Дәрінің мерзімі аяқталуда',
    lowStockAlert: 'Қор аяқталуда',
    newReply: 'Сұрағыңызға жаңа жауап',
    
    // Errors
    errorOccurred: 'Қате орын алды',
    tryAgain: 'Қайта байқап көріңіз',
    networkError: 'Желі қатесі. Байланысты тексеріңіз.',
    unauthorized: 'Бұл әрекетке рұқсатыңыз жоқ.',
    notFound: 'Ресурс табылмады',
    serverError: 'Сервер қатесі. Кейінірек қайталаңыз.',
    
    // Home Page
    heroTagline: 'ЖИ негізіндегі денсаулық көмекшісі',
    heroTitle1: 'Сіздің Жеке',
    heroTitle2: 'Денсаулық Көмекшіңіз',
    heroDescription: 'Лезде денсаулық кеңестерін алыңыз, дәрілерді басқарыңыз және жақын көмек табыңыз — барлығы қауіпсіздікті ескере отырып жасалған ЖИ технологиясымен.',
    startConsultation: 'Консультация бастау',
    exploreArticles: 'Мақалаларды оқу',
    aiAvailable: 'ЖИ қолжетімді',
    languages: 'Тілдер',
    safePrivate: 'Қауіпсіз',
    freeToUse: 'Тегін',
    
    // Features
    featureAiTitle: 'ЖИ Медициналық Кеңесші',
    featureAiDesc: 'Gemini негізіндегі ЖИ көмекшімен сөйлесіп, лезде денсаулық кеңестерін алыңыз.',
    featureSymptomTitle: 'Симптом журналы',
    featureSymptomDesc: 'Күнделікті симптомдарды жазыңыз, ауырлық деңгейін бақылаңыз және денсаулықты мониторингтеңіз.',
    featureFirstAidTitle: 'Алғашқы көмек нұсқаулығы',
    featureFirstAidDesc: 'ЖТЖ, тұншығу, күйіктер және басқа төтенше жағдайлар үшін қадамдық нұсқаулар.',
    featureMedicineTitle: 'Дәрі қорабы',
    featureMedicineDesc: 'Дәрілерді сақтаңыз және жарамдылық мерзімін қадағалаңыз.',
    featureMapTitle: 'Жақын көмек табу',
    featureMapDesc: 'Жақындағы дәріханалар, ауруханалар және клиникаларды толық ақпаратпен табыңыз.',
    featureEducationTitle: 'Медициналық білім',
    featureEducationDesc: 'Қазақ және орыс тілдерінде сенімді денсаулық мақалаларына қол жеткізіңіз.',
    
    // Why Choose Us
    whyChooseTitle1: 'Сіздің қауіпсіздігіңіз',
    whyChooseTitle2: 'үшін жасалған',
    whyChooseDesc: 'Біз медициналық ақпараттың құпия екенін түсінеміз. Сондықтан Disease Detector қауіпсіздік, құпиялылық және дәлдікті басымдық ретінде жасалған.',
    privacyFirst: 'Құпиялылық',
    privacyFirstDesc: 'Деректеріңіз құрылғыңызда қалады',
    instantInsights: 'Лезде жауаптар',
    instantInsightsDesc: 'ЖИ жауаптарын секундтарда алыңыз',
    expertReviewed: 'Сарапшылар тексерген',
    expertReviewedDesc: 'Мазмұн медицина мамандарымен тексерілген',
    
    // CTA
    ctaTitle: 'Денсаулықты бақылауға дайынсыз ба?',
    ctaDesc: 'Disease Detector-ға сенетін мыңдаған пайдаланушыларға қосылыңыз. Тегін, құпия және әрқашан қолжетімді.',
    getStartedFree: 'Тегін бастау',
    
    // Chat messages
    aiGreeting: 'Сәлеметсіз бе! Мен сіздің ЖИ денсаулық көмекшіңізмін. Қалай көмектесе аламын?',
    userHeadacheExample: 'Бірнеше күннен бері басым ауырып жүр...',
    aiFollowUp: 'Түсінемін. Симптомдарыңызды жақсырақ түсіну үшін бірнеше сұрақ қоюға рұқсат етіңіз...',
    riskAssessment: 'Тәуекелді бағалау',
    suggestedActions: 'Ұсынылатын әрекеттер',
    stayHydrated: 'Көбірек су ішіңіз',
    restQuiet: 'Тыныш жерде демалыңыз',
    monitorSymptoms: 'Симптомдарды бақылаңыз',
    
    // Health Report
    healthReport: 'Денсаулық есебі',
    generatedByAi: 'ЖИ жасаған',
    initialAssessment: 'Симптомдарыңыз бойынша тәуекел деңгейі төмен көрінеді.',
    tensionHeadache: 'Шиеленіс бас ауруы',
    dehydration: 'Сусыздану',
    eyeStrain: 'Көз шаршауы',
    recommendedActions: 'Ұсынылатын әрекеттер',
    drinkWater: 'Күніне 8 стакан су ішіңіз',
    takeBreaks: 'Экраннан үзіліс жасаңыз',
    considerPainRelief: 'Ауырсынуды басатын дәрі қолданыңыз',
    
    // Email verification
    checkEmailVerification: 'Аккаунтты растау үшін поштаңызды тексеріңіз.',
    emailVerificationSent: 'Растау хаты жіберілді',
  },
};
