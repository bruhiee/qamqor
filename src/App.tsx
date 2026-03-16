import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy, useEffect } from "react";
import { createPortal } from "react-dom";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { NavigationAssistant } from "@/components/layout/NavigationAssistant";

const Home = lazy(() => import("./pages/Home"));
const AIConsultant = lazy(() => import("./pages/AIConsultant"));
const MedicineCabinet = lazy(() => import("./pages/MedicineCabinet"));
const MapPage = lazy(() => import("./pages/MapPage"));
const HealthArticles = lazy(() => import("./pages/HealthArticles"));
const SymptomTracker = lazy(() => import("./pages/SymptomTracker"));
const About = lazy(() => import("./pages/About"));
const Auth = lazy(() => import("./pages/Auth"));
const Forum = lazy(() => import("./pages/Forum"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const DoctorWorkplace = lazy(() => import("./pages/DoctorWorkplace"));
const Profile = lazy(() => import("./pages/Profile"));
const Bookmarks = lazy(() => import("./pages/Bookmarks"));
const Tutorial = lazy(() => import("./pages/Tutorial"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function ScrollThemeController() {
  const location = useLocation();

  useEffect(() => {
    const root = document.documentElement;
    const isHome = location.pathname === "/";

    if (!isHome) {
      root.removeAttribute("data-scroll-theme");
      root.setAttribute("data-ambient", "off");
      return;
    }

    root.setAttribute("data-ambient", "on");
    let frame = 0;

    const updateTheme = () => {
      const maxScroll = Math.max(root.scrollHeight - window.innerHeight, 1);
      const progress = window.scrollY / maxScroll;
      const nextTheme =
        progress > 0.66 ? "vital" : progress > 0.33 ? "focus" : "calm";

      if (root.getAttribute("data-scroll-theme") !== nextTheme) {
        root.setAttribute("data-scroll-theme", nextTheme);
      }
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateTheme);
    };

    updateTheme();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [location.pathname]);

  return null;
}

function MedicalBackground() {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div aria-hidden className="medical-bg">
      <svg
        className="medical-bg__svg"
        viewBox="0 0 1600 420"
        preserveAspectRatio="xMidYMid slice"
      >
        <path
          className="medical-bg__line medical-bg__line--primary"
          d="M0 260 L160 260 L205 260 L232 210 L258 330 L292 260 L430 260 L468 140 L506 360 L548 260 L770 260 L810 200 L842 300 L884 260 L1600 260"
        />
        <path
          className="medical-bg__line medical-bg__line--secondary"
          d="M0 300 L220 300 L252 300 L282 252 L314 342 L352 300 L540 300 L574 190 L614 370 L650 300 L868 300 L902 270 L936 320 L980 300 L1600 300"
        />
      </svg>
      <div className="medical-bg__glow medical-bg__glow--one" />
      <div className="medical-bg__glow medical-bg__glow--two" />
      <div className="medical-bg__cross medical-bg__cross--one" />
      <div className="medical-bg__cross medical-bg__cross--two" />
    </div>,
    document.body
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ScrollThemeController />
            <MedicalBackground />
            <div className="relative z-10">
              <Suspense fallback={<div className="min-h-screen" />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/consultant" element={<AIConsultant />} />
                  <Route path="/cabinet" element={<MedicineCabinet />} />
                  <Route path="/map" element={<MapPage />} />
                  <Route path="/articles" element={<HealthArticles />} />
                  <Route path="/symptom-tracker" element={<SymptomTracker />} />
                  <Route path="/forum" element={<Forum />} />
                  <Route path="/doctor-workplace" element={<DoctorWorkplace />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/bookmarks" element={<Bookmarks />} />
                  <Route path="/tutorial" element={<Tutorial />} />
                  <Route path="/admin" element={<AdminPanel />} />
                  <Route path="/about" element={<About />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </div>
            <NavigationAssistant />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
