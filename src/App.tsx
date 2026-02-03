import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Home from "./pages/Home";
import AIConsultant from "./pages/AIConsultant";
import MedicineCabinet from "./pages/MedicineCabinet";
import MapPage from "./pages/MapPage";
import HealthArticles from "./pages/HealthArticles";
import FirstAidGuide from "./pages/FirstAidGuide";
import SymptomTracker from "./pages/SymptomTracker";
import About from "./pages/About";
import Auth from "./pages/Auth";
import Forum from "./pages/Forum";
import DoctorWorkplace from "./pages/DoctorWorkplace";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/consultant" element={<AIConsultant />} />
              <Route path="/cabinet" element={<MedicineCabinet />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/articles" element={<HealthArticles />} />
              <Route path="/first-aid" element={<FirstAidGuide />} />
              <Route path="/symptom-tracker" element={<SymptomTracker />} />
              <Route path="/forum" element={<Forum />} />
              <Route path="/doctor-workplace" element={<DoctorWorkplace />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/about" element={<About />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
