-- Drop and recreate view with explicit user filtering for defense-in-depth
DROP VIEW IF EXISTS public.user_subscriptions_safe;

-- Recreate with explicit WHERE clause that filters by auth.uid()
-- This provides double protection: security_invoker + explicit filter
CREATE VIEW public.user_subscriptions_safe
WITH (security_invoker = on) AS
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

-- Grant access to authenticated users only
GRANT SELECT ON public.user_subscriptions_safe TO authenticated;

-- Revoke from anon to ensure no public access
REVOKE ALL ON public.user_subscriptions_safe FROM anon;