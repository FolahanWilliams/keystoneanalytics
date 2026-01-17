-- Create a secure view that excludes Stripe-sensitive fields
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

-- Enable RLS on the view (views inherit table RLS when using security_invoker)
ALTER VIEW public.user_subscriptions_safe SET (security_invoker = on);

-- Grant access to authenticated users
GRANT SELECT ON public.user_subscriptions_safe TO authenticated;