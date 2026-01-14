import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle,
  Activity,
  DollarSign,
  Users,
  BarChart3,
  RefreshCw,
  Globe,
  Landmark,
  Percent,
  LineChart,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  GraduationCap
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface FredIndicator {
  id: string;
  name: string;
  category: string;
  value: number;
  date: string;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'flat';
  historical: { date: string; value: number }[];
}

interface MarketAnalysis {
  rateEnvironment: string;
  inflationOutlook: string;
  laborMarket: string;
  riskSentiment: string;
  yieldCurve?: string;
  recessionSignal?: boolean;
  summary: string;
}

const categoryMeta: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  rates: { icon: <Percent className="w-4 h-4" />, label: "Interest Rates", color: "text-blue-400" },
  employment: { icon: <Users className="w-4 h-4" />, label: "Employment", color: "text-emerald-400" },
  sentiment: { icon: <Activity className="w-4 h-4" />, label: "Market Sentiment", color: "text-purple-400" },
  growth: { icon: <BarChart3 className="w-4 h-4" />, label: "GDP & Growth", color: "text-amber-400" },
  inflation: { icon: <TrendingUp className="w-4 h-4" />, label: "Inflation", color: "text-red-400" },
  money: { icon: <DollarSign className="w-4 h-4" />, label: "Money Supply", color: "text-cyan-400" },
};

const indicatorDescriptions: Record<string, string> = {
  FEDFUNDS: "The interest rate at which banks lend to each other overnight. Primary tool of Fed monetary policy.",
  DGS10: "Yield on 10-year US Treasury bonds. Key benchmark for mortgage rates and economic outlook.",
  DGS2: "Yield on 2-year US Treasury bonds. Sensitive to Fed policy expectations.",
  T10Y2Y: "Difference between 10Y and 2Y yields. Negative value (inversion) historically precedes recessions.",
  UNRATE: "Percentage of labor force that is jobless and actively seeking work.",
  PAYEMS: "Total number of nonfarm payroll jobs. Key indicator of labor market health.",
  ICSA: "Weekly count of new unemployment insurance claims. Leading indicator of layoffs.",
  VIXCLS: "Measures expected stock market volatility. Known as the 'fear index'.",
  CPIAUCSL: "Consumer Price Index measuring inflation for urban consumers.",
  PCEPI: "Fed's preferred inflation measure. Tracks consumer spending prices.",
  GDP: "Total value of goods and services produced. Primary measure of economic output.",
  GDPC1: "GDP adjusted for inflation. Shows real economic growth.",
  M2SL: "Money supply including cash, checking, and savings deposits.",
  WALCL: "Total assets held by the Federal Reserve. Indicates monetary policy stance.",
  BAMLH0A0HYM2: "Spread between high-yield bonds and Treasuries. Measures credit risk appetite.",
};

