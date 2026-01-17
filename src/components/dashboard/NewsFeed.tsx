import { memo } from "react";
import { TrendingUp, TrendingDown, Minus, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMarketNews, NewsItem } from "@/hooks/useMarketNews";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const getSentimentConfig = (sentiment: NewsItem["sentiment"]) => {
  switch (sentiment) {
    case "bullish":
      return { color: "bg-gain", textColor: "text-gain" };
    case "bearish":
      return { color: "bg-loss", textColor: "text-loss" };
    default:
      return { color: "bg-muted-foreground", textColor: "text-muted-foreground" };
  }
};

interface NewsFeedProps {
  compact?: boolean;
}

const NewsFeed = memo(function NewsFeed({ compact = false }: NewsFeedProps) {
  const { news, loading, error, refetch } = useMarketNews("general");
  const displayNews = compact ? news.slice(0, 4) : news;

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <span className="data-label">Market News</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <span className="data-label">Market News</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <p className="text-xs text-muted-foreground">Failed to load news</p>
          <Button variant="outline" size="sm" onClick={refetch} className="h-7 text-xs gap-1.5">
            <RefreshCw className="w-3 h-3" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="data-label">Market News</span>
        <button 
          onClick={refetch}
          className="p-1 rounded-lg hover:bg-accent transition-colors"
        >
          <RefreshCw className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>

      {/* News List - Minimal Design */}
      <div className="flex-1 space-y-2 overflow-y-auto scrollbar-terminal">
        {displayNews.map((item, i) => {
          const sentimentConfig = getSentimentConfig(item.sentiment);

          return (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => item.url && window.open(item.url, "_blank")}
              className="group p-2.5 rounded-xl hover:bg-accent/50 transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-start gap-2.5">
                {/* Sentiment Dot */}
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                  sentimentConfig.color
                )} />
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {item.headline}
                  </h4>
                  
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-muted-foreground">{item.source}</span>
                    <span className="text-[10px] text-muted-foreground/50">•</span>
                    <span className="text-[10px] text-muted-foreground">{item.timestamp}</span>
                    <ExternalLink className="w-2.5 h-2.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                  </div>
                </div>
              </div>
            </motion.article>
          );
        })}
        
        {displayNews.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-8">
            <p className="text-xs text-muted-foreground">No news available</p>
          </div>
        )}
      </div>
    </div>
  );
});

export default NewsFeed;
