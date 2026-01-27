import { FileCheck, Search, Zap, FileText } from 'lucide-react';
import type { FullAnalysisResult } from '@/types/curriculo';

interface MetricsRowProps {
  metrics: FullAnalysisResult['metrics'];
}

export function MetricsRow({ metrics }: MetricsRowProps) {
  const metricCards = [
    {
      key: 'ats',
      label: 'Formatação ATS',
      score: metrics.ats_format.score,
      details: metrics.ats_format.details_pt,
      icon: FileCheck,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      key: 'keywords',
      label: 'Palavras-Chave',
      score: metrics.keywords.score,
      details: `${metrics.keywords.matched_count}/${metrics.keywords.total_required} encontradas`,
      icon: Search,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      key: 'verbs',
      label: 'Verbos de Ação',
      score: metrics.action_verbs.score,
      details: `${metrics.action_verbs.count} verbos de impacto`,
      icon: Zap,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      key: 'brevity',
      label: 'Brevidade',
      score: metrics.brevity.score,
      details: `${metrics.brevity.page_count}/${metrics.brevity.ideal_page_count} página(s)`,
      icon: FileText,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
    },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metricCards.map((metric) => (
        <div 
          key={metric.key}
          className="bg-white rounded-[20px] border border-gray-100 shadow-sm p-5 flex flex-col items-center text-center space-y-3"
        >
          {/* Icon */}
          <div className={`w-12 h-12 ${metric.iconBg} rounded-2xl flex items-center justify-center`}>
            <metric.icon className={`w-6 h-6 ${metric.iconColor}`} />
          </div>

          {/* Label */}
          <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
            {metric.label}
          </span>

          {/* Score Badge */}
          <span className={`text-lg font-bold px-3 py-1 rounded-full ${getScoreColor(metric.score)}`}>
            {metric.score}%
          </span>

          {/* Details */}
          <span className="text-xs text-gray-400">
            {metric.details}
          </span>
        </div>
      ))}
    </div>
  );
}
