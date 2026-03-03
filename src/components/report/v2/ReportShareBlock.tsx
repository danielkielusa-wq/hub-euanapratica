import { useState } from 'react';
import { Share2, MessageCircle, Linkedin, Copy, Check, Gift, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAnalytics } from '@/hooks/useAnalytics';

interface ReportShareBlockProps {
  referralCode: string;
  referralCount: number;
  isUnlocked: boolean;
  userName: string;
  isLimited: boolean;
}

const REFERRALS_NEEDED = 3;

export function ReportShareBlock({
  referralCode,
  referralCount,
  isUnlocked,
  userName,
  isLimited,
}: ReportShareBlockProps) {
  const [copied, setCopied] = useState(false);
  const { logEvent } = useAnalytics();

  if (!referralCode) return null;

  const firstName = userName.split(' ')[0];
  const shareUrl = `${window.location.origin}/avaliar?ref=${referralCode}`;
  const progress = Math.min(referralCount, REFERRALS_NEEDED);
  const progressPercent = (progress / REFERRALS_NEEDED) * 100;

  const shareMessage = `Fiz meu diagnóstico de carreira internacional e descobri meu score de prontidão! Descubra o seu grátis em 4 minutos`;
  const encodedMessage = encodeURIComponent(shareMessage);
  const encodedUrl = encodeURIComponent(shareUrl);

  const trackShare = (channel: string) => {
    logEvent({
      event_type: 'referral_share',
      entity_type: 'career_evaluation',
      metadata: { channel, referral_code: referralCode },
    });
  };

  const handleWhatsApp = () => {
    trackShare('whatsapp');
    window.open(`https://wa.me/?text=${encodedMessage}%20${encodedUrl}`, '_blank');
  };

  const handleLinkedIn = () => {
    trackShare('linkedin');
    navigator.clipboard.writeText(`${shareMessage}\n${shareUrl}`);
    toast({ title: 'Texto copiado! Cole no seu post do LinkedIn.' });
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, '_blank');
  };

  const handleCopy = () => {
    trackShare('copy');
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({ title: 'Link copiado!' });
    setTimeout(() => setCopied(false), 2000);
  };

  // Compact version for full-access users
  if (!isLimited) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 p-4 sm:p-5 text-center space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2">
          <Share2 className="w-4 h-4" />
          Compartilhe com amigos
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Conhece alguém que quer uma carreira internacional? Compartilhe o diagnóstico gratuito.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={handleWhatsApp}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-green-600 hover:bg-green-700 transition-colors"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            WhatsApp
          </button>
          <button
            onClick={handleLinkedIn}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 transition-colors"
          >
            <Linkedin className="h-3.5 w-3.5" />
            LinkedIn
          </button>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copiado!' : 'Copiar Link'}
          </button>
        </div>
      </div>
    );
  }

  // Full gamified version for limited-access users
  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-5 sm:p-6 md:p-8 space-y-5">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-[60px]" />

      {/* Header */}
      <div className="relative z-10 text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
          <Gift className="w-3 h-3" />
          Desbloqueie Grátis
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
          {isUnlocked
            ? 'Parabéns! Acesso desbloqueado!'
            : `${firstName}, desbloqueie o relatório completo`}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          {isUnlocked
            ? 'Seus amigos completaram o diagnóstico. Recarregue a página para ver o relatório completo.'
            : `Compartilhe o diagnóstico com ${REFERRALS_NEEDED} amigos. Quando eles completarem, seu relatório completo é desbloqueado automaticamente.`}
        </p>
      </div>

      {/* Progress bar */}
      <div className="relative z-10 space-y-2">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {progress} de {REFERRALS_NEEDED} amigos
          </span>
          <span className={progress >= REFERRALS_NEEDED ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500'}>
            {progress >= REFERRALS_NEEDED ? 'Completo!' : `Faltam ${REFERRALS_NEEDED - progress}`}
          </span>
        </div>
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {/* Step indicators */}
        <div className="flex justify-between px-1">
          {Array.from({ length: REFERRALS_NEEDED }).map((_, i) => (
            <div
              key={i}
              className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold transition-all ${
                i < progress
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
              }`}
            >
              {i < progress ? <Check className="w-3 h-3" /> : i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Share buttons */}
      {!isUnlocked && (
        <div className="relative z-10 space-y-3">
          <p className="text-xs text-center text-slate-500 dark:text-slate-400 font-medium">
            Compartilhe por:
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleWhatsApp}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white bg-green-600 hover:bg-green-700 transition-all hover:scale-[1.02] shadow-sm"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </button>
            <button
              onClick={handleLinkedIn}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 transition-all hover:scale-[1.02] shadow-sm"
            >
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </button>
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:scale-[1.02]"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copiado!' : 'Copiar Link'}
            </button>
          </div>
        </div>
      )}

      {/* Unlocked CTA */}
      {isUnlocked && (
        <div className="relative z-10 text-center">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all hover:scale-[1.02] shadow-lg"
          >
            <Gift className="w-4 h-4" />
            Recarregar e ver relatório completo
          </button>
        </div>
      )}
    </div>
  );
}
