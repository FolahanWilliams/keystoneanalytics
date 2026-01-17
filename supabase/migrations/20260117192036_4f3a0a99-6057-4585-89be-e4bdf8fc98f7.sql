-- Create table to store application errors and performance metrics
CREATE TABLE public.app_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('error', 'performance', 'event')),
  name text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  url text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_app_metrics_type ON public.app_metrics(type);
CREATE INDEX idx_app_metrics_created_at ON public.app_metrics(created_at DESC);
CREATE INDEX idx_app_metrics_name ON public.app_metrics(name);

-- Enable RLS
ALTER TABLE public.app_metrics ENABLE ROW LEVEL SECURITY;

-- Only allow inserts (no reads for regular users - admin only via service role)
CREATE POLICY "Anyone can insert metrics"
ON public.app_metrics FOR INSERT
WITH CHECK (true);

-- Block all reads from regular users (service role can still read)
CREATE POLICY "Block regular user reads"
ON public.app_metrics FOR SELECT
USING (false);

-- Block updates and deletes
CREATE POLICY "Block updates"
ON public.app_metrics FOR UPDATE
USING (false);

CREATE POLICY "Block deletes"
ON public.app_metrics FOR DELETE
USING (false);