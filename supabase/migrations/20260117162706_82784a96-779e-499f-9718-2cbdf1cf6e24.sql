-- Drop the security definer view
DROP VIEW IF EXISTS public.user_subscriptions_safe;

-- Drop the restrictive policy so we can recreate with proper approach
DROP POLICY IF EXISTS "No direct SELECT access to subscriptions" ON public.user_subscriptions;

-- Create a SELECT policy that only returns non-sensitive fields conceptually
-- But actually, we'll use a security invoker view with the WHERE clause
-- First, restore a SELECT policy that allows users to see their own rows
CREATE POLICY "Users can view their own subscription"
  ON public.user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create the view with security_invoker = on so it respects RLS
-- The view only exposes safe fields, and RLS ensures users only see their own data
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
FROM public.user_subscriptions;

-- Grant access to authenticated users
GRANT SELECT ON public.user_subscriptions_safe TO authenticated;

-- Drop unused function
DROP FUNCTION IF EXISTS public.owns_subscription(uuid);