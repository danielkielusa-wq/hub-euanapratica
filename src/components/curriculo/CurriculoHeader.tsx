import { FileText, Zap } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { Skeleton } from '@/components/ui/skeleton';

export function CurriculoHeader() {
  const { quota, isLoading } = useSubscription();

  const remaining = quota?.remaining ?? 0;
  const limit = quota?.monthlyLimit ?? 1;
  const percentage = Math.min((remaining / limit) * 100, 100);

  // Color logic based on remaining percentage
  const getColor = () => {
    if (remaining <= 0) return { stroke: '#ef4444', bg: 'bg-red-50', text: 'text-red-600', label: 'text-red-500' };
    if (percentage <= 25) return { stroke: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-600', label: 'text-amber-500' };
    return { stroke: '#7367F0', bg: 'bg-indigo-50', text: 'text-[#7367F0]', label: 'text-gray-500' };
  };

  const colors = getColor();

  // SVG circular gauge — compact 36x36, r=14
  const r = 14;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - percentage / 100);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      {/* Left: title + description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 bg-indigo-100 rounded-lg shrink-0">
            <FileText className="w-5 h-5 text-[#7367F0]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">ResumePass AI</h1>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed max-w-xl">
          Compare seu CV com a vaga desejada e vença o ATS. Nossa IA simula os robôs de recrutamento dos EUA para te dar um score real.
        </p>
      </div>

      {/* Right: Credits — compact inline pill */}
      {isLoading ? (
        <Skeleton className="h-10 w-36 rounded-full shrink-0" />
      ) : quota ? (
        <div className={`
          flex items-center gap-3 px-3 py-2 rounded-xl border shrink-0
          ${remaining <= 0 ? 'bg-red-50/80 border-red-200' : 'bg-white border-gray-200'}
          shadow-sm
        `}>
          {/* Circular gauge */}
          <div className="w-9 h-9 relative shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r={r} stroke="#f3f4f6" strokeWidth="3" fill="none" />
              <circle
                cx="18" cy="18" r={r}
                stroke={colors.stroke}
                strokeWidth="3"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {remaining <= 0 ? (
                <span className="text-[9px] font-bold text-red-500">0</span>
              ) : (
                <Zap className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
              )}
            </div>
          </div>

          {/* Text */}
          <div className="flex flex-col leading-tight">
            <span className={`text-base font-bold ${colors.text}`}>
              {remaining}
              <span className="text-gray-400 text-xs font-medium">/{limit}</span>
            </span>
            <span className={`text-[10px] font-medium ${colors.label} uppercase tracking-wider`}>
              {remaining <= 0 ? 'Sem créditos' : 'Créditos'}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
