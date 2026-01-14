import { useState, useMemo, useEffect } from "react";
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
  Eye,
  Gift
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/hooks/useSubscription";
import { useDecisionEngineUsage } from "@/hooks/useDecisionEngineUsage";
import { SubscriptionModal } from "@/components/premium/SubscriptionModal";

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
  changePercent = 1.38 
}: DecisionEngineVerdictProps) {
  const { isPro, isElite } = useSubscription();
  const { 
    remainingUses, 
    hasReachedLimit, 
    hasUsedForSymbol,
    recordUsage, 
    isLoading: usageLoading,
    maxFreeUses 
  } = useDecisionEngineUsage(symbol);
  
  const [showModal, setShowModal] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  
  // Check if user is premium (pro or elite)
  const hasPremiumAccess = isPro || isElite;
  
  // Determine if content should be shown
  const shouldShowContent = hasPremiumAccess || unlocked || hasUsedForSymbol;

  // Auto-unlock if previously used for this symbol
  useEffect(() => {
    if (hasUsedForSymbol && !unlocked) {
      setUnlocked(true);
    }
  }, [hasUsedForSymbol, unlocked]);

  // Handle unlock action
  const handleUnlock = () => {
    if (!hasReachedLimit) {
      recordUsage();
      setUnlocked(true);
    }
  };

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
        <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-sm flex items-center gap-2">
                Decision Engine
                <span className="premium-badge text-[9px] px-1.5 py-0.5">
                  <Sparkles className="w-2.5 h-2.5" />
                  AI
                </span>
              </h3>
              <p className="text-[10px] text-muted-foreground">
                47-factor analysis for {symbol}
              </p>
            </div>
          </div>
          
          {/* Show remaining uses for non-premium users */}
          {!hasPremiumAccess && !usageLoading && (
            <div className="flex items-center gap-1.5 text-[10px]">
              <Gift className="w-3 h-3 text-primary" />
              <span className="text-muted-foreground">
                {remainingUses}/{maxFreeUses} free
              </span>
            </div>
          )}
          
          {hasPremiumAccess && (
            <div className="text-[10px] text-muted-foreground">
              Just now
            </div>
          )}
        </div>

        <div className="p-4">
          {/* Signal Display - Always visible */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center",
                signalBg
              )}>
                <SignalIcon className={cn("w-6 h-6", signalColor)} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Technical Signal</div>
                <div className={cn("text-lg font-bold", signalColor)}>
                  {analysis.signal}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Strength</div>
              <div className="text-2xl font-bold font-mono">
                {analysis.signalScore.toFixed(0)}
                <span className="text-sm text-muted-foreground">/100</span>
              </div>
            </div>
          </div>

          {/* Catalysts - Always visible */}
          <div className="mb-4">
            <div className="text-xs font-medium mb-1 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-warning" />
              Key Catalysts Detected
            </div>
            <div className="text-xs text-muted-foreground">
              Our engine has identified <span className="text-primary font-semibold">3 key catalysts</span> for this ticker.
            </div>
          </div>

          {/* Premium Content - Blurred for non-premium users without trial */}
          <div className="relative">
            {/* Blurred content */}
            <div className={cn(
              "space-y-3 transition-all duration-300",
              !shouldShowContent && "blur-md select-none pointer-events-none"
            )}>
              {/* Rationale Section */}
              <div className="rounded-lg bg-secondary/30 p-3">
                <div className="text-xs font-medium mb-1.5 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-info" />
                  Analysis Rationale
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {analysis.rationale}
                </p>
              </div>

              {/* Action Plan Section */}
              <div className="rounded-lg bg-secondary/30 p-3">
                <div className="text-xs font-medium mb-2 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-primary" />
                  Action Plan
                </div>
                <div className="space-y-1">
                  {analysis.actionPlan.map((action, i) => (
                    <div 
                      key={i} 
                      className="flex items-center gap-1.5 text-xs font-mono"
                    >
                      <ChevronRight className="w-2.5 h-2.5 text-primary shrink-0" />
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-secondary/30 p-2.5">
                  <div className="text-[10px] text-muted-foreground mb-0.5">Risk Level</div>
                  <div className={cn(
                    "text-sm font-semibold flex items-center gap-1.5",
                    analysis.riskLevel === "Moderate" ? "text-warning" : "text-loss"
                  )}>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {analysis.riskLevel}
                  </div>
                </div>
                <div className="rounded-lg bg-secondary/30 p-2.5">
                  <div className="text-[10px] text-muted-foreground mb-0.5">Time Horizon</div>
                  <div className="text-sm font-semibold">{analysis.timeHorizon}</div>
                </div>
              </div>
            </div>

            {/* Gate Overlay - for users without access */}
            {!shouldShowContent && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="glass-panel rounded-xl p-5 max-w-sm mx-4 text-center border-primary/30 shadow-xl shadow-primary/10">
                  {/* Different display based on remaining uses */}
                  {!hasReachedLimit ? (
                    // Free trial available
                    <>
                      <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-3">
                        <Gift className="w-6 h-6 text-primary" />
                      </div>
                      
                      <h4 className="text-base font-bold mb-2">
                        Try the Decision Engine Free
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Get <span className="text-primary font-semibold">{remainingUses} free analyses</span> to experience our AI-powered insights.
                      </p>
                      
                      {/* Progress showing remaining uses */}
                      <div className="mb-4">
                        <Progress 
                          value={(remainingUses / maxFreeUses) * 100} 
                          className="h-2" 
                        />
                        <div className="text-[10px] text-muted-foreground mt-1">
                          {remainingUses} of {maxFreeUses} free uses remaining
                        </div>
                      </div>
                      
                      {/* Unlock Button */}
                      <Button 
                        onClick={handleUnlock}
                        className="w-full gap-2 bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 font-semibold"
                      >
                        <Sparkles className="w-4 h-4" />
                        Unlock Analysis for {symbol}
                      </Button>
                      
                      <p className="text-[10px] text-muted-foreground mt-3">
                        No credit card required
                      </p>
                    </>
                  ) : (
                    // Free trial exhausted
                    <>
                      <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-3 animate-glow-pulse">
                        <Lock className="w-6 h-6 text-primary" />
                      </div>
                      
                      <h4 className="text-base font-bold mb-2">
                        Unlock the Professional Playbook
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        You've used all {maxFreeUses} free analyses. Upgrade to get unlimited access.
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
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                          <span className="font-semibold text-foreground">Stop interpreting data. Start executing strategy.</span>
                        </p>
                        <div className="flex items-center justify-center gap-1.5 mt-1.5 text-[10px] text-muted-foreground">
                          <Shield className="w-3 h-3" />
                          Cancel anytime • Bank-level security
                        </div>
                      </div>
                    </>
                  )}
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
