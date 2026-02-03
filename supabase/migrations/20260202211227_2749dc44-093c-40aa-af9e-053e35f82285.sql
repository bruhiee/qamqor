-- Create doctor_applications table for storing pending doctor verification requests
CREATE TABLE public.doctor_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  license_number TEXT,
  license_document_url TEXT,
  bio TEXT,
  country TEXT NOT NULL,
  region TEXT,
  years_of_experience INTEGER,
  workplace TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.doctor_applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own application
CREATE POLICY "Users can view their own application"
ON public.doctor_applications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own application
CREATE POLICY "Users can create their own application"
ON public.doctor_applications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending application
CREATE POLICY "Users can update their own pending application"
ON public.doctor_applications
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

-- Admins can view all applications
CREATE POLICY "Admins can view all applications"
ON public.doctor_applications
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can update applications
CREATE POLICY "Admins can manage applications"
ON public.doctor_applications
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_doctor_applications_updated_at
BEFORE UPDATE ON public.doctor_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();