function IndicatorCard({ indicator }: { indicator: FredIndicator }) {
  const TrendIcon = indicator.trend === 'up' ? TrendingUp : 
                    indicator.trend === 'down' ? TrendingDown : Minus;
  
  const trendColor = indicator.trend === 'up' ? 'text-emerald-400' : 
                     indicator.trend === 'down' ? 'text-red-400' : 'text-muted-foreground';

  const meta = categoryMeta[indicator.category] || { icon: <Activity className="w-4 h-4" />, label: indicator.category, color: "text-primary" };

  return (
    <Card className="glass-panel hover:border-primary/30 transition-all duration-300 group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn("p-2 rounded-lg bg-primary/10", meta.color)}>
              {meta.icon}
            </div>
            <div>
              <p className="text-sm font-medium leading-tight">{indicator.name}</p>
              <p className="text-xs text-muted-foreground">{indicator.date}</p>
            </div>
          </div>
          <div className={cn("flex items-center gap-1 text-xs", trendColor)}>
            <TrendIcon className="w-3 h-3" />
            <span>{indicator.changePercent >= 0 ? '+' : ''}{indicator.changePercent.toFixed(2)}%</span>
          </div>
        </div>
        
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold tabular-nums">
              {indicator.value.toFixed(2)}
              {indicator.category === 'rates' || indicator.category === 'employment' || indicator.category === 'inflation' ? '%' : ''}
            </p>
          </div>
          
          {/* Mini sparkline */}
          {indicator.historical && indicator.historical.length > 3 && (
            <div className="w-20 h-10 opacity-60 group-hover:opacity-100 transition-opacity">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={indicator.historical}>
                  <defs>
                    <linearGradient id={`spark-${indicator.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={1.5}
                    fill={`url(#spark-${indicator.id})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Tooltip description */}
        {indicatorDescriptions[indicator.id] && (
          <p className="text-[10px] text-muted-foreground mt-3 opacity-0 group-hover:opacity-100 transition-opacity line-clamp-2">
            {indicatorDescriptions[indicator.id]}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function IndicatorChart({ indicator }: { indicator: FredIndicator }) {
  const data = indicator.historical || [];
  const meta = categoryMeta[indicator.category] || { icon: <Activity className="w-4 h-4" />, label: indicator.category, color: "text-primary" };

  return (
    <Card className="glass-panel">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <div className={cn("p-1.5 rounded-lg bg-primary/10", meta.color)}>
            {meta.icon}
          </div>
          {indicator.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id={`area-${indicator.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" vertical={false} />
              <XAxis 
                dataKey="date" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={45}
                tickFormatter={(v) => v.toFixed(1)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
              />
              {indicator.id === 'T10Y2Y' && (
                <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
              )}
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill={`url(#area-${indicator.id})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {indicatorDescriptions[indicator.id]}
        </p>
      </CardContent>
    </Card>
  );
}

function MarketConditionsPanel({ analysis }: { analysis: MarketAnalysis | null }) {
  if (!analysis) return null;

  const conditions = [
    { 
      label: "Rate Environment", 
      value: analysis.rateEnvironment,
      icon: <Landmark className="w-4 h-4" />,
      color: analysis.rateEnvironment === 'restrictive' ? 'text-red-400' : 
             analysis.rateEnvironment === 'accommodative' ? 'text-emerald-400' : 'text-amber-400'
    },
    { 
      label: "Labor Market", 
      value: analysis.laborMarket,
      icon: <Users className="w-4 h-4" />,
      color: analysis.laborMarket === 'tight' ? 'text-amber-400' : 
             analysis.laborMarket === 'healthy' ? 'text-emerald-400' : 'text-red-400'
    },
    { 
      label: "Risk Sentiment", 
      value: analysis.riskSentiment,
      icon: <Activity className="w-4 h-4" />,
      color: analysis.riskSentiment === 'fearful' ? 'text-red-400' : 
             analysis.riskSentiment === 'complacent' ? 'text-amber-400' : 'text-emerald-400'
    },
    { 
      label: "Yield Curve", 
      value: analysis.yieldCurve || 'normal',
      icon: <LineChart className="w-4 h-4" />,
      color: analysis.recessionSignal ? 'text-red-400' : 'text-emerald-400'
    },
  ];

  return (
    <Card className="glass-panel col-span-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          Market Conditions Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {conditions.map((condition) => (
            <div key={condition.label} className="p-4 rounded-xl bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn("p-1.5 rounded-lg bg-primary/10", condition.color)}>
                  {condition.icon}
                </div>
                <span className="text-xs text-muted-foreground">{condition.label}</span>
              </div>
              <p className={cn("text-lg font-semibold capitalize", condition.color)}>
                {condition.value}
              </p>
            </div>
          ))}
        </div>

        {/* Recession Warning */}
        {analysis.recessionSignal && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 mb-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-destructive" />
              <div>
                <p className="font-semibold text-destructive">Yield Curve Inverted</p>
                <p className="text-sm text-muted-foreground">
                  Historically, an inverted yield curve has preceded economic recessions. Consider defensive positioning.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Info className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-medium mb-1">Economic Summary</p>
              <p className="text-sm text-muted-foreground">{analysis.summary}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MacroOverview() {
  const [indicators, setIndicators] = useState<FredIndicator[]>([]);
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fnError } = await supabase.functions.invoke("fred-data", {
        body: { series: ['FEDFUNDS', 'DGS10', 'DGS2', 'T10Y2Y', 'UNRATE', 'PAYEMS', 'ICSA', 'VIXCLS', 'CPIAUCSL', 'PCEPI', 'GDP', 'GDPC1', 'M2SL', 'WALCL', 'BAMLH0A0HYM2'] },
      });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      setIndicators(data.indicators || []);
      setAnalysis(data.analysis || null);
    } catch (err) {
      console.error("Error fetching macro data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch economic data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const groupedIndicators = indicators.reduce((acc, ind) => {
    if (!acc[ind.category]) acc[ind.category] = [];
    acc[ind.category].push(ind);
    return acc;
  }, {} as Record<string, FredIndicator[]>);

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Globe className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Macro Overview</h1>
        </div>
        <Card className="glass-panel">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-12 h-12 text-destructive/50 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchAllData} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Macro Overview</h1>
            <p className="text-sm text-muted-foreground">Federal Reserve Economic Data (FRED)</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAllData} disabled={loading}>
          <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="glass-panel p-1">
          <TabsTrigger value="overview" className="gap-2">
            <PieChart className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="rates" className="gap-2">
            <Percent className="w-4 h-4" />
            Interest Rates
          </TabsTrigger>
          <TabsTrigger value="employment" className="gap-2">
            <Users className="w-4 h-4" />
            Employment
          </TabsTrigger>
          <TabsTrigger value="charts" className="gap-2">
            <LineChart className="w-4 h-4" />
            Charts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-36" />
              ))}
            </div>
          ) : (
            <>
              <MarketConditionsPanel analysis={analysis} />
              
              {/* Key Indicators Grid */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Key Economic Indicators</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {indicators.slice(0, 8).map((indicator) => (
                    <IndicatorCard key={indicator.id} indicator={indicator} />
                  ))}
                </div>
              </div>

              {/* Additional Indicators */}
              {indicators.length > 8 && (
                <div>
                  <h2 className="text-lg font-semibold mb-4">Additional Indicators</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {indicators.slice(8).map((indicator) => (
                      <IndicatorCard key={indicator.id} indicator={indicator} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="rates" className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : (
            <>
              <Card className="glass-panel">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Landmark className="w-5 h-5 text-primary" />
                    Federal Reserve Policy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    The Federal Reserve uses interest rates as its primary tool for monetary policy. 
                    Higher rates slow economic growth and combat inflation, while lower rates stimulate borrowing and spending.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groupedIndicators.rates?.map((indicator) => (
                      <IndicatorChart key={indicator.id} indicator={indicator} />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Yield Curve Explainer */}
              <Card className="glass-panel">
                <CardHeader>
                  <CardTitle>Understanding the Yield Curve</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <ArrowUpRight className="w-6 h-6 text-emerald-400 mb-2" />
                      <p className="font-medium text-emerald-400">Normal (Upward Sloping)</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Long-term rates higher than short-term. Indicates healthy economic expectations.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <Minus className="w-6 h-6 text-amber-400 mb-2" />
                      <p className="font-medium text-amber-400">Flat</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Short and long rates similar. Transition period, uncertainty about future direction.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                      <ArrowDownRight className="w-6 h-6 text-red-400 mb-2" />
                      <p className="font-medium text-red-400">Inverted</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Short-term rates exceed long-term. Historical recession indicator.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="employment" className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : (
            <>
              <Card className="glass-panel">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Labor Market Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Employment data is crucial for understanding economic health. Strong job growth typically leads to 
                    increased consumer spending, while rising unemployment can signal economic weakness.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groupedIndicators.employment?.map((indicator) => (
                      <IndicatorChart key={indicator.id} indicator={indicator} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="charts" className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {indicators.map((indicator) => (
                <IndicatorChart key={indicator.id} indicator={indicator} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Educational Footer */}
      <Card className="glass-panel">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Why Macro Data Matters for Trading</h3>
              <p className="text-sm text-muted-foreground">
                Macroeconomic indicators provide context for market movements. Rising interest rates typically pressure 
                growth stocks, while inflation fears can boost commodity and value plays. The yield curve, VIX, and 
                employment data help gauge overall market risk. Use this data alongside technical analysis for a 
                more complete investment picture.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
