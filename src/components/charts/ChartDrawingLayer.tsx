import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { IChartApi, Time } from "lightweight-charts";
import type { ChartDrawing, DrawingData } from "@/types/market";
import type { DrawingMode } from "./DrawingToolbar";

// Fibonacci retracement levels
const FIBONACCI_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];

interface ChartDrawingLayerProps {
  chart: IChartApi | null;
  drawings: ChartDrawing[];
  activeMode: DrawingMode;
  onAddDrawing: (type: ChartDrawing["type"], data: DrawingData) => Promise<ChartDrawing | null>;
  onDeleteDrawing: (id: string) => Promise<boolean>;
  containerRef: React.RefObject<HTMLDivElement>;
}

interface PriceLineRef {
  id: string;
  remove: () => void;
}

function ChartDrawingLayerComponent({
  chart,
  drawings,
  activeMode,
  onAddDrawing,
  onDeleteDrawing,
  containerRef,
}: ChartDrawingLayerProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ price: number; time: Time } | null>(null);
  const priceLinesRef = useRef<Map<string, PriceLineRef>>(new Map());
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Clear all price lines
  const clearPriceLines = useCallback(() => {
    priceLinesRef.current.forEach((line) => {
      try {
        line.remove();
      } catch (e) {
        // Line may already be removed
      }
    });
    priceLinesRef.current.clear();
  }, []);

  // Render horizontal lines using chart's native price lines
  useEffect(() => {
    if (!chart) return;

    // Clear existing lines first
    clearPriceLines();

    // Find the main candlestick series
    const series = chart.timeScale()?.options ? chart : null;
    if (!series) return;

    drawings
      .filter((d) => d.type === "horizontal" && d.data.price)
      .forEach((drawing) => {
        try {
          // Get all series from the chart - we'll add to the first one (candlestick)
          // Note: lightweight-charts doesn't expose series directly, so we use a workaround
          const priceLineOptions = {
            price: drawing.data.price!,
            color: drawing.data.color || "hsl(var(--primary))",
            lineWidth: drawing.data.lineWidth || 1,
            lineStyle: 2, // Dashed
            axisLabelVisible: true,
            title: "",
          };

          // Store reference for cleanup
          priceLinesRef.current.set(drawing.id, {
            id: drawing.id,
            remove: () => {}, // Will be set when we can access the series
          });
        } catch (e) {
          console.warn("Could not add price line:", e);
        }
      });

    return () => {
      clearPriceLines();
    };
  }, [chart, drawings, clearPriceLines]);

  // Handle mouse events for drawing
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!chart || !activeMode || activeMode === "select") return;
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Convert to chart coordinates
      const timeCoord = chart.timeScale().coordinateToTime(x);
      const series = (chart as any)._private__seriesMap?.values()?.next()?.value;
      if (!series) return;

      const priceCoord = series.coordinateToPrice(y);

      if (activeMode === "horizontal") {
        // Single click creates horizontal line
        onAddDrawing("horizontal", {
          price: priceCoord,
          color: "hsl(var(--primary))",
          lineWidth: 1,
        });
        return;
      }

      if (activeMode === "annotation") {
        const text = prompt("Enter annotation text:");
        if (text) {
          onAddDrawing("annotation", {
            text,
            price: priceCoord,
            time: timeCoord as string,
            color: "hsl(var(--foreground))",
          });
        }
        return;
      }

      // For trendline and fibonacci, need two points
      if (activeMode === "trendline" || activeMode === "fibonacci") {
        setIsDrawing(true);
        setStartPoint({ price: priceCoord, time: timeCoord as Time });
      }
    },
    [chart, activeMode, containerRef, onAddDrawing]
  );

  const handleMouseUp = useCallback(
    async (e: React.MouseEvent) => {
      if (!chart || !isDrawing || !startPoint || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const endTime = chart.timeScale().coordinateToTime(x);
      const series = (chart as any)._private__seriesMap?.values()?.next()?.value;
      if (!series) {
        setIsDrawing(false);
        setStartPoint(null);
        return;
      }

      const endPrice = series.coordinateToPrice(y);

      if (activeMode === "trendline") {
        await onAddDrawing("trendline", {
          startPrice: startPoint.price,
          startTime: startPoint.time as string,
          endPrice,
          endTime: endTime as string,
          color: "hsl(var(--primary))",
          lineWidth: 2,
        });
      } else if (activeMode === "fibonacci") {
        await onAddDrawing("fibonacci", {
          highPrice: Math.max(startPoint.price, endPrice),
          lowPrice: Math.min(startPoint.price, endPrice),
          highTime: startPoint.price > endPrice ? (startPoint.time as string) : (endTime as string),
          lowTime: startPoint.price <= endPrice ? (startPoint.time as string) : (endTime as string),
          levels: FIBONACCI_LEVELS,
          color: "hsl(var(--primary))",
        });
      }

      setIsDrawing(false);
      setStartPoint(null);
    },
    [chart, isDrawing, startPoint, activeMode, containerRef, onAddDrawing]
  );

  // Render SVG overlay for trendlines and fibonacci
  const renderDrawings = useCallback(() => {
    if (!chart || !containerRef.current) return null;

    const trendlines = drawings.filter((d) => d.type === "trendline");
    const fibonaccis = drawings.filter((d) => d.type === "fibonacci");
    const annotations = drawings.filter((d) => d.type === "annotation");
    const horizontals = drawings.filter((d) => d.type === "horizontal");

    const series = (chart as any)._private__seriesMap?.values()?.next()?.value;
    if (!series) return null;

    return (
      <>
        {/* Trendlines */}
        {trendlines.map((drawing) => {
          const { startTime, startPrice, endTime, endPrice, color } = drawing.data;
          if (!startTime || !startPrice || !endTime || !endPrice) return null;

          const x1 = chart.timeScale().timeToCoordinate(startTime as Time);
          const x2 = chart.timeScale().timeToCoordinate(endTime as Time);
          const y1 = series.priceToCoordinate(startPrice);
          const y2 = series.priceToCoordinate(endPrice);

          if (x1 === null || x2 === null || y1 === null || y2 === null) return null;

          return (
            <g key={drawing.id}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={color || "hsl(var(--primary))"}
                strokeWidth={drawing.data.lineWidth || 2}
                className="cursor-pointer hover:stroke-destructive"
                onClick={() => onDeleteDrawing(drawing.id)}
              />
              <circle
                cx={x1}
                cy={y1}
                r={4}
                fill={color || "hsl(var(--primary))"}
                className="cursor-move"
              />
              <circle
                cx={x2}
                cy={y2}
                r={4}
                fill={color || "hsl(var(--primary))"}
                className="cursor-move"
              />
            </g>
          );
        })}

        {/* Fibonacci levels */}
        {fibonaccis.map((drawing) => {
          const { highPrice, lowPrice, highTime, lowTime, levels, color } = drawing.data;
          if (!highPrice || !lowPrice || !highTime || !lowTime || !levels) return null;

          const x1 = chart.timeScale().timeToCoordinate(highTime as Time);
          const x2 = chart.timeScale().timeToCoordinate(lowTime as Time);
          const priceRange = highPrice - lowPrice;

          if (x1 === null || x2 === null) return null;

          const xMin = Math.min(x1, x2);
          const xMax = Math.max(x1, x2);
          const width = Math.max(xMax - xMin, 100);

          return (
            <g key={drawing.id}>
              {levels.map((level) => {
                const price = highPrice - priceRange * level;
                const y = series.priceToCoordinate(price);
                if (y === null) return null;

                return (
                  <g key={level}>
                    <line
                      x1={xMin}
                      y1={y}
                      x2={xMin + width}
                      y2={y}
                      stroke={color || "hsl(var(--primary))"}
                      strokeWidth={1}
                      strokeDasharray={level === 0 || level === 1 ? "none" : "4,4"}
                      opacity={0.7}
                    />
                    <text
                      x={xMin + width + 5}
                      y={y + 3}
                      fontSize={10}
                      fill="hsl(var(--muted-foreground))"
                    >
                      {(level * 100).toFixed(1)}% (${price.toFixed(2)})
                    </text>
                  </g>
                );
              })}
              {/* Click to delete */}
              <rect
                x={xMin}
                y={series.priceToCoordinate(highPrice) || 0}
                width={width}
                height={Math.abs(
                  (series.priceToCoordinate(lowPrice) || 0) -
                    (series.priceToCoordinate(highPrice) || 0)
                )}
                fill="transparent"
                className="cursor-pointer"
                onClick={() => onDeleteDrawing(drawing.id)}
              />
            </g>
          );
        })}

        {/* Horizontal lines */}
        {horizontals.map((drawing) => {
          const { price, color } = drawing.data;
          if (!price) return null;

          const y = series.priceToCoordinate(price);
          if (y === null) return null;

          const width = containerRef.current?.clientWidth || 800;

          return (
            <g key={drawing.id}>
              <line
                x1={0}
                y1={y}
                x2={width}
                y2={y}
                stroke={color || "hsl(var(--primary))"}
                strokeWidth={drawing.data.lineWidth || 1}
                strokeDasharray="8,4"
                className="cursor-pointer hover:stroke-destructive"
                onClick={() => onDeleteDrawing(drawing.id)}
              />
              <text
                x={5}
                y={y - 5}
                fontSize={10}
                fill={color || "hsl(var(--primary))"}
              >
                ${price.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* Annotations */}
        {annotations.map((drawing) => {
          const { text, time, price, color } = drawing.data;
          if (!text || !time || !price) return null;

          const x = chart.timeScale().timeToCoordinate(time as Time);
          const y = series.priceToCoordinate(price);

          if (x === null || y === null) return null;

          return (
            <g
              key={drawing.id}
              className="cursor-pointer"
              onClick={() => onDeleteDrawing(drawing.id)}
            >
              <rect
                x={x - 2}
                y={y - 12}
                width={text.length * 7 + 8}
                height={16}
                rx={3}
                fill="hsl(var(--card))"
                stroke="hsl(var(--border))"
              />
              <text
                x={x + 2}
                y={y}
                fontSize={11}
                fill={color || "hsl(var(--foreground))"}
              >
                {text}
              </text>
            </g>
          );
        })}
      </>
    );
  }, [chart, drawings, containerRef, onDeleteDrawing]);

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 pointer-events-none z-10"
      style={{
        pointerEvents: activeMode && activeMode !== "select" ? "auto" : "none",
        cursor: activeMode === "trendline" || activeMode === "fibonacci" 
          ? "crosshair" 
          : activeMode === "horizontal" 
          ? "row-resize"
          : activeMode === "annotation"
          ? "text"
          : "default",
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {renderDrawings()}
    </svg>
  );
}

export const ChartDrawingLayer = memo(ChartDrawingLayerComponent);
