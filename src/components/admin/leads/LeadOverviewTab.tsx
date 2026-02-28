import { User, MapPin, Clock, Phone, Mail, Globe, Smartphone, Tag, Calendar, Package, DollarSign, ArrowRight, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatInTz } from '@/lib/timezone';
import { useUserTimezone } from '@/hooks/useUserTimezone';
import type { CareerEvaluation } from '@/types/leads';

interface LeadOverviewTabProps {
  lead: CareerEvaluation;
  viewMode?: 'admin' | 'assistant';
}

const ROTA_STEPS = [
  { letter: 'R', title: 'Realidade & Direção', color: 'bg-red-500' },
  { letter: 'O', title: 'Organização da Marca', color: 'bg-amber-500' },
  { letter: 'T', title: 'Tração no Mercado', color: 'bg-emerald-500' },
  { letter: 'A', title: 'Aceleração & Adaptação', color: 'bg-blue-500' },
];

function InfoRow({ label, value, icon: Icon }: { label: string; value?: string | null; icon?: any }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />}
      <div className="min-w-0">
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm text-gray-700 break-words">{value}</p>
      </div>
    </div>
  );
}

function formatFollowUpDate(dateStr: string | undefined, tz: string): { text: string; className: string } | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const formatted = formatInTz(dateStr, tz, 'dd/MM/yyyy');

  if (diffDays < 0) return { text: `${formatted} (${Math.abs(diffDays)}d atrás)`, className: 'text-red-600' };
  if (diffDays === 0) return { text: `${formatted} (hoje)`, className: 'text-amber-600 font-medium' };
  return { text: `${formatted} (em ${diffDays}d)`, className: 'text-green-600' };
}

