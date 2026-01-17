import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { OnboardingStep } from "@/hooks/useOnboarding";

interface OnboardingTooltipProps {
  step: OnboardingStep;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  isActive: boolean;
}

interface TooltipPosition {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  transform?: string;
}

export const OnboardingTooltip = ({
  step,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  isActive,
}: OnboardingTooltipProps) => {
  const [position, setPosition] = useState<TooltipPosition>({});
  const [arrowPosition, setArrowPosition] = useState<string>("top");

  useEffect(() => {
    if (!isActive) return;

    const updatePosition = () => {
      const element = document.querySelector(step.target);
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const tooltipWidth = 320;
      const tooltipHeight = 180;
      const offset = 16;
      const padding = 16;

      let pos: TooltipPosition = {};
      let arrow = step.position;

      switch (step.position) {
        case "top":
          pos = {
            bottom: window.innerHeight - rect.top + offset,
            left: Math.max(padding, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding)),
          };
          arrow = "bottom";
          break;
        case "bottom":
          pos = {
            top: rect.bottom + offset,
            left: Math.max(padding, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding)),
          };
          arrow = "top";
          break;
        case "left":
          pos = {
            top: Math.max(padding, Math.min(rect.top + rect.height / 2 - tooltipHeight / 2, window.innerHeight - tooltipHeight - padding)),
            right: window.innerWidth - rect.left + offset,
          };
          arrow = "right";
          break;
        case "right":
          pos = {
            top: Math.max(padding, Math.min(rect.top + rect.height / 2 - tooltipHeight / 2, window.innerHeight - tooltipHeight - padding)),
            left: rect.right + offset,
          };
          arrow = "left";
          break;
      }

      setPosition(pos);
      setArrowPosition(arrow);
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [step, isActive]);

  const isLastStep = currentStep === totalSteps - 1;

  const getArrowStyles = () => {
    const base = "absolute w-3 h-3 bg-card border rotate-45";
    switch (arrowPosition) {
      case "top":
        return `${base} -top-1.5 left-1/2 -translate-x-1/2 border-t border-l border-r-0 border-b-0`;
      case "bottom":
        return `${base} -bottom-1.5 left-1/2 -translate-x-1/2 border-b border-r border-t-0 border-l-0`;
      case "left":
        return `${base} -left-1.5 top-1/2 -translate-y-1/2 border-l border-b border-t-0 border-r-0`;
      case "right":
        return `${base} -right-1.5 top-1/2 -translate-y-1/2 border-r border-t border-b-0 border-l-0`;
      default:
        return base;
    }
  };

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", duration: 0.3 }}
        className="fixed z-[95] w-80 bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
        style={position}
      >
        {/* Arrow */}
        <div className={getArrowStyles()} />

        {/* Close button */}
        <button
          onClick={onSkip}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="p-5">
          {/* Step indicator */}
          <div className="flex items-center gap-1.5 mb-3">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentStep
                    ? "w-6 bg-primary"
                    : i < currentStep
                    ? "w-1.5 bg-primary/50"
                    : "w-1.5 bg-muted"
                }`}
              />
            ))}
            <span className="ml-auto text-xs text-muted-foreground">
              {currentStep + 1} of {totalSteps}
            </span>
          </div>

          {/* Title & Description */}
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {step.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Navigation */}
        <div className="px-5 pb-5 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrev}
            disabled={currentStep === 0}
            className="text-muted-foreground"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          <Button size="sm" onClick={onNext} className="min-w-[100px]">
            {isLastStep ? (
              "Get Started"
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
