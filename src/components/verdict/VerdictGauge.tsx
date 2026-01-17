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
    if (score >= 60) return { main: 'hsl(160, 84%, 39%)', glow: 'hsl(160, 84%, 39%)' }; // Emerald
    if (score >= 45) return { main: 'hsl(38, 92%, 50%)', glow: 'hsl(38, 92%, 50%)' }; // Amber
    return { main: 'hsl(350, 89%, 60%)', glow: 'hsl(350, 89%, 60%)' }; // Rose
  };

  const colors = getGaugeColor(clampedScore);
  
  const centerX = size / 2;
  const centerY = size / 2 + 16;
  const radius = size * 0.36;
  const strokeWidth = size * 0.05;

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
    { start: -135, end: -45, color: 'hsl(350, 89%, 60%)' },  // Bearish - Rose
    { start: -45, end: 45, color: 'hsl(38, 92%, 50%)' },     // Neutral - Amber
    { start: 45, end: 135, color: 'hsl(160, 84%, 39%)' },    // Bullish - Emerald
  ], []);

  const ticks = [0, 50, 100];

  return (
    <div className="relative" style={{ width: size, height: size * 0.58 }}>
      <svg 
        width={size} 
        height={size * 0.65} 
        viewBox={`0 0 ${size} ${size * 0.65}`}
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
            opacity={0.12}
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

        {/* Tick marks */}
        {ticks.map((tick) => {
          const angle = -135 + (tick / 100) * 270;
          const rad = (angle * Math.PI) / 180;
          const innerR = radius - strokeWidth / 2 - 6;
          const labelR = radius - strokeWidth / 2 - 18;
          
          return (
            <g key={tick}>
              <text
                x={centerX + labelR * Math.cos(rad)}
                y={centerY + labelR * Math.sin(rad)}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="hsl(240, 5%, 46%)"
                fontSize={size * 0.04}
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
            x1={centerX - 8}
            y1={centerY}
            x2={centerX + radius * 0.7}
            y2={centerY}
            stroke={colors.main}
            strokeWidth={2.5}
            strokeLinecap="round"
            filter="url(#needleGlow)"
          />
          <circle
            cx={centerX}
            cy={centerY}
            r={6}
            fill="hsl(0, 0%, 95%)"
            stroke={colors.main}
            strokeWidth={2}
          />
        </motion.g>

        {/* Labels */}
        <text
          x={size * 0.12}
          y={centerY + 28}
          textAnchor="middle"
          fill="hsl(350, 89%, 60%)"
          fontSize={size * 0.035}
          fontFamily="JetBrains Mono, monospace"
          fontWeight="500"
          letterSpacing="0.05em"
        >
          SELL
        </text>
        <text
          x={size * 0.88}
          y={centerY + 28}
          textAnchor="middle"
          fill="hsl(160, 84%, 39%)"
          fontSize={size * 0.035}
          fontFamily="JetBrains Mono, monospace"
          fontWeight="500"
          letterSpacing="0.05em"
        >
          BUY
        </text>
      </svg>

      {/* Score display */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 text-center"
        style={{ bottom: -4 }}
        initial={animated ? { opacity: 0, y: 8 } : { opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        <div 
          className="font-mono text-4xl font-bold tabular-nums"
          style={{ color: colors.main }}
        >
          {clampedScore}
        </div>
        <div className="data-label mt-0.5">
          Composite Score
        </div>
      </motion.div>
    </div>
  );
}
