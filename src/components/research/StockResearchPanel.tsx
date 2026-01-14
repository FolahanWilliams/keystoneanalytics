import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search, ExternalLink, Newspaper, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const handleResearch = async () => {
    setLoading(true);
    setError(null);
    setArticles([]);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('stock-research', {
        body: { symbol, companyName },
      });

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
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-primary" />
            Web Research
          </span>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleResearch}
            disabled={loading}
            className="h-7 text-xs"
          >
            {loading ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-3 h-3 mr-1" />
                Research {symbol}
              </>
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!hasSearched && !loading && !error && (
          <p className="text-sm text-muted-foreground text-center py-6">
            Click "Research {symbol}" to find recent news and analysis
          </p>
        )}

        {hasSearched && articles.length === 0 && !loading && !error && (
          <p className="text-sm text-muted-foreground text-center py-6">
            No recent articles found for {symbol}
          </p>
        )}

        {articles.length > 0 && (
          <ScrollArea className="h-[280px] pr-3">
            <div className="space-y-3">
              {articles.map((article, index) => (
                <a
                  key={index}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h4>
                    <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {article.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {article.description}
                    </p>
                  )}
                </a>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
