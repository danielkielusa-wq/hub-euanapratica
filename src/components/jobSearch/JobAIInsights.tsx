import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Clock,
  Globe,
  DollarSign,
  Target,
  Lightbulb,
  FileText,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { JobAIEnrichment } from '@/types/jobs';

interface JobAIInsightsProps {
  enrichment: JobAIEnrichment;
}

export default function JobAIInsights({ enrichment }: JobAIInsightsProps) {
  const navigate = useNavigate();

  const timezoneScoreColor =
    enrichment.timezone_analysis.compatibility_score >= 7
      ? 'text-green-600 bg-green-50 border-green-100'
      : enrichment.timezone_analysis.compatibility_score >= 4
        ? 'text-amber-600 bg-amber-50 border-amber-100'
        : 'text-red-600 bg-red-50 border-red-100';

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-[40px] p-10 md:p-12 border border-indigo-100 shadow-sm space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
          <Sparkles size={20} />
        </div>
        <div>
          <h2 className="text-xl font-black text-gray-900">Análise ENP para Brasileiros</h2>
          <p className="text-xs text-gray-500 font-medium">Insights personalizados para profissionais no Brasil</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Timezone Compatibility */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-indigo-500" />
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Fuso Horário</h3>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-3 py-1 rounded-full text-sm font-black border ${timezoneScoreColor}`}>
              {enrichment.timezone_analysis.compatibility_score}/10
            </span>
            <span className="text-sm font-bold text-gray-700">
              {enrichment.timezone_analysis.overlap_with_brazil}
            </span>
          </div>
          <p className="text-xs text-gray-500 font-medium">
            {enrichment.timezone_analysis.preferred_hours}
          </p>
        </div>

        {/* English Level */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Globe size={16} className="text-blue-500" />
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Inglês Necessário</h3>
          </div>
          <p className="text-lg font-black text-gray-900 mb-1">
            {enrichment.english_level_required}
          </p>
          <p className="text-xs text-gray-500 font-medium">
            {enrichment.english_level_notes}
          </p>
        </div>

        {/* Salary in BRL */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={16} className="text-green-500" />
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Poder de Compra (BRL)</h3>
          </div>
          <p className="text-lg font-black text-green-600 mb-1">
            R$ {enrichment.salary_brl_context.monthly_brl.toLocaleString('pt-BR')}/mês
          </p>
          <p className="text-xs text-gray-500 font-medium">
            {enrichment.salary_brl_context.comparison}
          </p>
        </div>

        {/* Key Skills */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Target size={16} className="text-purple-500" />
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Habilidades-Chave</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {enrichment.key_skills.map((skill) => (
              <span key={skill} className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-lg border border-purple-100">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Skills Gap Hint */}
      {enrichment.missing_skills_hint && (
        <div className="bg-white rounded-3xl p-6 border border-amber-100">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-500 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Dica de Habilidade</h3>
              <p className="text-sm text-gray-700 font-medium leading-relaxed">
                {enrichment.missing_skills_hint}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Application Tips */}
      {enrichment.application_tips.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={16} className="text-amber-500" />
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Dicas para Candidatura</h3>
          </div>
          <ul className="space-y-3">
            {enrichment.application_tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm text-gray-700 font-medium leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ResumePass Keywords + CTA */}
      {enrichment.resume_pass_keywords.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={16} className="text-brand-500" />
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Keywords para seu Currículo</h3>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {enrichment.resume_pass_keywords.map((keyword) => (
              <span key={keyword} className="px-3 py-1.5 bg-brand-50 text-brand-700 text-xs font-bold rounded-lg border border-brand-100">
                {keyword}
              </span>
            ))}
          </div>
          <Button
            onClick={() => navigate('/curriculo')}
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl"
            size="sm"
          >
            <FileText size={14} className="mr-2" />
            Otimizar Currículo com ResumePass
          </Button>
        </div>
      )}

      {/* Career Path */}
      {enrichment.career_path_insight && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100">
          <div className="flex items-start gap-3">
            <TrendingUp size={18} className="text-indigo-500 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Perspectiva de Carreira</h3>
              <p className="text-sm text-gray-700 font-medium leading-relaxed">
                {enrichment.career_path_insight}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
