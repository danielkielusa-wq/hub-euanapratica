import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Lock, LucideIcon } from 'lucide-react';
import * as icons from 'lucide-react';
import { cn } from '@/lib/utils';
import { HubService, ServiceType } from '@/types/hub';
import { formatCurrency } from './PriceDisplay';

interface CatalogCardProps {
  service: HubService;
  hasAccess: boolean;
}

const serviceTypeIconBg: Record<ServiceType, { bg: string; color: string }> = {
  ai_tool: { bg: 'bg-cyan-50 dark:bg-cyan-500/10', color: 'text-cyan-500' },
  live_mentoring: { bg: 'bg-green-50 dark:bg-green-500/10', color: 'text-green-500' },
  recorded_course: { bg: 'bg-purple-50 dark:bg-purple-500/10', color: 'text-purple-500' },
  consulting: { bg: 'bg-indigo-50 dark:bg-indigo-500/10', color: 'text-indigo-500' },
  live_event: { bg: 'bg-blue-50 dark:bg-blue-500/10', color: 'text-blue-500' },
};

const ribbonColors: Record<string, string> = {
  POPULAR: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
  NOVO: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
  EXCLUSIVO: 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400',
  GRÁTIS: 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400',
  'VAGAS ABERTAS': 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400',
};

export function CatalogCard({ service, hasAccess }: CatalogCardProps) {
  const navigate = useNavigate();

  // Get icon component safely
  const iconName = service.icon_name as keyof typeof icons;
  const Icon = (icons[iconName] as LucideIcon) || icons.FileCheck;

  const serviceType = (service.service_type as ServiceType) || 'consulting';
  const iconStyle = serviceTypeIconBg[serviceType] || serviceTypeIconBg.consulting;
  const isHighlighted = service.is_highlighted;
  const isComingSoon = service.status === 'coming_soon';
  const canAccess = service.status === 'available' || hasAccess;

  const getInternalPath = (url: string): string | null => {
    if (url.startsWith('/')) return url;
    try {
      const parsed = new URL(url);
      if (parsed.origin === window.location.origin) return parsed.pathname;
    } catch {}
    return null;
  };

  const getLandingPageUrl = (): string => {
    if (service.landing_page_url) {
      const internal = getInternalPath(service.landing_page_url);
      if (internal) return internal;
    }
    return `/servicos/${service.id}`;
  };

  const handleNavigate = () => {
    navigate(getLandingPageUrl());
  };

  // Parse features from landing_page_data benefits
  const features = service.landing_page_data?.benefits?.slice(0, 3).map(b => b.title) || [];

  // Price display
  const price = service.price;
  const hasAnchor = !!service.anchor_price && service.anchor_price > price && price > 0;
  const isFree = !price || price === 0;

  // Price display text
  const priceText = service.price_display || (isFree ? '0' : formatCurrency(price, service.currency));
  const priceNumber = isFree ? '0' : Math.round(price).toString();

  // Period text for subscriptions
  const period = service.product_type === 'subscription_monthly' ? '/mês'
    : service.product_type === 'subscription_annual' ? '/ano'
    : null;

  // Ribbon badge color
  const badgeColor = service.ribbon ? (ribbonColors[service.ribbon] || 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-muted-foreground') : '';

  return (
    <div
      className={cn(
        'bg-white dark:bg-card rounded-xl p-6 flex flex-col h-full transition-all duration-300',
        !isComingSoon && 'hover:-translate-y-1 hover:shadow-lg',
        isHighlighted
          ? 'border-2 border-indigo-500 shadow-md dark:border-indigo-400'
          : 'border border-gray-100 dark:border-white/10 shadow-sm',
        isComingSoon && 'opacity-70'
      )}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', iconStyle.bg, iconStyle.color)}>
          <Icon className="w-6 h-6" />
        </div>
        {service.ribbon && (
          <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide', badgeColor)}>
            {service.ribbon}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="mb-6 flex-1">
        {service.category && (
          <div className="text-xs font-bold text-gray-400 dark:text-muted-foreground uppercase tracking-wider mb-2">
            {service.category}
          </div>
        )}
        <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-foreground mb-3 leading-snug">
          {service.name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-muted-foreground leading-relaxed mb-4 line-clamp-3">
          {service.description}
        </p>

        {/* Features List */}
        {features.length > 0 && (
          <ul className="space-y-2 mb-4">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2 text-xs text-gray-600 dark:text-muted-foreground">
                <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-gray-50 dark:border-white/5">
        {!isFree && (
          <div className="mb-4">
            {hasAnchor && (
              <span className="text-xs text-gray-400 dark:text-muted-foreground line-through mr-2">
                R$ {Math.round(service.anchor_price!).toLocaleString('pt-BR')}
              </span>
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-sm text-gray-500 dark:text-muted-foreground font-medium">R$</span>
              <span className="text-2xl font-bold text-gray-800 dark:text-foreground">{priceNumber}</span>
              {period && <span className="text-sm text-gray-500 dark:text-muted-foreground">{period}</span>}
            </div>
            {service.price_display && service.price_display !== formatCurrency(price, service.currency) && (
              <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-1">
                {service.price_display}
              </div>
            )}
          </div>
        )}
        {isFree && (
          <div className="mb-4">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">Grátis</span>
            </div>
          </div>
        )}

        {isComingSoon ? (
          <button
            disabled
            className="w-full py-2.5 rounded-lg text-sm font-bold bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-muted-foreground cursor-not-allowed flex items-center justify-center gap-2"
          >
            Em Breve
          </button>
        ) : (
          <button
            onClick={handleNavigate}
            className={cn(
              'w-full py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2',
              isHighlighted
                ? 'bg-[#7367F0] text-white hover:bg-indigo-600 shadow-md shadow-indigo-200 dark:shadow-none'
                : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20'
            )}
          >
            {!canAccess && <Lock className="h-4 w-4" />}
            {service.cta_text || (canAccess ? 'Ver Detalhes' : 'Desbloquear')}
            {canAccess && <ArrowRight className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
