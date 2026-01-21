import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Users, 
  BarChart3,
  Percent,
  Calendar,
  Globe,
  Lock
} from "lucide-react";
import { useFundamentals } from "@/hooks/useFundamentals";

interface CompanyFundamentalsProps {
  symbol: string;
}

const formatLargeNumber = (num: number | null | undefined): string => {
  if (num == null || isNaN(num)) return "N/A";
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toLocaleString()}`;
};

const formatPercent = (num: number | null | undefined): string => {
  if (num == null || isNaN(num)) return "N/A";
  return `${(num * 100).toFixed(2)}%`;
};

const StatItem = ({ 
  icon: Icon, 
  label, 
  value, 
  subValue,
  isLocked = false
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number; 
  subValue?: string;
  isLocked?: boolean;
}) => (
  <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors">
    <div className="p-2 rounded-md bg-primary/10">
      <Icon className="w-4 h-4 text-primary" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      {isLocked ? (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Lock className="w-3 h-3" />
          <span className="text-xs font-medium">Pro</span>
        </div>
      ) : (
        <>
          <p className="font-semibold text-sm truncate">{value}</p>
          {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
        </>
      )}
    </div>
  </div>
);

export const CompanyFundamentals = ({ symbol }: CompanyFundamentalsProps) => {
  const { data: fundamentals, loading: isLoading, error, isFieldLocked } = useFundamentals(symbol);

  if (isLoading) {
    return (
      <Card className="glass-panel">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Company Fundamentals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error || !fundamentals) {
    return (
      <Card className="glass-panel">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Company Fundamentals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unable to load fundamentals data for {symbol}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-panel">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              {fundamentals.companyName || symbol}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {fundamentals.sector && (
                <Badge variant="secondary" className="text-xs">
                  {fundamentals.sector}
                </Badge>
              )}
              {fundamentals.exchange && (
                <Badge variant="outline" className="text-xs">
                  {fundamentals.exchange}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <StatItem
            icon={DollarSign}
            label="Market Cap"
            value={formatLargeNumber(fundamentals.marketCap)}
          />
          <StatItem
            icon={BarChart3}
            label="P/E Ratio"
            value={fundamentals.peRatio?.toFixed(2) || "N/A"}
          />
          <StatItem
            icon={TrendingUp}
            label="EPS"
            value={fundamentals.eps ? `$${fundamentals.eps.toFixed(2)}` : "N/A"}
          />
          <StatItem
            icon={DollarSign}
            label="Revenue"
            value={formatLargeNumber(fundamentals.revenue)}
          />
          <StatItem
            icon={Percent}
            label="Profit Margin"
            value={formatPercent(fundamentals.profitMargin)}
            isLocked={isFieldLocked('profitMargin')}
          />
          <StatItem
            icon={TrendingUp}
            label="Net Income"
            value={formatLargeNumber(fundamentals.netIncome)}
          />
          <StatItem
            icon={BarChart3}
            label="ROE"
            value={fundamentals.roe ? `${fundamentals.roe.toFixed(2)}%` : "N/A"}
            isLocked={isFieldLocked('roe')}
          />
          <StatItem
            icon={BarChart3}
            label="Debt/Equity"
            value={fundamentals.debtToEquity?.toFixed(2) || "N/A"}
            isLocked={isFieldLocked('debtToEquity')}
          />
          {fundamentals.dividendYield != null && fundamentals.dividendYield > 0 && (
            <StatItem
              icon={Calendar}
              label="Dividend Yield"
              value={`${fundamentals.dividendYield.toFixed(2)}%`}
            />
          )}
          {fundamentals.beta && (
            <StatItem
              icon={BarChart3}
              label="Beta"
              value={fundamentals.beta.toFixed(2)}
            />
          )}
        </div>
        
        {fundamentals.industry && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Industry:</span> {fundamentals.industry}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
