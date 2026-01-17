-- Add notification preferences to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notify_price_alerts boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS notify_news_alerts boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS notify_portfolio_updates boolean DEFAULT false;