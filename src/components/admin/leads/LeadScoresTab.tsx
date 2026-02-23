import { Languages, Briefcase, DollarSign, Users, Globe, Clock, HelpCircle, Shield, AlertTriangle, Laptop, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import type { CareerEvaluation } from '@/types/leads';

interface LeadScoresTabProps {
  lead: CareerEvaluation;
}

const BARRIER_CONFIG = [
  { key: 'has_english_barrier' as const, label: 'Inglês', icon: Languages },
  { key: 'has_experience_barrier' as const, label: 'Experiência', icon: Briefcase },
  { key: 'has_financial_barrier' as const, label: 'Financeiro', icon: DollarSign },
  { key: 'has_family_barrier' as const, label: 'Família', icon: Users },
  { key: 'has_visa_barrier' as const, label: 'Visto', icon: Globe },
  { key: 'has_time_barrier' as const, label: 'Tempo', icon: Clock },
  { key: 'has_clarity_barrier' as const, label: 'Clareza', icon: HelpCircle },
];

export function LeadScoresTab({ lead }: LeadScoresTabProps) {
  const radarData = [
    { dimension: 'Inglês', value: lead.score_english ?? 0 },
    { dimension: 'Experiência', value: lead.score_experience ?? 0 },
    { dimension: 'Intl.', value: lead.score_international_work ?? 0 },
    { dimension: 'Timeline', value: lead.score_timeline ?? 0 },
    { dimension: 'Objetivo', value: lead.score_objective ?? 0 },
    { dimension: 'Visto', value: lead.score_visa ?? 0 },
    { dimension: 'Prontidão', value: lead.score_readiness ?? 0 },
    { dimension: 'Área', value: lead.score_area_bonus ?? 0 },
  ];

  const hasAnyScore = radarData.some(d => d.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Scores */}
      <div className="space-y-6">
        <Card variant="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-500" /> Breakdown de Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasAnyScore ? (
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10, fill: '#6b7280' }} />
                    <PolarRadiusAxis angle={90} domain={[0, 20]} tick={{ fontSize: 9 }} />
                    <Radar
                      name="Score"
                      dataKey="value"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-xs text-gray-400 py-8 text-center">Scores não disponíveis.</p>
            )}

            {/* Overall scores */}
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">{lead.readiness_score ?? '—'}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Readiness</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{lead.fit_score ?? '—'}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Fit Score</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{lead.lead_priority_score ?? '—'}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Prioridade</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right: Barriers + Blockers + Context */}
      <div className="space-y-6">
        {/* Barriers */}
        <Card variant="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-500" /> Barreiras Identificadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {BARRIER_CONFIG.map(({ key, label, icon: Icon }) => {
                const isActive = !!(lead as any)[key];
                return (
                  <div key={key} className={cn(
                    'flex items-center gap-2.5 p-2.5 rounded-xl border transition-colors',
                    isActive ? 'bg-red-50 border-red-200' : 'bg-green-50/50 border-green-200/50',
                  )}>
                    <div className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                      isActive ? 'bg-red-100' : 'bg-green-100',
                    )}>
                      <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-red-600' : 'text-green-600')} />
                    </div>
                    <div>
                      <p className={cn('text-xs font-medium', isActive ? 'text-red-700' : 'text-green-700')}>{label}</p>
                      <p className={cn('text-[10px]', isActive ? 'text-red-500' : 'text-green-500')}>
                        {isActive ? 'Barreira ativa' : 'OK'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Critical blockers */}
        {(lead.critical_blockers?.length || lead.main_concern || lead.impediment || lead.recommended_first_action) && (
          <Card variant="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Bloqueadores & Preocupações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lead.critical_blockers?.length ? (
                <div>
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Bloqueadores críticos</p>
                  <div className="space-y-1">
                    {lead.critical_blockers.map((b, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-red-700 bg-red-50 rounded-lg p-2">
                        <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {lead.recommended_first_action && (
                <div>
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Primeira ação recomendada</p>
                  <p className="text-xs text-gray-700 bg-blue-50 rounded-lg p-2">{lead.recommended_first_action}</p>
                </div>
              )}
              {lead.main_concern && (
                <div>
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Principal preocupação</p>
                  <p className="text-xs text-gray-700">{lead.main_concern}</p>
                </div>
              )}
              {lead.impediment && (
                <div>
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Impedimento</p>
                  <p className="text-xs text-gray-700">{lead.impediment}{lead.impediment_other ? ` — ${lead.impediment_other}` : ''}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Professional Context */}
        <Card variant="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Laptop className="w-4 h-4 text-indigo-500" /> Contexto Profissional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lead.is_tech_professional != null && (
                <Badge variant="outline" className={cn('text-[10px]', lead.is_tech_professional ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-500')}>
                  {lead.is_tech_professional ? 'Tech' : 'Não-Tech'}
                </Badge>
              )}
              {lead.is_senior_level != null && (
                <Badge variant="outline" className={cn('text-[10px]', lead.is_senior_level ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-gray-50 text-gray-500')}>
                  {lead.is_senior_level ? 'Sênior' : 'Não-Sênior'}
                </Badge>
              )}
              {lead.works_remotely != null && (
                <Badge variant="outline" className={cn('text-[10px]', lead.works_remotely ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500')}>
                  {lead.works_remotely ? 'Remoto' : 'Presencial'}
                </Badge>
              )}
              {lead.is_high_income != null && lead.is_high_income && (
                <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">Alta Renda</Badge>
              )}
              {lead.has_family != null && (
                <Badge variant="outline" className="text-[10px] bg-gray-50 text-gray-600">
                  {lead.has_family ? 'Com família' : 'Sem família'}
                </Badge>
              )}
              {lead.trabalha_internacional != null && lead.trabalha_internacional && (
                <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200">Trabalha Intl.</Badge>
              )}
            </div>
            <div className="mt-3 space-y-1 text-xs">
              {lead.experiencia && (
                <div className="flex gap-2"><span className="text-gray-400">Experiência:</span><span className="text-gray-700">{lead.experiencia}</span></div>
              )}
              {lead.english_level && (
                <div className="flex gap-2"><span className="text-gray-400">Inglês:</span><span className="text-gray-700">{lead.english_level}</span></div>
              )}
              {lead.objetivo && (
                <div className="flex gap-2"><span className="text-gray-400">Objetivo:</span><span className="text-gray-700">{lead.objetivo}</span></div>
              )}
              {lead.visa_status && (
                <div className="flex gap-2"><span className="text-gray-400">Visto:</span><span className="text-gray-700">{lead.visa_status}</span></div>
              )}
              {lead.timeline && (
                <div className="flex gap-2"><span className="text-gray-400">Timeline:</span><span className="text-gray-700">{lead.timeline}</span></div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