export function LeadOverviewTab({ lead, viewMode = 'admin' }: LeadOverviewTabProps) {
  const isAssistant = viewMode === 'assistant';
  const tz = useUserTimezone();
  // rota_letter can be compound like "O-T" — extract the target phase (last letter)
  const rotaLetter = lead.rota_letter?.split('-').pop()?.trim() ?? '';
  const currentRotaIdx = ROTA_STEPS.findIndex(s => s.letter === rotaLetter);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left column */}
      <div className="space-y-6">
        {/* Contact Info */}
        <Card variant="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-500" /> Informações de Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0 divide-y divide-gray-50">
            <InfoRow label="Nome" value={lead.name} icon={User} />
            <InfoRow label="Email" value={lead.email} icon={Mail} />
            <InfoRow label="Telefone" value={lead.phone} icon={Phone} />
            <InfoRow label="Área" value={lead.area} icon={MapPin} />
            <InfoRow label="Atuação" value={lead.atuacao} icon={MapPin} />
            <InfoRow label="Canal preferido" value={lead.preferred_communication} icon={Smartphone} />
            <InfoRow label="Melhor horário" value={lead.best_contact_time} icon={Clock} />
            {!isAssistant && <InfoRow label="Faixa de renda" value={lead.income_range} icon={DollarSign} />}
            {!isAssistant && <InfoRow label="Faixa de investimento" value={lead.investment_range} icon={DollarSign} />}
            <InfoRow label="Situação familiar" value={lead.family_status} />
            <InfoRow label="Inglês" value={lead.english_level} icon={Globe} />
          </CardContent>
        </Card>

        {/* UTM Attribution — admin only */}
        {!isAssistant && (lead.utm_source || lead.utm_medium || lead.utm_campaign || lead.gclid || lead.fbclid) && (
          <Card variant="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-500" /> Atribuição UTM
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0 divide-y divide-gray-50">
              <InfoRow label="Source" value={lead.utm_source} />
              <InfoRow label="Medium" value={lead.utm_medium} />
              <InfoRow label="Campaign" value={lead.utm_campaign} />
              <InfoRow label="Content" value={lead.utm_content} />
              <InfoRow label="Term" value={lead.utm_term} />
              <InfoRow label="Device" value={lead.device} icon={Smartphone} />
              {lead.gclid && <InfoRow label="Google Click ID" value={lead.gclid} />}
              {lead.fbclid && <InfoRow label="Facebook Click ID" value={lead.fbclid} />}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right column */}
      <div className="space-y-6">
        {/* ROTA Phase */}
        <Card variant="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-indigo-500" /> Fase ROTA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              {ROTA_STEPS.map((step, idx) => (
                <div key={step.letter} className="flex-1 text-center">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm mx-auto transition-all',
                    idx <= currentRotaIdx ? step.color : 'bg-gray-200 text-gray-400',
                    idx === currentRotaIdx && 'ring-2 ring-offset-2 ring-indigo-500 scale-110',
                  )}>
                    {step.letter}
                  </div>
                  <p className={cn('text-[10px] mt-1', idx === currentRotaIdx ? 'font-bold text-gray-800' : 'text-gray-400')}>
                    {step.title}
                  </p>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-xs">
              {lead.phase_name && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Fase:</span>
                  <span className="font-medium">{lead.phase_emoji} {lead.phase_name}</span>
                </div>
              )}
              {lead.urgency_level && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Urgência:</span>
                  <Badge variant="outline" className="text-[10px]">{lead.urgency_level}</Badge>
                </div>
              )}
              {lead.estimated_preparation_months != null && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Preparação estimada:</span>
                  <span className="font-medium">{lead.estimated_preparation_months} meses</span>
                </div>
              )}
              {lead.can_apply_jobs != null && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Pode aplicar para vagas:</span>
                  <Badge variant="outline" className={cn('text-[10px]', lead.can_apply_jobs ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
                    {lead.can_apply_jobs ? 'Sim' : 'Não'}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Product Recommendation */}
        <Card variant="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-500" /> Produto Recomendado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lead.recommended_product_name ? (
              <>
                <div className="bg-indigo-50 rounded-xl p-3">
                  <p className="text-sm font-bold text-indigo-800">{lead.recommended_product_name}</p>
                  {lead.recommended_product_tier && (
                    <Badge variant="outline" className="text-[10px] mt-1 bg-white/60 border-indigo-200 text-indigo-600">{lead.recommended_product_tier}</Badge>
                  )}
                  {!isAssistant && lead.recommended_product_price && (
                    <p className="text-xs text-indigo-600 mt-1">{lead.recommended_product_price}</p>
                  )}
                  {lead.recommendation_description && (
                    <p className="text-xs text-indigo-700/70 mt-2">{lead.recommendation_description}</p>
                  )}
                  {!isAssistant && lead.recommended_product_url && (
                    <a href={lead.recommended_product_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline mt-2">
                      <ExternalLink className="w-3 h-3" /> Ver página
                    </a>
                  )}
                </div>
                {lead.fit_score != null && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Fit Score:</span>
                    <span className="font-bold text-gray-800">{lead.fit_score}</span>
                  </div>
                )}
                {lead.secondary_product_name && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Alternativa</p>
                    <p className="text-sm font-medium text-gray-700">{lead.secondary_product_name}</p>
                    {lead.secondary_product_tier && (
                      <Badge variant="outline" className="text-[10px] mt-1">{lead.secondary_product_tier}</Badge>
                    )}
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-gray-400">Nenhum produto recomendado.</p>
            )}
          </CardContent>
        </Card>

        {/* Follow-ups */}
        <Card variant="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" /> Follow-ups Agendados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: 'Follow-up 1', date: lead.scheduled_follow_up_1 },
              { label: 'Follow-up 2', date: lead.scheduled_follow_up_2 },
              { label: 'Follow-up 3', date: lead.scheduled_follow_up_3 },
              { label: 'Recheck', date: lead.recheck_recommended_at },
            ].map(({ label, date }) => {
              const fup = formatFollowUpDate(date, tz);
              if (!fup) return null;
              return (
                <div key={label} className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">{label}</span>
                  <span className={fup.className}>{fup.text}</span>
                </div>
              );
            })}
            {lead.next_milestone_action && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Próximo milestone</p>
                <p className="text-sm text-gray-700 mt-1">{lead.next_milestone_action}</p>
                {lead.next_milestone_deadline && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Deadline: {formatInTz(lead.next_milestone_deadline, tz, 'dd/MM/yyyy')}
                  </p>
                )}
              </div>
            )}
            {!lead.scheduled_follow_up_1 && !lead.scheduled_follow_up_2 && !lead.scheduled_follow_up_3 && !lead.recheck_recommended_at && !lead.next_milestone_action && (
              <p className="text-xs text-gray-400">Nenhum follow-up agendado.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
