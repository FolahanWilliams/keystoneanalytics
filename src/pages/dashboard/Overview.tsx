import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import AdvancedChart from "@/components/charts/AdvancedChart";
import WatchlistWidget from "@/components/dashboard/WatchlistWidget";
import NewsFeed from "@/components/dashboard/NewsFeed";
import EconomicIndicators from "@/components/dashboard/EconomicIndicators";
import { Activity, Zap, BarChart3 } from "lucide-react";

interface OutletContextType {
  urlSymbol?: string | null;
}

const Overview = () => {
  const context = useOutletContext<OutletContextType>();
  const urlSymbol = context?.urlSymbol;
  
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  
  // Use URL symbol if provided
  useEffect(() => {
    if (urlSymbol) {
      setSelectedSymbol(urlSymbol);
    }
  }, [urlSymbol]);

  return (
    <div className="space-y-6">
      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 transition-colors cursor-pointer">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Market Status</p>
            <p className="text-lg font-semibold">Bullish Trend</p>
          </div>
        </div>
        <div className="glass-panel rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 transition-colors cursor-pointer">
          <div className="w-12 h-12 rounded-xl bg-gain/10 flex items-center justify-center">
            <Zap className="w-6 h-6 text-gain" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Volatility Index</p>
            <p className="text-lg font-semibold font-mono">18.42</p>
          </div>
        </div>
        <div className="glass-panel rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 transition-colors cursor-pointer">
          <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-info" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Fear & Greed</p>
            <p className="text-lg font-semibold">65 <span className="text-sm text-muted-foreground font-normal">Greed</span></p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Chart Area */}
        <div className="lg:col-span-8">
          {/* Advanced Chart with built-in indicators */}
          <div className="glass-panel rounded-xl p-6 min-h-[600px]">
            <AdvancedChart symbol={selectedSymbol} onSymbolChange={setSelectedSymbol} />
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="lg:col-span-4 space-y-6">
          {/* Watchlist */}
          <div className="glass-panel rounded-xl p-5 h-[340px]">
            <WatchlistWidget 
              onSelectSymbol={setSelectedSymbol} 
              selectedSymbol={selectedSymbol}
            />
          </div>

          {/* News Feed */}
          <div className="glass-panel rounded-xl p-5 h-[420px]">
            <NewsFeed compact />
          </div>
        </div>
      </div>

      {/* Economic Indicators Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EconomicIndicators />
        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Market Insights
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Economic data is sourced from the Federal Reserve Bank of St. Louis (FRED) 
            and provides institutional-grade macro indicators to inform your trading decisions.
          </p>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-secondary/30 border border-border/50">
              <p className="text-sm font-medium">Rate Environment</p>
              <p className="text-xs text-muted-foreground">
                Monitor Fed Funds Rate and Treasury yields to understand monetary policy direction.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/30 border border-border/50">
              <p className="text-sm font-medium">Yield Curve</p>
              <p className="text-xs text-muted-foreground">
                The 10Y-2Y spread is a key recession indicator. Inverted curve signals caution.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/30 border border-border/50">
              <p className="text-sm font-medium">VIX Index</p>
              <p className="text-xs text-muted-foreground">
                Market fear gauge. Above 25 indicates elevated fear; below 15 suggests complacency.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
