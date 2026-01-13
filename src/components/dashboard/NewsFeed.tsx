import { Newspaper, TrendingUp, TrendingDown, Minus, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsItem {
  id: string;
  headline: string;
  source: string;
  timestamp: string;
  sentiment: "bullish" | "bearish" | "neutral";
  tickers: string[];
}

const mockNews: NewsItem[] = [
  {
    id: "1",
    headline: "Fed signals potential rate cuts in 2024, markets rally on dovish outlook",
    source: "Reuters",
    timestamp: "2 min ago",
    sentiment: "bullish",
    tickers: ["SPY", "QQQ"],
  },
  {
    id: "2",
    headline: "Bitcoin surges past $45K as institutional adoption accelerates",
    source: "CoinDesk",
    timestamp: "15 min ago",
    sentiment: "bullish",
    tickers: ["BTC", "ETH"],
  },
  {
    id: "3",
    headline: "Tesla faces production challenges amid supply chain disruptions",
    source: "Bloomberg",
    timestamp: "32 min ago",
    sentiment: "bearish",
    tickers: ["TSLA"],
  },
  {
    id: "4",
    headline: "NVIDIA reports record quarterly revenue driven by AI chip demand",
    source: "CNBC",
    timestamp: "1 hr ago",
    sentiment: "bullish",
    tickers: ["NVDA"],
  },
  {
    id: "5",
    headline: "Oil prices stabilize as OPEC+ maintains production targets",
    source: "Financial Times",
    timestamp: "2 hrs ago",
    sentiment: "neutral",
    tickers: ["USO", "XLE"],
  },
  {
    id: "6",
    headline: "Apple announces major AI integration across product lineup",
    source: "TechCrunch",
    timestamp: "3 hrs ago",
    sentiment: "bullish",
    tickers: ["AAPL"],
  },
];

const getSentimentConfig = (sentiment: NewsItem["sentiment"]) => {
  switch (sentiment) {
    case "bullish":
      return {
        icon: TrendingUp,
        label: "Bullish",
        className: "bg-gain/10 text-gain border-gain/20",
      };
    case "bearish":
      return {
        icon: TrendingDown,
        label: "Bearish",
        className: "bg-loss/10 text-loss border-loss/20",
      };
    default:
      return {
        icon: Minus,
        label: "Neutral",
        className: "bg-muted text-muted-foreground border-border",
      };
  }
};

interface NewsFeedProps {
  compact?: boolean;
}

const NewsFeed = ({ compact = false }: NewsFeedProps) => {
  const displayNews = compact ? mockNews.slice(0, 4) : mockNews;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="w-4 h-4 text-primary" />
        <h3 className="font-semibold">Market News</h3>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto scrollbar-terminal">
        {displayNews.map((news) => {
          const sentimentConfig = getSentimentConfig(news.sentiment);
          const SentimentIcon = sentimentConfig.icon;

          return (
            <article
              key={news.id}
              className="group p-4 rounded-lg bg-card/50 border border-border/50 hover:border-primary/30 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {news.headline}
                  </h4>
                  
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-muted-foreground">{news.source}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{news.timestamp}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded border",
                        sentimentConfig.className
                      )}
                    >
                      <SentimentIcon className="w-3 h-3" />
                      {sentimentConfig.label}
                    </span>
                    
                    <div className="flex gap-1">
                      {news.tickers.map((ticker) => (
                        <span
                          key={ticker}
                          className="px-1.5 py-0.5 text-xs font-mono bg-secondary rounded"
                        >
                          ${ticker}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default NewsFeed;
