import { Link } from "react-router-dom";
import { Activity, Heart, Mail, Phone, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function Footer() {
  const { t } = useLanguage();
  
  return (
    <footer className="bg-foreground text-background/80">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl text-background">
                DiseaseDetector
              </span>
            </Link>
            <p className="text-sm text-background/60 leading-relaxed">
              {t.disclaimerText}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold text-background mb-4">
              {t.home}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/consultant" className="text-background/60 hover:text-primary transition-colors">
                  {t.aiConsultant}
                </Link>
              </li>
              <li>
                <Link to="/cabinet" className="text-background/60 hover:text-primary transition-colors">
                  {t.medicineCabinet}
                </Link>
              </li>
              <li>
                <Link to="/map" className="text-background/60 hover:text-primary transition-colors">
                  {t.findCare}
                </Link>
              </li>
              <li>
                <Link to="/articles" className="text-background/60 hover:text-primary transition-colors">
                  {t.articles}
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-display font-semibold text-background mb-4">
              {t.about}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/first-aid" className="text-background/60 hover:text-primary transition-colors">
                  {t.firstAid}
                </Link>
              </li>
              <li>
                <Link to="/symptom-tracker" className="text-background/60 hover:text-primary transition-colors">
                  {t.symptomTracker}
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-background/60 hover:text-primary transition-colors">
                  {t.about}
                </Link>
              </li>
              <li>
                <span className="text-background/60">
                  {t.medicalDisclaimer}
                </span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold text-background mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-background/60">
                <Mail className="w-4 h-4" />
                support@diseasedetector.app
              </li>
              <li className="flex items-center gap-2 text-background/60">
                <Phone className="w-4 h-4" />
                +7 (700) 123-4567
              </li>
              <li className="flex items-center gap-2 text-background/60">
                <MapPin className="w-4 h-4" />
                Astana, Kazakhstan
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/10 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-background/40">
            © 2024 Disease Detector. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-background/40">
            <Heart className="w-4 h-4 text-medical-pulse" />
            Made with care for your health
          </div>
        </div>
      </div>
    </footer>
  );
}
