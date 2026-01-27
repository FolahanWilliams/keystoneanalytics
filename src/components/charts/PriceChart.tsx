import { memo, useEffect, useMemo, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  LineSeries,
  createChart,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type Time,
} from "lightweight-charts";
import type { ChartIndicator, EnrichedCandle } from "@/types/market";

interface PriceChartProps {
  data: EnrichedCandle[];
  currentPrice: number;
  indicators: ChartIndicator[];
  showCrosshair: boolean;
  height?: number;
}

function PriceChartComponent({
  data,
  currentPrice: _currentPrice,
  indicators,
  showCrosshair,
  height = 350,
}: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const sma20SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const sma50SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ema12SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ema26SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bbUpperSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bbMiddleSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bbLowerSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const vwapSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  // Check which indicators are enabled
  const showSma20 = indicators.find((i) => i.id === "sma20")?.enabled ?? true;
  const showSma50 = indicators.find((i) => i.id === "sma50")?.enabled ?? true;
  const showEma12 = indicators.find((i) => i.id === "ema12")?.enabled ?? false;
  const showEma26 = indicators.find((i) => i.id === "ema26")?.enabled ?? false;
  const showBB = indicators.find((i) => i.id === "bb")?.enabled ?? false;
  const showVwap = indicators.find((i) => i.id === "vwap")?.enabled ?? false;

  // Transform data to ensure YYYY-MM-DD format for lightweight-charts
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data
      .map((candle) => {
        let dateStr = candle.date;
        if (!dateStr || !dateStr.includes("-")) {
          // candle.timestamp is seconds
          dateStr = new Date(candle.timestamp * 1000).toISOString().split("T")[0];
        }

        return {
          ...candle,
          date: dateStr,
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [data]);

  const { candleData, sma20Data, sma50Data, ema12Data, ema26Data, bbUpperData, bbMiddleData, bbLowerData, vwapData } = useMemo(() => {
    const candles: CandlestickData<Time>[] = [];
    const sma20: LineData<Time>[] = [];
    const sma50: LineData<Time>[] = [];
    const ema12: LineData<Time>[] = [];
    const ema26: LineData<Time>[] = [];
    const bbUpper: LineData<Time>[] = [];
    const bbMiddle: LineData<Time>[] = [];
    const bbLower: LineData<Time>[] = [];
    const vwap: LineData<Time>[] = [];

    for (const c of chartData) {
      const time = c.date as Time;
      candles.push({ time, open: c.open, high: c.high, low: c.low, close: c.close });

      if (c.sma20 !== null && c.sma20 !== undefined) sma20.push({ time, value: c.sma20 });
      if (c.sma50 !== null && c.sma50 !== undefined) sma50.push({ time, value: c.sma50 });
      if (c.ema12 !== null && c.ema12 !== undefined) ema12.push({ time, value: c.ema12 });
      if (c.ema26 !== null && c.ema26 !== undefined) ema26.push({ time, value: c.ema26 });
      if (c.bbUpper !== null && c.bbUpper !== undefined) bbUpper.push({ time, value: c.bbUpper });
      if (c.bbMiddle !== null && c.bbMiddle !== undefined) bbMiddle.push({ time, value: c.bbMiddle });
      if (c.bbLower !== null && c.bbLower !== undefined) bbLower.push({ time, value: c.bbLower });
      if (c.vwap !== null && c.vwap !== undefined) vwap.push({ time, value: c.vwap });
    }

    return { 
      candleData: candles, 
      sma20Data: sma20, 
      sma50Data: sma50, 
      ema12Data: ema12, 
      ema26Data: ema26,
      bbUpperData: bbUpper,
      bbMiddleData: bbMiddle,
      bbLowerData: bbLower,
      vwapData: vwap
    };
  }, [chartData]);

  const readCssHsl = (varName: string, fallback: string) => {
    if (typeof window === "undefined") return `hsl(${fallback})`;
    const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    return `hsl(${raw || fallback})`;
  };

  if (chartData.length === 0) {
    return (
      <div 
        className="w-full flex items-center justify-center text-muted-foreground text-sm"
        style={{ height }}
      >
        No data available
      </div>
    );
  }

  // Init chart once per mount/height
  useEffect(() => {
    if (!containerRef.current) return;

    const bg = readCssHsl("--chart-bg", "240 10% 3%");
    const grid = readCssHsl("--chart-grid", "240 5% 10%");
    const text = readCssHsl("--muted-foreground", "240 5% 50%");
    const border = readCssHsl("--border", "240 5% 12%");
    const up = readCssHsl("--chart-candle-up", "160 84% 39%");
    const down = readCssHsl("--chart-candle-down", "350 89% 60%");
    const info = readCssHsl("--info", "217 91% 60%");
    const warning = readCssHsl("--warning", "38 92% 50%");

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: bg },
        textColor: text,
      },
      width: containerRef.current.clientWidth,
      height,
      grid: {
        vertLines: { color: grid, style: 1 },
        horzLines: { color: grid, style: 1 },
      },
      crosshair: {
        mode: showCrosshair ? CrosshairMode.Normal : CrosshairMode.Hidden,
        vertLine: { color: border },
        horzLine: { color: border },
      },
      rightPriceScale: {
        borderColor: border,
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      timeScale: {
        borderColor: border,
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: up,
      downColor: down,
      borderUpColor: up,
      borderDownColor: down,
      wickUpColor: up,
      wickDownColor: down,
    });

    const sma20Series = chart.addSeries(LineSeries, {
      color: info,
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const sma50Series = chart.addSeries(LineSeries, {
      color: warning,
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    // EMA 12 - Blue
    const ema12Series = chart.addSeries(LineSeries, {
      color: "hsl(217 91% 60%)",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    // EMA 26 - Purple
    const ema26Series = chart.addSeries(LineSeries, {
      color: "hsl(280 70% 60%)",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    // Bollinger Bands - Cyan with different opacities
    const bbUpperSeries = chart.addSeries(LineSeries, {
      color: "hsl(180 70% 50%)",
      lineWidth: 1,
      lineStyle: 2, // Dashed
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const bbMiddleSeries = chart.addSeries(LineSeries, {
      color: "hsl(180 70% 60%)",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const bbLowerSeries = chart.addSeries(LineSeries, {
      color: "hsl(180 70% 50%)",
      lineWidth: 1,
      lineStyle: 2, // Dashed
      priceLineVisible: false,
      lastValueVisible: false,
    });

    // VWAP - Amber
    const vwapSeries = chart.addSeries(LineSeries, {
      color: "hsl(38 92% 50%)",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    sma20SeriesRef.current = sma20Series;
    sma50SeriesRef.current = sma50Series;
    ema12SeriesRef.current = ema12Series;
    ema26SeriesRef.current = ema26Series;
    bbUpperSeriesRef.current = bbUpperSeries;
    bbMiddleSeriesRef.current = bbMiddleSeries;
    bbLowerSeriesRef.current = bbLowerSeries;
    vwapSeriesRef.current = vwapSeries;

    const handleResize = () => {
      if (!containerRef.current || !chartRef.current) return;
      chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      sma20SeriesRef.current = null;
      sma50SeriesRef.current = null;
      ema12SeriesRef.current = null;
      ema26SeriesRef.current = null;
      bbUpperSeriesRef.current = null;
      bbMiddleSeriesRef.current = null;
      bbLowerSeriesRef.current = null;
      vwapSeriesRef.current = null;
    };
  }, [height]);

  // Crosshair toggle
  useEffect(() => {
    chartRef.current?.applyOptions({
      crosshair: {
        mode: showCrosshair ? CrosshairMode.Normal : CrosshairMode.Hidden,
      },
    });
  }, [showCrosshair]);

  // Candles
  useEffect(() => {
    if (!candleSeriesRef.current || candleData.length === 0) return;
    candleSeriesRef.current.setData(candleData);
    chartRef.current?.timeScale().fitContent();
  }, [candleData]);

  // SMA 20
  useEffect(() => {
    if (!sma20SeriesRef.current) return;
    if (showSma20 && sma20Data.length > 0) {
      sma20SeriesRef.current.setData(sma20Data);
      sma20SeriesRef.current.applyOptions({ visible: true });
    } else {
      sma20SeriesRef.current.setData([]);
      sma20SeriesRef.current.applyOptions({ visible: false });
    }
  }, [showSma20, sma20Data]);

  // SMA 50
  useEffect(() => {
    if (!sma50SeriesRef.current) return;
    if (showSma50 && sma50Data.length > 0) {
      sma50SeriesRef.current.setData(sma50Data);
      sma50SeriesRef.current.applyOptions({ visible: true });
    } else {
      sma50SeriesRef.current.setData([]);
      sma50SeriesRef.current.applyOptions({ visible: false });
    }
  }, [showSma50, sma50Data]);

  // EMA 12
  useEffect(() => {
    if (!ema12SeriesRef.current) return;
    if (showEma12 && ema12Data.length > 0) {
      ema12SeriesRef.current.setData(ema12Data);
      ema12SeriesRef.current.applyOptions({ visible: true });
    } else {
      ema12SeriesRef.current.setData([]);
      ema12SeriesRef.current.applyOptions({ visible: false });
    }
  }, [showEma12, ema12Data]);

  // EMA 26
  useEffect(() => {
    if (!ema26SeriesRef.current) return;
    if (showEma26 && ema26Data.length > 0) {
      ema26SeriesRef.current.setData(ema26Data);
      ema26SeriesRef.current.applyOptions({ visible: true });
    } else {
      ema26SeriesRef.current.setData([]);
      ema26SeriesRef.current.applyOptions({ visible: false });
    }
  }, [showEma26, ema26Data]);

  // Bollinger Bands
  useEffect(() => {
    if (!bbUpperSeriesRef.current || !bbMiddleSeriesRef.current || !bbLowerSeriesRef.current) return;
    if (showBB && bbUpperData.length > 0) {
      bbUpperSeriesRef.current.setData(bbUpperData);
      bbMiddleSeriesRef.current.setData(bbMiddleData);
      bbLowerSeriesRef.current.setData(bbLowerData);
      bbUpperSeriesRef.current.applyOptions({ visible: true });
      bbMiddleSeriesRef.current.applyOptions({ visible: true });
      bbLowerSeriesRef.current.applyOptions({ visible: true });
    } else {
      bbUpperSeriesRef.current.setData([]);
      bbMiddleSeriesRef.current.setData([]);
      bbLowerSeriesRef.current.setData([]);
      bbUpperSeriesRef.current.applyOptions({ visible: false });
      bbMiddleSeriesRef.current.applyOptions({ visible: false });
      bbLowerSeriesRef.current.applyOptions({ visible: false });
    }
  }, [showBB, bbUpperData, bbMiddleData, bbLowerData]);

  // VWAP
  useEffect(() => {
    if (!vwapSeriesRef.current) return;
    if (showVwap && vwapData.length > 0) {
      vwapSeriesRef.current.setData(vwapData);
      vwapSeriesRef.current.applyOptions({ visible: true });
    } else {
      vwapSeriesRef.current.setData([]);
      vwapSeriesRef.current.applyOptions({ visible: false });
    }
  }, [showVwap, vwapData]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-lg overflow-hidden"
      style={{ height }}
    />
  );
}

export const PriceChart = memo(PriceChartComponent);
