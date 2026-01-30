import { useApiHealth, ProviderName } from '@/hooks/useApiHealth';
import { AlertTriangle, RefreshCw, X, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const providerDisplayNames: Record<ProviderName, string> = {
  'market-data': 'Market Data',
  'ai-features': 'AI Features',
  'news': 'News Feed',
  'fundamentals': 'Company Data',
};

export function ApiStatusBanner() {
  const { globalStatus, getDegradedProviders, getRateLimitedProviders } = useApiHealth();
  const [isDismissed, setIsDismissed] = useState(false);
  const [lastStatus, setLastStatus] = useState(globalStatus);
  
  // Reset dismissed state when status changes
  useEffect(() => {
    if (globalStatus !== lastStatus) {
      setIsDismissed(false);
      setLastStatus(globalStatus);
    }
  }, [globalStatus, lastStatus]);
  
  // Don't show banner if healthy or dismissed
  if (globalStatus === 'healthy' || isDismissed) {
    return null;
  }
  
  const degradedProviders = getDegradedProviders();
  const rateLimitedProviders = getRateLimitedProviders();
  
  const isRateLimited = rateLimitedProviders.length > 0;
  const isUnhealthy = globalStatus === 'unhealthy';
  
  const handleRefresh = () => {
    window.location.reload();
  };
  
  const handleDismiss = () => {
    setIsDismissed(true);
  };
  
  return (
    <div
      className={`w-full px-4 py-2 flex items-center justify-between gap-4 text-sm ${
        isUnhealthy 
          ? 'bg-destructive/10 text-destructive border-b border-destructive/20' 
          : 'bg-warning/10 text-warning-foreground border-b border-warning/20'
      }`}
      role="alert"
    >
      <div className="flex items-center gap-2 flex-1">
        {isRateLimited ? (
          <Clock className="h-4 w-4 shrink-0" />
        ) : (
          <AlertTriangle className="h-4 w-4 shrink-0" />
        )}
        
        <span className="font-medium">
          {isRateLimited
            ? 'Rate limit reached'
            : isUnhealthy
            ? 'Service issues detected'
            : 'Some services degraded'}
        </span>
        
        <span className="text-muted-foreground hidden sm:inline">
          {isRateLimited
            ? `Please wait before making more requests to: ${rateLimitedProviders.map(p => providerDisplayNames[p]).join(', ')}`
            : `Affected: ${degradedProviders.map(p => providerDisplayNames[p]).join(', ')}`}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        {!isRateLimited && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="h-7 px-2 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="h-7 w-7 p-0"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
