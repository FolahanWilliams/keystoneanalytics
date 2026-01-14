import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Check, 
  ChevronRight, 
  Zap, 
  Crown, 
  Shield,
  TrendingUp,
  BarChart3,
  Sparkles,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSubscription, STRIPE_PRICES } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface SubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  highlightedTier?: "pro" | "elite";
}

const plans = [
  {
    id: "pro",
    name: "Pro",
    price: 19,
    icon: Zap,
    color: "text-blue-400",
    bgColor: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-500/50",
    popular: true,
    description: "For active traders who need an edge",
    features: [
      "50 real-time quotes",
      "15+ advanced indicators",
      "AI sentiment analysis",
      "10 price alerts",
      "Chart sharing",
    ],
  },
  {
    id: "elite",
    name: "Elite",
    price: 49,
    icon: Crown,
    color: "text-amber-400",
    bgColor: "from-amber-500/20 to-orange-500/20",
    borderColor: "border-amber-500/50",
    popular: false,
    description: "Maximum power for professionals",
    features: [
      "Unlimited everything",
      "Deep AI market insights",
      "Pattern recognition",
      "Smart alerts",
      "Priority support",
    ],
  },
];

export function SubscriptionModal({ open, onOpenChange, highlightedTier = "pro" }: SubscriptionModalProps) {
  const { createCheckout, isCheckoutLoading } = useSubscription();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      onOpenChange(false);
      navigate("/auth");
      return;
    }

    const priceId = planId === "pro" ? STRIPE_PRICES.pro : STRIPE_PRICES.elite;
    setLoadingPlan(planId);
    createCheckout(priceId);
    setTimeout(() => setLoadingPlan(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 bg-card/95 backdrop-blur-xl border-border/50 overflow-hidden">
        {/* Header */}
        <div className="relative px-8 pt-8 pb-6 text-center bg-gradient-to-b from-primary/5 to-transparent">
          <div className="absolute inset-0 grid-pattern opacity-10" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 text-xs font-medium border rounded-full bg-primary/10 border-primary/20 text-primary">
              <Sparkles className="w-3 h-3" />
              Institutional-grade tools
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                Unlock the <span className="gradient-text">Professional Playbook</span>
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground mt-2">
              For the price of a gym membership, get tools used by Wall Street analysts.
            </p>
          </div>
        </div>

        {/* Plans */}
        <div className="px-6 pb-8">
          <div className="grid sm:grid-cols-2 gap-4">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const isHighlighted = plan.id === highlightedTier;
              const isLoading = loadingPlan === plan.id;

              return (
                <div
                  key={plan.id}
                  className={cn(
                    "relative rounded-xl border p-5 transition-all duration-300",
                    "bg-gradient-to-br",
                    plan.bgColor,
                    isHighlighted ? plan.borderColor : "border-border/50",
                    isHighlighted && "ring-1 ring-primary/20"
                  )}
                >
                  {plan.popular && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary rounded-full text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
                      Most Popular
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={cn("w-5 h-5", plan.color)} />
                        <h3 className="font-bold text-lg">{plan.name}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground">{plan.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold font-mono">${plan.price}</span>
                      <span className="text-xs text-muted-foreground">/mo</span>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-xs">
                        <Check className="w-3.5 h-3.5 text-gain shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isLoading || isCheckoutLoading}
                    className={cn(
                      "w-full gap-2 font-semibold",
                      isHighlighted
                        ? "bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90"
                        : ""
                    )}
                    variant={isHighlighted ? "default" : "outline"}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Get {plan.name}
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Trust signals */}
          <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-border/50">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Shield className="w-3.5 h-3.5 text-primary" />
              Cancel anytime
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="w-3.5 h-3.5 text-gain" />
              5,000+ traders
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
              Bank-level security
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
