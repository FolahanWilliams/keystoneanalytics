-- Drop the blocking SELECT policy
DROP POLICY IF EXISTS "Block direct subscription access" ON public.user_subscriptions;

-- Create new policy allowing users to view their own subscription
CREATE POLICY "Users can view their own subscription"
ON public.user_subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);