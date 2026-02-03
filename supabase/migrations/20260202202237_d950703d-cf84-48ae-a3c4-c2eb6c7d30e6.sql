-- Fix search path for handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix overly permissive RLS policies on symptom_logs
DROP POLICY IF EXISTS "Anyone can view their own symptom logs" ON public.symptom_logs;
DROP POLICY IF EXISTS "Anyone can insert symptom logs" ON public.symptom_logs;
DROP POLICY IF EXISTS "Anyone can update their own symptom logs" ON public.symptom_logs;
DROP POLICY IF EXISTS "Anyone can delete their own symptom logs" ON public.symptom_logs;

CREATE POLICY "Users can view their own symptom logs" 
ON public.symptom_logs FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own symptom logs" 
ON public.symptom_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own symptom logs" 
ON public.symptom_logs FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own symptom logs" 
ON public.symptom_logs FOR DELETE 
USING (auth.uid() = user_id);

-- Fix overly permissive RLS policies on chat_sessions  
DROP POLICY IF EXISTS "Anyone can manage chat sessions" ON public.chat_sessions;

CREATE POLICY "Users can view their own chat sessions" 
ON public.chat_sessions FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert chat sessions" 
ON public.chat_sessions FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own chat sessions" 
ON public.chat_sessions FOR DELETE 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Fix overly permissive RLS policies on chat_messages
DROP POLICY IF EXISTS "Anyone can manage chat messages" ON public.chat_messages;

CREATE POLICY "Users can view messages from their sessions" 
ON public.chat_messages FOR SELECT 
USING (
  session_id IN (
    SELECT session_id FROM public.chat_sessions 
    WHERE user_id = auth.uid() OR user_id IS NULL
  )
);

CREATE POLICY "Users can insert messages to their sessions" 
ON public.chat_messages FOR INSERT 
WITH CHECK (
  session_id IN (
    SELECT session_id FROM public.chat_sessions 
    WHERE user_id = auth.uid() OR user_id IS NULL
  )
);

CREATE POLICY "Users can delete messages from their sessions" 
ON public.chat_messages FOR DELETE 
USING (
  session_id IN (
    SELECT session_id FROM public.chat_sessions 
    WHERE user_id = auth.uid() OR user_id IS NULL
  )
);