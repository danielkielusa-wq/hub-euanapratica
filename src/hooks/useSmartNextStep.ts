import { useMemo } from 'react';
import type {
  CareerInsights,
  CommunityPulse,
  HubDashboardConfig,
  HubSection,
  SmartNextStep,
  SmartNextStepType,
} from '@/types/hub';
import type { ChecklistItemStatus } from '@/types/guidedTour';

interface SmartNextStepInput {
  insights: CareerInsights | null;
  sections: HubSection[] | null;
  checklistItems: ChecklistItemStatus[] | null;
  communityPulse: CommunityPulse | null;
  config: HubDashboardConfig;
}

function tryMatch(
  type: SmartNextStepType,
  { insights, sections, checklistItems, communityPulse }: Omit<SmartNextStepInput, 'config'>,
): SmartNextStep | null {
  switch (type) {
    case 'unscheduled_consultation': {
      const needsAction = sections?.find((s) => s.id === 'needs_action');
      const consulting = needsAction?.items.find(
        (i) => i.service.service_type === 'consulting' && i.computed_status === 'needs_action',
      );
      if (!consulting) return null;
      return {
        type,
        title: 'Agende sua consultoria',
        description: `Você adquiriu "${consulting.service.name}" — agende agora para garantir seu horário.`,
        actionLabel: 'Agendar',
        actionHref: '/dashboard/agendamentos',
        icon: 'Calendar',
        urgencyLevel: 'high',
      };
    }

    case 'upcoming_event_24h': {
      const upcoming = sections?.find((s) => s.id === 'upcoming');
      if (!upcoming?.items.length) return null;
      const soon = upcoming.items.find((i) => {
        const dt = i.next_session_datetime || i.booking?.meeting_datetime;
        if (!dt) return false;
        const diff = new Date(dt).getTime() - Date.now();
        return diff > 0 && diff < 24 * 60 * 60 * 1000;
      });
      if (!soon) return null;
      const dt = soon.next_session_datetime || soon.booking?.meeting_datetime;
      const timeStr = dt
        ? new Date(dt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : '';
      return {
        type,
        title: `${soon.service.name} em breve`,
        description: `Sua sessão começa hoje às ${timeStr}. Prepare-se!`,
        actionLabel: 'Ver Detalhes',
        actionHref: '/dashboard/agendamentos',
        icon: 'Clock',
        urgencyLevel: 'high',
      };
    }

    case 'report_first_action': {
      if (!insights?.hasReport || !insights.recommendedFirstAction) return null;
      return {
        type,
        title: 'Seu próximo passo recomendado',
        description: insights.recommendedFirstAction,
        actionLabel: 'Ver Relatório',
        actionHref: insights.reportToken ? `/report/${insights.reportToken}` : '/dashboard/hub',
        icon: 'Target',
        urgencyLevel: 'medium',
      };
    }

    case 'checklist_incomplete': {
      if (!checklistItems) return null;
      const next = checklistItems.find((i) => !i.completed);
      if (!next) return null;
      return {
        type,
        title: next.label,
        description: next.description || 'Complete este passo para avançar na sua jornada.',
        actionLabel: 'Fazer Agora',
        actionHref: next.href,
        icon: 'CheckCircle',
        urgencyLevel: 'low',
      };
    }

    case 'resume_suggestion': {
      if (!insights?.hasReport) return null;
      // If weakest dimension is experience or the user has a critical gap mentioning currículo
      const resumeRelevant =
        insights.weakest?.key === 'experience' ||
        insights.criticalGaps.some((g) => g.toLowerCase().includes('currículo'));
      if (!resumeRelevant) return null;
      return {
        type,
        title: 'Analise seu currículo com IA',
        description: 'Descubra se seu currículo passa nos filtros automáticos das empresas americanas.',
        actionLabel: 'Analisar',
        actionHref: '/curriculo',
        icon: 'FileSearch',
        urgencyLevel: 'low',
      };
    }

    case 'community_prompt': {
      if (!communityPulse) return null;
      const hasPosted = !!communityPulse.userLatestPost;
      if (hasPosted) {
        // Check if last post was > 7 days ago
        const daysSince = communityPulse.userLatestPost?.created_at
          ? (Date.now() - new Date(communityPulse.userLatestPost.created_at).getTime()) / 86400000
          : Infinity;
        if (daysSince < 7) return null;
      }
      return {
        type,
        title: hasPosted ? 'A comunidade sente sua falta!' : 'Faça seu primeiro post',
        description: hasPosted
          ? 'Faz mais de uma semana desde seu último post. Compartilhe algo!'
          : 'Conecte-se com outros profissionais na comunidade ENP.',
        actionLabel: hasPosted ? 'Postar' : 'Conhecer Comunidade',
        actionHref: '/comunidade',
        icon: 'MessageCircle',
        urgencyLevel: 'low',
      };
    }

    default:
      return null;
  }
}

export function useSmartNextStep({
  insights,
  sections,
  checklistItems,
  communityPulse,
  config,
}: SmartNextStepInput): SmartNextStep | null {
  return useMemo(() => {
    for (const type of config.smart_next_step_priority) {
      const match = tryMatch(type, { insights, sections, checklistItems, communityPulse });
      if (match) return match;
    }
    return null;
  }, [insights, sections, checklistItems, communityPulse, config.smart_next_step_priority]);
}
