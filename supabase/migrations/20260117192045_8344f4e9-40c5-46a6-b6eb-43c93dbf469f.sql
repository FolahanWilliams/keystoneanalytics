-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can insert metrics" ON public.app_metrics;

-- Create a more restrictive policy - only authenticated users can insert
CREATE POLICY "Authenticated users can insert metrics"
ON public.app_metrics FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);