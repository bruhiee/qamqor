import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Pill,
  Plus,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  Calendar,
  FileText,
  MapPin,
  X,
  Package,
  Tag,
  Loader2
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface Medicine {
  id: string;
  name: string;
  purpose: string | null;
  dosage: string | null;
  quantity: number;
  form_type: string;
  tags: string[];
  expiration_date: string;
  notes: string | null;
}

const formTypes = [
  { value: "tablet", labelKey: "tablet" },
  { value: "capsule", labelKey: "capsule" },
  { value: "liquid", labelKey: "liquid" },
  { value: "injection", labelKey: "injection" },
  { value: "cream", labelKey: "cream" },
  { value: "drops", labelKey: "drops" },
  { value: "inhaler", labelKey: "inhaler" },
  { value: "patch", labelKey: "patch" },
] as const;

export default function MedicineCabinet() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    purpose: "",
    dosage: "",
    quantity: 1,
    form_type: "tablet",
    tags: "",
    expiration_date: "",
    notes: "",
  });

  useEffect(() => {
    if (user) {
      fetchMedicines();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchMedicines = async () => {
    try {
      const { data, error } = await supabase
        .from("medicines")
        .select("*")
        .order("expiration_date", { ascending: true });

      if (error) throw error;
      setMedicines(data || []);
    } catch (error) {
      console.error("Error fetching medicines:", error);
      toast({
        variant: "destructive",
        title: t.error,
        description: "Failed to load medicines",
      });
    } finally {
      setLoading(false);
    }
  };

  const isExpired = (date: string) => new Date(date) < new Date();
  const isExpiringSoon = (date: string) => {
    const expDate = new Date(date);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expDate <= thirtyDaysFromNow && expDate > new Date();
  };

  const filteredMedicines = medicines.filter(
    (med) =>
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.purpose?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const expiredMedicines = medicines.filter((med) => isExpired(med.expiration_date));
  const expiringSoonMedicines = medicines.filter((med) => isExpiringSoon(med.expiration_date));

  const handleSubmit = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: t.error,
        description: "Please sign in to add medicines",
      });
      return;
    }

    setSaving(true);
    try {
      const medicineData = {
        user_id: user.id,
        name: formData.name,
        purpose: formData.purpose || null,
        dosage: formData.dosage || null,
        quantity: formData.quantity,
        form_type: formData.form_type,
        tags: formData.tags ? formData.tags.split(",").map(t => t.trim()) : [],
        expiration_date: formData.expiration_date,
        notes: formData.notes || null,
      };

      if (editingMedicine) {
        const { error } = await supabase
          .from("medicines")
          .update(medicineData)
          .eq("id", editingMedicine.id);

        if (error) throw error;
        toast({ title: t.success, description: "Medicine updated" });
      } else {
        const { error } = await supabase
          .from("medicines")
          .insert(medicineData);

        if (error) throw error;
        toast({ title: t.success, description: "Medicine added" });
      }

      fetchMedicines();
      resetForm();
    } catch (error) {
      console.error("Error saving medicine:", error);
      toast({
        variant: "destructive",
        title: t.error,
        description: "Failed to save medicine",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("medicines")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setMedicines((prev) => prev.filter((med) => med.id !== id));
      toast({ title: t.success, description: "Medicine deleted" });
    } catch (error) {
      console.error("Error deleting medicine:", error);
      toast({
        variant: "destructive",
        title: t.error,
        description: "Failed to delete medicine",
      });
    }
  };

  const handleEdit = (medicine: Medicine) => {
    setEditingMedicine(medicine);
    setFormData({
      name: medicine.name,
      purpose: medicine.purpose || "",
      dosage: medicine.dosage || "",
      quantity: medicine.quantity,
      form_type: medicine.form_type,
      tags: medicine.tags.join(", "),
      expiration_date: medicine.expiration_date,
      notes: medicine.notes || "",
    });
    setIsAddDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      purpose: "",
      dosage: "",
      quantity: 1,
      form_type: "tablet",
      tags: "",
      expiration_date: "",
      notes: "",
    });
    setEditingMedicine(null);
    setIsAddDialogOpen(false);
  };

  const getFormTypeLabel = (value: string) => {
    const formType = formTypes.find(f => f.value === value);
    return formType ? t[formType.labelKey as keyof typeof t] : value;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 pt-24 pb-12">
          <div className="container mx-auto px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
              <Pill className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-2">{t.medicineCabinet}</h2>
            <p className="text-muted-foreground mb-4">
              {t.signIn} to manage your medicines
            </p>
            <Link to="/auth">
              <Button className="medical-gradient">{t.signIn}</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <Pill className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold">{t.medicineCabinet}</h1>
                <p className="text-muted-foreground">{t.notes}</p>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {(expiredMedicines.length > 0 || expiringSoonMedicines.length > 0) && (
            <div className="mb-6 space-y-3">
              {expiredMedicines.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-destructive/10 border border-destructive/30 rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-destructive mb-1">{t.expired}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {expiredMedicines.map((m) => m.name).join(", ")}
                      </p>
                      <Link to="/map">
                        <Button size="sm" variant="outline" className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10">
                          <MapPin className="w-4 h-4" />
                          {t.findPharmacy}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}

              {expiringSoonMedicines.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-warning/10 border border-warning/30 rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-warning mb-1">{t.expiringSoon}</h4>
                      <p className="text-sm text-muted-foreground">
                        {expiringSoonMedicines.map((m) => m.name).join(", ")}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Search and Add */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={`${t.search}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="medical-gradient shadow-medical gap-2">
                  <Plus className="w-4 h-4" />
                  {t.addMedicine}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-display">
                    {editingMedicine ? t.edit : t.addMedicine}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="name">{t.medicineName} *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Ibuprofen 400mg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quantity">{t.quantity}</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min={1}
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="form_type">{t.formType}</Label>
                      <Select
                        value={formData.form_type}
                        onValueChange={(value) => setFormData({ ...formData, form_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {formTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {t[type.labelKey as keyof typeof t]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="purpose">{t.purpose}</Label>
                    <Input
                      id="purpose"
                      value={formData.purpose}
                      onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                      placeholder="e.g., Pain relief, headache, fever"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dosage">{t.dosage}</Label>
                    <Input
                      id="dosage"
                      value={formData.dosage}
                      onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                      placeholder="e.g., 1 tablet every 6 hours"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tags">{t.tags}</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="headache, pain, fever (comma separated)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="expiration">{t.expirationDate} *</Label>
                    <Input
                      id="expiration"
                      type="date"
                      value={formData.expiration_date}
                      onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">{t.notes}</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Additional notes..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={resetForm} className="flex-1">
                      {t.cancel}
                    </Button>
                    <Button 
                      onClick={handleSubmit} 
                      className="flex-1 medical-gradient"
                      disabled={!formData.name || !formData.expiration_date || saving}
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingMedicine ? t.save : t.add)}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* Medicine Grid */}
          {!loading && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredMedicines.map((medicine) => {
                  const expired = isExpired(medicine.expiration_date);
                  const expiringSoon = isExpiringSoon(medicine.expiration_date);

                  return (
                    <motion.div
                      key={medicine.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`bg-card rounded-xl border p-5 transition-all hover:shadow-medical ${
                        expired
                          ? "border-destructive/50 bg-destructive/5"
                          : expiringSoon
                          ? "border-warning/50 bg-warning/5"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            expired 
                              ? "bg-destructive/20" 
                              : expiringSoon 
                              ? "bg-warning/20" 
                              : "bg-accent/20"
                          }`}>
                            <Pill className={`w-5 h-5 ${
                              expired 
                                ? "text-destructive" 
                                : expiringSoon 
                                ? "text-warning" 
                                : "text-accent"
                            }`} />
                          </div>
                          <div>
                            <h3 className="font-display font-semibold">{medicine.name}</h3>
                            {expired && (
                              <span className="text-xs text-destructive font-medium">{t.expired.toUpperCase()}</span>
                            )}
                            {expiringSoon && (
                              <span className="text-xs text-warning font-medium">{t.expiringSoon.toUpperCase()}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8"
                            onClick={() => handleEdit(medicine)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(medicine.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {medicine.quantity}x {getFormTypeLabel(medicine.form_type)}
                          </span>
                        </div>
                        {medicine.purpose && (
                          <div className="flex items-start gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                            <span className="text-muted-foreground">{medicine.purpose}</span>
                          </div>
                        )}
                        {medicine.dosage && (
                          <div className="flex items-start gap-2">
                            <Pill className="w-4 h-4 text-muted-foreground mt-0.5" />
                            <span className="text-muted-foreground">{medicine.dosage}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className={`${
                            expired 
                              ? "text-destructive" 
                              : expiringSoon 
                              ? "text-warning" 
                              : "text-muted-foreground"
                          }`}>
                            {new Date(medicine.expiration_date).toLocaleDateString()}
                          </span>
                        </div>
                        {medicine.tags.length > 0 && (
                          <div className="flex items-start gap-2">
                            <Tag className="w-4 h-4 text-muted-foreground mt-0.5" />
                            <div className="flex flex-wrap gap-1">
                              {medicine.tags.map((tag, i) => (
                                <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {medicine.notes && (
                          <p className="text-xs text-muted-foreground bg-muted rounded-lg p-2 mt-2">
                            {medicine.notes}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {!loading && filteredMedicines.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
                <Pill className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">No medicines found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Start by adding your first medicine"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  {t.addMedicine}
                </Button>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
