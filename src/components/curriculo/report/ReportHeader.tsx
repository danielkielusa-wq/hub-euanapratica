import { Sparkles } from 'lucide-react';
import { ScoreGauge } from './ScoreGauge';
import type { FullAnalysisResult } from '@/types/curriculo';

interface ReportHeaderProps {
  result: FullAnalysisResult;
}

export function ReportHeader({ result }: ReportHeaderProps) {
  const { header } = result;

  // Highlight word in main message (e.g., "competitivo" becomes gradient)
  const highlightMessage = (message: string) => {
    // Find common highlight words
    const highlightWords = ['competitivo', 'forte', 'excelente', 'bom', 'promissor', 'adequado'];
    
    for (const word of highlightWords) {
      if (message.toLowerCase().includes(word.toLowerCase())) {
        const regex = new RegExp(`(${word})`, 'gi');
        const parts = message.split(regex);
        
        return parts.map((part, index) => {
          if (part.toLowerCase() === word.toLowerCase()) {
            return (
              <span 
                key={index}
                className="bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent"
              >
                {part}
              </span>
            );
          }
          return part;
        });
      }
    }
    
    return message;
  };

  return (
    <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 md:p-8">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
        {/* Score Gauge - Compact on left */}
        <div className="flex-shrink-0">
          <ScoreGauge score={header.score} compact />
        </div>

        {/* Text Content - Right side */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-3 flex-1">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              {header.status_tag}
            </span>
          </div>

          {/* Main Message */}
          <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 leading-tight">
            {highlightMessage(header.main_message)}
          </h2>

          {/* Sub Message */}
          <p className="text-gray-500 text-sm md:text-base max-w-lg leading-relaxed">
            {header.sub_message}
          </p>
        </div>
      </div>
    </div>
  );
}
