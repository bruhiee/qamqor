import { motion } from "framer-motion";
import { 
  Shield, 
  Heart, 
  Users, 
  Award, 
  Globe, 
  Lock,
  AlertTriangle,
  CheckCircle,
  Mail
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DisclaimerBanner } from "@/components/layout/DisclaimerBanner";
import { Button } from "@/components/ui/button";

const values = [
  {
    icon: Shield,
    title: "Safety First",
    description: "We prioritize user safety by always encouraging professional medical consultation and never providing diagnoses."
  },
  {
    icon: Lock,
    title: "Privacy Protected",
    description: "Your health information stays on your device. We don't store or share your personal medical data."
  },
  {
    icon: Heart,
    title: "User-Centered",
    description: "Designed with empathy, our platform focuses on making health information accessible and understandable."
  },
  {
    icon: Globe,
    title: "Multilingual",
    description: "Available in Russian, Kazakh, and English to serve diverse communities across Central Asia."
  }
];

const team = [
  { name: "Medical AI Team", role: "AI Development & Medical Research" },
  { name: "Healthcare Advisors", role: "Medical Content Review" },
  { name: "UX Research Team", role: "User Experience Design" },
  { name: "Security Team", role: "Data Protection & Privacy" }
];

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-2 mb-6"
            >
              <Award className="w-4 h-4" />
              <span className="text-sm font-medium">Student Competition Project</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-display text-4xl md:text-5xl font-bold mb-6"
            >
              About <span className="text-gradient">Disease Detector</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-muted-foreground"
            >
              An AI-powered health assistant platform designed to make health information 
              more accessible while promoting safe, informed healthcare decisions.
            </motion.p>
          </div>

          {/* Mission */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card rounded-2xl border border-border p-8 md:p-12 mb-16"
          >
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
                  Our Mission
                </h2>
                <p className="text-muted-foreground mb-4">
                  Disease Detector was created to bridge the gap between complex medical 
                  information and everyday understanding. We believe everyone deserves 
                  access to reliable health information in their own language.
                </p>
                <p className="text-muted-foreground">
                  Our platform combines advanced AI technology with a commitment to safety, 
                  always reminding users that professional medical advice is irreplaceable.
                </p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 blur-3xl" />
                <div className="relative grid grid-cols-2 gap-4">
                  {values.slice(0, 2).map((value, index) => {
                    const Icon = value.icon;
                    return (
                      <div
                        key={index}
                        className="bg-background rounded-xl p-4 border border-border"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <h4 className="font-semibold text-sm mb-1">{value.title}</h4>
                        <p className="text-xs text-muted-foreground">{value.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Values */}
          <div className="mb-16">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-8">
              Our Core Values
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-card rounded-xl border border-border p-6 text-center hover:shadow-medical transition-shadow"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-display font-semibold mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Disclaimer Section */}
          <div id="disclaimer" className="mb-16 scroll-mt-24">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-8">
              Medical Disclaimer
            </h2>
            <DisclaimerBanner />
            
            <div className="mt-8 grid md:grid-cols-2 gap-6">
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-success" />
                  </div>
                  <h3 className="font-display font-semibold">What We Do</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    Provide general health information
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    Help you understand symptoms
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    Suggest when to seek medical help
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    Help manage medications
                  </li>
                </ul>
              </div>
              
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </div>
                  <h3 className="font-display font-semibold">What We Don't Do</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                    Provide medical diagnoses
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                    Replace professional medical advice
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                    Prescribe medications or treatments
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                    Handle medical emergencies
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Team */}
          <div className="mb-16">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-8">
              Our Team
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {team.map((member, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-xl border border-border p-6 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                    <Users className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-display font-semibold mb-1">{member.name}</h3>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Contact CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8 md:p-12 border border-primary/20"
          >
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
              Get in Touch
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Have questions, feedback, or want to collaborate? We'd love to hear from you.
            </p>
            <Button size="lg" className="medical-gradient gap-2">
              <Mail className="w-5 h-5" />
              Contact Us
            </Button>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
