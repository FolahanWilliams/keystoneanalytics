import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import AdvancedChart from "@/components/charts/AdvancedChart";
import WatchlistWidget from "@/components/dashboard/WatchlistWidget";
import NewsFeed from "@/components/dashboard/NewsFeed";
import EconomicIndicators from "@/components/dashboard/EconomicIndicators";
import { BentoModule, BentoGrid, BentoStat } from "@/components/ui/bento-module";
import { Activity, Zap, BarChart3, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface OutletContextType {
  urlSymbol?: string | null;
}

const Overview = () => {
  const context = useOutletContext<OutletContextType>();
  const urlSymbol = context?.urlSymbol;
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  
  useEffect(() => {
    if (urlSymbol) {
      setSelectedSymbol(urlSymbol);
    }
  }, [urlSymbol]);

  return (
    <div className="space-y-4">
      {/* Quick Stats Row */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="bento-module p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="data-label">Market Status</p>
            <p className="text-sm font-semibold text-foreground">Bullish Trend</p>
          </div>
        </div>
        
        <div className="bento-module p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gain/10 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-gain" />
          </div>
          <div>
            <p className="data-label">VIX Index</p>
            <p className="text-sm font-semibold font-mono text-foreground tabular-nums">18.42</p>
          </div>
        </div>
        
        <div className="bento-module p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="data-label">Fear & Greed</p>
            <p className="text-sm font-semibold text-foreground">
              65 <span className="text-muted-foreground font-normal text-xs">Greed</span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Content Grid - Bento Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Main Chart Area - Hero Module */}
        <motion.div 
          className="lg:col-span-8"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div 
            data-onboarding="chart" 
            className="bento-module p-4 min-h-[480px]"
          >
            <AdvancedChart symbol={selectedSymbol} onSymbolChange={setSelectedSymbol} />
          </div>
        </motion.div>

        {/* Sidebar Widgets */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Watchlist Module */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <div 
              data-onboarding="watchlist" 
              className="bento-module p-4 h-[260px]"
            >
              <WatchlistWidget 
                onSelectSymbol={setSelectedSymbol} 
                selectedSymbol={selectedSymbol}
              />
            </div>
          </motion.div>

          {/* News Module */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="bento-module p-4 flex-1 min-h-[220px]">
              <NewsFeed compact />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Economic Indicators Section */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        <EconomicIndicators />
        
        <div className="bento-module p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="data-label text-xs">Market Insights</h3>
          </div>
          
          <p className="text-xs text-muted-foreground mb-4">
            Economic data is sourced from the Federal Reserve Bank of St. Louis (FRED) 
            and provides institutional-grade macro indicators.
          </p>
          
          <div className="space-y-2">
            {[
              { title: "Rate Environment", desc: "Monitor Fed Funds Rate and Treasury yields for monetary policy direction." },
              { title: "Yield Curve", desc: "The 10Y-2Y spread is a key recession indicator." },
              { title: "VIX Index", desc: "Above 25 = elevated fear; below 15 = complacency." },
            ].map((item) => (
              <div key={item.title} className="p-3 rounded-xl bg-accent/30 border border-border/50">
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Overview;
