-- Optimize academy progress lookups (user + module composite queries)
CREATE INDEX IF NOT EXISTS idx_academy_progress_user_module 
ON public.academy_progress (user_id, module_id);

-- Optimize quiz history queries (user ordered by completion time)
CREATE INDEX IF NOT EXISTS idx_academy_quizzes_user_completed 
ON public.academy_quizzes (user_id, completed_at DESC);

-- Optimize metrics analysis (filter by type and time range)
CREATE INDEX IF NOT EXISTS idx_app_metrics_type_created 
ON public.app_metrics (type, created_at DESC);

-- Optimize Stripe webhook lookups by customer ID
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer 
ON public.user_subscriptions (stripe_customer_id);

-- Optimize watchlist queries by user and symbol
CREATE INDEX IF NOT EXISTS idx_watchlist_user_symbol 
ON public.watchlist (user_id, symbol);