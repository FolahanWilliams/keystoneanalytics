-- Create a security definer function to safely fetch subscription for current user
CREATE OR REPLACE FUNCTION public.get_user_subscription()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  tier subscription_tier,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Drop the view - we'll use the function instead
DROP VIEW IF EXISTS public.user_subscriptions_safe;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_subscription() TO authenticated;

-- Revoke from anon
REVOKE EXECUTE ON FUNCTION public.get_user_subscription() FROM anon;