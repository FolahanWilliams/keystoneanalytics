import { supabase } from "@/integrations/supabase/client";

// Core Web Vitals thresholds
const VITALS_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FID: { good: 100, poor: 300 },   // First Input Delay
  CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
};

type MetricName = keyof typeof VITALS_THRESHOLDS;

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
}

interface ErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  url: string;
  timestamp: string;
}

// Rate limiting for metrics
const sentMetrics = new Set<string>();
const METRIC_COOLDOWN = 60000; // 1 minute cooldown per metric type

function getRating(name: MetricName, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = VITALS_THRESHOLDS[name];
  if (!thresholds) return 'good';
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

async function sendMetric(type: 'error' | 'performance' | 'event', name: string, value: object) {
  // Only send in production
  if (import.meta.env.DEV) {
    console.log(`[Monitoring ${type}]`, name, value);
    return;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Use raw insert - types will be regenerated
    await supabase.from('app_metrics' as any).insert({
      type,
      name,
      value,
      user_id: user?.id || null,
      url: window.location.href,
      user_agent: navigator.userAgent,
    });
  } catch (error) {
    // Silent fail - don't break the app for monitoring
    console.warn('[Monitoring] Failed to send metric:', error);
  }
}

export function reportError(error: Error, componentStack?: string) {
  const report: ErrorReport = {
    message: error.message,
    stack: error.stack,
    componentStack,
    url: window.location.href,
    timestamp: new Date().toISOString(),
  };

  sendMetric('error', 'runtime_error', report);
}

export function reportPerformanceMetric(metric: PerformanceMetric) {
  // Rate limit metrics
  const metricKey = `${metric.name}-${Math.floor(Date.now() / METRIC_COOLDOWN)}`;
  if (sentMetrics.has(metricKey)) return;
  sentMetrics.add(metricKey);

  sendMetric('performance', metric.name, {
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
  });
}

export function reportEvent(name: string, properties?: object) {
  sendMetric('event', name, properties || {});
}

// Initialize Core Web Vitals tracking
export function initWebVitals() {
  if (typeof window === 'undefined') return;

  // Use PerformanceObserver for modern metrics
  try {
    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
      if (lastEntry) {
        reportPerformanceMetric({
          name: 'LCP',
          value: lastEntry.startTime,
          rating: getRating('LCP', lastEntry.startTime),
        });
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

    // First Input Delay
    const fidObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry: PerformanceEntry & { processingStart?: number; startTime?: number }) => {
        if (entry.processingStart && entry.startTime) {
          const fid = entry.processingStart - entry.startTime;
          reportPerformanceMetric({
            name: 'FID',
            value: fid,
            rating: getRating('FID', fid),
          });
        }
      });
    });
    fidObserver.observe({ type: 'first-input', buffered: true });

    // Cumulative Layout Shift
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry: PerformanceEntry & { hadRecentInput?: boolean; value?: number }) => {
        if (!entry.hadRecentInput && entry.value) {
          clsValue += entry.value;
        }
      });
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });

    // Report CLS on page hide
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && clsValue > 0) {
        reportPerformanceMetric({
          name: 'CLS',
          value: clsValue,
          rating: getRating('CLS', clsValue),
        });
      }
    });

    // First Contentful Paint & TTFB from Navigation Timing
    const navObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry: PerformanceNavigationTiming) => {
        // TTFB
        const ttfb = entry.responseStart - entry.requestStart;
        if (ttfb > 0) {
          reportPerformanceMetric({
            name: 'TTFB',
            value: ttfb,
            rating: getRating('TTFB', ttfb),
          });
        }
      });
    });
    navObserver.observe({ type: 'navigation', buffered: true });

    // FCP from paint entries
    const paintObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const fcpEntry = entries.find((e) => e.name === 'first-contentful-paint');
      if (fcpEntry) {
        reportPerformanceMetric({
          name: 'FCP',
          value: fcpEntry.startTime,
          rating: getRating('FCP', fcpEntry.startTime),
        });
      }
    });
    paintObserver.observe({ type: 'paint', buffered: true });

  } catch (error) {
    // PerformanceObserver not supported
    console.warn('[Monitoring] PerformanceObserver not fully supported');
  }
}

// Global error handler
export function initErrorTracking() {
  if (typeof window === 'undefined') return;

  // Unhandled errors
  window.addEventListener('error', (event) => {
    reportError(event.error || new Error(event.message));
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason));
    reportError(error);
  });
}
