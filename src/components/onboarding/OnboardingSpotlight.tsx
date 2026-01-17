import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface OnboardingSpotlightProps {
  targetSelector: string;
  isActive: boolean;
  padding?: number;
}

export const OnboardingSpotlight = ({
  targetSelector,
  isActive,
  padding = 8,
}: OnboardingSpotlightProps) => {
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (!isActive) {
      setRect(null);
      return;
    }

    const updateRect = () => {
      const element = document.querySelector(targetSelector);
      if (element) {
        const boundingRect = element.getBoundingClientRect();
        setRect({
          top: boundingRect.top - padding,
          left: boundingRect.left - padding,
          width: boundingRect.width + padding * 2,
          height: boundingRect.height + padding * 2,
        });
      }
    };

    // Initial update
    updateRect();

    // Update on scroll and resize
    window.addEventListener("scroll", updateRect, true);
    window.addEventListener("resize", updateRect);

    // Observe element for size changes
    const element = document.querySelector(targetSelector);
    if (element) {
      observerRef.current = new ResizeObserver(updateRect);
      observerRef.current.observe(element);
    }

    return () => {
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
      observerRef.current?.disconnect();
    };
  }, [targetSelector, isActive, padding]);

  if (!isActive || !rect) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] pointer-events-none"
      >
        {/* SVG mask for the spotlight effect */}
        <svg className="w-full h-full">
          <defs>
            <mask id="spotlight-mask">
              {/* White background (visible area) */}
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {/* Black rectangle (cut-out area) */}
              <motion.rect
                initial={{ opacity: 0 }}
                animate={{
                  x: rect.left,
                  y: rect.top,
                  width: rect.width,
                  height: rect.height,
                  opacity: 1,
                }}
                transition={{ type: "spring", duration: 0.4 }}
                rx="8"
                fill="black"
              />
            </mask>
          </defs>
          {/* Dark overlay with mask applied */}
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.75)"
            mask="url(#spotlight-mask)"
          />
        </svg>

        {/* Highlight border around the target */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{
            opacity: 1,
            scale: 1,
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }}
          transition={{ type: "spring", duration: 0.4 }}
          className="fixed rounded-lg border-2 border-primary shadow-[0_0_20px_rgba(34,197,94,0.3)]"
          style={{
            boxShadow: "0 0 0 4px rgba(34, 197, 94, 0.1), 0 0 30px rgba(34, 197, 94, 0.2)",
          }}
        />

        {/* Pulsing ring effect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0.5, 0],
            scale: [1, 1.1],
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeOut",
          }}
          className="fixed rounded-lg border-2 border-primary"
        />
      </motion.div>
    </AnimatePresence>
  );
};
