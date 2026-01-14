import { ReactNode } from "react";
import { useSubscription, SubscriptionTier } from "@/hooks/useSubscription";
import { Lock, Sparkles, Crown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PremiumGateProps {
  children: ReactNode;
  requiredTier?: SubscriptionTier;
  feature?: string;
  className?: string;
  showOverlay?: boolean;
  compact?: boolean;
}

const tierIcons = {
  free: Lock,
  pro: Zap,
  elite: Crown,
};

const tierColors = {
  free: "text-muted-foreground",
  pro: "text-blue-400",
  elite: "text-amber-400",
};

const tierLabels = {
  pro: "Pro",
  elite: "Elite",
};

export function PremiumGate({
  children,
  requiredTier = "pro",
  feature = "this feature",
  className,
  showOverlay = true,
  compact = false,
}: PremiumGateProps) {
  const { tier, isLoading } = useSubscription();

  if (isLoading) {
    return <div className={cn("animate-pulse bg-muted/50 rounded-lg", className)}>{children}</div>;
  }

  const tierOrder: SubscriptionTier[] = ["free", "pro", "elite"];
  const currentTierIndex = tierOrder.indexOf(tier);
  const requiredTierIndex = tierOrder.indexOf(requiredTier);
  const hasAccess = currentTierIndex >= requiredTierIndex;

  if (hasAccess) {
    return <>{children}</>;
  }

  const Icon = tierIcons[requiredTier] || Lock;

  if (!showOverlay) {
    return null;
  }

  if (compact) {
    return (
      <div className={cn("relative", className)}>
        <div className="opacity-50 blur-[2px] pointer-events-none select-none">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Link to="/pricing">
            <Button size="sm" variant="outline" className="gap-2 border-primary/50 hover:border-primary">
              <Icon className={cn("w-4 h-4", tierColors[requiredTier])} />
              Upgrade to {tierLabels[requiredTier]}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div className="opacity-30 blur-sm pointer-events-none select-none">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-md rounded-xl border border-border/50">
        <div className="text-center p-6 max-w-sm">
          <div className={cn("w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mx-auto mb-4", 
            requiredTier === "elite" ? "from-amber-500/20 to-orange-500/20" : "from-blue-500/20 to-cyan-500/20"
          )}>
            <Icon className={cn("w-7 h-7", tierColors[requiredTier])} />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            <Sparkles className="w-4 h-4 inline mr-2 text-primary" />
            {tierLabels[requiredTier]} Feature
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Upgrade to {tierLabels[requiredTier]} to unlock {feature} and more powerful trading tools.
          </p>
          <Link to="/pricing">
            <Button className="gap-2 bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90">
              <Zap className="w-4 h-4" />
              Upgrade Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function PremiumBadge({ tier }: { tier: SubscriptionTier }) {
  if (tier === "free") return null;

  const Icon = tierIcons[tier];
  
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
      tier === "elite" 
        ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30"
        : "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 border border-blue-500/30"
    )}>
      <Icon className="w-3 h-3" />
      {tierLabels[tier]}
    </span>
  );
}
