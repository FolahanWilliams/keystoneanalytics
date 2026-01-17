import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface OnboardingStep {
  id: string;
  target: string;
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "market-bar",
    target: "[data-onboarding='market-bar']",
    title: "Live Market Data",
    description: "Track real-time updates on major indices. Click any ticker to see detailed charts.",
    position: "bottom",
  },
  {
    id: "chart",
    target: "[data-onboarding='chart']",
    title: "Interactive Charts",
    description: "Explore detailed price action with candlestick charts, volume indicators, and technical overlays.",
    position: "bottom",
  },
  {
    id: "watchlist",
    target: "[data-onboarding='watchlist']",
    title: "Your Watchlist",
    description: "Add stocks you're tracking. Build your personalized portfolio view and monitor performance.",
    position: "left",
  },
  {
    id: "sidebar-coach",
    target: "[data-onboarding='sidebar-coach']",
    title: "AI Stock Coach",
    description: "Get personalized trading guidance from our AI mentor. Ask questions about any stock or strategy.",
    position: "right",
  },
  {
    id: "sidebar-analysis",
    target: "[data-onboarding='sidebar-analysis']",
    title: "Master Verdict",
    description: "See AI-powered buy/hold/sell recommendations with confidence scores and technical analysis.",
    position: "right",
  },
];

const DEFAULT_WATCHLIST_STOCKS = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "MSFT", name: "Microsoft Corporation" },
  { symbol: "GOOGL", name: "Alphabet Inc." },
  { symbol: "AMZN", name: "Amazon.com Inc." },
  { symbol: "NVDA", name: "NVIDIA Corporation" },
];

export const useOnboarding = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const { toast } = useToast();

  // Fetch onboarding status from database
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error fetching onboarding status:", error);
          setIsLoading(false);
          return;
        }

        if (profile?.onboarding_completed) {
          setIsOnboardingComplete(true);
        } else {
          setShowWelcomeModal(true);
        }
      } catch (error) {
        console.error("Error checking onboarding:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, []);

  const startTour = useCallback(() => {
    setShowWelcomeModal(false);
    setShowTour(true);
    setCurrentStep(0);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      completeTour();
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const addDefaultWatchlistStocks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user already has watchlist items
      const { data: existingWatchlist } = await supabase
        .from("watchlist")
        .select("symbol")
        .eq("user_id", user.id);

      if (existingWatchlist && existingWatchlist.length > 0) {
        return; // User already has watchlist items
      }

      // Add default stocks
      const stocksToAdd = DEFAULT_WATCHLIST_STOCKS.map((stock) => ({
        user_id: user.id,
        symbol: stock.symbol,
        name: stock.name,
      }));

      await supabase.from("watchlist").insert(stocksToAdd);
    } catch (error) {
      console.error("Error adding default watchlist:", error);
    }
  };

  const completeTour = useCallback(async () => {
    setShowTour(false);
    setIsOnboardingComplete(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("profiles")
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      // Add default stocks to watchlist
      await addDefaultWatchlistStocks();

      toast({
        title: "Welcome to Pulse Terminal! 🎉",
        description: "We've added some popular stocks to your watchlist to get you started.",
      });
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }
  }, [toast]);

  const skipTour = useCallback(async () => {
    setShowWelcomeModal(false);
    setShowTour(false);
    setIsOnboardingComplete(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("profiles")
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      // Still add default stocks even if they skip
      await addDefaultWatchlistStocks();
    } catch (error) {
      console.error("Error skipping onboarding:", error);
    }
  }, []);

  const resetOnboarding = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("profiles")
        .update({
          onboarding_completed: false,
          onboarding_completed_at: null,
        })
        .eq("user_id", user.id);

      setIsOnboardingComplete(false);
      setShowWelcomeModal(true);
      setCurrentStep(0);

      toast({
        title: "Onboarding Reset",
        description: "You can now replay the welcome tour.",
      });
    } catch (error) {
      console.error("Error resetting onboarding:", error);
    }
  }, [toast]);

  return {
    isLoading,
    showWelcomeModal,
    showTour,
    currentStep,
    isOnboardingComplete,
    totalSteps: ONBOARDING_STEPS.length,
    currentStepData: ONBOARDING_STEPS[currentStep],
    startTour,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
    resetOnboarding,
  };
};
