export type Language = 'en' | 'ru' | 'kk'  | 'de' | 'fr' | 'es';

export const languageNames: Record<Language, string> = {
  en: 'English',
  ru: 'Русский',
  kk: 'Қазақша',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
};

export function getTranslation(language: Language): Translations {
  const base = translations.en;
  const locale = translations[language] ?? base;
  const override = localeOverrides[language] ?? {};
  return { ...base, ...locale, ...override };
}

export interface Translations {
  // Navigation
  home: string;
  aiConsultant: string;
  aiPoweredBy: string;
  onlineStatus: string;
  symptomTrackerTitle: string;
  symptomTrackerSubtitle: string;
  logSymptomsButton: string;
  logTodaysSymptomsTitle: string;
  dateLabel: string;
  selectSymptomsLabel: string;
  addCustomSymptomPlaceholder: string;
  addButton: string;
  severityLabel: string;
  severityMild: string;
  severityModerate: string;
  severitySevere: string;
  overallMoodLabel: string;
  hoursOfSleepLabel: string;
  additionalNotesLabel: string;
  moodGreat: string;
  moodGood: string;
  moodOkay: string;
  moodBad: string;
  moodTerrible: string;
  totalLogs: string;
  avgSeverity: string;
  trend: string;
  trendImproving: string;
  trendWorsening: string;
  trendStable: string;
  topSymptom: string;
  mostFrequentSymptoms: string;
  recentLogs: string;
  noLogsTitle: string;
  noLogsDescription: string;
  logFirstSymptomsButton: string;
  logsLoadError: string;
  selectSymptomWarning: string;
  logsSaveSuccess: string;
  logsSaveError: string;
  logsDeleteSuccess: string;
  logsDeleteError: string;
  notAvailable: string;
  firstAidTitle: string;
  firstAidSubtitle: string;
  emergencyBannerTitle: string;
  emergencyBannerDescription: string;
  searchFirstAidPlaceholder: string;
  criticalLabel: string;
  urgentLabel: string;
  moderateLabel: string;
  whatNotToDo: string;
  whenToSeekHelp: string;
  noGuidesFound: string;
  callEmergencyLabel: string;
  disclaimerTitle: string;
  disclaimerSummary: string;
  disclaimerDetails: string;
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
  users: string;
  userManagement: string;
  banUser: string;
  unbanUser: string;
  accountStatus: string;
  banned: string;
  active: string;
  userBanned: string;
  userUnbanned: string;
  
