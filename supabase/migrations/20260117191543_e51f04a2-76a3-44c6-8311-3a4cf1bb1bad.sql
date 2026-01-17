-- Add INSERT/UPDATE RLS policies for user_subscriptions table
-- These policies deny direct user modification (only service role via webhooks/triggers can modify)

-- Block direct user inserts (only allow service role via trigger)
CREATE POLICY "Only service role can insert subscriptions"
ON public.user_subscriptions FOR INSERT
WITH CHECK (false);

-- Block direct user updates (only allow via Stripe webhook with service role)
CREATE POLICY "Only service role can update subscriptions"
ON public.user_subscriptions FOR UPDATE
USING (false);