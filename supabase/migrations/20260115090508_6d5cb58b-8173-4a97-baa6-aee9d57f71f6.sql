-- Create academy_progress table to store user learning progress
CREATE TABLE public.academy_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  module_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_id)
);

-- Create academy_quizzes table to store quiz results
CREATE TABLE public.academy_quizzes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  level integer NOT NULL,
  passed boolean NOT NULL DEFAULT false,
  score numeric NOT NULL DEFAULT 0,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, level)
);

-- Enable RLS
ALTER TABLE public.academy_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_quizzes ENABLE ROW LEVEL SECURITY;

-- RLS policies for academy_progress
CREATE POLICY "Users can view their own progress"
ON public.academy_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
ON public.academy_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
ON public.academy_progress FOR UPDATE
USING (auth.uid() = user_id);

-- RLS policies for academy_quizzes
CREATE POLICY "Users can view their own quizzes"
ON public.academy_quizzes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quizzes"
ON public.academy_quizzes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quizzes"
ON public.academy_quizzes FOR UPDATE
USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_academy_progress_updated_at
BEFORE UPDATE ON public.academy_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_academy_quizzes_updated_at
BEFORE UPDATE ON public.academy_quizzes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();