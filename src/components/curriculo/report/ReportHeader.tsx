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
    let found = false;
    
    for (const word of highlightWords) {
      if (message.toLowerCase().includes(word.toLowerCase())) {
        const regex = new RegExp(`(${word})`, 'gi');
        const parts = message.split(regex);
        
        return parts.map((part, index) => {
          if (part.toLowerCase() === word.toLowerCase()) {
            found = true;
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
    <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-8 md:p-12">
      <div className="flex flex-col items-center text-center space-y-6">
        {/* Score Gauge */}
        <ScoreGauge score={header.score} />

        {/* Status Badge */}
        <div className="inline-flex">
          <span className="bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full">
            {header.status_tag}
          </span>
        </div>

        {/* Main Message */}
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
          {highlightMessage(header.main_message)}
        </h2>

        {/* Sub Message */}
        <p className="text-gray-500 text-sm md:text-base max-w-lg">
          {header.sub_message}
        </p>
      </div>
    </div>
  );
}
