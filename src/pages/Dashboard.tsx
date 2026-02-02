import { useState, useEffect } from "react";
import { useNavigate, Outlet, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import MarketOverview from "@/components/dashboard/MarketOverview";
import { WelcomeModal, OnboardingTour } from "@/components/onboarding";
import { useOnboarding } from "@/hooks/useOnboarding";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const urlSymbol = searchParams.get("symbol");

  const {
    isLoading: onboardingLoading,
    showWelcomeModal,
    showTour,
    currentStep,
    totalSteps,
    currentStepData,
    startTour,
    nextStep,
    prevStep,
    skipTour,
  } = useOnboarding();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setLoading(false);
      if (!session) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex w-full">
      <DashboardSidebar />
      
      {/* Main content with proper mobile spacing for hamburger menu */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <MarketOverview />
        <main className="flex-1 overflow-y-auto p-3 pt-14 md:pt-3 md:p-6 scrollbar-terminal">
          <Outlet context={{ urlSymbol }} />
        </main>
      </div>

      {/* Onboarding */}
      {!onboardingLoading && (
        <>
          <WelcomeModal
            isOpen={showWelcomeModal}
            onStartTour={startTour}
            onSkip={skipTour}
          />
          {currentStepData && (
            <OnboardingTour
              isActive={showTour}
              currentStep={currentStep}
              totalSteps={totalSteps}
              stepData={currentStepData}
              onNext={nextStep}
              onPrev={prevStep}
              onSkip={skipTour}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
