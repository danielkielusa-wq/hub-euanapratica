import React, { useState } from 'react';
import { X, ExternalLink, Sparkles, BookOpen, Users, Mic, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Job } from '@/types/jobs';
import type { HubService } from '@/types/hub';
import {
  useJobUpsellConfig,
  useUpsellServices,
  matchServicesToJob,
  isDismissed,
  dismissUpsell,
} from '@/hooks/useJobUpsell';

function serviceIcon(service: HubService) {
  switch (service.service_type) {
    case 'live_mentoring': return <Users size={20} />;
    case 'recorded_course': return <BookOpen size={20} />;
    case 'live_event': return <Mic size={20} />;
    case 'ai_tool': return <Zap size={20} />;
    default: return <Sparkles size={20} />;
  }
}

interface UpsellCardProps {
  service: HubService;
  jobId: string;
  onDismiss: () => void;
}

function UpsellServiceCard({ service, jobId, onDismiss }: UpsellCardProps) {
  const url = service.landing_page_url || service.ticto_checkout_url;

  const handleCTA = () => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDismiss = () => {
    dismissUpsell(jobId, service.id);
    onDismiss();
  };

  return (
    <div className="relative bg-white rounded-[28px] border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 p-1 text-gray-300 hover:text-gray-500 transition-colors"
        aria-label="Dispensar"
      >
        <X size={16} />
      </button>

      {/* Icon + name */}
      <div className="flex items-start gap-3 pr-6">
        <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl shrink-0">
          {serviceIcon(service)}
        </div>
        <div>
          <p className="font-black text-gray-900 leading-tight">{service.name}</p>
          {service.price_display && (
            <p className="text-xs font-bold text-brand-600 mt-0.5">{service.price_display}</p>
          )}
        </div>
      </div>

      {/* Description */}
      {service.description && (
        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
          {service.description}
        </p>
      )}

      {/* CTA */}
      {url && (
        <Button
          onClick={handleCTA}
          size="sm"
          className="rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold w-full"
        >
          {service.cta_text || 'Conhecer'} <ExternalLink size={13} className="ml-1.5" />
        </Button>
      )}
    </div>
  );
}

interface JobUpsellBlockProps {
  job: Job;
}

export default function JobUpsellBlock({ job }: JobUpsellBlockProps) {
  const config = useJobUpsellConfig();
  const { data: eligibleServices = [], isLoading } = useUpsellServices(config.eligible_service_ids);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  if (!config.enabled || !job.ai_enrichment || isLoading) return null;

  const matched = matchServicesToJob(job, eligibleServices, 2);

  // Filter out dismissed ones
  const visible = matched.filter(
    (s) => !dismissed.has(s.id) && !isDismissed(job.id, s.id)
  );

  if (visible.length === 0) return null;

  const handleDismiss = (serviceId: string) => {
    setDismissed((prev) => new Set([...prev, serviceId]));
  };

  return (
    <div className="bg-gradient-to-br from-brand-50/60 to-purple-50/40 rounded-[40px] p-8 md:p-10 border border-brand-100/50">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-brand-600 text-white rounded-xl">
          <Sparkles size={16} />
        </div>
        <div>
          <h3 className="font-black text-gray-900">Prepare-se para essa vaga</h3>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Recomendações baseadas nos requisitos desta oportunidade
          </p>
        </div>
      </div>

      <div className={`grid gap-4 ${visible.length > 1 ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
        {visible.map((service) => (
          <UpsellServiceCard
            key={service.id}
            service={service}
            jobId={job.id}
            onDismiss={() => handleDismiss(service.id)}
          />
        ))}
      </div>
    </div>
  );
}
