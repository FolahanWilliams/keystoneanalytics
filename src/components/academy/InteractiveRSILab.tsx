import { useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DataPoint {
  day: number;
  price: number;
  rsi: number;
}

export function InteractiveRSILab() {
  const [priceMovement, setPriceMovement] = useState(50); // 0 = bear, 100 = bull

  // Generate mock data based on slider
  const data = useMemo<DataPoint[]>(() => {
    const basePrice = 100;
    const points: DataPoint[] = [];
    let price = basePrice;
    let avgGain = 0;
    let avgLoss = 0;
    const period = 14;

    // Generate 30 days of data
    for (let i = 0; i < 30; i++) {
      // Calculate daily change based on slider (more bullish = more gains)
      const bullBias = (priceMovement - 50) / 100; // -0.5 to 0.5
      const randomChange = (Math.random() - 0.5 + bullBias) * 3;
      price = Math.max(50, price + randomChange);

      const gain = randomChange > 0 ? randomChange : 0;
      const loss = randomChange < 0 ? Math.abs(randomChange) : 0;

      if (i < period) {
        avgGain = (avgGain * i + gain) / (i + 1);
        avgLoss = (avgLoss * i + loss) / (i + 1);
      } else {
        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
      }

      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      const rsi = 100 - 100 / (1 + rs);

      points.push({ day: i + 1, price, rsi: i >= period - 1 ? rsi : 50 });
    }

    return points;
  }, [priceMovement]);

  const currentRSI = data[data.length - 1]?.rsi ?? 50;
  const rsiStatus =
    currentRSI >= 70 ? "Overbought" : currentRSI <= 30 ? "Oversold" : "Neutral";
  const rsiColor =
    currentRSI >= 70
      ? "text-loss"
      : currentRSI <= 30
      ? "text-gain"
      : "text-muted-foreground";

  // Normalize for chart display
  const maxPrice = Math.max(...data.map((d) => d.price));
  const minPrice = Math.min(...data.map((d) => d.price));
  const priceRange = maxPrice - minPrice || 1;

  return (
    <div className="p-6 bg-card/50 rounded-xl border border-border/50">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold">Interactive RSI Lab</h4>
        <Badge variant="outline" className={cn("font-mono", rsiColor)}>
          RSI: {currentRSI.toFixed(1)} ({rsiStatus})
        </Badge>
      </div>

      {/* Price Chart */}
      <div className="relative h-24 mb-2 bg-secondary/30 rounded-lg overflow-hidden">
        <svg viewBox="0 0 300 100" className="w-full h-full" preserveAspectRatio="none">
          {/* Price line */}
          <polyline
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            points={data
              .map((d, i) => {
                const x = (i / (data.length - 1)) * 300;
                const y = 100 - ((d.price - minPrice) / priceRange) * 90;
                return `${x},${y}`;
              })
              .join(" ")}
          />
        </svg>
        <span className="absolute top-1 left-2 text-[10px] text-muted-foreground">
          Price
        </span>
      </div>

      {/* RSI Chart */}
      <div className="relative h-16 mb-4 bg-secondary/30 rounded-lg overflow-hidden">
        {/* Overbought/Oversold zones */}
        <div
          className="absolute w-full bg-loss/10"
          style={{ top: 0, height: "30%" }}
        />
        <div
          className="absolute w-full bg-gain/10"
          style={{ bottom: 0, height: "30%" }}
        />

        <svg viewBox="0 0 300 100" className="w-full h-full" preserveAspectRatio="none">
          {/* 70 line */}
          <line x1="0" y1="30" x2="300" y2="30" stroke="hsl(0, 72%, 51%)" strokeDasharray="4" opacity="0.5" />
          {/* 30 line */}
          <line x1="0" y1="70" x2="300" y2="70" stroke="hsl(142, 71%, 45%)" strokeDasharray="4" opacity="0.5" />

          {/* RSI line */}
          <polyline
            fill="none"
            stroke="hsl(262, 83%, 58%)"
            strokeWidth="2"
            points={data
              .map((d, i) => {
                const x = (i / (data.length - 1)) * 300;
                const y = 100 - d.rsi;
                return `${x},${y}`;
              })
              .join(" ")}
          />
        </svg>

        <span className="absolute top-1 left-2 text-[10px] text-muted-foreground">
          RSI
        </span>
        <span className="absolute top-1 right-2 text-[10px] text-loss/70">70</span>
        <span className="absolute bottom-1 right-2 text-[10px] text-gain/70">30</span>
      </div>

      {/* Slider Control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-loss">Bearish</span>
          <span className="text-muted-foreground font-mono text-xs">
            Market Sentiment
          </span>
          <span className="text-gain">Bullish</span>
        </div>
        <Slider
          value={[priceMovement]}
          onValueChange={([v]) => setPriceMovement(v)}
          min={0}
          max={100}
          step={1}
          className="w-full"
        />
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Drag the slider to simulate bullish or bearish price movement and observe how
        RSI responds. When RSI crosses above 70, the asset is considered overbought;
        below 30, it's oversold.
      </p>
    </div>
  );
}
