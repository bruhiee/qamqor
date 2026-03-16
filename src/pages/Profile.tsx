import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/contexts/useAuth";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type ProfilePayload = {
  age: number | null;
  gender: string | null;
  city: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  additional_info: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  blood_type: string | null;
  allergies: string[];
  lifestyle_factors: string[];
  chronic_conditions: string[];
  medications: string[];
  notes: string | null;
};

export default function Profile() {
  const { user, requestTwoFactorEnable, confirmTwoFactorEnable, disableTwoFactor } = useAuth();
  const [profile, setProfile] = useState<ProfilePayload>({
    age: null,
    gender: "",
    city: "",
    height_cm: null,
    weight_kg: null,
    additional_info: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    blood_type: "",
    allergies: [],
    lifestyle_factors: [],
    chronic_conditions: [],
    medications: [],
    notes: "",
  });
  const [allergiesRaw, setAllergiesRaw] = useState("");
  const [conditionsRaw, setConditionsRaw] = useState("");
  const [medicationsRaw, setMedicationsRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [twoFactorChallengeId, setTwoFactorChallengeId] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const lifestyleOptions = [
    "Smoking",
    "Alcohol",
    "Low activity",
    "High stress",
    "Poor sleep",
    "Night shifts",
  ];

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await apiFetch<{ data: ProfilePayload }>("/profile");
        if (!data) return;
        setProfile({
          age: data.age ?? null,
          gender: data.gender || "",
          city: data.city || "",
          height_cm: data.height_cm ?? null,
          weight_kg: data.weight_kg ?? null,
          additional_info: data.additional_info || "",
          emergency_contact_name: data.emergency_contact_name || "",
          emergency_contact_phone: data.emergency_contact_phone || "",
          blood_type: data.blood_type || "",
          allergies: data.allergies || [],
          lifestyle_factors: data.lifestyle_factors || [],
          chronic_conditions: data.chronic_conditions || [],
          medications: data.medications || [],
          notes: data.notes || "",
        });
        setAllergiesRaw((data.allergies || []).join(", "));
        setConditionsRaw((data.chronic_conditions || []).join(", "));
        setMedicationsRaw((data.medications || []).join(", "));
      } catch (error) {
        console.error(error);
      }
    };
    load();
  }, []);

  const saveProfile = async () => {
    setLoading(true);
    try {
      await apiFetch("/profile", {
        method: "PUT",
        body: {
          ...profile,
          age: profile.age ? Number(profile.age) : null,
          height_cm: profile.height_cm ? Number(profile.height_cm) : null,
          weight_kg: profile.weight_kg ? Number(profile.weight_kg) : null,
          allergies: allergiesRaw.split(",").map((item) => item.trim()).filter(Boolean),
          chronic_conditions: conditionsRaw.split(",").map((item) => item.trim()).filter(Boolean),
          medications: medicationsRaw.split(",").map((item) => item.trim()).filter(Boolean),
        },
      });
      toast.success("Profile saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const startEnableTwoFactor = async () => {
    const result = await requestTwoFactorEnable();
    if (result.error || !result.challengeId) {
      toast.error(result.error || "Failed to request code");
      return;
    }
    setTwoFactorChallengeId(result.challengeId);
    setDebugCode(result.debugCode || null);
    toast.success("2FA code sent");
  };

  const completeEnableTwoFactor = async () => {
    if (!twoFactorChallengeId || !twoFactorCode.trim()) return;
    const result = await confirmTwoFactorEnable(twoFactorChallengeId, twoFactorCode.trim());
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setTwoFactorChallengeId(null);
    setTwoFactorCode("");
    setDebugCode(null);
    toast.success("2FA enabled");
  };

  const handleDisableTwoFactor = async () => {
    const result = await disableTwoFactor();
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("2FA disabled");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-3xl space-y-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <h1 className="text-2xl font-display font-bold mb-2">Profile</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <h2 className="font-semibold">Medical Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Age</Label>
                <Input type="number" min={0} max={120} value={profile.age ?? ""} onChange={(e) => setProfile((prev) => ({ ...prev, age: e.target.value ? Number(e.target.value) : null }))} />
              </div>
              <div>
                <Label>Gender</Label>
                <Input value={profile.gender || ""} onChange={(e) => setProfile((prev) => ({ ...prev, gender: e.target.value }))} />
              </div>
              <div>
                <Label>City</Label>
                <Input value={profile.city || ""} onChange={(e) => setProfile((prev) => ({ ...prev, city: e.target.value }))} />
              </div>
              <div>
                <Label>Height (cm)</Label>
                <Input type="number" min={30} max={260} value={profile.height_cm ?? ""} onChange={(e) => setProfile((prev) => ({ ...prev, height_cm: e.target.value ? Number(e.target.value) : null }))} />
              </div>
              <div>
                <Label>Weight (kg)</Label>
                <Input type="number" min={1} max={500} value={profile.weight_kg ?? ""} onChange={(e) => setProfile((prev) => ({ ...prev, weight_kg: e.target.value ? Number(e.target.value) : null }))} />
              </div>
              <div>
                <Label>Emergency Contact Name</Label>
                <Input value={profile.emergency_contact_name || ""} onChange={(e) => setProfile((prev) => ({ ...prev, emergency_contact_name: e.target.value }))} />
              </div>
              <div>
                <Label>Emergency Contact Phone</Label>
                <Input value={profile.emergency_contact_phone || ""} onChange={(e) => setProfile((prev) => ({ ...prev, emergency_contact_phone: e.target.value }))} />
              </div>
              <div>
                <Label>Blood Type</Label>
                <Input value={profile.blood_type || ""} onChange={(e) => setProfile((prev) => ({ ...prev, blood_type: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Allergies (comma separated)</Label>
              <Input value={allergiesRaw} onChange={(e) => setAllergiesRaw(e.target.value)} />
            </div>
            <div>
              <Label>Lifestyle Factors</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {lifestyleOptions.map((option) => {
                  const active = (profile.lifestyle_factors || []).includes(option);
                  return (
                    <Button
                      key={option}
                      type="button"
                      size="sm"
                      variant={active ? "default" : "outline"}
                      onClick={() =>
                        setProfile((prev) => ({
                          ...prev,
                          lifestyle_factors: active
                            ? (prev.lifestyle_factors || []).filter((item) => item !== option)
                            : [...(prev.lifestyle_factors || []), option],
                        }))
                      }
                      className="rounded-full"
                    >
                      {option}
                    </Button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label>Chronic Conditions (comma separated)</Label>
              <Input value={conditionsRaw} onChange={(e) => setConditionsRaw(e.target.value)} />
            </div>
            <div>
              <Label>Current Medications (comma separated)</Label>
              <Input value={medicationsRaw} onChange={(e) => setMedicationsRaw(e.target.value)} />
            </div>
            <div>
              <Label>Additional Information (optional)</Label>
              <Textarea value={profile.additional_info || ""} onChange={(e) => setProfile((prev) => ({ ...prev, additional_info: e.target.value }))} rows={3} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={profile.notes || ""} onChange={(e) => setProfile((prev) => ({ ...prev, notes: e.target.value }))} rows={4} />
            </div>
            <Button onClick={saveProfile} disabled={loading}>{loading ? "Saving..." : "Save Profile"}</Button>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <h2 className="font-semibold">Two-Factor Authentication</h2>
            {user?.two_factor_enabled ? (
              <Button variant="destructive" onClick={handleDisableTwoFactor}>Disable 2FA</Button>
            ) : (
              <div className="space-y-3">
                {!twoFactorChallengeId ? (
                  <Button onClick={startEnableTwoFactor}>Enable 2FA</Button>
                ) : (
                  <div className="space-y-2">
                    <Label>Enter code from email</Label>
                    <Input value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value)} maxLength={6} />
                    {debugCode && <p className="text-xs text-warning">Debug code: {debugCode}</p>}
                    <Button onClick={completeEnableTwoFactor}>Confirm Enable</Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
