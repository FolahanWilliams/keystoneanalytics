import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

// Stripe price IDs for each tier
export const STRIPE_PRICES = {
  pro: "price_1SpbFWGC4ILz5tue0ZckENCS",
  elite: "price_1SpbFxGC4ILz5tueYZ34WXXO",
} as const;

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
  const queryClient = useQueryClient();

  // Fetch subscription from database
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
        if (error.code === "PGRST116") {
          return { tier: "free" as SubscriptionTier } as Subscription;
        }
        throw error;
      }

      return data as Subscription;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Sync subscription status with Stripe
  const syncSubscription = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
    onError: (error) => {
      console.error("Failed to sync subscription:", error);
    },
  });

  // Create checkout session
  const createCheckout = useMutation({
    mutationFn: async (priceId: string) => {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
      }
    },
    onError: (error) => {
      toast.error(`Checkout failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    },
  });

  // Open customer portal
  const openPortal = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
      }
    },
    onError: (error) => {
      toast.error(`Portal failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    },
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
    if (limit === -1) return true;
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
    // Stripe methods
    syncSubscription: syncSubscription.mutate,
    isSyncing: syncSubscription.isPending,
    createCheckout: createCheckout.mutate,
    isCheckoutLoading: createCheckout.isPending,
    openPortal: openPortal.mutate,
    isPortalLoading: openPortal.isPending,
  };
}
