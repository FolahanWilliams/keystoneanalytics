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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  if (signal === 'bullish') return <TrendingUp className="w-3.5 h-3.5 text-[hsl(var(--gain))]" />;
  if (signal === 'bearish') return <TrendingDown className="w-3.5 h-3.5 text-[hsl(var(--loss))]" />;
  return <Minus className="w-3.5 h-3.5 text-[hsl(var(--warning))]" />;
}

function SignalCard({ metric, index }: { metric: VerdictMetric; index: number }) {
  const signalColors = {
    bullish: 'border-[hsl(var(--gain)/0.3)] bg-[hsl(var(--gain)/0.05)]',
    bearish: 'border-[hsl(var(--loss)/0.3)] bg-[hsl(var(--loss)/0.05)]',
    neutral: 'border-[hsl(var(--warning)/0.3)] bg-[hsl(var(--warning)/0.05)]',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1 + index * 0.15, duration: 0.4 }}
      className={cn(
        "p-3 rounded-lg border transition-all hover:scale-[1.02]",
        signalColors[metric.signal]
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <SignalIcon signal={metric.signal} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm text-foreground">{metric.name}</span>
            <Badge 
              variant="outline" 
              className={cn(
                "text-[10px] px-1.5 py-0 h-4",
                metric.signal === 'bullish' && 'text-[hsl(var(--gain))] border-[hsl(var(--gain)/0.3)]',
                metric.signal === 'bearish' && 'text-[hsl(var(--loss))] border-[hsl(var(--loss)/0.3)]',
                metric.signal === 'neutral' && 'text-[hsl(var(--warning))] border-[hsl(var(--warning)/0.3)]'
              )}
            >
              {layerLabels[metric.layer]}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{metric.description}</p>
        </div>
        <div className="text-right">
          <div className="font-mono text-sm font-medium tabular-nums">
            {metric.score}
          </div>
          <div className="text-[10px] text-muted-foreground">score</div>
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
        
        return (
          <motion.div
            key={layer}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.1, duration: 0.3 }}
            className="flex items-center gap-3"
          >
            <div className="w-6 h-6 rounded flex items-center justify-center bg-muted/50">
              <Icon className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">{layerLabels[layer]}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{weight}%</span>
                  <span className="font-mono text-xs font-medium w-6 text-right">{score}</span>
                </div>
              </div>
              <Progress 
                value={score} 
                className="h-1.5"
                style={{
                  '--progress-background': score >= 60 
                    ? 'hsl(var(--gain))' 
                    : score >= 40 
                      ? 'hsl(var(--warning))' 
                      : 'hsl(var(--loss))'
                } as React.CSSProperties}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function LockedOverlay({ onUnlockClick }: { onUnlockClick?: () => void }) {
  return (
    <div className="absolute inset-0 backdrop-blur-sm bg-background/60 rounded-lg flex flex-col items-center justify-center z-10">
      <Lock className="w-8 h-8 text-muted-foreground mb-3" />
      <p className="text-sm text-muted-foreground mb-4 text-center px-4">
        Unlock detailed signal breakdown with Pro
      </p>
      <Button
        onClick={onUnlockClick}
        className="btn-premium gap-2"
        size="sm"
      >
        <Sparkles className="w-4 h-4" />
        Unlock with Pro
      </Button>
    </div>
  );
}

export function MasterVerdict({ verdict, symbol, loading, onUnlockClick }: MasterVerdictProps) {
  const { tier } = useSubscription();
  const isPremium = tier === 'pro' || tier === 'elite';

  const signalLabel = {
    extreme_bullish: 'Extreme Bullish',
    bullish: 'Bullish',
    neutral: 'Neutral',
    bearish: 'Bearish',
    extreme_bearish: 'Extreme Bearish',
  };

  const signalColor = {
    extreme_bullish: 'text-[hsl(var(--gain))]',
    bullish: 'text-[hsl(var(--gain))]',
    neutral: 'text-[hsl(var(--warning))]',
    bearish: 'text-[hsl(var(--loss))]',
    extreme_bearish: 'text-[hsl(var(--loss))]',
  };

  if (loading) {
    return (
      <Card className="relative bg-[hsl(240,10%,4%)] border-border/50">
        <CardContent className="py-12 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">Calculating verdict...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative bg-[hsl(240,10%,4%)] border-border/50 overflow-hidden">
      {/* Subtle glow effect based on verdict */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background: verdict.score >= 60 
            ? 'radial-gradient(ellipse at 50% 0%, hsl(142, 76%, 45%, 0.15), transparent 70%)'
            : verdict.score <= 40
              ? 'radial-gradient(ellipse at 50% 0%, hsl(0, 84%, 60%, 0.15), transparent 70%)'
              : 'radial-gradient(ellipse at 50% 0%, hsl(45, 93%, 47%, 0.1), transparent 70%)'
        }}
      />

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Master Verdict
          </CardTitle>
          <Badge variant="outline" className="font-mono text-xs">
            {symbol}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Multi-layer analysis with weighted signals
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Gauge Section */}
        <div className="flex flex-col items-center">
          <VerdictGauge score={verdict.score} size={260} />
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.4 }}
            className="flex items-center gap-2 mt-2"
          >
            <Badge 
              variant="outline" 
              className={cn(
                "font-semibold text-sm px-3 py-1",
                signalColor[verdict.signal]
              )}
            >
              {signalLabel[verdict.signal]}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {verdict.confidence}% confidence
            </span>
          </motion.div>
        </div>

        {/* Layer Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Layer Breakdown
            </h4>
          </div>
          <LayerBreakdown verdict={verdict} />
        </div>

        {/* Top Signals Section */}
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Strongest Signals
            </h4>
            <span className="text-[10px] text-muted-foreground">Top 3</span>
          </div>

          <div className="space-y-2">
            <AnimatePresence>
              {verdict.topSignals.map((metric, i) => (
                <SignalCard key={metric.id} metric={metric} index={i} />
              ))}
            </AnimatePresence>
          </div>

          {/* Premium gate overlay */}
          {!isPremium && (
            <LockedOverlay onUnlockClick={onUnlockClick} />
          )}
        </div>

        {/* CTA for non-premium */}
        {!isPremium && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.4 }}
            className="pt-2"
          >
            <Button 
              variant="outline" 
              className="w-full text-sm group"
              onClick={onUnlockClick}
            >
              View all {verdict.metrics.length} metrics
              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </motion.div>
        )}

        {/* Financial Disclaimer */}
        <FinancialDisclaimer variant="compact" className="mt-4" />
      </CardContent>
    </Card>
  );
}
