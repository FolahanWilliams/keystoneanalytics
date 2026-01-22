import { useEffect, useRef, useMemo } from 'react';
import { 
  createChart, 
  ColorType,
  CrosshairMode,
  CandlestickSeries,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type LineData,
  type Time
} from 'lightweight-charts';
import type { EnrichedCandle } from '@/types/market';

interface LightweightChartProps {
  data: EnrichedCandle[];
  height?: number;
  showCrosshair?: boolean;
  showSma20?: boolean;
  showSma50?: boolean;
}

export function LightweightChart({ 
  data, 
  height = 350,
  showCrosshair = true,
  showSma20 = true,
  showSma50 = true
}: LightweightChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const sma20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const sma50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  // Transform candle data for lightweight-charts
  const { candleData, sma20Data, sma50Data } = useMemo(() => {
    if (!data || data.length === 0) {
      return { candleData: [], sma20Data: [], sma50Data: [] };
    }

    const candles: CandlestickData<Time>[] = [];
    const sma20: LineData<Time>[] = [];
    const sma50: LineData<Time>[] = [];

    data.forEach((c) => {
      // Convert timestamp to YYYY-MM-DD string format for lightweight-charts
      const time = c.date as Time;

      candles.push({
        time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      });

      if (c.sma20 !== null && c.sma20 !== undefined) {
        sma20.push({ time, value: c.sma20 });
      }

      if (c.sma50 !== null && c.sma50 !== undefined) {
        sma50.push({ time, value: c.sma50 });
      }
    });

    return { candleData: candles, sma20Data: sma20, sma50Data: sma50 };
  }, [data]);

  // Initialize chart once
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#09090b' }, // Zinc-950
        textColor: '#a1a1aa', // Zinc-400
      },
      width: containerRef.current.clientWidth,
      height,
      grid: {
        vertLines: { color: '#27272a', style: 1 }, // Subtle gridlines
        horzLines: { color: '#27272a', style: 1 },
      },
      crosshair: {
        mode: showCrosshair ? CrosshairMode.Normal : CrosshairMode.Hidden,
        vertLine: { color: '#71717a', labelBackgroundColor: '#27272a' },
        horzLine: { color: '#71717a', labelBackgroundColor: '#27272a' },
      },
      rightPriceScale: { 
        borderColor: '#27272a',
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      timeScale: { 
        borderColor: '#27272a', 
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Candlestick series with professional colors (v5 API)
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',      // Emerald for up
      downColor: '#ef4444',    // Red for down
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    // SMA 20 Line (Blue) - v5 API
    const sma20Series = chart.addSeries(LineSeries, {
      color: '#3b82f6',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    // SMA 50 Line (Orange) - v5 API
    const sma50Series = chart.addSeries(LineSeries, {
      color: '#f59e0b',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    sma20SeriesRef.current = sma20Series;
    sma50SeriesRef.current = sma50Series;

    // Responsive resize
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ 
          width: containerRef.current.clientWidth 
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      sma20SeriesRef.current = null;
      sma50SeriesRef.current = null;
    };
  }, [height, showCrosshair]);

  // Update candlestick data
  useEffect(() => {
    if (!candleSeriesRef.current || candleData.length === 0) return;
    
    candleSeriesRef.current.setData(candleData);
    chartRef.current?.timeScale().fitContent();
  }, [candleData]);

  // Update SMA 20 overlay
  useEffect(() => {
    if (!sma20SeriesRef.current) return;
    
    if (showSma20 && sma20Data.length > 0) {
      sma20SeriesRef.current.setData(sma20Data);
      sma20SeriesRef.current.applyOptions({ visible: true });
    } else {
      sma20SeriesRef.current.setData([]);
      sma20SeriesRef.current.applyOptions({ visible: false });
    }
  }, [sma20Data, showSma20]);

  // Update SMA 50 overlay
  useEffect(() => {
    if (!sma50SeriesRef.current) return;
    
    if (showSma50 && sma50Data.length > 0) {
      sma50SeriesRef.current.setData(sma50Data);
      sma50SeriesRef.current.applyOptions({ visible: true });
    } else {
      sma50SeriesRef.current.setData([]);
      sma50SeriesRef.current.applyOptions({ visible: false });
    }
  }, [sma50Data, showSma50]);

  return (
    <div 
      ref={containerRef} 
      className="w-full rounded-lg overflow-hidden" 
      style={{ height }} 
    />
  );
}

export default LightweightChart;
