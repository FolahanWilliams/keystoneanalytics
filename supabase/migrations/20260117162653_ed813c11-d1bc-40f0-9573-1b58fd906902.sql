-- Drop the existing view and recreate it properly
DROP VIEW IF EXISTS public.user_subscriptions_safe;

-- Recreate view WITHOUT security_invoker (so it bypasses RLS on base table)
-- This allows the view to work even when base table SELECT is denied
CREATE VIEW public.user_subscriptions_safe AS
SELECT 
  id,
  user_id,
  tier,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  created_at,
  updated_at
FROM public.user_subscriptions;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.user_subscriptions_safe TO authenticated;

-- Create a security definer function to check if user owns the subscription
CREATE OR REPLACE FUNCTION public.owns_subscription(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() = _user_id
$$;

-- Drop the existing SELECT policy on user_subscriptions
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.user_subscriptions;

-- Create a new SELECT policy that denies all direct access
-- Users must use the safe view instead
CREATE POLICY "No direct SELECT access to subscriptions"
  ON public.user_subscriptions
  FOR SELECT
  USING (false);

-- Keep INSERT and UPDATE policies intact (they're needed for edge functions)
-- The service role key used by edge functions bypasses RLS anyway

-- Enable RLS on the view using Row Security on the base query
-- Since security_invoker is off by default, we need to add the user check in the view
DROP VIEW IF EXISTS public.user_subscriptions_safe;

CREATE VIEW public.user_subscriptions_safe AS
SELECT 
  id,
  user_id,
  tier,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  created_at,
  updated_at
FROM public.user_subscriptions
WHERE user_id = auth.uid();

-- Grant access to the view
GRANT SELECT ON public.user_subscriptions_safe TO authenticated;