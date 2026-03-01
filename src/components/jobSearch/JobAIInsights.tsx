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
  AlertCircle,
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

  const matchScore = enrichment.timezone_analysis.compatibility_score * 10;

  return (
    <div className="bg-white rounded-3xl border border-purple-100 shadow-sm overflow-hidden">
      {/* Purple Gradient Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-200" />
              Análise de Compatibilidade
            </h2>
            <p className="text-purple-100 text-sm mt-1">Baseado no seu perfil brasileiro</p>
          </div>
          <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
            <div className="text-3xl font-bold">{matchScore}%</div>
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">Match</div>
          </div>
        </div>
      </div>

      {/* 3-Column Metrics */}
      <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-100">
        {/* Timezone */}
        <div className="space-y-3 pt-4 md:pt-0">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
            <Clock className="w-4 h-4" /> Fuso Horário
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {enrichment.timezone_analysis.compatibility_score}/10
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${timezoneScoreColor}`}>
              {enrichment.timezone_analysis.overlap_with_brazil}
            </span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            {enrichment.timezone_analysis.preferred_hours}
          </p>
        </div>

        {/* English */}
        <div className="space-y-3 pt-4 md:pt-0 md:pl-8">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
            <Globe className="w-4 h-4" /> Inglês
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-600">
              {enrichment.english_level_required}
            </span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            {enrichment.english_level_notes}
          </p>
        </div>

        {/* Salary BRL */}
        <div className="space-y-3 pt-4 md:pt-0 md:pl-8">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
            <DollarSign className="w-4 h-4" /> Estimativa BRL
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-green-600">
              R$ {enrichment.salary_brl_context.monthly_brl.toLocaleString('pt-BR')}
            </span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            {enrichment.salary_brl_context.comparison}
          </p>
        </div>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-8 pb-8">
        {/* Key Skills */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-4">
            <Target className="w-5 h-5 text-blue-500" />
            Skills Necessárias
          </div>
          <div className="flex flex-wrap gap-2">
            {enrichment.key_skills.map((skill) => (
              <span key={skill} className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-xs font-medium border border-gray-100">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Skills Gap / Attention Point */}
        {enrichment.missing_skills_hint ? (
          <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100">
            <div className="flex items-center gap-2 text-sm font-bold text-orange-800 mb-4">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Ponto de Atenção
            </div>
            <p className="text-sm text-orange-800/80 leading-relaxed">
              {enrichment.missing_skills_hint}
            </p>
          </div>
        ) : (
          <div className="bg-green-50 p-6 rounded-3xl border border-green-100">
            <div className="flex items-center gap-2 text-sm font-bold text-green-800 mb-4">
              <Target className="w-5 h-5 text-green-600" />
              Bom Match
            </div>
            <p className="text-sm text-green-800/80 leading-relaxed">
              Seu perfil atende bem aos requisitos desta vaga.
            </p>
          </div>
        )}
      </div>

      {/* Application Tips */}
      {enrichment.application_tips.length > 0 && (
        <div className="mx-8 mb-8 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Dicas para Aplicação
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enrichment.application_tips.map((tip, idx) => (
              <div key={idx} className="flex gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="w-6 h-6 bg-white text-gray-900 rounded-full flex items-center justify-center text-xs font-bold shadow-sm shrink-0 border border-gray-100">
                  {idx + 1}
                </div>
                <p className="text-sm text-gray-600 font-medium">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ResumePass Keywords + CTA */}
      {enrichment.resume_pass_keywords.length > 0 && (
        <div className="mx-8 mb-8 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
            <FileText className="w-4 h-4" /> Keywords para seu Currículo
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {enrichment.resume_pass_keywords.map((keyword) => (
              <span key={keyword} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100">
                {keyword}
              </span>
            ))}
          </div>
          <Button
            onClick={() => navigate('/curriculo')}
            className="bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold rounded-xl"
            size="sm"
          >
            <Sparkles size={14} className="mr-2" />
            Otimizar Currículo com ResumePass
          </Button>
        </div>
      )}

      {/* Career Path */}
      {enrichment.career_path_insight && (
        <div className="mx-8 mb-8 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Perspectiva de Carreira</h3>
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
