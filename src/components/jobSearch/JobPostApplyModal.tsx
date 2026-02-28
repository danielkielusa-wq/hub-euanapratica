import React from 'react';
import { CheckCircle2, ExternalLink, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useJobUpsellConfig, useUpsellServiceById } from '@/hooks/useJobUpsell';

interface JobPostApplyModalProps {
  open: boolean;
  onClose: () => void;
  jobTitle: string;
}

export default function JobPostApplyModal({ open, onClose, jobTitle }: JobPostApplyModalProps) {
  const config = useJobUpsellConfig();
  const { data: service } = useUpsellServiceById(config.post_apply_service_id);

  // If upsell not configured, just close immediately (shouldn't open)
  if (!config.enabled || !config.post_apply_service_id) return null;

  const url = service ? (service.landing_page_url || service.ticto_checkout_url) : null;

  const handleCTA = () => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-[32px] border-0 shadow-2xl p-0 overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-1.5 bg-white/80 text-gray-400 hover:text-gray-700 rounded-full transition-colors"
        >
          <X size={16} />
        </button>

        {/* Success header */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-white text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-brand-500/20 rounded-full">
              <CheckCircle2 size={32} className="text-brand-400" />
            </div>
          </div>
          <DialogHeader>
            <DialogTitle className="text-white font-black text-xl text-center">
              Acesso liberado. Agora é com você.
            </DialogTitle>
          </DialogHeader>
          <p className="text-gray-400 text-sm mt-2 leading-relaxed">
            Você tem o caminho para <span className="font-bold text-white">"{jobTitle}"</span>.<br />
            Não deixe essa oportunidade esfriar.
          </p>
        </div>

        {/* Upsell service */}
        {service ? (
          <div className="p-8 space-y-5">
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                Se prepare para se destacar
              </p>
              <div className="bg-gray-50 rounded-[20px] p-5 space-y-2">
                <p className="font-black text-gray-900">{service.name}</p>
                {service.description && (
                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">
                    {service.description}
                  </p>
                )}
                {service.price_display && (
                  <p className="text-sm font-bold text-brand-600">{service.price_display}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {url && (
                <Button
                  onClick={handleCTA}
                  className="w-full rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-black py-5"
                >
                  {service.cta_text || 'Conhecer'} <ExternalLink size={14} className="ml-2" />
                </Button>
              )}
              <button
                onClick={onClose}
                className="text-sm text-gray-400 hover:text-gray-600 font-medium transition-colors text-center"
              >
                Agora não
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500 text-sm mb-4">
              Boa sorte! A vaga está nas suas mãos agora.
            </p>
            <Button onClick={onClose} className="rounded-xl">
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
