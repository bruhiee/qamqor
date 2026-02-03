-- Fix overly permissive RLS policy for anonymized_analytics
DROP POLICY IF EXISTS "System can insert analytics" ON public.anonymized_analytics;

-- Only allow inserting analytics if user has opted in
CREATE POLICY "Users can insert their own analytics"
ON public.anonymized_analytics FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.privacy_settings 
    WHERE user_id = auth.uid() AND analytics_opt_in = true
  )
);