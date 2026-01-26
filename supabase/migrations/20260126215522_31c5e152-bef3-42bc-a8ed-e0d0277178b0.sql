-- Block anonymous reads on profiles table
CREATE POLICY "Block anonymous reads on profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Block anonymous reads on academy_progress table
CREATE POLICY "Block anonymous reads on academy_progress"
ON public.academy_progress
FOR SELECT
USING (auth.uid() IS NOT NULL);