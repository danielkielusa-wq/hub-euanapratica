import { useState } from 'react';
import { Share2, MessageCircle, Linkedin, Twitter, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
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
      color: 'bg-gray-900 hover:bg-gray-800',
      onClick: undefined as (() => void) | undefined,
    },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast({ title: 'Texto copiado!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const cardStyle = isLive
    ? 'border-red-200 bg-red-50/30'
    : 'border-indigo-200 bg-indigo-50/30';
  const iconColor = isLive ? 'text-red-500' : 'text-indigo-500';
  const subtitle = isLive
    ? 'Divulgue que voce esta ao vivo agora!'
    : 'Compartilhe esta live com sua rede!';

  return (
    <Card className={cardStyle}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Share2 className={`h-4 w-4 ${iconColor}`} />
          Compartilhar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500 mb-3">
          {subtitle}
        </p>
        <div className="flex flex-wrap gap-2">
          {channels.map((ch) => (
            <Button
              key={ch.label}
              size="sm"
              className={`${ch.color} text-white gap-1.5`}
              onClick={ch.onClick ?? (() => window.open(ch.href, '_blank'))}
            >
              <ch.icon className="h-4 w-4" />
              {ch.label}
            </Button>
          ))}
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={handleCopy}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copiado!' : 'Copiar Texto'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
