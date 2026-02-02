-- Create table for chart drawings (trend lines, fibonacci, support/resistance)
CREATE TABLE public.chart_drawings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('trendline', 'fibonacci', 'horizontal', 'annotation')),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chart_drawings ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own drawings
CREATE POLICY "Users can view their own drawings"
ON public.chart_drawings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own drawings"
ON public.chart_drawings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drawings"
ON public.chart_drawings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drawings"
ON public.chart_drawings FOR DELETE
USING (auth.uid() = user_id);

-- Block anonymous reads
CREATE POLICY "Block anonymous reads on chart_drawings"
ON public.chart_drawings FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Add composite index for efficient queries
CREATE INDEX idx_chart_drawings_user_symbol ON public.chart_drawings (user_id, symbol, timeframe);

-- Add updated_at trigger
CREATE TRIGGER update_chart_drawings_updated_at
BEFORE UPDATE ON public.chart_drawings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();