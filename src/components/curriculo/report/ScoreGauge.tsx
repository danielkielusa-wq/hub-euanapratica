import { useMemo } from 'react';

interface ScoreGaugeProps {
  score: number;
}

export function ScoreGauge({ score }: ScoreGaugeProps) {
  const { strokeColor, bgColor } = useMemo(() => {
    if (score >= 75) return { strokeColor: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.1)' };
    if (score >= 50) return { strokeColor: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' };
    return { strokeColor: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' };
  }, [score]);

  // SVG circle calculations
  const size = 200;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const offset = circumference - progress;

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Pulsing background ring */}
      <div 
        className="absolute rounded-full animate-pulse"
        style={{
          width: size + 40,
          height: size + 40,
          backgroundColor: bgColor,
        }}
      />
      
      {/* SVG Gauge */}
      <svg
        width={size}
        height={size}
        className="transform -rotate-90 relative z-10"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="white"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
        <span 
          className="text-5xl font-extrabold"
          style={{ color: strokeColor }}
        >
          {score}
        </span>
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
          Score
        </span>
      </div>
    </div>
  );
}
