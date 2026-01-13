import { TrendingUp, TrendingDown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

const marketIndices: MarketIndex[] = [
  { name: "S&P 500", value: 4789.25, change: 12.45, changePercent: 0.26 },
  { name: "NASDAQ", value: 15023.50, change: -45.30, changePercent: -0.30 },
  { name: "DOW", value: 37562.80, change: 85.20, changePercent: 0.23 },
  { name: "BTC/USD", value: 45230.50, change: 1250.30, changePercent: 2.84 },
];

const MarketOverview = () => {
  return (
    <div className="w-full border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6 overflow-x-auto scrollbar-terminal">
          {marketIndices.map((index) => {
            const isPositive = index.change >= 0;
            
            return (
              <div key={index.name} className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-sm font-medium text-muted-foreground">{index.name}</span>
                <span className="font-mono text-sm font-semibold">
                  {index.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span
                  className={cn(
                    "flex items-center gap-0.5 font-mono text-xs",
                    isPositive ? "text-gain" : "text-loss"
                  )}
                >
                  {isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {isPositive ? "+" : ""}
                  {index.changePercent.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
          <Clock className="w-4 h-4" />
          <span className="font-mono">
            {new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
          <span className="text-xs">EST</span>
        </div>
      </div>
    </div>
  );
};

export default MarketOverview;
