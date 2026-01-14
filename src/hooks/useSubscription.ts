import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SubscriptionTier = "free" | "pro" | "elite";

export interface Subscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export const TIER_LIMITS = {
  free: {
    symbols: 5,
    watchlists: 1,
    watchlistItems: 10,
    indicators: 3,
    alerts: 0,
    aiAnalysis: false,
    realtimeNews: false,
    chartSharing: false,
  },
  pro: {
    symbols: 50,
    watchlists: 5,
    watchlistItems: 50,
    indicators: 15,
    alerts: 10,
    aiAnalysis: true,
    realtimeNews: true,
    chartSharing: true,
  },
  elite: {
    symbols: -1, // unlimited
    watchlists: -1,
    watchlistItems: -1,
    indicators: -1,
    alerts: -1,
    aiAnalysis: true,
    realtimeNews: true,
    chartSharing: true,
  },
} as const;

export function useSubscription() {
  const { data: subscription, isLoading, error, refetch } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        // If no subscription found, user is on free tier
        if (error.code === "PGRST116") {
          return { tier: "free" as SubscriptionTier } as Subscription;
        }
        throw error;
      }

      return data as Subscription;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const tier = subscription?.tier || "free";
  const limits = TIER_LIMITS[tier];

  const canUseFeature = (feature: keyof typeof TIER_LIMITS.free) => {
    const limit = limits[feature];
    if (typeof limit === "boolean") return limit;
    return limit !== 0;
  };

  const isWithinLimit = (feature: keyof typeof TIER_LIMITS.free, currentCount: number) => {
    const limit = limits[feature];
    if (typeof limit === "boolean") return limit;
    if (limit === -1) return true; // unlimited
    return currentCount < limit;
  };

  return {
    subscription,
    tier,
    limits,
    isLoading,
    error,
    refetch,
    canUseFeature,
    isWithinLimit,
    isPro: tier === "pro" || tier === "elite",
    isElite: tier === "elite",
  };
}
