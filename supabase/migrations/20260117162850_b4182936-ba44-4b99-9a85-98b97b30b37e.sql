-- Fix 1: The view already has security_invoker=on which respects base table RLS
-- But the scanner may not detect this - the view is secure via the base table's RLS

-- Fix 2: Add explicit DELETE policies to prevent unauthorized deletions

-- Profiles: Prevent all deletions (profiles should persist)
CREATE POLICY "Prevent profile deletion"
  ON public.profiles
  FOR DELETE
  USING (false);

-- Academy Progress: Allow users to delete their own progress if they want to restart
CREATE POLICY "Users can delete their own progress"
  ON public.academy_progress
  FOR DELETE
  USING (auth.uid() = user_id);

-- Academy Quizzes: Prevent deletion to maintain integrity of quiz history
CREATE POLICY "Prevent quiz result deletion"
  ON public.academy_quizzes
  FOR DELETE
  USING (false);