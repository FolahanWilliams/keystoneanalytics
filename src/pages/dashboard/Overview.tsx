import { useNavigate } from "react-router-dom";
import WatchlistWidget from "@/components/dashboard/WatchlistWidget";
import NewsFeed from "@/components/dashboard/NewsFeed";
import EconomicIndicators from "@/components/dashboard/EconomicIndicators";
import { MarketStatusIndicator } from "@/components/dashboard/MarketStatusIndicator";
import { Activity, Zap, BarChart3, TrendingUp, LineChart, Brain, Globe, ArrowRight, Percent, Building } from "lucide-react";
import { motion } from "framer-motion";
import { useFredData } from "@/hooks/useFredData";

const Overview = () => {
  const navigate = useNavigate();
  const { indicators, loading: fredLoading } = useFredData();

  // Quick action cards for navigation
  const quickActions = [
    {
      title: "Analyze Stock",
      description: "Deep-dive into any ticker with AI-powered insights",
      icon: LineChart,
      path: "/dashboard/analysis",
      color: "primary",
    },
    {
      title: "AI Coach",
      description: "Get personalized market guidance and strategies",
      icon: Brain,
      path: "/dashboard/coach",
      color: "info",
    },
    {
      title: "Macro Overview",
      description: "View comprehensive economic indicators",
      icon: Globe,
      path: "/dashboard/macro",
      color: "warning",
    },
  ];

  // Market conditions indicators
  const marketConditions = [
    {
      label: "Rate Environment",
      value: fredLoading ? "..." : indicators?.find(i => i.id === 'FEDFUNDS')?.value?.toFixed(2) || "5.33",
      unit: "%",
      status: "neutral",
      description: "Fed Funds Rate",
      icon: Percent,
    },
    {
      label: "10Y Treasury",
      value: fredLoading ? "..." : indicators?.find(i => i.id === 'DGS10')?.value?.toFixed(2) || "4.28",
      unit: "%",
      status: "neutral",
      description: "10-Year Yield",
      icon: TrendingUp,
    },
    {
      label: "S&P 500 PE",
      value: fredLoading ? "..." : indicators?.find(i => i.id === 'SP500_PE')?.value?.toFixed(1) || "28.5",
      unit: "x",
      status: "elevated",
      description: "Valuation",
      icon: BarChart3,
    },
    {
      label: "Unemployment",
      value: fredLoading ? "..." : indicators?.find(i => i.id === 'UNRATE')?.value?.toFixed(1) || "3.8",
      unit: "%",
      status: "healthy",
      description: "Labor Market",
      icon: Building,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Quick Stats Row */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-4 gap-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Market Status */}
        <div className="bento-module p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="data-label mb-0.5">Market Status</p>
            <MarketStatusIndicator compact />
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

        <div className="bento-module p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-warning" />
          </div>
          <div>
            <p className="data-label">S&P 500</p>
            <p className="text-sm font-semibold font-mono text-gain tabular-nums">+0.42%</p>
          </div>
        </div>
      </motion.div>

      {/* Main Content Grid - Bento Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Market Conditions & Quick Actions - Hero Module */}
        <motion.div 
          className="lg:col-span-8"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="bento-module p-5 min-h-[480px]">
            {/* Market Conditions Header */}
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Globe className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Market Conditions</h3>
                <p className="text-xs text-muted-foreground">Real-time economic snapshot</p>
              </div>
            </div>

            {/* Market Condition Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {marketConditions.map((condition, index) => (
                <motion.div
                  key={condition.label}
                  className="glass-panel p-4 rounded-xl"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.15 + index * 0.05 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <condition.icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{condition.label}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-mono font-bold tabular-nums">{condition.value}</span>
                    <span className="text-xs text-muted-foreground">{condition.unit}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{condition.description}</p>
                </motion.div>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-border/50 my-5" />

            {/* Quick Actions Section */}
            <div className="flex items-center gap-2 mb-4">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Quick Actions</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {quickActions.map((action, index) => (
                <motion.button
                  key={action.title}
                  onClick={() => navigate(action.path)}
                  className="glass-panel-hover p-4 rounded-xl text-left group transition-all duration-200 hover:scale-[1.02]"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.25 + index * 0.05 }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      action.color === 'primary' ? 'bg-primary/10' :
                      action.color === 'info' ? 'bg-info/10' :
                      'bg-warning/10'
                    }`}>
                      <action.icon className={`w-5 h-5 ${
                        action.color === 'primary' ? 'text-primary' :
                        action.color === 'info' ? 'text-info' :
                        'text-warning'
                      }`} />
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h5 className="text-sm font-semibold mb-1">{action.title}</h5>
                  <p className="text-xs text-muted-foreground leading-relaxed">{action.description}</p>
                </motion.button>
              ))}
            </div>
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
                onSelectSymbol={(symbol) => navigate(`/dashboard/analysis?symbol=${symbol}`)} 
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
