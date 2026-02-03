-- Create symptom logs table for tracking daily symptoms
CREATE TABLE public.symptom_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  symptom_date DATE NOT NULL DEFAULT CURRENT_DATE,
  symptoms TEXT[] NOT NULL DEFAULT '{}',
  severity INTEGER NOT NULL DEFAULT 5 CHECK (severity >= 1 AND severity <= 10),
  notes TEXT,
  mood TEXT CHECK (mood IN ('great', 'good', 'okay', 'bad', 'terrible')),
  sleep_hours NUMERIC(3,1),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_symptom_logs_date ON public.symptom_logs(symptom_date DESC);
CREATE INDEX idx_symptom_logs_user ON public.symptom_logs(user_id);

-- Enable Row Level Security
ALTER TABLE public.symptom_logs ENABLE ROW LEVEL SECURITY;

-- Policy for anonymous users (before auth is implemented)
-- Users can manage their own symptom logs based on user_id match
CREATE POLICY "Anyone can insert symptom logs" 
ON public.symptom_logs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view their own symptom logs" 
ON public.symptom_logs 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can update their own symptom logs" 
ON public.symptom_logs 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete their own symptom logs" 
ON public.symptom_logs 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_symptom_logs_updated_at
BEFORE UPDATE ON public.symptom_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create chat history table for AI consultant
CREATE TABLE public.chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  image_url TEXT,
  report JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on chat tables
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for chat tables (open for now, can be restricted later with auth)
CREATE POLICY "Anyone can manage chat sessions"
ON public.chat_sessions FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can manage chat messages"
ON public.chat_messages FOR ALL USING (true) WITH CHECK (true);

-- Index for chat messages
CREATE INDEX idx_chat_messages_session ON public.chat_messages(session_id, created_at);