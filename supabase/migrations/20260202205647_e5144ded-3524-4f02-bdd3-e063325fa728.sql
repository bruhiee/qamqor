-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('user', 'doctor', 'admin');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's roles
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS app_role[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(role), ARRAY[]::app_role[])
  FROM public.user_roles
  WHERE user_id = _user_id
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Forum posts table
CREATE TABLE public.forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_urgent BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'answered', 'closed', 'flagged')),
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

-- Forum replies table
CREATE TABLE public.forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  is_doctor_reply BOOLEAN DEFAULT false,
  is_ai_moderated BOOLEAN DEFAULT false,
  moderation_flags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;

-- Clinical cases table (doctor workplace)
CREATE TABLE public.clinical_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  age_range TEXT NOT NULL,
  symptoms TEXT[] NOT NULL DEFAULT '{}',
  duration TEXT,
  diagnostic_markers TEXT[],
  insights TEXT,
  tags TEXT[] DEFAULT '{}',
  is_private BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.clinical_cases ENABLE ROW LEVEL SECURITY;

-- Doctor case collections
CREATE TABLE public.case_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  case_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.case_collections ENABLE ROW LEVEL SECURITY;

-- Health articles table
CREATE TABLE public.health_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title_en TEXT NOT NULL,
  title_ru TEXT,
  title_kk TEXT,
  content_en TEXT NOT NULL,
  content_ru TEXT,
  content_kk TEXT,
  summary_en TEXT,
  summary_ru TEXT,
  summary_kk TEXT,
  tags TEXT[] DEFAULT '{}',
  category TEXT,
  is_published BOOLEAN DEFAULT false,
  is_ai_generated BOOLEAN DEFAULT false,
  needs_review BOOLEAN DEFAULT true,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.health_articles ENABLE ROW LEVEL SECURITY;

-- Anonymized analytics table (k-anonymity compliant)
CREATE TABLE public.anonymized_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('medicine_added', 'medicine_searched', 'symptom_logged', 'article_viewed')),
  category TEXT,
  region TEXT,
  rounded_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.anonymized_analytics ENABLE ROW LEVEL SECURITY;

-- User privacy settings
CREATE TABLE public.privacy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  analytics_opt_in BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;

-- Admin action logs
CREATE TABLE public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Forum posts: everyone can read, authors can manage their own
CREATE POLICY "Anyone can view forum posts"
ON public.forum_posts FOR SELECT TO authenticated
USING (status != 'flagged' OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create posts"
ON public.forum_posts FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
ON public.forum_posts FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their own posts"
ON public.forum_posts FOR DELETE TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Forum replies
CREATE POLICY "Anyone can view replies"
ON public.forum_replies FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can create replies"
ON public.forum_replies FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own replies"
ON public.forum_replies FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their own replies"
ON public.forum_replies FOR DELETE TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Clinical cases: doctors only
CREATE POLICY "Doctors can view their own cases"
ON public.clinical_cases FOR SELECT TO authenticated
USING (doctor_id = auth.uid() OR (NOT is_private AND public.has_role(auth.uid(), 'doctor')));

CREATE POLICY "Doctors can create cases"
ON public.clinical_cases FOR INSERT TO authenticated
WITH CHECK (auth.uid() = doctor_id AND public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Doctors can update their cases"
ON public.clinical_cases FOR UPDATE TO authenticated
USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can delete their cases"
ON public.clinical_cases FOR DELETE TO authenticated
USING (auth.uid() = doctor_id);

-- Case collections
CREATE POLICY "Doctors can manage their collections"
ON public.case_collections FOR ALL TO authenticated
USING (auth.uid() = doctor_id);

-- Health articles
CREATE POLICY "Anyone can view published articles"
ON public.health_articles FOR SELECT
USING (is_published = true OR author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Doctors and admins can create articles"
ON public.health_articles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authors can update their articles"
ON public.health_articles FOR UPDATE TO authenticated
USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authors and admins can delete articles"
ON public.health_articles FOR DELETE TO authenticated
USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Privacy settings
CREATE POLICY "Users can manage their privacy settings"
ON public.privacy_settings FOR ALL TO authenticated
USING (auth.uid() = user_id);

-- Anonymized analytics: only admins can view
CREATE POLICY "Admins can view analytics"
ON public.anonymized_analytics FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert analytics"
ON public.anonymized_analytics FOR INSERT TO authenticated
WITH CHECK (true);

-- Admin logs: only admins can view
CREATE POLICY "Admins can view logs"
ON public.admin_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create logs"
ON public.admin_logs FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_forum_posts_updated_at
BEFORE UPDATE ON public.forum_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_forum_replies_updated_at
BEFORE UPDATE ON public.forum_replies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clinical_cases_updated_at
BEFORE UPDATE ON public.clinical_cases
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_case_collections_updated_at
BEFORE UPDATE ON public.case_collections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_health_articles_updated_at
BEFORE UPDATE ON public.health_articles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_privacy_settings_updated_at
BEFORE UPDATE ON public.privacy_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-assign default user role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  INSERT INTO public.privacy_settings (user_id, analytics_opt_in)
  VALUES (NEW.id, false);
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-assign role on user creation
CREATE TRIGGER on_auth_user_created_role
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();