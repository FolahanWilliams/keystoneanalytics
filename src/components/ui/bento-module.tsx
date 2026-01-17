import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

/* ============================================
   BENTO MODULE COMPONENT
   Expressive Minimalism Design System
   ============================================ */

export type BentoSize = "hero" | "standard" | "compact" | "wide" | "full";

interface BentoModuleProps {
  size?: BentoSize;
  title?: string;
  action?: React.ReactNode;
  noPadding?: boolean;
  noHeader?: boolean;
  delay?: number;
  className?: string;
  children?: React.ReactNode;
  dataOnboarding?: string;
}

const sizeClasses: Record<BentoSize, string> = {
  hero: "bento-hero",
  standard: "bento-standard",
  compact: "bento-compact",
  wide: "bento-wide",
  full: "bento-full",
};

const moduleVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.98,
    y: 8 
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: { 
      duration: 0.4, 
      ease: [0.22, 1, 0.36, 1] 
    }
  }
};

export const BentoModule = React.forwardRef<HTMLDivElement, BentoModuleProps>(
  ({ 
    className, 
    children, 
    size = "standard", 
    title, 
    action,
    noPadding = false,
    noHeader = false,
    delay = 0,
    dataOnboarding
  }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          "bento-module flex flex-col",
          sizeClasses[size],
          className
        )}
        variants={moduleVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: delay * 0.1 }}
        data-onboarding={dataOnboarding}
      >
        {!noHeader && title && (
          <div className="bento-header shrink-0">
            <span className="bento-title">{title}</span>
            {action && <div className="flex items-center gap-2">{action}</div>}
          </div>
        )}
        <div className={cn(
          "flex-1 min-h-0 overflow-auto scrollbar-terminal",
          !noPadding && "bento-content"
        )}>
          {children}
        </div>
      </motion.div>
    );
  }
);

BentoModule.displayName = "BentoModule";

/* ============================================
   BENTO GRID CONTAINER
   ============================================ */

interface BentoGridProps {
  className?: string;
  children?: React.ReactNode;
  stagger?: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const BentoGrid = React.forwardRef<HTMLDivElement, BentoGridProps>(
  ({ className, children, stagger = true }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("bento-grid", className)}
      >
        {children}
      </div>
    );
  }
);

BentoGrid.displayName = "BentoGrid";

/* ============================================
   BENTO STAT CARD
   For displaying key metrics
   ============================================ */

interface BentoStatProps {
  label: string;
  value: string | number;
  change?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function BentoStat({ 
  label, 
  value, 
  change, 
  prefix, 
  suffix,
  className 
}: BentoStatProps) {
  const isPositive = change !== undefined && change >= 0;
  
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="data-label">{label}</span>
      <div className="flex items-baseline gap-1">
        {prefix && <span className="text-muted-foreground text-sm">{prefix}</span>}
        <span className="data-value-lg text-foreground">{value}</span>
        {suffix && <span className="text-muted-foreground text-sm">{suffix}</span>}
      </div>
      {change !== undefined && (
        <span className={cn(
          "font-mono text-xs tabular-nums",
          isPositive ? "text-gain" : "text-loss"
        )}>
          {isPositive ? "+" : ""}{change.toFixed(2)}%
        </span>
      )}
    </div>
  );
}

/* ============================================
   BENTO SKELETON
   Loading state for modules
   ============================================ */

interface BentoSkeletonProps {
  size?: BentoSize;
  className?: string;
}

export function BentoSkeleton({ size = "standard", className }: BentoSkeletonProps) {
  return (
    <div className={cn(
      "bento-module animate-pulse",
      sizeClasses[size],
      className
    )}>
      <div className="bento-header">
        <div className="h-3 w-20 bg-muted rounded" />
      </div>
      <div className="bento-content space-y-3">
        <div className="h-4 w-3/4 bg-muted rounded" />
        <div className="h-4 w-1/2 bg-muted rounded" />
        <div className="h-16 w-full bg-muted rounded" />
      </div>
    </div>
  );
}
