-- Fix: Recreate view with security_invoker instead of security_definer
DROP VIEW IF EXISTS public.user_subscriptions_safe;

CREATE VIEW public.user_subscriptions_safe
WITH (security_invoker=on) AS
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

-- Revoke all access from anonymous users
REVOKE ALL ON public.user_subscriptions_safe FROM anon;