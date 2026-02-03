import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Heart,
  Search,
  AlertTriangle,
  Phone,
  ChevronRight,
  ChevronDown,
  Clock,
  CheckCircle,
  XCircle,
  Flame,
  Droplets,
  Brain,
  Bone,
  Baby,
  Pill,
  Zap
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DisclaimerBanner } from "@/components/layout/DisclaimerBanner";

interface FirstAidGuide {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  severity: "critical" | "urgent" | "moderate";
  overview: string;
  callEmergency: boolean;
  steps: {
    step: number;
    title: string;
    description: string;
    warning?: string;
  }[];
  doNots: string[];
  whenToSeekHelp: string;
}

const firstAidGuides: FirstAidGuide[] = [
  {
    id: "cpr",
    title: "CPR (Cardiopulmonary Resuscitation)",
    icon: Heart,
    color: "#EF4444",
    severity: "critical",
    overview: "CPR is a life-saving technique used when someone's heart stops beating. Immediate action can double or triple survival chances.",
    callEmergency: true,
    steps: [
      { step: 1, title: "Check Responsiveness", description: "Tap the person's shoulder and shout 'Are you okay?' Look for normal breathing." },
      { step: 2, title: "Call Emergency Services", description: "Call 103 (Kazakhstan) or your local emergency number. Put phone on speaker.", warning: "Don't delay - every second counts!" },
      { step: 3, title: "Position the Person", description: "Place them on their back on a firm, flat surface." },
      { step: 4, title: "Begin Chest Compressions", description: "Place heel of one hand on center of chest, other hand on top. Push hard and fast - at least 5cm deep, 100-120 compressions per minute." },
      { step: 5, title: "Give Rescue Breaths (if trained)", description: "Tilt head back, lift chin, pinch nose. Give 2 breaths, each lasting about 1 second." },
      { step: 6, title: "Continue CPR", description: "Alternate 30 compressions with 2 breaths. Don't stop until help arrives or person recovers." }
    ],
    doNots: [
      "Don't give up - continue CPR until help arrives",
      "Don't compress too slowly or too shallow",
      "Don't interrupt compressions for more than 10 seconds"
    ],
    whenToSeekHelp: "Always call emergency services immediately when someone is unresponsive and not breathing normally."
  },
  {
    id: "choking",
    title: "Choking (Heimlich Maneuver)",
    icon: AlertTriangle,
    color: "#F97316",
    severity: "critical",
    overview: "Choking occurs when an object blocks the airway. Quick action using the Heimlich maneuver can dislodge the obstruction.",
    callEmergency: true,
    steps: [
      { step: 1, title: "Recognize Choking Signs", description: "Person cannot speak, cough, or breathe. May clutch throat. Skin may turn blue." },
      { step: 2, title: "Ask for Permission", description: "If person is conscious, ask 'Are you choking? Can I help you?'" },
      { step: 3, title: "Position Yourself", description: "Stand behind the person. Place one foot between their feet for stability." },
      { step: 4, title: "Make a Fist", description: "Place your fist (thumb side in) just above the navel, below the ribcage." },
      { step: 5, title: "Perform Abdominal Thrusts", description: "Grasp your fist with other hand. Pull sharply inward and upward in quick, forceful thrusts." },
      { step: 6, title: "Repeat Until Clear", description: "Continue thrusts until object is expelled or person becomes unconscious." }
    ],
    doNots: [
      "Don't perform on pregnant women (use chest thrusts instead)",
      "Don't slap the back while person is upright (for adults)",
      "Don't stick fingers in mouth to retrieve object blindly"
    ],
    whenToSeekHelp: "Call emergency if choking persists, person loses consciousness, or after any severe choking episode."
  },
  {
    id: "burns",
    title: "Burns and Scalds",
    icon: Flame,
    color: "#DC2626",
    severity: "urgent",
    overview: "Burns require immediate cooling to reduce damage. The severity determines the level of care needed.",
    callEmergency: false,
    steps: [
      { step: 1, title: "Remove from Source", description: "Move person away from heat source. Remove any clothing or jewelry near the burn (unless stuck to skin)." },
      { step: 2, title: "Cool the Burn", description: "Hold burn under cool (not cold) running water for at least 20 minutes.", warning: "Don't use ice, ice water, or any creams/butter." },
      { step: 3, title: "Assess Severity", description: "First-degree: red, dry skin. Second-degree: blisters, moist. Third-degree: white/charred, no pain (nerve damage)." },
      { step: 4, title: "Cover the Burn", description: "Use a sterile, non-fluffy bandage or clean cloth. Wrap loosely to avoid pressure." },
      { step: 5, title: "Manage Pain", description: "Over-the-counter pain relievers can help. Keep burned area elevated if possible." },
      { step: 6, title: "Monitor for Shock", description: "Watch for pale skin, weakness, or rapid breathing. Keep person warm and calm." }
    ],
    doNots: [
      "Don't apply ice directly to burns",
      "Don't break blisters",
      "Don't apply butter, oil, or toothpaste",
      "Don't remove clothing stuck to the burn"
    ],
    whenToSeekHelp: "Seek medical help for burns larger than palm size, on face/hands/feet/genitals, chemical or electrical burns, or if blisters form."
  },
  {
    id: "bleeding",
    title: "Severe Bleeding",
    icon: Droplets,
    color: "#B91C1C",
    severity: "critical",
    overview: "Controlling severe bleeding quickly is essential. Apply direct pressure and keep the wound elevated when possible.",
    callEmergency: true,
    steps: [
      { step: 1, title: "Ensure Safety", description: "Wear gloves if available. Ensure the scene is safe before approaching." },
      { step: 2, title: "Apply Direct Pressure", description: "Use a clean cloth or bandage. Press firmly on the wound. Don't lift to check - this disrupts clotting." },
      { step: 3, title: "Elevate the Wound", description: "If possible, raise the injured area above heart level." },
      { step: 4, title: "Add More Pressure", description: "If blood soaks through, add more cloth on top. Don't remove the first layer." },
      { step: 5, title: "Apply Pressure Point", description: "If bleeding continues, press on the artery between the wound and the heart." },
      { step: 6, title: "Secure Bandage", description: "Once bleeding slows, wrap firmly but not too tight. Check circulation beyond bandage." }
    ],
    doNots: [
      "Don't remove the first bandage if soaked",
      "Don't apply a tourniquet unless trained and bleeding is life-threatening",
      "Don't probe or clean deep wounds"
    ],
    whenToSeekHelp: "Call emergency for arterial bleeding (bright red, spurting), wounds that won't stop bleeding, or if person shows signs of shock."
  },
  {
    id: "stroke",
    title: "Stroke Recognition (FAST)",
    icon: Brain,
    color: "#7C3AED",
    severity: "critical",
    overview: "Stroke requires immediate medical attention. Use FAST to recognize symptoms: Face drooping, Arm weakness, Speech difficulty, Time to call emergency.",
    callEmergency: true,
    steps: [
      { step: 1, title: "Face - Check for Drooping", description: "Ask person to smile. Does one side of the face droop or feel numb?" },
      { step: 2, title: "Arms - Check for Weakness", description: "Ask person to raise both arms. Does one arm drift downward?" },
      { step: 3, title: "Speech - Check for Difficulty", description: "Ask person to repeat a simple sentence. Is speech slurred or strange?" },
      { step: 4, title: "Time - Act Quickly", description: "If any symptoms present, call emergency immediately. Note the time symptoms started." },
      { step: 5, title: "Keep Person Comfortable", description: "Have them lie down with head slightly elevated. Loosen tight clothing." },
      { step: 6, title: "Stay Calm and Monitor", description: "Stay with person. Don't give food or drink. Be prepared to perform CPR if needed." }
    ],
    doNots: [
      "Don't give aspirin or any medication",
      "Don't give food or water (swallowing may be impaired)",
      "Don't let person 'sleep it off'",
      "Don't delay calling for help"
    ],
    whenToSeekHelp: "Call emergency immediately if any FAST symptoms are present. Every minute counts - brain cells are dying."
  },
  {
    id: "fractures",
    title: "Broken Bones and Fractures",
    icon: Bone,
    color: "#6366F1",
    severity: "urgent",
    overview: "Suspected fractures should be immobilized to prevent further injury. Don't try to realign the bone.",
    callEmergency: false,
    steps: [
      { step: 1, title: "Assess the Injury", description: "Look for deformity, swelling, bruising, or bone protruding. Ask about pain and ability to move." },
      { step: 2, title: "Immobilize the Area", description: "Keep the injured limb still. Support it in the position found." },
      { step: 3, title: "Apply Cold Compress", description: "Wrap ice in cloth and apply to reduce swelling. Don't apply ice directly to skin." },
      { step: 4, title: "Create a Splint", description: "Use rigid materials (boards, magazines) padded with cloth. Extend past joints above and below injury." },
      { step: 5, title: "Secure the Splint", description: "Tie splint in place with cloth strips. Check circulation beyond splint regularly." },
      { step: 6, title: "Treat for Shock", description: "Keep person warm and calm. Elevate legs if no leg injury. Monitor breathing." }
    ],
    doNots: [
      "Don't try to straighten or push back a deformed limb",
      "Don't move person if spine injury is suspected",
      "Don't apply splint too tightly"
    ],
    whenToSeekHelp: "Seek medical care for all suspected fractures. Call emergency if bone is visible, there's severe bleeding, or if neck/back injury is suspected."
  },
  {
    id: "allergic-reaction",
    title: "Severe Allergic Reaction (Anaphylaxis)",
    icon: Zap,
    color: "#EC4899",
    severity: "critical",
    overview: "Anaphylaxis is a life-threatening allergic reaction. It can cause airways to swell and blood pressure to drop rapidly.",
    callEmergency: true,
    steps: [
      { step: 1, title: "Recognize Symptoms", description: "Swelling of face/throat, difficulty breathing, hives, rapid pulse, dizziness, nausea." },
      { step: 2, title: "Call Emergency", description: "Call 103 immediately. Anaphylaxis can be fatal within minutes." },
      { step: 3, title: "Use Epinephrine", description: "If person has an EpiPen, help them use it. Inject into outer thigh through clothing if needed." },
      { step: 4, title: "Position the Person", description: "If breathing is difficult, let them sit up. If feeling faint, have them lie down with legs elevated." },
      { step: 5, title: "Monitor Breathing", description: "Be prepared to perform CPR if person stops breathing." },
      { step: 6, title: "Give Second Dose", description: "If symptoms don't improve in 5-15 minutes and a second EpiPen is available, use it." }
    ],
    doNots: [
      "Don't leave person alone",
      "Don't give oral medication if having trouble breathing",
      "Don't delay epinephrine if available",
      "Don't have person stand up if feeling dizzy"
    ],
    whenToSeekHelp: "Always call emergency for suspected anaphylaxis. Even if symptoms improve, person needs medical observation."
  },
  {
    id: "poisoning",
    title: "Poisoning and Overdose",
    icon: Pill,
    color: "#059669",
    severity: "critical",
    overview: "Poisoning can occur from medications, chemicals, or contaminated food. Identifying the substance helps treatment.",
    callEmergency: true,
    steps: [
      { step: 1, title: "Identify the Poison", description: "Find containers, pills, or plants. Note the amount and time of exposure." },
      { step: 2, title: "Call Poison Control", description: "Contact poison control center or emergency services. Provide substance name and amount." },
      { step: 3, title: "Follow Instructions", description: "Do exactly what poison control tells you. Don't induce vomiting unless instructed." },
      { step: 4, title: "If Inhaled", description: "Move person to fresh air immediately. Open windows and doors." },
      { step: 5, title: "If on Skin", description: "Remove contaminated clothing. Rinse skin with running water for 15-20 minutes." },
      { step: 6, title: "Monitor Vital Signs", description: "Watch for changes in consciousness, breathing, or pulse. Be ready to perform CPR." }
    ],
    doNots: [
      "Don't induce vomiting unless directed by poison control",
      "Don't give anything to drink unless directed",
      "Don't wait for symptoms before calling for help",
      "Don't try home remedies"
    ],
    whenToSeekHelp: "Call poison control immediately for any poisoning. Call emergency if person is unconscious, having seizures, or difficulty breathing."
  }
];

