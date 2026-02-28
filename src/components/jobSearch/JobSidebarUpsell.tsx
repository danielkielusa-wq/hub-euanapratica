import React from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useJobUpsellConfig, useUpsellServiceById } from '@/hooks/useJobUpsell';

export default function JobSidebarUpsell() {
  const config = useJobUpsellConfig();
  const { data: service, isLoading } = useUpsellServiceById(config.sidebar_service_id);

  if (!config.enabled || !config.sidebar_service_id || isLoading || !service) return null;

  const url = service.landing_page_url || service.ticto_checkout_url;

  return (
    <div className="bg-gradient-to-br from-purple-900 to-brand-900 rounded-[32px] p-6 text-white shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={14} className="text-purple-300" />
        <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest">
          Recomendado para você
        </span>
      </div>

      <p className="font-black text-lg leading-tight mb-1">{service.name}</p>

      {service.description && (
        <p className="text-sm text-white/60 leading-relaxed mb-4 line-clamp-3">
          {service.description}
        </p>
      )}

      {service.price_display && (
        <p className="text-sm font-bold text-purple-200 mb-4">{service.price_display}</p>
      )}

      {url && (
        <Button
          onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
          size="sm"
          className="w-full rounded-xl bg-white text-purple-900 hover:bg-purple-50 font-black"
        >
          {service.cta_text || 'Conhecer'} <ExternalLink size={13} className="ml-1.5" />
        </Button>
      )}
    </div>
  );
}
