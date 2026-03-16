import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, Mail, Lock, User, ArrowLeft, Stethoscope, UserCircle, Building, MapPin, Briefcase, FileText, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/useAuth';
import { useLanguage } from '@/contexts/useLanguage';
import { useToast } from '@/hooks/use-toast';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { Link } from 'react-router-dom';
import { apiFetch } from "@/lib/api";

type RegistrationStep = 'credentials' | 'role-selection' | 'doctor-form';

export default function Auth() {
  type RegistrationProfileForm = {
    age: string;
    gender: string;
    city: string;
    height_cm: string;
    weight_kg: string;
    additional_info: string;
    allergiesRaw: string;
    lifestyle_factors: string[];
  };

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingChallengeId, setPendingChallengeId] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [debugTwoFactorCode, setDebugTwoFactorCode] = useState<string | null>(null);
  
  // Registration flow
  const [registrationStep, setRegistrationStep] = useState<RegistrationStep>('credentials');
  const [selectedRole, setSelectedRole] = useState<'user' | 'doctor'>('user');
  
  // Doctor application fields
  const [doctorForm, setDoctorForm] = useState({
    fullName: '',
    specialization: '',
    licenseNumber: '',
    bio: '',
    country: '',
    region: '',
    yearsOfExperience: '',
    workplace: '',
  });
  const [registrationProfile, setRegistrationProfile] = useState<RegistrationProfileForm>({
    age: "",
    gender: "",
    city: "",
    height_cm: "",
    weight_kg: "",
    additional_info: "",
    allergiesRaw: "",
    lifestyle_factors: [],
  });
  
  const { signUp, signIn, verifyTwoFactor, resendTwoFactorLoginCode } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  const specializations = [
    { value: 'general', label: t.generalPractitioner },
    { value: 'cardiologist', label: t.cardiologist },
    { value: 'dermatologist', label: t.dermatologist },
    { value: 'pediatrician', label: t.pediatrician },
    { value: 'neurologist', label: t.neurologist },
    { value: 'psychiatrist', label: t.psychiatrist },
    { value: 'surgeon', label: t.surgeon },
    { value: 'gynecologist', label: t.gynecologist },
    { value: 'urologist', label: t.urologist },
    { value: 'endocrinologist', label: t.endocrinologist },
    { value: 'ophthalmologist', label: t.ophthalmologist },
    { value: 'other', label: t.otherSpecialty },
  ];
  const lifestyleOptions = [
    "Smoking",
    "Alcohol",
    "Low activity",
    "High stress",
    "Poor sleep",
    "Night shifts",
  ];

  const toggleLifestyle = (value: string) => {
    setRegistrationProfile((prev) => ({
      ...prev,
      lifestyle_factors: prev.lifestyle_factors.includes(value)
        ? prev.lifestyle_factors.filter((item) => item !== value)
        : [...prev.lifestyle_factors, value],
    }));
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp) {
      // Move to role selection for sign up
      setRegistrationStep('role-selection');
    } else {
      // Sign in directly
      setLoading(true);
      try {
        const { error, twoFactorRequired, challengeId, debugCode } = await signIn(email, password);
        if (error) {
          toast({
            variant: 'destructive',
            title: t.error,
            description: error,
          });
        } else if (twoFactorRequired && challengeId) {
          setPendingChallengeId(challengeId);
          setDebugTwoFactorCode(debugCode || null);
          toast({
            title: 'Two-Factor Authentication',
            description: 'Enter the verification code sent to your email.',
          });
        } else {
          navigate('/');
        }
      } catch {
        toast({
          variant: 'destructive',
          title: t.error,
          description: t.errorOccurred,
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVerifyTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingChallengeId || !twoFactorCode.trim()) return;
    setLoading(true);
    try {
      const { error } = await verifyTwoFactor(pendingChallengeId, twoFactorCode.trim());
      if (error) {
        toast({
          variant: 'destructive',
          title: t.error,
          description: error,
        });
        return;
      }
      setPendingChallengeId(null);
      setTwoFactorCode('');
      setDebugTwoFactorCode(null);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleResendTwoFactor = async () => {
    if (!pendingChallengeId) return;
    setLoading(true);
    try {
      const { error, debugCode } = await resendTwoFactorLoginCode(pendingChallengeId);
      if (error) {
        toast({
          variant: 'destructive',
          title: t.error,
          description: error,
        });
        return;
      }
      setDebugTwoFactorCode(debugCode || null);
      toast({
        title: 'Code resent',
        description: 'A new verification code has been sent.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelection = (role: 'user' | 'doctor') => {
    setSelectedRole(role);
    if (role === 'doctor') {
      setRegistrationStep('doctor-form');
    } else {
      // Complete user registration
      completeRegistration('user');
    }
  };

  const completeRegistration = async (role: 'user' | 'doctor') => {
    setLoading(true);
    try {
      const { error } = await signUp(email, password, displayName, role, {
        age: registrationProfile.age ? Number(registrationProfile.age) : null,
        gender: registrationProfile.gender || null,
        city: registrationProfile.city || null,
        height_cm: registrationProfile.height_cm ? Number(registrationProfile.height_cm) : null,
        weight_kg: registrationProfile.weight_kg ? Number(registrationProfile.weight_kg) : null,
        additional_info: registrationProfile.additional_info || null,
        allergies: registrationProfile.allergiesRaw
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        lifestyle_factors: registrationProfile.lifestyle_factors,
      });
      if (error) {
        toast({
          variant: "destructive",
          title: t.error,
          description: error,
        });
        setLoading(false);
        return;
      }

      // If doctor, submit application after signup
      if (role === 'doctor') {
        try {
          await apiFetch("/doctor-applications", {
            method: "POST",
            body: {
              fullName: doctorForm.fullName || displayName,
              specialization: doctorForm.specialization,
              licenseNumber: doctorForm.licenseNumber || null,
              bio: doctorForm.bio || null,
              country: doctorForm.country,
              region: doctorForm.region || null,
              yearsOfExperience: doctorForm.yearsOfExperience
                ? parseInt(doctorForm.yearsOfExperience, 10)
                : null,
              workplace: doctorForm.workplace || null,
            },
          });
        } catch (applicationError) {
          console.error("Doctor application error:", applicationError);
          toast({
            variant: "destructive",
            title: t.error,
            description: (applicationError as Error).message || t.errorOccurred,
          });
        }

        toast({
          title: t.success,
          description: t.applicationSubmitted + ' ' + t.checkEmailVerification,
        });
      } else {
        toast({
          title: t.success,
          description: t.checkEmailVerification,
        });
      }

      // Reset form
      setRegistrationStep('credentials');
      setSelectedRole('user');
      setIsSignUp(false);
      setRegistrationProfile({
        age: "",
        gender: "",
        city: "",
        height_cm: "",
        weight_kg: "",
        additional_info: "",
        allergiesRaw: "",
        lifestyle_factors: [],
      });
    } catch {
      toast({
        variant: 'destructive',
        title: t.error,
        description: t.errorOccurred,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    completeRegistration('doctor');
  };

  const renderCredentialsForm = () => (
    <form onSubmit={handleCredentialsSubmit} className="space-y-4">
      {isSignUp && (
        <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
          <div>
            <Label htmlFor="displayName">{t.displayName}</Label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="pl-10"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                min="0"
                max="120"
                value={registrationProfile.age}
                onChange={(e) => setRegistrationProfile((prev) => ({ ...prev, age: e.target.value }))}
                placeholder="25"
              />
            </div>
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={registrationProfile.gender}
                onValueChange={(value) => setRegistrationProfile((prev) => ({ ...prev, gender: value }))}
              >
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                type="text"
                value={registrationProfile.city}
                onChange={(e) => setRegistrationProfile((prev) => ({ ...prev, city: e.target.value }))}
                placeholder="Almaty"
              />
            </div>
            <div>
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                min="30"
                max="260"
                value={registrationProfile.height_cm}
                onChange={(e) => setRegistrationProfile((prev) => ({ ...prev, height_cm: e.target.value }))}
                placeholder="172"
              />
            </div>
            <div>
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                min="1"
                max="500"
                value={registrationProfile.weight_kg}
                onChange={(e) => setRegistrationProfile((prev) => ({ ...prev, weight_kg: e.target.value }))}
                placeholder="68"
              />
            </div>
            <div>
              <Label htmlFor="allergies">Allergies (comma separated)</Label>
              <Input
                id="allergies"
                type="text"
                value={registrationProfile.allergiesRaw}
                onChange={(e) => setRegistrationProfile((prev) => ({ ...prev, allergiesRaw: e.target.value }))}
                placeholder="Pollen, Penicillin"
              />
            </div>
          </div>

          <div>
            <Label>Lifestyle factors</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {lifestyleOptions.map((option) => {
                const active = registrationProfile.lifestyle_factors.includes(option);
                return (
                  <Button
                    key={option}
                    type="button"
                    size="sm"
                    variant={active ? "default" : "outline"}
                    onClick={() => toggleLifestyle(option)}
                    className="rounded-full"
                  >
                    {option}
                  </Button>
                );
              })}
            </div>
          </div>

          <div>
            <Label htmlFor="additionalInfo">Additional Information (optional)</Label>
            <Textarea
              id="additionalInfo"
              value={registrationProfile.additional_info}
              onChange={(e) => setRegistrationProfile((prev) => ({ ...prev, additional_info: e.target.value }))}
              className="min-h-[80px]"
              placeholder="Anything important about your health history"
            />
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="email">{t.email}</Label>
        <div className="relative mt-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            placeholder="you@example.com"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="password">{t.password}</Label>
        <div className="relative mt-1">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10"
            placeholder="********"
            required
            minLength={6}
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full medical-gradient"
        disabled={loading}
      >
        {loading ? t.loading : isSignUp ? t.next : t.signIn}
        {isSignUp && <ChevronRight className="w-4 h-4 ml-2" />}
      </Button>
    </form>
  );

  const renderTwoFactorForm = () => (
    <form onSubmit={handleVerifyTwoFactor} className="space-y-4">
      <div>
        <Label htmlFor="twoFactorCode">2FA Code</Label>
        <Input
          id="twoFactorCode"
          type="text"
          value={twoFactorCode}
          onChange={(e) => setTwoFactorCode(e.target.value)}
          placeholder="6-digit code"
          maxLength={6}
          required
        />
        {debugTwoFactorCode && (
          <p className="text-xs text-warning mt-2">Debug code: {debugTwoFactorCode}</p>
        )}
      </div>
      <Button type="submit" className="w-full medical-gradient" disabled={loading}>
        {loading ? t.loading : 'Verify'}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleResendTwoFactor}
        disabled={loading}
      >
        Resend code
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="w-full"
        onClick={() => {
          setPendingChallengeId(null);
          setTwoFactorCode('');
          setDebugTwoFactorCode(null);
        }}
      >
        Back to Sign In
      </Button>
    </form>
  );

  const renderRoleSelection = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center mb-4">{t.selectAccountType}</h3>
      
      <button
        onClick={() => handleRoleSelection('user')}
        className="w-full p-4 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 text-left group"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <UserCircle className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold mb-1">{t.registerAsUser}</h4>
            <p className="text-sm text-muted-foreground">{t.userAccountDesc}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors mt-1" />
        </div>
      </button>

      <button
        onClick={() => handleRoleSelection('doctor')}
        className="w-full p-4 rounded-xl border-2 border-border hover:border-secondary/50 hover:bg-secondary/5 transition-all duration-200 text-left group"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
            <Stethoscope className="w-6 h-6 text-secondary" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold mb-1">{t.registerAsDoctor}</h4>
            <p className="text-sm text-muted-foreground">{t.doctorAccountDesc}</p>
            <p className="text-xs text-warning mt-1">{t.doctorVerificationRequired}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-secondary transition-colors mt-1" />
        </div>
      </button>

      <Button
        variant="ghost"
        onClick={() => setRegistrationStep('credentials')}
        className="w-full mt-4"
      >
        <ChevronLeft className="w-4 h-4 mr-2" />
        {t.back}
      </Button>
    </div>
  );

  const renderDoctorForm = () => (
    <form onSubmit={handleDoctorFormSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-center mb-4">{t.doctorApplication}</h3>
      
      <div>
        <Label htmlFor="fullName">{t.fullName} *</Label>
        <div className="relative mt-1">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="fullName"
            type="text"
            value={doctorForm.fullName}
            onChange={(e) => setDoctorForm({ ...doctorForm, fullName: e.target.value })}
            className="pl-10"
            placeholder={t.fullName}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="specialization">{t.specialization} *</Label>
        <Select
          value={doctorForm.specialization}
          onValueChange={(value) => setDoctorForm({ ...doctorForm, specialization: value })}
          required
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder={t.specialization} />
          </SelectTrigger>
          <SelectContent>
            {specializations.map((spec) => (
              <SelectItem key={spec.value} value={spec.value}>
                {spec.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="country">{t.country} *</Label>
          <div className="relative mt-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="country"
              type="text"
              value={doctorForm.country}
              onChange={(e) => setDoctorForm({ ...doctorForm, country: e.target.value })}
              className="pl-10"
              placeholder={t.country}
              required
            />
          </div>
        </div>
        <div>
          <Label htmlFor="region">{t.region}</Label>
          <Input
            id="region"
            type="text"
            value={doctorForm.region}
            onChange={(e) => setDoctorForm({ ...doctorForm, region: e.target.value })}
            className="mt-1"
            placeholder={t.region}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="licenseNumber">{t.licenseNumber}</Label>
          <div className="relative mt-1">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="licenseNumber"
              type="text"
              value={doctorForm.licenseNumber}
              onChange={(e) => setDoctorForm({ ...doctorForm, licenseNumber: e.target.value })}
              className="pl-10"
              placeholder="XX-123456"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="yearsOfExperience">{t.yearsOfExperience}</Label>
          <div className="relative mt-1">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="yearsOfExperience"
              type="number"
              min="0"
              max="60"
              value={doctorForm.yearsOfExperience}
              onChange={(e) => setDoctorForm({ ...doctorForm, yearsOfExperience: e.target.value })}
              className="pl-10"
              placeholder="5"
            />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="workplace">{t.workplace}</Label>
        <div className="relative mt-1">
          <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="workplace"
            type="text"
            value={doctorForm.workplace}
            onChange={(e) => setDoctorForm({ ...doctorForm, workplace: e.target.value })}
            className="pl-10"
            placeholder={t.workplace}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="bio">{t.professionalBio}</Label>
        <Textarea
          id="bio"
          value={doctorForm.bio}
          onChange={(e) => setDoctorForm({ ...doctorForm, bio: e.target.value })}
          className="mt-1 min-h-[80px]"
          placeholder={t.professionalBio}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setRegistrationStep('role-selection')}
          className="flex-1"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          {t.back}
        </Button>
        <Button
          type="submit"
          className="flex-1 medical-gradient"
          disabled={loading || !doctorForm.fullName || !doctorForm.specialization || !doctorForm.country}
        >
          {loading ? t.loading : t.submit}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-4 left-4">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            {t.home}
          </Button>
        </Link>
      </div>
      
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full ${isSignUp ? "max-w-2xl" : "max-w-md"}`}
      >
        <div className="bg-card rounded-2xl border border-border p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl medical-gradient flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold">
              {registrationStep === 'doctor-form' 
                ? t.doctorApplication 
                : isSignUp 
                  ? t.signUp 
                  : t.signIn}
            </h1>
            <p className="text-muted-foreground text-sm mt-2">
              Qamqor
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={registrationStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {registrationStep === 'credentials' && !pendingChallengeId && renderCredentialsForm()}
              {registrationStep === 'credentials' && pendingChallengeId && renderTwoFactorForm()}
              {registrationStep === 'role-selection' && renderRoleSelection()}
              {registrationStep === 'doctor-form' && renderDoctorForm()}
            </motion.div>
          </AnimatePresence>

          {registrationStep === 'credentials' && !pendingChallengeId && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setRegistrationStep('credentials');
                  setPendingChallengeId(null);
                }}
                className="text-sm text-primary hover:underline"
              >
                {isSignUp ? t.alreadyHaveAccount : t.dontHaveAccount}
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4 px-4">
          {t.disclaimerText}
        </p>
      </motion.div>
    </div>
  );
}



