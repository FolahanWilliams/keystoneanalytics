import { Newspaper, TrendingUp, TrendingDown, Minus, ExternalLink, Loader2, RefreshCw, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMarketNews, NewsItem } from "@/hooks/useMarketNews";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const getSentimentConfig = (sentiment: NewsItem["sentiment"]) => {
  switch (sentiment) {
    case "bullish":
      return {
        icon: TrendingUp,
        label: "Bullish",
        className: "bg-gain/15 text-gain border-gain/30",
      };
    case "bearish":
      return {
        icon: TrendingDown,
        label: "Bearish",
        className: "bg-loss/15 text-loss border-loss/30",
      };
    default:
      return {
        icon: Minus,
        label: "Neutral",
        className: "bg-muted/50 text-muted-foreground border-border",
      };
  }
};

interface NewsFeedProps {
  compact?: boolean;
}

const NewsFeed = ({ compact = false }: NewsFeedProps) => {
  const { news, loading, error, refetch } = useMarketNews("general");
  const displayNews = compact ? news.slice(0, 5) : news;
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const handleImageError = (id: string) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <Newspaper className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">Market News</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <Newspaper className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">Market News</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <p className="text-muted-foreground text-sm">Failed to load news</p>
          <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">Market News</h3>
        </div>
        <button 
          onClick={refetch}
          className="p-1.5 rounded-md hover:bg-secondary/80 transition-colors"
          title="Refresh news"
        >
          <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto scrollbar-terminal pr-1">
        {displayNews.map((item) => {
          const sentimentConfig = getSentimentConfig(item.sentiment);
          const SentimentIcon = sentimentConfig.icon;
          const hasImage = item.image && !imageErrors[item.id];

          return (
            <article
              key={item.id}
              onClick={() => item.url && window.open(item.url, "_blank")}
              className="group p-3 rounded-lg bg-card/30 border border-border/30 hover:border-primary/40 hover:bg-card/60 transition-all cursor-pointer"
            >
              <div className="flex gap-3">
                {/* Thumbnail */}
                {!compact && hasImage && (
                  <div className="flex-shrink-0 w-20 h-16 rounded-md overflow-hidden bg-secondary/50">
                    <img
                      src={item.image}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(item.id)}
                    />
                  </div>
                )}
                {!compact && !hasImage && (
                  <div className="flex-shrink-0 w-20 h-16 rounded-md bg-secondary/30 flex items-center justify-center">
                    <Image className="w-6 h-6 text-muted-foreground/30" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {item.headline}
                  </h4>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">{item.source}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md border",
                        sentimentConfig.className
                      )}
                    >
                      <SentimentIcon className="w-3 h-3" />
                      {sentimentConfig.label}
                    </span>
                    
                    {item.tickers.length > 0 && (
                      <div className="flex gap-1">
                        {item.tickers.slice(0, 2).map((ticker) => (
                          <span
                            key={ticker}
                            className="px-1.5 py-0.5 text-xs font-mono bg-secondary/80 rounded text-muted-foreground"
                          >
                            ${ticker}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
        
        {displayNews.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-8">
            <p className="text-muted-foreground text-sm">No news available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsFeed;
