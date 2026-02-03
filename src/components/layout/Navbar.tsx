import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Menu,
  X,
  MessageSquare,
  Pill,
  MapPin,
  FileText,
  Cross,
  Activity,
  User,
  LogOut,
  Users,
  Stethoscope,
  Shield,
} from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, signOut } = useAuth();
  const { isDoctor, isAdmin } = useUserRoles();

  const navItems = [
    { href: "/consultant", label: t.aiConsultant, icon: MessageSquare },
    { href: "/cabinet", label: t.medicineCabinet, icon: Pill },
    { href: "/map", label: t.map, icon: MapPin },
    { href: "/first-aid", label: t.firstAid, icon: Cross },
    { href: "/symptom-tracker", label: t.symptomTracker, icon: Activity },
    { href: "/forum", label: t.forum, icon: Users },
    { href: "/articles", label: t.articles, icon: FileText },
  ];

  // Add doctor workplace if user is a doctor
  const doctorItems = isDoctor() ? [
    { href: "/doctor-workplace", label: t.doctorWorkplace, icon: Stethoscope },
  ] : [];

  // Add admin panel if user is an admin
  const adminItems = isAdmin() ? [
    { href: "/admin", label: t.adminPanel, icon: Shield },
  ] : [];

  const allNavItems = [...navItems, ...doctorItems, ...adminItems];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl medical-gradient flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg hidden sm:block">
              Disease Detector
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {allNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden xl:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {user.user_metadata?.display_name || user.email?.split('@')[0]}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {isDoctor() && (
                    <DropdownMenuItem onClick={() => navigate('/doctor-workplace')}>
                      <Stethoscope className="w-4 h-4 mr-2" />
                      {t.doctorWorkplace}
                    </DropdownMenuItem>
                  )}
                  {isAdmin() && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Shield className="w-4 h-4 mr-2" />
                      {t.adminPanel}
                    </DropdownMenuItem>
                  )}
                  {(isDoctor() || isAdmin()) && <DropdownMenuSeparator />}
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    {t.signOut}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button variant="default" size="sm" className="medical-gradient">
                  {t.signIn}
                </Button>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden overflow-hidden"
            >
              <div className="py-4 space-y-1">
                {allNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
