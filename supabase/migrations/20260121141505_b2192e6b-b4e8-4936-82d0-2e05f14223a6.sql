-- Fix Stripe ID exposure: Block direct SELECT access to user_subscriptions
-- Users must use the get_user_subscription() RPC function which excludes sensitive Stripe IDs

-- Drop the existing SELECT policy that exposes all columns
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.user_subscriptions;

-- Create a new restrictive SELECT policy that blocks direct table access
-- This forces users to use the get_user_subscription() RPC function
CREATE POLICY "Block direct subscription reads"
  ON public.user_subscriptions
  FOR SELECT
  USING (false);