  // Common
  search: string;
  save: string;
  cancel: string;
  saveLog: string;
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
  popularTags: string;
  topContributors: string;
  aiConsultantMetrics: string;
  evaluationCount: string;
  commonKeywords: string;
  lastUpdated: string;
  mostPopularQuestion: string;
  questionViews: string;
  questionReplies: string;
  aiChatSessions: string;
  aiChatTopQueries: string;
  aiChatKeywords: string;
  medicineCabinetMetrics: string;
  totalMedicines: string;
  uniqueUsers: string;
  averagePerUser: string;
  topMedicines: string;
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

export const translations: Record<string, Translations> = {
  en: {
    // Navigation
    home: 'Home',
    aiConsultant: 'AI Consultant',
    aiPoweredBy: 'Powered by Qamqor AI',
    onlineStatus: 'Online',
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
    users: 'Users',
    userManagement: 'User Management',
    banUser: 'Ban user',
    unbanUser: 'Unban user',
    accountStatus: 'Account status',
    banned: 'Banned',
    active: 'Active',
    userBanned: 'User has been banned',
    userUnbanned: 'User has been unbanned',
    
    // Common
    search: 'Search',
    save: 'Save',
    cancel: 'Cancel',
    saveLog: 'Save Log',
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
    russian: 'Russian',
    kazakh: 'Kazakh',
    
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
    popularTags: 'Popular Tags',
    topContributors: 'Top Contributors',
    aiConsultantMetrics: 'AI Consultant Metrics',
    evaluationCount: 'Evaluations Submitted',
    commonKeywords: 'Common Keywords',
    lastUpdated: 'Last Updated',
    mostPopularQuestion: 'Most Popular Question',
    questionViews: 'Views',
    questionReplies: 'Replies',
    aiChatSessions: 'AI Chat Sessions',
    aiChatTopQueries: 'Top Chat Queries',
    aiChatKeywords: 'Chat Keywords',
    medicineCabinetMetrics: 'Medicine Cabinet Metrics',
    totalMedicines: 'Total Medicines',
    uniqueUsers: 'Unique Users',
    averagePerUser: 'Average per User',
    topMedicines: 'Top Medicines',
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
    heroDescription: 'Get instant health insights, manage your medications, and find nearby care - all powered by advanced AI technology designed with your safety in mind.',
    startConsultation: 'Start Consultation',
    exploreArticles: 'Explore Articles',
    aiAvailable: 'AI Available',
    languages: 'Languages',
    safePrivate: 'Safe & Private',
    freeToUse: 'Free To Use',
    
    // Features
    featureAiTitle: 'AI Medical Consultant',
    featureAiDesc: 'Chat with our Qamqor AI assistant to get instant health insights and guidance.',
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
    symptomTrackerTitle: 'Symptom Tracker',
    symptomTrackerSubtitle: 'Log and track your daily symptoms',
    logSymptomsButton: 'Log Symptoms',
    logTodaysSymptomsTitle: "Log Today's Symptoms",
    dateLabel: 'Date',
    selectSymptomsLabel: 'Select Symptoms',
    addCustomSymptomPlaceholder: 'Add custom symptom...',
    addButton: 'Add',
    severityLabel: 'Severity',
    severityMild: 'Mild',
    severityModerate: 'Moderate',
    severitySevere: 'Severe',
    overallMoodLabel: 'Overall Mood',
    hoursOfSleepLabel: 'Hours of Sleep',
    additionalNotesLabel: 'Additional Notes',
    moodGreat: 'Great',
    moodGood: 'Good',
    moodOkay: 'Okay',
    moodBad: 'Bad',
    moodTerrible: 'Terrible',
    totalLogs: 'Total Logs',
    avgSeverity: 'Avg Severity',
    trend: 'Trend',
    trendImproving: 'Improving',
    trendWorsening: 'Worsening',
    trendStable: 'Stable',
    topSymptom: 'Top Symptom',
    mostFrequentSymptoms: 'Most Frequent Symptoms',
    recentLogs: 'Recent Logs',
    noLogsTitle: 'No logs yet',
    noLogsDescription: 'Start tracking your symptoms to see trends over time',
    logFirstSymptomsButton: 'Log Your First Symptoms',
    logsLoadError: 'Failed to load symptom logs',
    selectSymptomWarning: 'Please select at least one symptom',
    logsSaveSuccess: 'Symptom log saved successfully',
    logsSaveError: 'Failed to save symptom log',
    logsDeleteSuccess: 'Log deleted',
    logsDeleteError: 'Failed to delete log',
    notAvailable: 'N/A',
    firstAidTitle: 'First Aid Guide',
    firstAidSubtitle: 'Emergency procedures and step-by-step instructions',
    emergencyBannerTitle: 'Emergency Numbers',
    emergencyBannerDescription: 'In a life-threatening emergency, always call emergency services first before providing first aid.',
    searchFirstAidPlaceholder: 'Search first aid guides...',
    criticalLabel: 'Critical',
    urgentLabel: 'Urgent',
    moderateLabel: 'Moderate',
    whatNotToDo: 'What NOT to Do',
    whenToSeekHelp: 'When to Seek Help',
    noGuidesFound: 'No guides found',
    callEmergencyLabel: 'Call 103',
    disclaimerTitle: 'Important Medical Disclaimer',
    disclaimerSummary: 'Medical Disclaimer: This platform provides informational support only and does not replace professional medical advice.',
    disclaimerDetails: 'This platform provides informational support only and does not replace professional medical advice. The AI-generated insights are not diagnoses and should never be used as a substitute for consultation with qualified healthcare professionals. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.',
    
    // Why Choose Us
    whyChooseTitle1: 'Built with Your',
    whyChooseTitle2: 'Safety in Mind',
    whyChooseDesc: 'We understand that health information is sensitive. That\'s why we\'ve designed Qamqor with safety, privacy, and accuracy as our top priorities.',
    privacyFirst: 'Privacy First',
    privacyFirstDesc: 'Your health data stays on your device',
    instantInsights: 'Instant Insights',
    instantInsightsDesc: 'Get AI-powered responses in seconds',
    expertReviewed: 'Expert-Reviewed',
    expertReviewedDesc: 'Content reviewed by medical professionals',
    
    // CTA
    ctaTitle: 'Ready to Take Control of Your Health?',
    ctaDesc: 'Join thousands of users who trust Qamqor for their health information needs. It\'s free, private, and always available.',
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
};

const localeOverrides: Partial<Record<Language, Partial<Translations>>> = {
  ru: {
    home: "Главная",
    aiConsultant: "AI Консультант",
    medicineCabinet: "Аптечка",
    map: "Карта клиник",
    symptomTracker: "Трекер симптомов",
    forum: "Форум",
    articles: "Статьи о здоровье",
    doctorWorkplace: "Кабинет врача",
    adminPanel: "Панель админа",
    signIn: "Войти",
    signOut: "Выйти",
    heroTagline: "AI-помощник по здоровью",
    heroTitle1: "Ваш персональный",
    heroTitle2: "медицинский помощник",
    heroDescription:
      "Получайте мгновенные медицинские советы, управляйте лекарствами и находите ближайшую помощь — всё на базе продвинутого ИИ с приоритетом вашей безопасности.",
    startConsultation: "Начать консультацию",
    exploreArticles: "Смотреть статьи",
    aiAvailable: "AI доступен",
    languages: "Языки",
    safePrivate: "Безопасно и приватно",
    freeToUse: "Бесплатно",
    featureAiTitle: "AI медицинский консультант",
    featureAiDesc: "Общайтесь с AI-ассистентом Qamqor для быстрых и понятных рекомендаций.",
    featureSymptomTitle: "Трекер симптомов",
    featureSymptomDesc: "Отмечайте симптомы, отслеживайте динамику и контролируйте состояние.",
    featureMedicineTitle: "Онлайн-аптечка",
    featureMedicineDesc: "Храните список лекарств, сроки годности и важные напоминания.",
    featureMapTitle: "Поиск медпомощи рядом",
    featureMapDesc: "Находите больницы, клиники и аптеки поблизости с маршрутами.",
    featureEducationTitle: "База знаний",
    featureEducationDesc: "Читайте проверенные медицинские материалы и рекомендации.",
    whyChooseTitle1: "Создано с приоритетом",
    whyChooseTitle2: "вашей безопасности",
    whyChooseDesc:
      "Мы понимаем, что медицинская информация чувствительна. Поэтому Qamqor создан с фокусом на безопасность, приватность и точность.",
    aiGreeting: "Здравствуйте! Я ваш AI-помощник по здоровью. Чем могу помочь?",
    userHeadacheExample: "У меня несколько дней болит голова.",
    aiFollowUp:
      "Понял. Уточните, пожалуйста: есть ли температура, тошнота, слабость или ухудшение зрения?",
    riskLevel: "Уровень риска",
    lowRisk: "Низкий риск",
    initialAssessment: "По вашим симптомам текущий риск выглядит низким.",
    suggestedActions: "Рекомендуемые действия",
    stayHydrated: "Пейте больше воды",
    restQuiet: "Отдохните в тихом месте",
    monitorSymptoms: "Наблюдайте за симптомами",
    healthReport: "Отчёт о состоянии",
    generatedByAi: "Сформировано AI",
    riskAssessment: "Оценка риска",
    possibleConditions: "Возможные причины",
    tensionHeadache: "Головная боль напряжения",
    dehydration: "Обезвоживание",
    eyeStrain: "Переутомление глаз",
    recommendedActions: "Рекомендованные шаги",
    drinkWater: "Пейте воду регулярно",
    takeBreaks: "Делайте перерывы от экрана",
    considerPainRelief: "При необходимости используйте обезболивающее по инструкции",
    instantInsights: "Мгновенные рекомендации",
    instantInsightsDesc: "Быстрый первичный анализ симптомов в удобном формате.",
    privacyFirst: "Приватность прежде всего",
    privacyFirstDesc: "Ваши данные анонимизируются и защищаются.",
    expertReviewed: "Проверено специалистами",
    expertReviewedDesc: "Рекомендации соответствуют базовым медицинским практикам.",
    ctaTitle: "Готовы начать?",
    ctaDesc: "Получите персональные рекомендации по здоровью прямо сейчас.",
    getStartedFree: "Начать бесплатно",
  },
  kk: {
    home: "Басты бет",
    aiConsultant: "AI кеңесші",
    medicineCabinet: "Дәрі қобдишасы",
    map: "Мекемелер картасы",
    symptomTracker: "Симптом трекері",
    forum: "Форум",
    articles: "Денсаулық мақалалары",
    doctorWorkplace: "Дәрігер кабинеті",
    adminPanel: "Әкімші панелі",
    signIn: "Кіру",
    signOut: "Шығу",
    heroTagline: "AI арқылы жұмыс істейтін денсаулық көмекшісі",
    heroTitle1: "Сіздің жеке",
    heroTitle2: "денсаулық серігіңіз",
    heroDescription:
      "Денсаулық бойынша жедел кеңес алыңыз, дәрілерді басқарыңыз және жақын жердегі көмекті табыңыз — барлығы қауіпсіздікке басымдық беретін озық ЖИ технологиясымен.",
    startConsultation: "Кеңесті бастау",
    exploreArticles: "Мақалаларды оқу",
    aiAvailable: "AI қолжетімді",
    languages: "Тілдер",
    safePrivate: "Қауіпсіз және құпия",
    freeToUse: "Тегін",
    featureAiTitle: "AI медициналық кеңесші",
    featureAiDesc: "Qamqor AI көмекшісімен сөйлесіп, жедел әрі түсінікті нұсқаулық алыңыз.",
    featureSymptomTitle: "Симптом трекері",
    featureSymptomDesc: "Симптомдарды белгілеңіз, өзгеріс динамикасын бақылаңыз.",
    featureMedicineTitle: "Онлайн дәрі қобдишасы",
    featureMedicineDesc: "Дәрілерді, жарамдылық мерзімін және еске салғыштарды сақтаңыз.",
    featureMapTitle: "Жақын көмекті табу",
    featureMapDesc: "Аурухана, емхана және дәріханаларды картадан табыңыз.",
    featureEducationTitle: "Білім базасы",
    featureEducationDesc: "Сенімді медициналық материалдар мен түсіндірмелерді оқыңыз.",
    whyChooseTitle1: "Платформа негізі",
    whyChooseTitle2: "қауіпсіздік пен сенім",
    whyChooseDesc:
      "Денсаулық деректері сезімтал екенін білеміз. Сондықтан Qamqor қауіпсіздікке, құпиялыққа және дәлдікке бағытталған.",
    aiGreeting: "Сәлеметсіз бе! Мен сіздің AI денсаулық көмекшіңізбін. Қалай көмектесе аламын?",
    userHeadacheExample: "Соңғы күндері басым ауырып жүр.",
    aiFollowUp:
      "Түсіндім. Температура, жүрек айну, әлсіздік немесе көрудің нашарлауы бар ма?",
    riskLevel: "Тәуекел деңгейі",
    lowRisk: "Төмен тәуекел",
    initialAssessment: "Сипатталған белгілерге сай тәуекел деңгейі қазір төмен көрінеді.",
    suggestedActions: "Ұсынылатын әрекеттер",
    stayHydrated: "Көбірек су ішіңіз",
    restQuiet: "Тыныш жерде демалыңыз",
    monitorSymptoms: "Симптомдарды бақылаңыз",
    healthReport: "Денсаулық есебі",
    generatedByAi: "AI жасаған",
    riskAssessment: "Тәуекелді бағалау",
    possibleConditions: "Мүмкін себептер",
    tensionHeadache: "Кернеуден болатын бас ауруы",
    dehydration: "Сусыздану",
    eyeStrain: "Көздің шаршауы",
    recommendedActions: "Ұсынылған қадамдар",
    drinkWater: "Суды жеткілікті мөлшерде ішіңіз",
    takeBreaks: "Экраннан жиі үзіліс жасаңыз",
    considerPainRelief: "Қажет болса, нұсқаулыққа сай ауырсынуды басатын дәрі қолданыңыз",
    instantInsights: "Жедел ұсыныстар",
    instantInsightsDesc: "Симптомдар бойынша бастапқы талдау жылдам және түсінікті форматта.",
    privacyFirst: "Құпиялық бірінші орында",
    privacyFirstDesc: "Деректеріңіз анонимделеді және қорғалады.",
    expertReviewed: "Сарапшылар тексерген",
    expertReviewedDesc: "Ұсыныстар негізгі медициналық тәжірибеге сәйкес беріледі.",
    ctaTitle: "Бастауға дайынсыз ба?",
    ctaDesc: "Денсаулық бойынша жеке ұсыныстарды дәл қазір алыңыз.",
    getStartedFree: "Тегін бастау",
  },
  de: {
    home: "Startseite",
    aiConsultant: "KI-Berater",
    medicineCabinet: "Medikamentenschrank",
    map: "Hilfe finden",
    firstAid: "Erste Hilfe",
    symptomTracker: "Symptom-Tracker",
    forum: "Forum",
    articles: "Gesundheitsartikel",
    doctorWorkplace: "Arztbereich",
    adminPanel: "Admin-Panel",
    signIn: "Anmelden",
    signOut: "Abmelden",
    heroTagline: "KI-gestutzter Gesundheitsassistent",
    heroTitle1: "Ihr personlicher",
    heroTitle2: "Gesundheitsbegleiter",
    heroDescription:
      "Erhalten Sie sofortige Gesundheitshinweise, verwalten Sie Medikamente und finden Sie Hilfe in der Nahe.",
    startConsultation: "Beratung starten",
    exploreArticles: "Artikel lesen",
    aiAvailable: "24/7 verfugbar",
    languages: "Sprachen",
    safePrivate: "Sicher & privat",
    freeToUse: "Kostenlos",
  },
  fr: {
    home: "Accueil",
    aiConsultant: "Consultant IA",
    medicineCabinet: "Armoire a pharmacie",
    map: "Trouver des soins",
    firstAid: "Premiers secours",
    symptomTracker: "Suivi des symptomes",
    forum: "Forum",
    articles: "Articles sante",
    doctorWorkplace: "Espace medecin",
    adminPanel: "Panneau admin",
    signIn: "Se connecter",
    signOut: "Se deconnecter",
    heroTagline: "Assistant sante alimente par IA",
    heroTitle1: "Votre",
    heroTitle2: "compagnon sante",
    heroDescription:
      "Obtenez des conseils sante instantanes, gerez vos medicaments et trouvez des soins a proximite.",
    startConsultation: "Commencer",
    exploreArticles: "Voir les articles",
    aiAvailable: "Disponible 24/7",
    languages: "Langues",
    safePrivate: "Sur et prive",
    freeToUse: "Gratuit",
  },
  es: {
    home: "Inicio",
    aiConsultant: "Consultor IA",
    medicineCabinet: "Botiquin",
    map: "Encontrar atencion",
    firstAid: "Primeros auxilios",
    symptomTracker: "Seguimiento de sintomas",
    forum: "Foro",
    articles: "Articulos de salud",
    doctorWorkplace: "Espacio medico",
    adminPanel: "Panel admin",
    signIn: "Iniciar sesion",
    signOut: "Cerrar sesion",
    heroTagline: "Asistente de salud con IA",
    heroTitle1: "Tu",
    heroTitle2: "companero de salud",
    heroDescription:
      "Obten consejos de salud al instante, gestiona tus medicamentos y encuentra atencion cercana.",
    startConsultation: "Iniciar consulta",
    exploreArticles: "Explorar articulos",
    aiAvailable: "Disponible 24/7",
    languages: "Idiomas",
    safePrivate: "Seguro y privado",
    freeToUse: "Gratis",
  },
};

const cleanLocales: Language[] = ["ru", "kk", "de", "fr", "es"];
for (const locale of cleanLocales) {
  const override = localeOverrides[locale] ?? {};
  translations[locale] = { ...translations.en, ...override };
}




