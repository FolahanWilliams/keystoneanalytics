import { OnboardingSpotlight } from "./OnboardingSpotlight";
import { OnboardingTooltip } from "./OnboardingTooltip";
import type { OnboardingStep } from "@/hooks/useOnboarding";

interface OnboardingTourProps {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  stepData: OnboardingStep;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

export const OnboardingTour = ({
  isActive,
  currentStep,
  totalSteps,
  stepData,
  onNext,
  onPrev,
  onSkip,
}: OnboardingTourProps) => {
  if (!isActive || !stepData) return null;

  return (
    <>
      {/* Spotlight overlay */}
      <OnboardingSpotlight
        targetSelector={stepData.target}
        isActive={isActive}
        padding={8}
      />

      {/* Tooltip with navigation */}
      <OnboardingTooltip
        step={stepData}
        currentStep={currentStep}
        totalSteps={totalSteps}
        onNext={onNext}
        onPrev={onPrev}
        onSkip={onSkip}
        isActive={isActive}
      />
    </>
  );
};
