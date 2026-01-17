-- Remove user ability to update their own subscription directly
-- This ensures subscription changes can only happen through edge functions using service_role
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.user_subscriptions;

-- Remove user ability to insert their own subscription directly
-- The handle_new_user_subscription trigger handles initial creation
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.user_subscriptions;

-- Keep the SELECT policy so users can view their subscription status
-- (already exists: "Users can view their own subscription")

-- Add a comment to document the security model
COMMENT ON TABLE public.user_subscriptions IS 'Subscription data is read-only for users. Updates only via edge functions (check-subscription, stripe webhooks) using service_role key.';