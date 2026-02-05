import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Activity,
  Plus,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Moon,
  Smile,
  Meh,
  Frown,
  Trash2,
  ChevronLeft,
  ChevronRight,
  BarChart3
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/useLanguage";

interface SymptomLog {
  id: string;
  symptom_date: string;
  symptoms: string[];
  severity: number;
  notes: string | null;
  mood: string | null;
  sleep_hours: number | null;
  created_at: string;
}

const commonSymptoms = [
  "Headache", "Fatigue", "Nausea", "Fever", "Cough",
  "Sore throat", "Body aches", "Dizziness", "Congestion",
  "Stomach pain", "Back pain", "Anxiety", "Insomnia"
];

export default function SymptomTracker() {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<SymptomLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  
  // Form state
  const [formData, setFormData] = useState({
    symptoms: [] as string[],
    severity: 5,
    notes: "",
    mood: "okay",
    sleepHours: 7,
    customSymptom: "",
  });
  const moodOptions = [
    { value: "great", label: t.moodGreat, icon: Smile, color: "text-success" },
    { value: "good", label: t.moodGood, icon: Smile, color: "text-primary" },
    { value: "okay", label: t.moodOkay, icon: Meh, color: "text-warning" },
    { value: "bad", label: t.moodBad, icon: Frown, color: "text-orange-500" },
    { value: "terrible", label: t.moodTerrible, icon: Frown, color: "text-destructive" },
  ];

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data } = await apiFetch<{ data: SymptomLog[] }>("/symptom-logs");
      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast.error(t.logsLoadError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (formData.symptoms.length === 0) {
      toast.error(t.selectSymptomWarning);
      return;
    }

    try {
      await apiFetch("/symptom-logs", {
        method: "POST",
        body: {
          symptom_date: selectedDate,
          symptoms: formData.symptoms,
          severity: formData.severity,
          notes: formData.notes || null,
          mood: formData.mood,
          sleep_hours: formData.sleepHours,
        },
      });

      toast.success(t.logsSaveSuccess);
      resetForm();
      fetchLogs();
    } catch (error) {
      console.error("Error saving log:", error);
      toast.error(t.logsSaveError);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/symptom-logs/${id}`, {
        method: "DELETE",
      });
      toast.success(t.logsDeleteSuccess);
      fetchLogs();
    } catch (error) {
      console.error("Error deleting log:", error);
      toast.error(t.logsDeleteError);
    }
  };

  const resetForm = () => {
    setFormData({
      symptoms: [],
      severity: 5,
      notes: "",
      mood: "okay",
      sleepHours: 7,
      customSymptom: "",
    });
    setIsAddDialogOpen(false);
  };

  const toggleSymptom = (symptom: string) => {
    setFormData((prev) => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter((s) => s !== symptom)
        : [...prev.symptoms, symptom],
    }));
  };

  const addCustomSymptom = () => {
    if (formData.customSymptom.trim() && !formData.symptoms.includes(formData.customSymptom.trim())) {
      setFormData((prev) => ({
        ...prev,
        symptoms: [...prev.symptoms, prev.customSymptom.trim()],
        customSymptom: "",
      }));
    }
  };

  const getSeverityColor = (severity: number) => {
    if (severity <= 3) return "text-success bg-success/20";
    if (severity <= 6) return "text-warning bg-warning/20";
    return "text-destructive bg-destructive/20";
  };

  const getSeverityTrend = () => {
    if (logs.length < 2) return null;
    const recentAvg = logs.slice(0, 3).reduce((a, b) => a + b.severity, 0) / Math.min(logs.length, 3);
    const olderAvg = logs.slice(3, 6).reduce((a, b) => a + b.severity, 0) / Math.min(logs.length - 3, 3);
    if (logs.length < 4) return null;
    if (recentAvg < olderAvg - 0.5) return "improving";
    if (recentAvg > olderAvg + 0.5) return "worsening";
    return "stable";
  };

  const trend = getSeverityTrend();
  const trendLabel = trend
    ? trend === "improving"
      ? t.trendImproving
      : trend === "worsening"
        ? t.trendWorsening
        : t.trendStable
    : t.notAvailable;

  // Get unique symptoms from recent logs for frequency chart
  const symptomFrequency = logs.reduce((acc, log) => {
    log.symptoms.forEach((s) => {
      acc[s] = (acc[s] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const topSymptoms = Object.entries(symptomFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h1 className="font-display text-3xl font-bold">{t.symptomTrackerTitle}</h1>
                  <p className="text-muted-foreground">{t.symptomTrackerSubtitle}</p>
                </div>
              </div>

              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                    <Button className="medical-gradient shadow-medical gap-2">
                      <Plus className="w-4 h-4" />
                      {t.logSymptomsButton}
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="font-display">{t.logTodaysSymptomsTitle}</DialogTitle>
                    </DialogHeader>
                  <div className="space-y-6 mt-4">
                    {/* Date */}
                    <div>
                      <Label>{t.dateLabel}</Label>
                      <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        max={new Date().toISOString().split("T")[0]}
                      />
                    </div>

                    {/* Symptoms */}
                    <div>
                      <Label className="mb-3 block">{t.selectSymptomsLabel}</Label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {commonSymptoms.map((symptom) => (
                          <Button
                            key={symptom}
                            type="button"
                            variant={formData.symptoms.includes(symptom) ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleSymptom(symptom)}
                            className={formData.symptoms.includes(symptom) ? "medical-gradient" : ""}
                          >
                            {symptom}
                          </Button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder={t.addCustomSymptomPlaceholder}
                          value={formData.customSymptom}
                          onChange={(e) => setFormData({ ...formData, customSymptom: e.target.value })}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSymptom())}
                        />
                        <Button type="button" variant="outline" onClick={addCustomSymptom}>
                          {t.addButton}
                        </Button>
                      </div>
                      {formData.symptoms.filter((s) => !commonSymptoms.includes(s)).length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.symptoms
                            .filter((s) => !commonSymptoms.includes(s))
                            .map((symptom) => (
                              <Button
                                key={symptom}
                                variant="default"
                                size="sm"
                                onClick={() => toggleSymptom(symptom)}
                                className="medical-gradient"
                              >
                                {symptom}
                              </Button>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Severity */}
                    <div>
                      <Label className="mb-3 block">
                        {t.severityLabel}: <span className="font-bold">{formData.severity}/10</span>
                      </Label>
                      <Slider
                        value={[formData.severity]}
                        onValueChange={(v) => setFormData({ ...formData, severity: v[0] })}
                        min={1}
                        max={10}
                        step={1}
                        className="py-4"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{t.severityMild}</span>
                        <span>{t.severityModerate}</span>
                        <span>{t.severitySevere}</span>
                      </div>
                    </div>

                    {/* Mood */}
                    <div>
                      <Label className="mb-3 block">{t.overallMoodLabel}</Label>
                      <div className="flex gap-2">
                        {moodOptions.map((option) => {
                          const Icon = option.icon;
                          return (
                            <Button
                              key={option.value}
                              type="button"
                              variant={formData.mood === option.value ? "default" : "outline"}
                              size="sm"
                              onClick={() => setFormData({ ...formData, mood: option.value })}
                              className={`flex-1 gap-1 ${formData.mood === option.value ? "medical-gradient" : ""}`}
                            >
                              <Icon className={`w-4 h-4 ${formData.mood !== option.value ? option.color : ""}`} />
                              <span className="hidden sm:inline">{option.label}</span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Sleep */}
                    <div>
                      <Label className="mb-3 block flex items-center gap-2">
                        <Moon className="w-4 h-4" />
                        {t.hoursOfSleepLabel}: <span className="font-bold">{formData.sleepHours}h</span>
                      </Label>
                      <Slider
                        value={[formData.sleepHours]}
                        onValueChange={(v) => setFormData({ ...formData, sleepHours: v[0] })}
                        min={0}
                        max={12}
                        step={0.5}
                        className="py-4"
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <Label>{t.additionalNotesLabel}</Label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Any additional details about how you're feeling..."
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button variant="outline" onClick={resetForm} className="flex-1">
                        {t.cancel}
                      </Button>
                      <Button onClick={handleSubmit} className="flex-1 medical-gradient">
                        {t.saveLog}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl border border-border p-5"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{t.totalLogs}</span>
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="font-display text-2xl font-bold">{logs.length}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-xl border border-border p-5"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{t.avgSeverity}</span>
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="font-display text-2xl font-bold">
                {logs.length > 0
                  ? (logs.reduce((a, b) => a + b.severity, 0) / logs.length).toFixed(1)
                  : "-"}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-xl border border-border p-5"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{t.trend}</span>
                {trend === "improving" && <TrendingDown className="w-4 h-4 text-success" />}
                {trend === "worsening" && <TrendingUp className="w-4 h-4 text-destructive" />}
                {trend === "stable" && <Minus className="w-4 h-4 text-muted-foreground" />}
                {!trend && <Minus className="w-4 h-4 text-muted-foreground" />}
              </div>
              <div className={`font-display text-2xl font-bold capitalize ${
                trend === "improving" ? "text-success" : trend === "worsening" ? "text-destructive" : ""
              }`}>
                {trendLabel}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-xl border border-border p-5"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{t.topSymptom}</span>
                <Activity className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="font-display text-lg font-bold truncate">
                {topSymptoms[0]?.[0] || "N/A"}
              </div>
            </motion.div>
          </div>

          {/* Symptom Frequency */}
          {topSymptoms.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl border border-border p-5 mb-8"
            >
              <h3 className="font-display font-semibold mb-4">{t.mostFrequentSymptoms}</h3>
              <div className="space-y-3">
                {topSymptoms.map(([symptom, count], index) => (
                  <div key={symptom} className="flex items-center gap-3">
                    <span className="text-sm w-24 truncate">{symptom}</span>
                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / topSymptoms[0][1]) * 100}%` }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="h-full medical-gradient"
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Logs List */}
          <div className="space-y-3">
            <h3 className="font-display font-semibold">{t.recentLogs}</h3>
            
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-display font-semibold mb-2">{t.noLogsTitle}</h3>
                <p className="text-muted-foreground mb-4">{t.noLogsDescription}</p>
                <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  {t.logFirstSymptomsButton}
                </Button>
              </div>
            ) : (
              <AnimatePresence>
                {logs.map((log, index) => {
                  const moodOption = moodOptions.find((m) => m.value === log.mood);
                  const MoodIcon = moodOption?.icon || Meh;

                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-card rounded-xl border border-border p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold">
                              {new Date(log.symptom_date).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getSeverityColor(log.severity)}`}>
                              Severity: {log.severity}/10
                            </span>
                            {moodOption && (
                              <MoodIcon className={`w-4 h-4 ${moodOption.color}`} />
                            )}
                            {log.sleep_hours && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Moon className="w-3 h-3" />
                                {log.sleep_hours}h
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {log.symptoms.map((symptom) => (
                              <span
                                key={symptom}
                                className="text-xs bg-muted px-2 py-1 rounded-full"
                              >
                                {symptom}
                              </span>
                            ))}
                          </div>
                          {log.notes && (
                            <p className="text-sm text-muted-foreground">{log.notes}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(log.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
