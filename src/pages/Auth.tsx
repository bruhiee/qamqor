import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, Mail, Lock, User, ArrowLeft, Stethoscope, UserCircle, Building, MapPin, Briefcase, FileText, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

type RegistrationStep = 'credentials' | 'role-selection' | 'doctor-form';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  
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
  
  const { signUp, signIn } = useAuth();
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

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp) {
      // Move to role selection for sign up
      setRegistrationStep('role-selection');
    } else {
      // Sign in directly
      setLoading(true);
      try {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            variant: 'destructive',
            title: t.error,
            description: error.message,
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
      const { error } = await signUp(email, password, displayName);
      if (error) {
        toast({
          variant: 'destructive',
          title: t.error,
          description: error.message,
        });
        setLoading(false);
        return;
      }

      // If doctor, submit application after signup
      if (role === 'doctor') {
        // Get the user's ID after signup
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { error: applicationError } = await supabase
            .from('doctor_applications')
            .insert({
              user_id: user.id,
              full_name: doctorForm.fullName || displayName,
              specialization: doctorForm.specialization,
              license_number: doctorForm.licenseNumber || null,
              bio: doctorForm.bio || null,
              country: doctorForm.country,
              region: doctorForm.region || null,
              years_of_experience: doctorForm.yearsOfExperience ? parseInt(doctorForm.yearsOfExperience) : null,
              workplace: doctorForm.workplace || null,
              status: 'pending',
            });

          if (applicationError) {
            console.error('Doctor application error:', applicationError);
            // Still show success for account creation
          }
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
            placeholder="••••••••"
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
        className="w-full max-w-md"
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
              Disease Detector
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
              {registrationStep === 'credentials' && renderCredentialsForm()}
              {registrationStep === 'role-selection' && renderRoleSelection()}
              {registrationStep === 'doctor-form' && renderDoctorForm()}
            </motion.div>
          </AnimatePresence>

          {registrationStep === 'credentials' && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setRegistrationStep('credentials');
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
