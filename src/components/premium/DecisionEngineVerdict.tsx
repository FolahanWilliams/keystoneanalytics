import { useState, useMemo } from "react";
import { 
  Lock, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle,
  Sparkles,
  ChevronRight,
  BarChart3,
  Zap,
  Shield,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/hooks/useSubscription";
import { SubscriptionModal } from "@/components/premium/SubscriptionModal";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface DecisionEngineVerdictProps {
  symbol: string;
  price?: number;
  change?: number;
  changePercent?: number;
}

// Mock analysis data - in production, this would come from an AI/analysis API
function generateAnalysisData(symbol: string, price: number = 180, changePercent: number = 1.5) {
  const isPositive = changePercent >= 0;
  const signalStrength = Math.abs(changePercent) * 20 + Math.random() * 30;
  
  const signals = ["Strong Buy", "Buy", "Hold", "Sell", "Strong Sell"];
  const signalIndex = isPositive 
    ? (signalStrength > 50 ? 0 : 1)
    : (signalStrength > 50 ? 4 : 3);
  
  return {
    signal: signals[signalIndex],
    signalScore: Math.min(95, Math.max(25, signalStrength + 40)),
    isPositive: signalIndex <= 1,
    catalysts: [
      `${symbol} showing strong institutional accumulation patterns`,
      "RSI divergence indicates potential reversal opportunity",
      "Earnings momentum exceeds sector average by 23%",
    ],
    rationale: `Based on our proprietary 47-factor analysis model, ${symbol} demonstrates compelling technical and fundamental characteristics. The stock is currently trading at a ${isPositive ? 'premium' : 'discount'} to its intrinsic value, with key support levels holding strong. Volume analysis suggests smart money is ${isPositive ? 'accumulating' : 'distributing'} shares ahead of the next catalyst event.`,
    actionPlan: [
      `Entry Zone: $${(price * 0.98).toFixed(2)} - $${(price * 1.01).toFixed(2)}`,
      `Target 1: $${(price * 1.08).toFixed(2)} (+8%)`,
      `Target 2: $${(price * 1.15).toFixed(2)} (+15%)`,
      `Stop Loss: $${(price * 0.94).toFixed(2)} (-6%)`,
      `Risk/Reward Ratio: 2.5:1`,
    ],
    riskLevel: isPositive ? "Moderate" : "Elevated",
    timeHorizon: "2-4 weeks",
  };
}

export function DecisionEngineVerdict({ 
  symbol, 
  price = 180, 
  change = 2.45, 
  changePercent = 1.38 
}: DecisionEngineVerdictProps) {
  const { isPro, isElite, tier } = useSubscription();
  const [showModal, setShowModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  // Check if user is premium (pro or elite)
  const hasPremiumAccess = isPro || isElite;
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setIsAuthenticated(!!data.user);
    });
  }, []);

  // Generate analysis data
  const analysis = useMemo(() => 
    generateAnalysisData(symbol, price, changePercent), 
    [symbol, price, changePercent]
  );

  const SignalIcon = analysis.isPositive ? TrendingUp : TrendingDown;
  const signalColor = analysis.isPositive ? "text-gain" : "text-loss";
  const signalBg = analysis.isPositive ? "bg-gain/10" : "bg-loss/10";

  return (
    <>
      <div className="glass-panel rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                Decision Engine Verdict
                <span className="premium-badge text-[10px]">
                  <Sparkles className="w-3 h-3" />
                  AI Powered
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">
                47-factor analysis for {symbol}
              </p>
            </div>
          </div>
          
          {hasPremiumAccess && (
            <div className="text-xs text-muted-foreground">
              Last updated: Just now
            </div>
          )}
        </div>

        <div className="p-6">
          {/* Signal Display - Always visible */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-16 h-16 rounded-xl flex items-center justify-center",
                signalBg
              )}>
                <SignalIcon className={cn("w-8 h-8", signalColor)} />
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Technical Signal</div>
                <div className={cn("text-2xl font-bold", signalColor)}>
                  {analysis.signal}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-muted-foreground mb-1">Signal Strength</div>
              <div className="text-3xl font-bold font-mono">
                {analysis.signalScore.toFixed(0)}
                <span className="text-base text-muted-foreground">/100</span>
              </div>
            </div>
          </div>

          {/* Catalysts - Always visible */}
          <div className="mb-6">
            <div className="text-sm font-medium mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-warning" />
              Key Catalysts Detected
            </div>
            <div className="text-sm text-muted-foreground">
              Our engine has identified <span className="text-primary font-semibold">3 key catalysts</span> for this ticker.
            </div>
          </div>

          {/* Premium Content - Blurred for non-premium users */}
          <div className="relative">
            {/* Blurred content */}
            <div className={cn(
              "space-y-6 transition-all duration-300",
              !hasPremiumAccess && "blur-md select-none pointer-events-none"
            )}>
              {/* Rationale Section */}
              <div className="rounded-lg bg-secondary/30 p-4">
                <div className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-info" />
                  Analysis Rationale
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {analysis.rationale}
                </p>
              </div>

              {/* Action Plan Section */}
              <div className="rounded-lg bg-secondary/30 p-4">
                <div className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Professional Action Plan
                </div>
                <div className="space-y-2">
                  {analysis.actionPlan.map((action, i) => (
                    <div 
                      key={i} 
                      className="flex items-center gap-2 text-sm font-mono"
                    >
                      <ChevronRight className="w-3 h-3 text-primary shrink-0" />
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-secondary/30 p-4">
                  <div className="text-xs text-muted-foreground mb-1">Risk Level</div>
                  <div className={cn(
                    "font-semibold flex items-center gap-2",
                    analysis.riskLevel === "Moderate" ? "text-warning" : "text-loss"
                  )}>
                    <AlertTriangle className="w-4 h-4" />
                    {analysis.riskLevel}
                  </div>
                </div>
                <div className="rounded-lg bg-secondary/30 p-4">
                  <div className="text-xs text-muted-foreground mb-1">Time Horizon</div>
                  <div className="font-semibold">{analysis.timeHorizon}</div>
                </div>
              </div>
            </div>

            {/* Premium Gate Overlay */}
            {!hasPremiumAccess && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="glass-panel rounded-xl p-6 max-w-sm mx-4 text-center border-primary/30 shadow-xl shadow-primary/10">
                  {/* Lock icon with glow */}
                  <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4 animate-glow-pulse">
                    <Lock className="w-7 h-7 text-primary" />
                  </div>
                  
                  {/* Hook copy */}
                  <h4 className="text-lg font-bold mb-2">
                    Unlock the Professional Playbook
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Our engine has identified <span className="text-primary font-semibold">3 key catalysts</span> for this ticker with a complete action plan.
                  </p>
                  
                  {/* Progress bar showing locked content */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Analysis Progress</span>
                      <span className="text-primary font-medium">30%</span>
                    </div>
                    <Progress value={30} className="h-2" />
                    <div className="text-[10px] text-muted-foreground mt-1">
                      70% of analysis locked
                    </div>
                  </div>
                  
                  {/* CTA Button */}
                  <Button 
                    onClick={() => setShowModal(true)}
                    className="w-full gap-2 bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 font-semibold"
                  >
                    Get Full Access - $19/mo
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  
                  {/* Trust microcopy */}
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      <span className="font-semibold text-foreground">Stop interpreting data. Start executing strategy.</span>
                      <br />
                      Join 5,000+ disciplined investors using PulseTerminal.
                    </p>
                    <div className="flex items-center justify-center gap-1.5 mt-2 text-[10px] text-muted-foreground">
                      <Shield className="w-3 h-3" />
                      Cancel anytime • Bank-level security
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subscription Modal */}
      <SubscriptionModal 
        open={showModal} 
        onOpenChange={setShowModal}
        highlightedTier="pro"
      />
    </>
  );
}
