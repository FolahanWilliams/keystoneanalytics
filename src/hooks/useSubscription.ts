import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type SubscriptionTier = "free" | "pro" | "elite";

// Safe subscription interface - no Stripe IDs exposed to client
export interface Subscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
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

  // Fetch subscription from secure view (excludes Stripe IDs)
  const { data: subscription, isLoading, error, refetch } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Use the security definer function that excludes sensitive Stripe fields
      const { data, error } = await supabase.rpc("get_user_subscription");

      if (error) {
        console.error("Subscription fetch error:", error);
        return { tier: "free" as SubscriptionTier } as Subscription;
      }

      // Function returns an array, get first item or default to free
      if (!data || data.length === 0) {
        return { tier: "free" as SubscriptionTier } as Subscription;
      }

      return data[0] as Subscription;
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
