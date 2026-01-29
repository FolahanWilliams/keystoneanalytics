-- Add explicit anonymous blocking policy to academy_quizzes table
CREATE POLICY "Block anonymous reads on academy_quizzes"
ON public.academy_quizzes FOR SELECT
USING (auth.uid() IS NOT NULL);