-- Step 1: Drop and recreate the safe view with proper security
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

-- Grant access to authenticated users only
GRANT SELECT ON public.user_subscriptions_safe TO authenticated;

-- Revoke all access from anonymous users
REVOKE ALL ON public.user_subscriptions_safe FROM anon;

-- Step 2: Block direct SELECT access to base table
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.user_subscriptions;

CREATE POLICY "Block direct subscription access"
  ON public.user_subscriptions
  FOR SELECT
  USING (false);

-- Step 3: Add documentation comment
COMMENT ON TABLE public.user_subscriptions IS 
  'Subscription data with sensitive Stripe IDs. Direct access blocked via RLS. Users must query user_subscriptions_safe view. Edge functions use service_role to bypass RLS.';