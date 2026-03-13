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
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  blood_type: string | null;
  allergies: string[];
  chronic_conditions: string[];
  medications: string[];
  notes: string | null;
};

export default function Profile() {
  const { user, requestTwoFactorEnable, confirmTwoFactorEnable, disableTwoFactor } = useAuth();
  const [profile, setProfile] = useState<ProfilePayload>({
    emergency_contact_name: "",
    emergency_contact_phone: "",
    blood_type: "",
    allergies: [],
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

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await apiFetch<{ data: ProfilePayload }>("/profile");
        if (!data) return;
        setProfile({
          emergency_contact_name: data.emergency_contact_name || "",
          emergency_contact_phone: data.emergency_contact_phone || "",
          blood_type: data.blood_type || "",
          allergies: data.allergies || [],
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
              <Label>Chronic Conditions (comma separated)</Label>
              <Input value={conditionsRaw} onChange={(e) => setConditionsRaw(e.target.value)} />
            </div>
            <div>
              <Label>Current Medications (comma separated)</Label>
              <Input value={medicationsRaw} onChange={(e) => setMedicationsRaw(e.target.value)} />
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