export default function FirstAidGuide() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);

  const filteredGuides = firstAidGuides.filter(
    (guide) =>
      guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.overview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <span className="text-xs px-2 py-1 rounded-full bg-destructive/20 text-destructive font-medium">Critical</span>;
      case "urgent":
        return <span className="text-xs px-2 py-1 rounded-full bg-warning/20 text-warning font-medium">Urgent</span>;
      case "moderate":
        return <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary font-medium">Moderate</span>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center">
                <Heart className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold">First Aid Guide</h1>
                <p className="text-muted-foreground">Emergency procedures and step-by-step instructions</p>
              </div>
            </div>
          </div>

          {/* Emergency Banner */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 mb-8"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-destructive mb-2">
                  Emergency Numbers
                </h3>
                <div className="grid sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-semibold">Kazakhstan:</span>
                    <span className="ml-2">103 (Ambulance)</span>
                  </div>
                  <div>
                    <span className="font-semibold">Russia:</span>
                    <span className="ml-2">103 / 112</span>
                  </div>
                  <div>
                    <span className="font-semibold">International:</span>
                    <span className="ml-2">112</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  In a life-threatening emergency, always call emergency services first before providing first aid.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Disclaimer */}
          <div className="mb-8">
            <DisclaimerBanner />
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search first aid guides..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Guides List */}
          <div className="space-y-4">
            {filteredGuides.map((guide, index) => {
              const Icon = guide.icon;
              const isExpanded = expandedGuide === guide.id;

              return (
                <motion.div
                  key={guide.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card rounded-xl border border-border overflow-hidden"
                >
                  {/* Header */}
                  <button
                    onClick={() => setExpandedGuide(isExpanded ? null : guide.id)}
                    className="w-full p-5 flex items-center gap-4 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${guide.color}20` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: guide.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-display font-semibold">{guide.title}</h3>
                        {getSeverityBadge(guide.severity)}
                        {guide.callEmergency && (
                          <span className="text-xs px-2 py-1 rounded-full bg-destructive text-destructive-foreground font-medium flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            Call 103
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{guide.overview}</p>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-muted-foreground transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 pt-0 space-y-6">
                          {/* Overview */}
                          <div className="bg-muted/50 rounded-lg p-4">
                            <p className="text-sm">{guide.overview}</p>
                          </div>

                          {/* Steps */}
                          <div>
                            <h4 className="font-display font-semibold mb-4 flex items-center gap-2">
                              <Clock className="w-5 h-5 text-primary" />
                              Step-by-Step Instructions
                            </h4>
                            <div className="space-y-3">
                              {guide.steps.map((step) => (
                                <div
                                  key={step.step}
                                  className="flex gap-4 p-4 bg-background rounded-lg border border-border"
                                >
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm"
                                    style={{ backgroundColor: `${guide.color}20`, color: guide.color }}
                                  >
                                    {step.step}
                                  </div>
                                  <div>
                                    <h5 className="font-semibold text-sm mb-1">{step.title}</h5>
                                    <p className="text-sm text-muted-foreground">{step.description}</p>
                                    {step.warning && (
                                      <p className="text-xs text-warning mt-2 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        {step.warning}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Do's and Don'ts */}
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                              <h5 className="font-semibold text-sm mb-3 flex items-center gap-2 text-destructive">
                                <XCircle className="w-4 h-4" />
                                What NOT to Do
                              </h5>
                              <ul className="space-y-2">
                                {guide.doNots.map((item, i) => (
                                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                    <XCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="bg-warning/5 border border-warning/20 rounded-lg p-4">
                              <h5 className="font-semibold text-sm mb-3 flex items-center gap-2 text-warning">
                                <AlertTriangle className="w-4 h-4" />
                                When to Seek Help
                              </h5>
                              <p className="text-sm text-muted-foreground">{guide.whenToSeekHelp}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {filteredGuides.length === 0 && (
            <div className="text-center py-12">
              <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No guides found</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
