-- Drop existing SELECT policy that doesn't require authentication
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create new SELECT policy that requires authentication AND only allows users to view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Note: The INSERT, UPDATE, DELETE policies already properly restrict to user_id = auth.uid()