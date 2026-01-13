import { useMemo } from "react";
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// Mock candlestick data
const generateMockData = () => {
  const data = [];
  let price = 45000;
  const now = new Date();
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const open = price + (Math.random() - 0.5) * 500;
    const close = open + (Math.random() - 0.5) * 800;
    const high = Math.max(open, close) + Math.random() * 300;
    const low = Math.min(open, close) - Math.random() * 300;
    const volume = Math.floor(Math.random() * 10000) + 5000;
    
    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      open: Math.round(open),
      close: Math.round(close),
      high: Math.round(high),
      low: Math.round(low),
      volume,
      isUp: close >= open,
    });
    
    price = close;
  }
  
  return data;
};

interface CandlestickChartProps {
  symbol?: string;
}

const CandlestickChart = ({ symbol = "BTC/USD" }: CandlestickChartProps) => {
  const data = useMemo(() => generateMockData(), []);
  
  const currentPrice = data[data.length - 1]?.close ?? 0;
  const previousPrice = data[data.length - 2]?.close ?? 0;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = ((priceChange / previousPrice) * 100).toFixed(2);
  const isPositive = priceChange >= 0;

  // Transform data for the candlestick visualization
  const chartData = data.map((d) => ({
    ...d,
    // For the body (open-close range)
    body: [Math.min(d.open, d.close), Math.max(d.open, d.close)],
    // For the wick (high-low range)
    wick: [d.low, d.high],
  }));

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold font-mono">{symbol}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold font-mono">
              ${currentPrice.toLocaleString()}
            </span>
            <span
              className={`text-sm font-mono px-2 py-0.5 rounded ${
                isPositive ? "ticker-positive" : "ticker-negative"
              }`}
            >
              {isPositive ? "+" : ""}
              {priceChangePercent}%
            </span>
          </div>
        </div>
        
        <div className="flex gap-2">
          {["1H", "4H", "1D", "1W", "1M"].map((tf) => (
            <button
              key={tf}
              className="px-3 py-1 text-xs font-mono rounded bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--chart-grid))" 
              vertical={false}
            />
            <XAxis 
              dataKey="date" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              domain={['auto', 'auto']}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number[], name: string) => {
                if (name === 'body') {
                  return [`O: $${value[0]} C: $${value[1]}`, 'Price'];
                }
                return [value, name];
              }}
            />
            <ReferenceLine 
              y={currentPrice} 
              stroke="hsl(var(--primary))" 
              strokeDasharray="5 5" 
              strokeWidth={1}
            />
            {/* Simplified candlestick using bars */}
            <Bar
              dataKey="body"
              fill="hsl(var(--chart-up))"
              stroke="hsl(var(--chart-up))"
              barSize={8}
              shape={(props: any) => {
                const { x, y, width, height, payload } = props;
                const fill = payload.isUp ? 'hsl(142, 71%, 45%)' : 'hsl(0, 72%, 51%)';
                const stroke = fill;
                
                // Calculate wick positions
                const candleY = y;
                const candleHeight = height;
                const centerX = x + width / 2;
                
                // Price to Y coordinate mapping
                const minPrice = Math.min(...chartData.map(d => d.low));
                const maxPrice = Math.max(...chartData.map(d => d.high));
                const priceRange = maxPrice - minPrice;
                const chartHeight = 300; // Approximate
                
                return (
                  <g>
                    {/* Candle body */}
                    <rect
                      x={x}
                      y={candleY}
                      width={width}
                      height={Math.max(height, 2)}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={1}
                      rx={1}
                    />
                  </g>
                );
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CandlestickChart;
