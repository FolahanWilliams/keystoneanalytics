import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { StockCoachChat } from "@/components/coach/StockCoachChat";
import { MarketDataPanel } from "@/components/coach/MarketDataPanel";
import { StockSearch } from "@/components/dashboard/StockSearch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Lightbulb, ShieldCheck, Target, TrendingUp, BookOpen, Search } from "lucide-react";

const FEATURED_STOCKS = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "GOOGL", name: "Alphabet" },
  { symbol: "NVDA", name: "NVIDIA" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "AMZN", name: "Amazon" },
];

const LEARNING_TOPICS = [
  { icon: TrendingUp, title: "Understanding Trends", desc: "Learn how to identify and trade with market trends" },
  { icon: Target, title: "Risk Management", desc: "Protect your capital with proper position sizing" },
  { icon: ShieldCheck, title: "Stop-Loss Strategies", desc: "When and where to place protective stops" },
  { icon: BookOpen, title: "Reading Charts", desc: "Master candlestick patterns and technical analysis" },
];

const Coach = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSymbol = searchParams.get("symbol") || "";
  const [activeSymbol, setActiveSymbol] = useState(initialSymbol || "AAPL");
  const [showSearch, setShowSearch] = useState(false);

  const handleSymbolSelect = (symbol: string) => {
    setActiveSymbol(symbol);
    setSearchParams({ symbol });
    setShowSearch(false);
  };

  const handleSymbolMentioned = (symbol: string) => {
    setActiveSymbol(symbol);
    setSearchParams({ symbol });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                AI Stock Coach
                <Badge variant="secondary" className="text-xs font-normal">Beta</Badge>
              </h1>
              <p className="text-sm text-muted-foreground">
                Your personal trading mentor powered by real market data
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {showSearch ? (
            <div className="w-64">
              <StockSearch 
                onSelect={handleSymbolSelect}
                placeholder="Search any stock..."
                showInline
              />
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowSearch(true)}
              className="gap-2"
            >
              <Search className="w-4 h-4" />
              Search Stock
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stock Selection */}
      <div className="flex flex-wrap gap-2">
        {FEATURED_STOCKS.map(stock => (
          <Button
            key={stock.symbol}
            variant={activeSymbol === stock.symbol ? "default" : "outline"}
            size="sm"
            onClick={() => handleSymbolSelect(stock.symbol)}
            className="font-mono"
          >
            {stock.symbol}
          </Button>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Section - Takes 2 columns */}
        <div className="lg:col-span-2 h-[600px]">
          <StockCoachChat 
            initialSymbol={initialSymbol || undefined}
            onSymbolMentioned={handleSymbolMentioned}
          />
        </div>

        {/* Market Data Panel - Takes 1 column */}
        <div className="h-[600px] overflow-auto">
          <MarketDataPanel 
            symbol={activeSymbol}
            onSymbolChange={handleSymbolSelect}
          />
        </div>
      </div>

      {/* Learning Topics */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Trading Education</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Ask the coach about any of these topics to improve your trading knowledge
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {LEARNING_TOPICS.map((topic, i) => (
            <Card 
              key={i} 
              className="bg-secondary/20 border-border/50 hover:border-primary/30 transition-colors cursor-pointer group"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <topic.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm mb-1">{topic.title}</h3>
                    <p className="text-xs text-muted-foreground">{topic.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <Card className="bg-amber-500/5 border-amber-500/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-sm text-amber-600 dark:text-amber-400 mb-1">
                Educational Purpose Only
              </h3>
              <p className="text-xs text-muted-foreground">
                The AI Stock Coach provides educational guidance based on technical analysis and market data. 
                This is not financial advice. Trading involves substantial risk of loss. Past performance 
                does not guarantee future results. Always consult with a licensed financial advisor and 
                do your own research before making investment decisions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Coach;
