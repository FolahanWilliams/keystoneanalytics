import { motion } from "framer-motion";
import { useMemo } from "react";

interface VerdictGaugeProps {
  score: number; // 0-100
  size?: number;
  animated?: boolean;
}

export function VerdictGauge({ score, size = 280, animated = true }: VerdictGaugeProps) {
  // Clamp score between 0 and 100
  const clampedScore = Math.max(0, Math.min(100, score));
  
  // Calculate needle angle: 0 = -90deg (left), 100 = 90deg (right)
  // The gauge spans from -135deg to 135deg (270 degrees total)
  const needleAngle = -135 + (clampedScore / 100) * 270;
  
  // Determine color based on score
  const getGaugeColor = (score: number) => {
    if (score >= 70) return { main: 'hsl(142, 76%, 45%)', glow: 'hsl(142, 76%, 45%)' }; // Emerald
    if (score >= 55) return { main: 'hsl(142, 60%, 50%)', glow: 'hsl(142, 60%, 50%)' }; // Light green
    if (score >= 45) return { main: 'hsl(45, 93%, 47%)', glow: 'hsl(45, 93%, 47%)' }; // Amber
    if (score >= 30) return { main: 'hsl(20, 90%, 55%)', glow: 'hsl(20, 90%, 55%)' }; // Orange
    return { main: 'hsl(0, 84%, 60%)', glow: 'hsl(0, 84%, 60%)' }; // Rose
  };

  const colors = getGaugeColor(clampedScore);
  
  // SVG dimensions
  const centerX = size / 2;
  const centerY = size / 2 + 20;
  const radius = size * 0.38;
  const strokeWidth = size * 0.06;

  // Create arc path for the gauge background
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

  // Gauge segments (from left to right: bearish to bullish)
  const segments = useMemo(() => [
    { start: -135, end: -81, color: 'hsl(0, 84%, 60%)' },      // Extreme Bearish
    { start: -81, end: -27, color: 'hsl(20, 90%, 55%)' },     // Bearish
    { start: -27, end: 27, color: 'hsl(45, 93%, 47%)' },      // Neutral
    { start: 27, end: 81, color: 'hsl(142, 60%, 50%)' },      // Bullish
    { start: 81, end: 135, color: 'hsl(142, 76%, 45%)' },     // Extreme Bullish
  ], []);

  // Tick marks
  const ticks = [0, 25, 50, 75, 100];

  return (
    <div className="relative" style={{ width: size, height: size * 0.65 }}>
      <svg 
        width={size} 
        height={size * 0.7} 
        viewBox={`0 0 ${size} ${size * 0.7}`}
        className="overflow-visible"
      >
        {/* Glow filter */}
        <defs>
          <filter id="gaugeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="needleGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="needleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.main} />
            <stop offset="100%" stopColor="hsl(var(--foreground))" />
          </linearGradient>
        </defs>

        {/* Background arc segments */}
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

        {/* Active arc (filled portion) */}
        <motion.path
          d={createArc(-135, -135 + (clampedScore / 100) * 270, radius)}
          fill="none"
          stroke={colors.main}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          filter="url(#gaugeGlow)"
          initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />

        {/* Tick marks and labels */}
        {ticks.map((tick) => {
          const angle = -135 + (tick / 100) * 270;
          const rad = (angle * Math.PI) / 180;
          const innerR = radius - strokeWidth / 2 - 8;
          const outerR = radius - strokeWidth / 2 - 2;
          const labelR = radius - strokeWidth / 2 - 22;
          
          return (
            <g key={tick}>
              <line
                x1={centerX + innerR * Math.cos(rad)}
                y1={centerY + innerR * Math.sin(rad)}
                x2={centerX + outerR * Math.cos(rad)}
                y2={centerY + outerR * Math.sin(rad)}
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1.5}
                opacity={0.5}
              />
              <text
                x={centerX + labelR * Math.cos(rad)}
                y={centerY + labelR * Math.sin(rad)}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="hsl(var(--muted-foreground))"
                fontSize={size * 0.035}
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
          transition={{
            type: "spring",
            stiffness: 60,
            damping: 12,
            mass: 1,
          }}
          style={{ transformOrigin: `${centerX}px ${centerY}px` }}
        >
          {/* Needle shadow */}
          <line
            x1={centerX}
            y1={centerY}
            x2={centerX + radius * 0.75}
            y2={centerY}
            stroke="black"
            strokeWidth={4}
            strokeLinecap="round"
            opacity={0.3}
            transform="translate(2, 2)"
          />
          {/* Needle body */}
          <line
            x1={centerX - 10}
            y1={centerY}
            x2={centerX + radius * 0.75}
            y2={centerY}
            stroke="url(#needleGradient)"
            strokeWidth={3}
            strokeLinecap="round"
            filter="url(#needleGlow)"
          />
          {/* Needle cap */}
          <circle
            cx={centerX}
            cy={centerY}
            r={8}
            fill="hsl(var(--foreground))"
            stroke={colors.main}
            strokeWidth={2}
          />
        </motion.g>

        {/* Center labels */}
        <text
          x={size * 0.15}
          y={centerY + 35}
          textAnchor="middle"
          fill="hsl(0, 84%, 60%)"
          fontSize={size * 0.032}
          fontFamily="JetBrains Mono, monospace"
          fontWeight="500"
        >
          BEARISH
        </text>
        <text
          x={size * 0.85}
          y={centerY + 35}
          textAnchor="middle"
          fill="hsl(142, 76%, 45%)"
          fontSize={size * 0.032}
          fontFamily="JetBrains Mono, monospace"
          fontWeight="500"
        >
          BULLISH
        </text>
      </svg>

      {/* Score display */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 text-center"
        style={{ bottom: 0 }}
        initial={animated ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.4 }}
      >
        <div 
          className="font-mono text-4xl font-bold tabular-nums"
          style={{ color: colors.main }}
        >
          {clampedScore}
        </div>
        <div className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">
          Composite Score
        </div>
      </motion.div>
    </div>
  );
}
