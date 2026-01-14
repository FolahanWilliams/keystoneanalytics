-- Add explicit DELETE policy to user_subscriptions table
-- This makes the security posture explicit: users cannot delete their own subscriptions
-- Subscription lifecycle should be managed by backend/admin processes

CREATE POLICY "Block user subscription deletion"
  ON public.user_subscriptions FOR DELETE
  USING (false);