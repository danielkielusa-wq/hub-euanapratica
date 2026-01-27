import { FileCheck, Search, Zap, FileText, Info } from 'lucide-react';
import type { FullAnalysisResult, QualitativeScore } from '@/types/curriculo';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MetricsRowProps {
  metrics: FullAnalysisResult['metrics'];
}

const metricTooltips = {
  ats: "Verifica se o formato do seu currículo é compatível com sistemas ATS (Applicant Tracking Systems). Formatos PDF simples e sem tabelas complexas são ideais.",
  keywords: "Analisa quantas palavras-chave da vaga estão presentes no seu currículo. Quanto mais correspondências, maior a chance de passar pelos filtros automatizados.",
  verbs: "Verbos de ação como 'Led', 'Developed', 'Achieved' demonstram impacto e liderança. Currículos americanos priorizam verbos fortes no início das frases.",
  brevity: "Nos EUA, currículos devem ter 1-2 páginas. Recrutadores gastam em média 6 segundos na primeira triagem.",
};

const getQualitativeLabel = (score: number): QualitativeScore => {
  if (score >= 80) return "Perfeito";
  if (score >= 50) return "Precisa Melhorar";
  return "Crítico";
};

const getScoreStyles = (score: number) => {
  if (score >= 80) return { badge: 'text-green-700 bg-green-100', icon: 'bg-green-50', iconColor: 'text-green-600' };
  if (score >= 50) return { badge: 'text-amber-700 bg-amber-100', icon: 'bg-amber-50', iconColor: 'text-amber-600' };
  return { badge: 'text-red-700 bg-red-100', icon: 'bg-red-50', iconColor: 'text-red-600' };
};

export function MetricsRow({ metrics }: MetricsRowProps) {
  const metricCards = [
    {
      key: 'ats',
      label: 'Formatação ATS',
      score: metrics.ats_format.score,
      details: metrics.ats_format.details_pt,
      icon: FileCheck,
      tooltip: metricTooltips.ats,
    },
    {
      key: 'keywords',
      label: 'Palavras-Chave',
      score: metrics.keywords.score,
      details: `${metrics.keywords.matched_count}/${metrics.keywords.total_required} encontradas`,
      icon: Search,
      tooltip: metricTooltips.keywords,
    },
    {
      key: 'verbs',
      label: 'Verbos de Ação',
      score: metrics.action_verbs.score,
      details: `${metrics.action_verbs.count} verbos de impacto`,
      icon: Zap,
      tooltip: metricTooltips.verbs,
    },
    {
      key: 'brevity',
      label: 'Brevidade',
      score: metrics.brevity.score,
      details: `${metrics.brevity.page_count}/${metrics.brevity.ideal_page_count} página(s)`,
      icon: FileText,
      tooltip: metricTooltips.brevity,
    },
  ];

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((metric) => {
          const styles = getScoreStyles(metric.score);
          const qualitativeLabel = getQualitativeLabel(metric.score);
          
          return (
            <div 
              key={metric.key}
              className="bg-background rounded-2xl border border-border shadow-sm p-5 flex flex-col items-center text-center space-y-3 relative"
            >
              {/* Info Icon */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors">
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[280px] text-sm">
                  <p>{metric.tooltip}</p>
                </TooltipContent>
              </Tooltip>

              {/* Icon */}
              <div className={`w-12 h-12 ${styles.icon} rounded-2xl flex items-center justify-center`}>
                <metric.icon className={`w-6 h-6 ${styles.iconColor}`} />
              </div>

              {/* Label */}
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {metric.label}
              </span>

              {/* Qualitative Badge */}
              <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${styles.badge}`}>
                {qualitativeLabel}
              </span>

              {/* Details */}
              <span className="text-xs text-muted-foreground">
                {metric.details}
              </span>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
