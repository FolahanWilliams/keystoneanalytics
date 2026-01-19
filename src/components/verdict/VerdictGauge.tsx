import { motion } from "framer-motion";
import { useMemo } from "react";

interface VerdictGaugeProps {
  score: number;
  size?: number;
  animated?: boolean;
}

export function VerdictGauge({ score, size = 240, animated = true }: VerdictGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const needleAngle = -135 + (clampedScore / 100) * 270;
  
  const getGaugeColor = (score: number) => {
    if (score >= 60) return { main: 'hsl(var(--chart-2))', glow: 'hsl(var(--chart-2))' }; // Green/Emerald
    if (score >= 45) return { main: 'hsl(var(--chart-4))', glow: 'hsl(var(--chart-4))' }; // Amber
    return { main: 'hsl(var(--chart-5))', glow: 'hsl(var(--chart-5))' }; // Rose/Red
  };

  const colors = getGaugeColor(clampedScore);
  
  // Increased vertical space for gauge
  const svgHeight = size * 0.55;
  const centerX = size / 2;
  const centerY = size * 0.48; // Move center down slightly for better label positioning
  const radius = size * 0.32;
  const strokeWidth = size * 0.045;

  const createArc = (startAngle: number, endAngle: number, r: number) => {
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = centerX + r * Math.cos(startRad);
    const y1 = centerY + r * Math.sin(startRad);
    const x2 = centerX + r * Math.cos(endRad);
    const y2 = centerY + r * Math.sin(endRad);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  const segments = useMemo(() => [
    { start: -135, end: -45, color: 'hsl(var(--chart-5))' },  // Bearish - Red
    { start: -45, end: 45, color: 'hsl(var(--chart-4))' },     // Neutral - Amber
    { start: 45, end: 135, color: 'hsl(var(--chart-2))' },    // Bullish - Green
  ], []);

  const ticks = [0, 50, 100];

  // Label positions - calculated to be outside the arc with proper spacing
  const labelRadius = radius + strokeWidth + size * 0.08;
  
  // Angles for labels (in degrees, where 0 is right, -90 is top)
  const sellAngle = -135; // Bottom-left of arc
  const holdAngle = -90;  // Top center of arc  
  const buyAngle = -45;   // Bottom-right of arc

  const getLabelPos = (angle: number, extraOffset: number = 0) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: centerX + (labelRadius + extraOffset) * Math.cos(rad),
      y: centerY + (labelRadius + extraOffset) * Math.sin(rad),
    };
  };

  const sellPos = getLabelPos(sellAngle);
  const holdPos = getLabelPos(holdAngle, 4);
  const buyPos = getLabelPos(buyAngle);

  return (
    <div className="relative flex flex-col items-center" style={{ width: size }}>
      <svg 
        width={size} 
        height={svgHeight} 
        viewBox={`0 0 ${size} ${svgHeight}`}
        className="overflow-visible"
      >
        <defs>
          <filter id="needleGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background arc segments - subtle */}
        {segments.map((seg, i) => (
          <path
            key={i}
            d={createArc(seg.start, seg.end, radius)}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity={0.15}
          />
        ))}

        {/* Active arc */}
        <motion.path
          d={createArc(-135, -135 + (clampedScore / 100) * 270, radius)}
          fill="none"
          stroke={colors.main}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Tick marks - positioned inside the arc */}
        {ticks.map((tick) => {
          const angle = -135 + (tick / 100) * 270;
          const rad = (angle * Math.PI) / 180;
          const labelR = radius - strokeWidth - size * 0.06;
          
          return (
            <g key={tick}>
              <text
                x={centerX + labelR * Math.cos(rad)}
                y={centerY + labelR * Math.sin(rad)}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-muted-foreground"
                fontSize={size * 0.038}
                fontFamily="JetBrains Mono, monospace"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Needle */}
        <motion.g
          initial={animated ? { rotate: -135 } : { rotate: needleAngle }}
          animate={{ rotate: needleAngle }}
          transition={{ type: "spring", stiffness: 80, damping: 15 }}
          style={{ transformOrigin: `${centerX}px ${centerY}px` }}
        >
          <line
            x1={centerX - 6}
            y1={centerY}
            x2={centerX + radius * 0.65}
            y2={centerY}
            stroke={colors.main}
            strokeWidth={2.5}
            strokeLinecap="round"
            filter="url(#needleGlow)"
          />
          <circle
            cx={centerX}
            cy={centerY}
            r={5}
            className="fill-background"
            stroke={colors.main}
            strokeWidth={2}
          />
        </motion.g>

        {/* SELL Label - positioned at bottom-left of arc */}
        <text
          x={sellPos.x}
          y={sellPos.y}
          textAnchor="end"
          dominantBaseline="middle"
          className="fill-chart-5"
          fontSize={size * 0.038}
          fontFamily="JetBrains Mono, monospace"
          fontWeight="600"
          letterSpacing="0.05em"
        >
          SELL
        </text>

        {/* HOLD Label - positioned at top center of arc */}
        <text
          x={holdPos.x}
          y={holdPos.y - 2}
          textAnchor="middle"
          dominantBaseline="auto"
          className="fill-chart-4"
          fontSize={size * 0.038}
          fontFamily="JetBrains Mono, monospace"
          fontWeight="600"
          letterSpacing="0.05em"
        >
          HOLD
        </text>

        {/* BUY Label - positioned at bottom-right of arc */}
        <text
          x={buyPos.x}
          y={buyPos.y}
          textAnchor="start"
          dominantBaseline="middle"
          className="fill-chart-2"
          fontSize={size * 0.038}
          fontFamily="JetBrains Mono, monospace"
          fontWeight="600"
          letterSpacing="0.05em"
        >
          BUY
        </text>
      </svg>

      {/* Score display - clearly separated below the gauge */}
      <motion.div
        className="flex flex-col items-center justify-center text-center -mt-2"
        initial={animated ? { opacity: 0, y: 8 } : { opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        <div 
          className="font-mono text-4xl font-bold tabular-nums leading-none"
          style={{ color: colors.main }}
        >
          {clampedScore}
        </div>
        <div className="text-xs text-muted-foreground font-medium tracking-wide mt-1">
          COMPOSITE SCORE
        </div>
      </motion.div>
    </div>
  );
}
