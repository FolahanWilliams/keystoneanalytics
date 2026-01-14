import { useFredData, FredIndicator } from "@/hooks/useFredData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle,
  Activity,
  DollarSign,
  Users,
  BarChart3,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";

const categoryIcons: Record<string, React.ReactNode> = {
  rates: <DollarSign className="w-4 h-4" />,
  employment: <Users className="w-4 h-4" />,
  sentiment: <Activity className="w-4 h-4" />,
  growth: <BarChart3 className="w-4 h-4" />,
};

interface IndicatorCardProps {
  indicator: FredIndicator;
}

function IndicatorCard({ indicator }: IndicatorCardProps) {
  const TrendIcon = indicator.trend === 'up' ? TrendingUp : 
                    indicator.trend === 'down' ? TrendingDown : Minus;
  
  const trendColor = indicator.trend === 'up' ? 'text-emerald-400' : 
                     indicator.trend === 'down' ? 'text-red-400' : 'text-muted-foreground';

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          {categoryIcons[indicator.category] || <Activity className="w-4 h-4" />}
        </div>
        <div>
          <p className="text-sm font-medium">{indicator.name}</p>
          <p className="text-xs text-muted-foreground">{indicator.date}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold tabular-nums">
          {indicator.value.toFixed(2)}
        </p>
        <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
          <TrendIcon className="w-3 h-3" />
          <span>{indicator.changePercent >= 0 ? '+' : ''}{indicator.changePercent.toFixed(2)}%</span>
        </div>
      </div>
    </div>
  );
}

interface EconomicIndicatorsProps {
  compact?: boolean;
}

export default function EconomicIndicators({ compact = false }: EconomicIndicatorsProps) {
  const { indicators, analysis, loading, error, refetch } = useFredData();

  if (loading) {
    return (
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Economic Indicators
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Economic Indicators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={refetch} className="mt-3">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayIndicators = compact ? indicators.slice(0, 4) : indicators;

  return (
    <Card className="glass-panel">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Economic Indicators
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={refetch}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Analysis Summary */}
        {analysis && (
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <BarChart3 className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    Rates: {analysis.rateEnvironment}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Labor: {analysis.laborMarket}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Sentiment: {analysis.riskSentiment}
                  </Badge>
                  {analysis.recessionSignal && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Yield Curve Inverted
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{analysis.summary}</p>
              </div>
            </div>
          </div>
        )}

        {/* Indicators Grid */}
        <div className="space-y-2">
          {displayIndicators.map((indicator) => (
            <IndicatorCard key={indicator.id} indicator={indicator} />
          ))}
        </div>

        {compact && indicators.length > 4 && (
          <p className="text-xs text-center text-muted-foreground">
            +{indicators.length - 4} more indicators
          </p>
        )}
      </CardContent>
    </Card>
  );
}
