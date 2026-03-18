import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Menu,
  X,
  MessageSquare,
  Pill,
  MapPin,
  FileText,
  Activity,
  User,
  LogOut,
  Users,
  Shield,
  Bookmark,
  GraduationCap,
  Sun,
  Moon,
} from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "@/contexts/useLanguage";
import { useAuth } from "@/contexts/useAuth";
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
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, signOut } = useAuth();
  const { isAdmin, isDoctor } = useUserRoles();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const navItems = [
    { href: "/consultant", label: t.aiConsultant, icon: MessageSquare },
    { href: "/cabinet", label: t.medicineCabinet, icon: Pill },
    { href: "/map", label: t.map, icon: MapPin },
    { href: "/symptom-tracker", label: t.symptomTracker, icon: Activity },
    { href: "/forum", label: t.forum, icon: Users },
    { href: "/articles", label: t.articles, icon: FileText },
  ];

  // Add admin panel if user is an admin
  const adminItems = isAdmin() ? [
    { href: "/admin", label: t.adminPanel, icon: Shield },
  ] : [];

  const doctorItems = isDoctor()
    ? [{ href: "/doctor-workplace", label: t.doctorWorkplace, icon: Shield }]
    : [];
  const allNavItems = [...navItems, ...doctorItems, ...adminItems];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-md transition-colors duration-300 ${
        scrolled ? "bg-background/92 border-border/85" : "bg-background/72 border-border/60"
      }`}
    >
      <div className="mx-auto w-full max-w-[1600px] px-3 lg:px-5">
        <div className="flex items-center justify-between h-[72px]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl medical-gradient flex items-center justify-center shadow-[0_10px_30px_-18px_hsl(var(--primary)/0.9)]">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-[1.85rem] leading-none hidden sm:block">
              Qamqor
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex flex-1 min-w-0 mx-4">
            <div className="flex w-full items-center gap-1.5 rounded-xl border border-border/70 bg-muted/35 p-1.5 overflow-x-auto scrollbar-hide xl:justify-between">
              {allNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`nav-link-fancy relative shrink-0 min-w-max flex items-center px-2.5 py-2.5 rounded-lg text-[13px] font-medium whitespace-nowrap transition-all duration-300 ${
                    isActive
                      ? "bg-primary/12 text-primary shadow-[0_10px_28px_-18px_hsl(var(--primary)/0.8)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/75"
                  }`}
                >
                  {isActive && <span className="absolute inset-0 rounded-lg border border-primary/25" />}
                  <Icon className="w-4 h-4 mr-2" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2.5 shrink-0">
            <LanguageSwitcher />
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-xl border-border/70 bg-background/70 hover:bg-primary/10 hover:border-primary/30"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-11 rounded-xl gap-2.5 border-border/70 bg-background/72 px-4 hover:bg-primary/10 hover:border-primary/30">
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
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/bookmarks')}>
                    <Bookmark className="w-4 h-4 mr-2" />
                    Bookmarks
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/tutorial')}>
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Tutorial
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {isAdmin() && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <Shield className="w-4 h-4 mr-2" />
                        {t.adminPanel}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    {t.signOut}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button variant="default" size="sm" className="medical-gradient button-glow">
                  {t.signIn}
                </Button>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-11 w-11 rounded-xl"
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
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="lg:hidden overflow-hidden"
            >
              <motion.div
                initial={{ y: -8 }}
                animate={{ y: 0 }}
                exit={{ y: -8 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="py-4 space-y-1"
              >
                {allNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}


