import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import PageLoader from "@/components/common/PageLoader";
import { ApiStatusBanner } from "@/components/common/ApiStatusBanner";
import { initWebVitals, initErrorTracking } from "@/utils/monitoring";

// Lazy load route components for better performance
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Academy = lazy(() => import("./pages/Academy"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Dashboard sub-routes
const Overview = lazy(() => import("./pages/dashboard/Overview"));
const Watchlist = lazy(() => import("./pages/dashboard/Watchlist"));
const News = lazy(() => import("./pages/dashboard/News"));
const Analysis = lazy(() => import("./pages/dashboard/Analysis"));
const CalculatorPage = lazy(() => import("./pages/dashboard/CalculatorPage"));
const Settings = lazy(() => import("./pages/dashboard/Settings"));
const Learn = lazy(() => import("./pages/dashboard/Learn"));
const Coach = lazy(() => import("./pages/dashboard/Coach"));
const MacroOverview = lazy(() => import("./pages/dashboard/MacroOverview"));

// Optimized QueryClient with performance settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (previously cacheTime)
      refetchOnWindowFocus: false, // Prevent unnecessary refetches
      refetchOnReconnect: true,
    },
  },
});

// Route prefetching component
const RoutePrefetcher = () => {
  const location = useLocation();

  useEffect(() => {
    // Prefetch likely next routes based on current location
    const prefetchRoutes = async () => {
      if (location.pathname === "/") {
        // On landing, prefetch auth and pricing
        import("./pages/Auth");
        import("./pages/Pricing");
      } else if (location.pathname === "/auth") {
        // After auth, user likely goes to dashboard
        import("./pages/Dashboard");
        import("./pages/dashboard/Overview");
      } else if (location.pathname.startsWith("/dashboard")) {
        // Prefetch common dashboard routes
        import("./pages/dashboard/Analysis");
        import("./pages/dashboard/Coach");
      }
    };

    // Delay prefetching to not block initial render
    const timer = setTimeout(prefetchRoutes, 1000);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return null;
};

// Initialize monitoring on first render
const MonitoringInitializer = () => {
  useEffect(() => {
    initWebVitals();
    initErrorTracking();
  }, []);
  return null;
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <MonitoringInitializer />
            <RoutePrefetcher />
            <ApiStatusBanner />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/academy" element={<Academy />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/dashboard" element={<Dashboard />}>
                  <Route index element={<Overview />} />
                  <Route path="coach" element={<Coach />} />
                  <Route path="watchlist" element={<Watchlist />} />
                  <Route path="news" element={<News />} />
                  <Route path="analysis" element={<Analysis />} />
                  <Route path="macro" element={<MacroOverview />} />
                  <Route path="calculator" element={<CalculatorPage />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="learn" element={<Learn />} />
                </Route>
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
