import { useMemo } from 'react';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ScoreGaugeProps {
  score: number;
}

export function ScoreGauge({ score }: ScoreGaugeProps) {
  const { strokeColor, bgColor, textColor } = useMemo(() => {
    if (score >= 75) return { strokeColor: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.1)', textColor: 'text-green-600' };
    if (score >= 50) return { strokeColor: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)', textColor: 'text-amber-600' };
    return { strokeColor: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)', textColor: 'text-red-600' };
  }, [score]);

  // SVG circle calculations
  const size = 200;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const offset = circumference - progress;

  return (
    <TooltipProvider>
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
            stroke="hsl(var(--border))"
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
            className={`text-5xl font-extrabold ${textColor}`}
          >
            {score}
          </span>
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Score
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-0.5 rounded-full hover:bg-muted transition-colors">
                  <Info className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[280px] text-sm">
                <p className="font-medium mb-2">Este score representa a compatibilidade geral do seu currículo com a vaga analisada.</p>
                <ul className="space-y-1 text-xs">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span>75-100: Alta compatibilidade</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>50-74: Compatibilidade média</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span>0-49: Baixa compatibilidade</span>
                  </li>
                </ul>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
