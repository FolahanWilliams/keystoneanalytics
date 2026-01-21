import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search, ExternalLink, Newspaper, AlertCircle, Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { SubscriptionModal } from "@/components/premium/SubscriptionModal";

interface Article {
  title: string;
  url: string;
  description: string;
  content: string;
}

interface StockResearchPanelProps {
  symbol: string;
  companyName?: string;
  className?: string;
}

export function StockResearchPanel({ symbol, companyName, className }: StockResearchPanelProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [premiumRequired, setPremiumRequired] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const handleResearch = async () => {
    setLoading(true);
    setError(null);
    setArticles([]);
    setPremiumRequired(false);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('stock-research', {
        body: { symbol, companyName },
      });

      // Handle 403 premium_required response
      if (data?.error === 'premium_required') {
        setPremiumRequired(true);
        setHasSearched(true);
        return;
      }

      if (fnError) throw fnError;
      if (!data?.success) throw new Error(data?.error || 'Research failed');

      setArticles(data.articles || []);
      setHasSearched(true);
    } catch (err) {
      console.error('Research error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch research');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={cn("glass-panel", className)}>
      <CardHeader className="p-3 pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5">
            <Newspaper className="w-3.5 h-3.5 text-primary" />
            Web Research
          </span>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleResearch}
            disabled={loading}
            className="h-6 text-[10px] px-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-2.5 h-2.5 mr-1 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-2.5 h-2.5 mr-1" />
                Research
              </>
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        {error && (
          <div className="flex items-center gap-2 text-destructive text-xs p-2 bg-destructive/10 rounded-lg">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!hasSearched && !loading && !error && (
          <p className="text-xs text-muted-foreground text-center py-4">
            Click "Research" to find recent news for {symbol}
          </p>
        )}

        {premiumRequired && (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="p-2 rounded-full bg-primary/10">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Pro Feature</p>
              <p className="text-xs text-muted-foreground mt-1">
                Web research requires a Pro subscription
              </p>
            </div>
            <Button 
              size="sm" 
              onClick={() => setShowSubscriptionModal(true)}
              className="gap-1.5"
            >
              <Sparkles className="w-3 h-3" />
              Upgrade to Pro
            </Button>
          </div>
        )}

        {hasSearched && articles.length === 0 && !loading && !error && !premiumRequired && (
          <p className="text-xs text-muted-foreground text-center py-4">
            No recent articles found for {symbol}
          </p>
        )}

        {articles.length > 0 && (
          <ScrollArea className="h-[180px] pr-2">
            <div className="space-y-2">
              {articles.map((article, index) => (
                <a
                  key={index}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-medium line-clamp-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h4>
                    <ExternalLink className="w-2.5 h-2.5 text-muted-foreground shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {article.description && (
                    <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
                      {article.description}
                    </p>
                  )}
                </a>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      <SubscriptionModal 
        open={showSubscriptionModal} 
        onOpenChange={setShowSubscriptionModal} 
      />
    </Card>
  );
}
