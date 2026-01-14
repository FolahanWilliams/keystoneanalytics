import { useState } from "react";
import CandlestickChart from "@/components/dashboard/CandlestickChart";
import WatchlistWidget from "@/components/dashboard/WatchlistWidget";
import NewsFeed from "@/components/dashboard/NewsFeed";
import TechnicalIndicators from "@/components/dashboard/TechnicalIndicators";
import { Activity, Zap, BarChart3 } from "lucide-react";

const Overview = () => {
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");

  return (
    <div className="space-y-6">
      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Market Status</p>
            <p className="text-lg font-semibold">Bullish Trend</p>
          </div>
        </div>
        <div className="glass-panel rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gain/10 flex items-center justify-center">
            <Zap className="w-6 h-6 text-gain" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Volatility Index</p>
            <p className="text-lg font-semibold font-mono">18.42</p>
          </div>
        </div>
        <div className="glass-panel rounded-xl p-4 flex items-center gap-4">
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
        <div className="lg:col-span-8 space-y-6">
          {/* Chart */}
          <div className="glass-panel rounded-xl p-6 h-[420px]">
            <CandlestickChart symbol={selectedSymbol} onSymbolChange={setSelectedSymbol} />
          </div>
          
          {/* Technical Indicators */}
          <div className="glass-panel rounded-xl p-6">
            <TechnicalIndicators />
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="lg:col-span-4 space-y-6">
          {/* Watchlist */}
          <div className="glass-panel rounded-xl p-5 h-[340px]">
            <WatchlistWidget />
          </div>

          {/* News Feed */}
          <div className="glass-panel rounded-xl p-5 h-[420px]">
            <NewsFeed compact />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
