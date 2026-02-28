import React, { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import {
  ArrowLeft,
  Clock,
  Video,
  CheckCircle2,
  MapPin,
  Briefcase,
  Users,
  Globe,
  MessageCircle,
  Star,
  Calendar,
  ShieldCheck,
  Target,
  TrendingUp,
  Award,
  Zap
} from 'lucide-react';
import { HubService } from '@/types/hub';
import { PriceDisplay } from '@/components/hub/PriceDisplay';
import { CourseCurriculumPreview } from '@/components/course/CourseCurriculumPreview';
import { OrderBumpCard } from './OrderBumpCard';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface ServiceLandingPageProps {
  service: HubService;
}

// Icon mapping helper
const iconMap: Record<string, React.ComponentType<any>> = {
  Briefcase,
  Globe,
  Users,
  MapPin,
  Target,
  TrendingUp,
  Award,
  Zap,
  CheckCircle2,
  ShieldCheck,
};

const ServiceLandingPage: React.FC<ServiceLandingPageProps> = ({ service }) => {
  const navigate = useNavigate();
  const [bumpChecked, setBumpChecked] = useState(false);
  const pageViewIdRef = useRef<string | null>(null);

  // Extract landing page data with defaults
  const landingData = service.landing_page_data || {};
  const hero = landingData.hero || {};
  const mentor = landingData.mentor;
  const benefitsSection = landingData.benefits_section;
  const benefits = landingData.benefits || [];
  const targetAudience = landingData.target_audience || [];
  const faqSection = landingData.faq_section;

  // Get checkout URL (priority: ticto_checkout_url > redirect_url > landing_page_url)
  const checkoutUrl = service.ticto_checkout_url || service.redirect_url || service.landing_page_url;

  // Fetch order bump service (F11)
  const { data: bumpService } = useQuery({
    queryKey: ['order-bump', service.order_bump_service_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('hub_services')
        .select('*')
        .eq('id', service.order_bump_service_id!)
        .single();
      return data as HubService | null;
    },
    enabled: !!service.order_bump_service_id,
  });

  // Track page view for abandoned cart (F13)
  useEffect(() => {
    const trackView = async () => {
      try {
        // Generate or retrieve session ID
        let sessionId = sessionStorage.getItem('lp_session_id');
        if (!sessionId) {
          sessionId = crypto.randomUUID();
          sessionStorage.setItem('lp_session_id', sessionId);
        }

        const { data: user } = await supabase.auth.getUser();
        const params = new URLSearchParams(window.location.search);

        const { data } = await supabase
          .from('landing_page_views')
          .insert({
            service_id: service.id,
            user_id: user?.user?.id || null,
            session_id: sessionId,
            utm_source: params.get('utm_source') || null,
            utm_medium: params.get('utm_medium') || null,
            utm_campaign: params.get('utm_campaign') || null,
          })
          .select('id')
          .single();

        if (data) pageViewIdRef.current = data.id;
      } catch {
        // Non-critical — don't block page
      }
    };
    trackView();
  }, [service.id]);

  const handleBack = () => {
    navigate('/dashboard/hub');
  };

  const handleBook = () => {
    // Mark conversion (F13)
    if (pageViewIdRef.current) {
      supabase
        .from('landing_page_views')
        .update({ converted: true })
        .eq('id', pageViewIdRef.current)
        .then(() => {});
    }

    if (checkoutUrl) {
      // Append order bump to checkout URL if checked
      let url = checkoutUrl;
      if (bumpChecked && bumpService?.ticto_checkout_url) {
        const sep = url.includes('?') ? '&' : '?';
        url = `${url}${sep}bump=${bumpService.id}`;
      }
      window.open(url, '_blank');
    }
  };

  return (
    <div className="animate-fade-in bg-white relative">

      {/* 1. HERO SECTION */}
      <div className="relative bg-[#0F172A] text-white rounded-b-[48px] overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600 rounded-full blur-[150px] opacity-20 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500 rounded-full blur-[150px] opacity-10 translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-12 pb-20">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white font-bold text-sm mb-10 transition-colors group"
          >
            <div className="p-2 rounded-full bg-white/10 group-hover:bg-white/20 transition-all">
               <ArrowLeft size={18} />
            </div>
            Voltar para Serviços
          </button>

          <div className="flex flex-col md:flex-row gap-12 items-start">
             <div className="flex-1">
                {/* Tagline/Category Badge */}
                {(hero.tagline || service.ribbon || service.category) && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                     <Star size={12} fill="currentColor" />
                     {hero.tagline || service.ribbon || service.category}
                  </div>
                )}

                {/* Main Title */}
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[1.1] mb-6">
                   {service.name.split(' ').slice(0, -2).join(' ')}<br/>
                   <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-400">
                     {hero.subtitle || service.name.split(' ').slice(-2).join(' ')}
                   </span>
                </h1>

                {/* Description */}
                <p className="text-lg text-gray-300 font-medium leading-relaxed max-w-xl mb-8">
                   {service.description}
                </p>

                {/* Service Metadata */}
                <div className="flex flex-wrap gap-4">
                   {service.duration && (
                     <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                        <Clock size={18} className="text-indigo-400" />
                        <span className="text-sm font-bold">{service.duration}</span>
                     </div>
                   )}
                   {service.meeting_type && (
                     <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                        <Video size={18} className="text-indigo-400" />
                        <span className="text-sm font-bold">{service.meeting_type}</span>
                     </div>
                   )}
                   <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                      <Users size={18} className="text-indigo-400" />
                      <span className="text-sm font-bold">1-on-1</span>
                   </div>
                </div>
             </div>

             {/* Mentor Card (if available) */}
             {mentor && (
               <div className="hidden md:block w-80 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 text-center transform rotate-3 hover:rotate-0 transition-all duration-500">
                   <div className="w-24 h-24 mx-auto bg-gray-200 rounded-full mb-4 border-4 border-white/10 overflow-hidden">
                      <div className="w-full h-full bg-indigo-900 flex items-center justify-center text-2xl font-black text-white">
                        {mentor.initials}
                      </div>
                   </div>
                   <h3 className="text-xl font-bold text-white mb-1">{mentor.name}</h3>
                   <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-6">{mentor.title}</p>
                   {mentor.quote && (
                     <div className="bg-white/10 rounded-xl p-4 text-left">
                        <p className="text-xs text-gray-300 italic">"{mentor.quote}"</p>
                     </div>
                   )}
               </div>
             )}
          </div>
        </div>
      </div>

      {/* 2. MAIN CONTENT */}
      <div className="max-w-4xl mx-auto px-6 -mt-10 relative z-20">

         {/* Benefits Section */}
         {benefits.length > 0 && (
           <div className="bg-white rounded-[32px] p-8 shadow-xl border border-gray-100 mb-16">
               <h2 className="text-2xl font-black text-gray-900 mb-4">
                 {benefitsSection?.title || 'O que você vai descobrir nesta sessão?'}
               </h2>
               <p className="text-gray-500 mb-8 leading-relaxed">
                 {benefitsSection?.description || 'Muitos profissionais perdem anos (e milhares de dólares) tentando imigrar da forma errada. Esta sessão é um "alinhamento de bússola" para evitar erros caros.'}
               </p>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {benefits.map((item, i) => {
                    const IconComponent = iconMap[item.icon] || Target;
                    return (
                      <div key={i} className="flex gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-indigo-50 transition-colors border border-transparent hover:border-indigo-100 group">
                         <div className="w-12 h-12 rounded-xl bg-white text-indigo-600 flex items-center justify-center shadow-sm shrink-0 group-hover:scale-110 transition-transform">
                            <IconComponent size={24} />
                         </div>
                         <div>
                            <h3 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>
                         </div>
                      </div>
                    );
                  })}
               </div>
           </div>
         )}

         {/* Course Curriculum (for recorded courses) */}
         {service.service_type === 'recorded_course' && service.espaco_id && (
           <CourseCurriculumPreview espacoId={service.espaco_id} />
         )}

         {/* Target Audience Section */}
         {targetAudience.length > 0 && (
           <div className="mb-16">
              <h3 className="text-xl font-black text-gray-900 mb-8 text-center">Para quem é esta sessão?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {targetAudience.map((profile, i) => (
                   <div key={i} className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                      <div className="mb-4 bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center">
                         <CheckCircle2 size={18} />
                      </div>
                      <h4 className="font-bold text-gray-900 mb-2">{profile.title}</h4>
                      <p className="text-xs text-gray-500">{profile.description}</p>
                   </div>
                 ))}
              </div>
           </div>
         )}

         {/* Order Bump (F11) */}
         {bumpService && (
           <div className="mb-16">
             <OrderBumpCard
               bumpService={bumpService}
               checked={bumpChecked}
               onToggle={setBumpChecked}
             />
           </div>
         )}

         {/* FAQ Section */}
         {faqSection && (
           <div className="bg-indigo-50 rounded-[32px] p-8 md:p-12 text-center border border-indigo-100 mb-10">
               <MessageCircle size={32} className="mx-auto text-indigo-600 mb-4" />
               <h3 className="text-2xl font-black text-indigo-900 mb-4">{faqSection.title}</h3>
               <p className="text-indigo-800 text-sm max-w-2xl mx-auto leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(faqSection.description || '') }} />
           </div>
         )}

      </div>

      {/* 3. STICKY FOOTER CTA */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 md:p-6 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
         <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="hidden md:block">
               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Investimento</p>
               <div className="flex items-center gap-2">
                  <PriceDisplay
                    price={service.price}
                    currency={service.currency}
                    priceDisplay={service.price_display}
                    anchorPrice={service.anchor_price}
                    size="lg"
                  />
                  {service.status === 'premium' && (
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                      Exclusivo Membros
                    </span>
                  )}
               </div>
            </div>

            <div className="flex-1 md:flex-none flex gap-4 w-full md:w-auto">
               <div className="md:hidden flex flex-col justify-center">
                  <PriceDisplay
                    price={service.price}
                    currency={service.currency}
                    priceDisplay={service.price_display}
                    anchorPrice={service.anchor_price}
                    size="md"
                  />
               </div>
               <button
                 onClick={handleBook}
                 disabled={!checkoutUrl}
                 className="flex-1 md:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                  <Calendar size={20} />
                  {service.cta_text || 'Agendar Sessão'}
               </button>
            </div>
         </div>
      </div>

    </div>
  );
};

export default ServiceLandingPage;
