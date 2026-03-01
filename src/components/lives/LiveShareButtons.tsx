import { useState } from 'react';
import { Share2, MessageCircle, Linkedin, Twitter, Copy, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { LiveStatus } from '@/types/live';

interface LiveShareButtonsProps {
  liveTitle: string;
  slug: string;
  status?: LiveStatus;
}

export function LiveShareButtons({ liveTitle, slug, status }: LiveShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const liveUrl = `${window.location.origin}/live/${slug}`;

  const isLive = status === 'live';
  const message = isLive
    ? `Estamos ao vivo! Participe agora: ${liveTitle}`
    : `Participe da live: ${liveTitle}`;
  const encodedMessage = encodeURIComponent(message);
  const encodedUrl = encodeURIComponent(liveUrl);
  const fullText = `${message}\n${liveUrl}`;

  const handleLinkedIn = () => {
    navigator.clipboard.writeText(fullText);
    toast({ title: 'Texto copiado! Cole no seu post do LinkedIn.' });
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, '_blank');
  };

  const channels = [
    {
      label: 'WhatsApp',
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodedMessage}%20${encodedUrl}`,
      color: 'bg-green-600 hover:bg-green-700',
      onClick: undefined as (() => void) | undefined,
    },
    {
      label: 'LinkedIn',
      icon: Linkedin,
      href: undefined as string | undefined,
      color: 'bg-blue-700 hover:bg-blue-800',
      onClick: handleLinkedIn,
    },
    {
      label: 'Twitter/X',
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}`,
      color: 'bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600',
      onClick: undefined as (() => void) | undefined,
    },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast({ title: 'Texto copiado!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const subtitle = isLive
    ? 'Divulgue que você está ao vivo agora!'
    : 'Compartilhe esta live com sua rede!';

  return (
    <div className={cn(
      'rounded-2xl p-6 border shadow-sm',
      isLive
        ? 'border-red-200 dark:border-red-500/20 bg-red-50/30 dark:bg-red-500/5'
        : 'border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-500/5'
    )}>
      <h3 className="text-base font-bold text-gray-800 dark:text-foreground flex items-center gap-2 mb-2">
        <Share2 className={cn('h-4 w-4', isLive ? 'text-red-500' : 'text-indigo-500 dark:text-indigo-400')} />
        Compartilhar
      </h3>
      <p className="text-sm text-gray-500 dark:text-muted-foreground mb-4">
        {subtitle}
      </p>
      <div className="flex flex-wrap gap-2">
        {channels.map((ch) => (
          <button
            key={ch.label}
            onClick={ch.onClick ?? (() => window.open(ch.href, '_blank'))}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-colors',
              ch.color
            )}
          >
            <ch.icon className="h-3.5 w-3.5" />
            {ch.label}
          </button>
        ))}
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 dark:border-white/10 text-gray-600 dark:text-muted-foreground hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copiado!' : 'Copiar Texto'}
        </button>
      </div>
    </div>
  );
}
