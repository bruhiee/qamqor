import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Stethoscope,
  Plus,
  Search,
  Clock,
  Tag,
  Brain,
  FolderOpen,
  Lock,
  Eye,
  Sparkles,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navigate } from "react-router-dom";

interface ClinicalCase {
  id: string;
  doctor_id: string;
  age_range: string;
  symptoms: string[];
  duration: string;
  diagnostic_markers: string[];
  insights: string;
  tags: string[];
  is_private: boolean;
  created_at: string;
}

interface CaseCollection {
  id: string;
  doctor_id: string;
  name: string;
  description: string;
  case_ids: string[];
  created_at: string;
}

const AGE_RANGES = [
  "0-2 years", "3-12 years", "13-17 years", "18-30 years",
  "31-45 years", "46-60 years", "61-75 years", "76+ years"
];

const SUGGESTED_TAGS = [
  "cardiology", "neurology", "gastroenterology", "respiratory",
  "dermatology", "pediatrics", "geriatrics", "emergency",
  "chronic", "acute", "rare"
];

export default function DoctorWorkplace() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isDoctor, loading: rolesLoading } = useUserRoles();
  const { toast } = useToast();

  const [cases, setCases] = useState<ClinicalCase[]>([]);
  const [collections, setCollections] = useState<CaseCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [newCaseOpen, setNewCaseOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<ClinicalCase | null>(null);

  // New case form
  const [ageRange, setAgeRange] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [duration, setDuration] = useState("");
  const [diagnosticMarkers, setDiagnosticMarkers] = useState("");
  const [insights, setInsights] = useState("");
  const [caseTags, setCaseTags] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(true);

  // AI suggestions
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    if (user && isDoctor()) {
      fetchCases();
      fetchCollections();
    }
  }, [user, isDoctor]);

  const fetchCases = async () => {
    try {
      const { data, error } = await supabase
        .from('clinical_cases')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCases(data || []);
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollections = async () => {
    try {
      const { data, error } = await supabase
        .from('case_collections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCollections(data || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  const handleCreateCase = async () => {
    if (!user || !ageRange || !symptoms.trim()) return;

    try {
      const { error } = await supabase.from('clinical_cases').insert({
        doctor_id: user.id,
        age_range: ageRange,
        symptoms: symptoms.split(',').map(s => s.trim()),
        duration: duration,
        diagnostic_markers: diagnosticMarkers.split(',').map(s => s.trim()).filter(Boolean),
        insights: insights,
        tags: caseTags,
        is_private: isPrivate,
      });

      if (error) throw error;

      toast({ title: t.success, description: "Case created successfully" });
      setNewCaseOpen(false);
      resetForm();
      fetchCases();
    } catch (error) {
      console.error('Error creating case:', error);
      toast({ title: t.error, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setAgeRange("");
    setSymptoms("");
    setDuration("");
    setDiagnosticMarkers("");
    setInsights("");
    setCaseTags([]);
    setIsPrivate(true);
    setAiSuggestions([]);
  };

  const toggleTag = (tag: string) => {
    setCaseTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const getAiSuggestions = async () => {
    if (!symptoms.trim()) return;
    
    setLoadingAi(true);
    try {
      const { data, error } = await supabase.functions.invoke('medical-chat', {
        body: {
          message: `Based on these symptoms: ${symptoms}, suggest relevant medical tags and categories for clinical classification. Return only a comma-separated list of tags.`,
          language: 'en'
        }
      });

      if (error) throw error;
      
      // Parse AI response for tags
      const suggestedTags = data.content?.split(',').map((t: string) => t.trim().toLowerCase()) || [];
      setAiSuggestions(suggestedTags.slice(0, 5));
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
    } finally {
      setLoadingAi(false);
    }
  };

  const filteredCases = cases.filter(c =>
    c.symptoms.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
    c.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
    c.age_range.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Access control
  if (rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">{t.loading}</div>
      </div>
    );
  }

  if (!user || !isDoctor()) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold">{t.doctorWorkplace}</h1>
                <p className="text-muted-foreground">{t.clinicalCases}</p>
              </div>
            </div>

            <Dialog open={newCaseOpen} onOpenChange={setNewCaseOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  {t.newCase}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t.newCase}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t.ageRange}</Label>
                      <Select value={ageRange} onValueChange={setAgeRange}>
                        <SelectTrigger>
                          <SelectValue placeholder={t.ageRange} />
                        </SelectTrigger>
                        <SelectContent>
                          {AGE_RANGES.map(range => (
                            <SelectItem key={range} value={range}>{range}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{t.duration}</Label>
                      <Input
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        placeholder="e.g., 3 days, 2 weeks"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>{t.keySymptoms}</Label>
                    <Textarea
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      placeholder="Comma-separated symptoms"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label>{t.diagnosticMarkers}</Label>
                    <Textarea
                      value={diagnosticMarkers}
                      onChange={(e) => setDiagnosticMarkers(e.target.value)}
                      placeholder="Key diagnostic findings, test results"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label>{t.clinicalInsights}</Label>
                    <Textarea
                      value={insights}
                      onChange={(e) => setInsights(e.target.value)}
                      placeholder="Your professional observations and insights"
                      rows={3}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>{t.tags}</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={getAiSuggestions}
                        disabled={loadingAi || !symptoms.trim()}
                        className="gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        {t.aiSuggestions}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTED_TAGS.map(tag => (
                        <Badge
                          key={tag}
                          variant={caseTags.includes(tag) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleTag(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    {aiSuggestions.length > 0 && (
                      <div className="mt-2 p-3 bg-primary/5 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-2">AI Suggested:</p>
                        <div className="flex flex-wrap gap-2">
                          {aiSuggestions.map(tag => (
                            <Badge
                              key={tag}
                              variant={caseTags.includes(tag) ? "default" : "secondary"}
                              className="cursor-pointer"
                              onClick={() => toggleTag(tag)}
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={isPrivate}
                      onCheckedChange={setIsPrivate}
                    />
                    <Label className="flex items-center gap-1">
                      <Lock className="w-4 h-4" />
                      {t.privateCase}
                    </Label>
                  </div>

                  <Button onClick={handleCreateCase} className="w-full">
                    {t.save}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          <div className="relative max-w-md mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Collections Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" />
                  {t.myCollections}
                </h3>
                {collections.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t.noResults}</p>
                ) : (
                  <div className="space-y-2">
                    {collections.map(collection => (
                      <div
                        key={collection.id}
                        className="p-3 rounded-lg bg-muted hover:bg-muted/80 cursor-pointer"
                      >
                        <p className="font-medium text-sm">{collection.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {collection.case_ids.length} cases
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Cases Grid */}
            <div className="lg:col-span-3">
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">{t.loading}</div>
              ) : filteredCases.length === 0 ? (
                <div className="text-center py-12">
                  <Stethoscope className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{t.noResults}</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {filteredCases.map((c, index) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedCase(c)}
                      className="bg-card rounded-xl border border-border p-5 cursor-pointer hover:border-primary/50 transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline">{c.age_range}</Badge>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {c.is_private ? (
                            <Lock className="w-3 h-3" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                          <Clock className="w-3 h-3" />
                          {new Date(c.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="mb-3">
                        <p className="text-sm font-medium mb-1">{t.keySymptoms}:</p>
                        <div className="flex flex-wrap gap-1">
                          {c.symptoms.slice(0, 4).map((symptom, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {symptom}
                            </Badge>
                          ))}
                          {c.symptoms.length > 4 && (
                            <Badge variant="secondary" className="text-xs">
                              +{c.symptoms.length - 4}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {c.duration && (
                        <p className="text-xs text-muted-foreground mb-2">
                          {t.duration}: {c.duration}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-1 mt-3">
                        {c.tags.slice(0, 3).map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            <Tag className="w-2 h-2 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
