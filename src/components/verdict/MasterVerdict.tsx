import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Lock, 
  ChevronRight,
  Activity,
  BarChart3,
  MessageSquare,
  Globe,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VerdictGauge } from "./VerdictGauge";
import { VerdictResult, VerdictMetric } from "@/utils/verdictEngine";
import { useSubscription } from "@/hooks/useSubscription";
import { FinancialDisclaimer } from "@/components/common/FinancialDisclaimer";
import { cn } from "@/lib/utils";

interface MasterVerdictProps {
  verdict: VerdictResult;
  symbol: string;
  loading?: boolean;
  onUnlockClick?: () => void;
}

const layerIcons = {
  technical: Activity,
  fundamental: BarChart3,
  sentiment: MessageSquare,
  macro: Globe,
};

const layerLabels = {
  technical: 'Technical',
  fundamental: 'Fundamental',
  sentiment: 'Sentiment',
  macro: 'Macro',
};

const layerWeights = {
  technical: 40,
  fundamental: 30,
  sentiment: 20,
  macro: 10,
};

function SignalIcon({ signal }: { signal: 'bullish' | 'bearish' | 'neutral' }) {
  if (signal === 'bullish') return <TrendingUp className="w-3 h-3 text-gain" />;
  if (signal === 'bearish') return <TrendingDown className="w-3 h-3 text-loss" />;
  return <Minus className="w-3 h-3 text-warning" />;
}

function SignalCard({ metric, index }: { metric: VerdictMetric; index: number }) {
  const signalColors = {
    bullish: 'border-l-gain bg-gain/5',
    bearish: 'border-l-loss bg-loss/5',
    neutral: 'border-l-warning bg-warning/5',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.8 + index * 0.1, duration: 0.3 }}
      className={cn(
        "p-3 rounded-xl border-l-2 transition-all hover:translate-x-1",
        signalColors[metric.signal]
      )}
    >
      <div className="flex items-start gap-2.5">
        <SignalIcon signal={metric.signal} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-medium text-sm text-foreground">{metric.name}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground uppercase tracking-wide">
              {layerLabels[metric.layer]}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{metric.description}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono text-sm font-semibold tabular-nums">{metric.score}</div>
        </div>
      </div>
    </motion.div>
  );
}

function LayerBreakdown({ verdict }: { verdict: VerdictResult }) {
  const layers = ['technical', 'fundamental', 'sentiment', 'macro'] as const;

  return (
    <div className="space-y-2">
      {layers.map((layer, i) => {
        const Icon = layerIcons[layer];
        const score = verdict.layerScores[layer];
        const weight = layerWeights[layer];
        
        const getBarColor = (s: number) => {
          if (s >= 60) return 'bg-gain';
          if (s >= 40) return 'bg-warning';
          return 'bg-loss';
        };
        
        return (
          <motion.div
            key={layer}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.08, duration: 0.3 }}
            className="flex items-center gap-3"
          >
            <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-muted/50">
              <Icon className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-foreground">{layerLabels[layer]}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{weight}%</span>
                  <span className="font-mono text-xs font-semibold w-6 text-right tabular-nums">{score}</span>
                </div>
              </div>
              <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                <motion.div
                  className={cn("h-full rounded-full", getBarColor(score))}
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                  transition={{ delay: 0.5 + i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function LockedOverlay({ onUnlockClick }: { onUnlockClick?: () => void }) {
  return (
    <div className="absolute inset-0 backdrop-blur-[2px] bg-background/70 rounded-xl flex flex-col items-center justify-center z-10">
      <Lock className="w-6 h-6 text-muted-foreground mb-2" />
      <p className="text-xs text-muted-foreground mb-3">Unlock with Pro</p>
      <Button onClick={onUnlockClick} className="btn-premium gap-1.5 h-8 text-xs">
        <Sparkles className="w-3 h-3" />
        Upgrade
      </Button>
    </div>
  );
}

export function MasterVerdict({ verdict, symbol, loading, onUnlockClick }: MasterVerdictProps) {
  const { tier } = useSubscription();
  const isPremium = tier === 'pro' || tier === 'elite';

  const signalLabel = {
    extreme_bullish: 'Strong Buy',
    bullish: 'Buy',
    neutral: 'Hold',
    bearish: 'Sell',
    extreme_bearish: 'Strong Sell',
  };

  const signalColor = {
    extreme_bullish: 'text-gain bg-gain/10',
    bullish: 'text-gain bg-gain/10',
    neutral: 'text-warning bg-warning/10',
    bearish: 'text-loss bg-loss/10',
    extreme_bearish: 'text-loss bg-loss/10',
  };

  if (loading) {
    return (
      <div className="bento-module p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
          <p className="text-xs text-muted-foreground">Calculating verdict...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bento-module overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="data-label">Master Verdict</span>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] h-5 px-1.5">
          {symbol}
        </Badge>
      </div>

      <div className="p-4 space-y-5">
        {/* Gauge Section */}
        <div className="flex flex-col items-center">
          <VerdictGauge score={verdict.score} size={220} />
          
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.3 }}
            className="flex items-center gap-2 mt-2"
          >
            <span className={cn(
              "font-semibold text-xs px-2.5 py-1 rounded-lg",
              signalColor[verdict.signal]
            )}>
              {signalLabel[verdict.signal]}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {verdict.confidence}% conf.
            </span>
          </motion.div>
        </div>

        {/* Layer Breakdown */}
        <div className="space-y-2">
          <span className="data-label">Layer Breakdown</span>
          <LayerBreakdown verdict={verdict} />
        </div>

        {/* Top Signals */}
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <span className="data-label">Top Signals</span>
            <span className="text-[9px] text-muted-foreground uppercase tracking-wide">Top 3</span>
          </div>

          <div className="space-y-1.5">
            <AnimatePresence>
              {verdict.topSignals.map((metric, i) => (
                <SignalCard key={metric.id} metric={metric} index={i} />
              ))}
            </AnimatePresence>
          </div>

          {!isPremium && <LockedOverlay onUnlockClick={onUnlockClick} />}
        </div>

        {/* CTA for non-premium */}
        {!isPremium && (
          <Button 
            variant="outline" 
            className="w-full text-xs h-9 group"
            onClick={onUnlockClick}
          >
            View all {verdict.metrics.length} metrics
            <ChevronRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        )}

        <FinancialDisclaimer variant="compact" className="mt-3" />
      </div>
    </div>
  );
}
