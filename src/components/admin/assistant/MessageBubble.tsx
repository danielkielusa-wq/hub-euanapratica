import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sparkles, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MarkdownContent } from './MarkdownContent';
import type { ChatMessage } from '@/hooks/useAdminAssistant';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <Avatar className={cn('h-8 w-8 shrink-0', isUser ? 'bg-primary/10' : 'bg-amber-100')}>
        <AvatarFallback className={cn(isUser ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-700')}>
          {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          'rounded-2xl px-4 py-3 max-w-[85%] text-sm',
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-muted/60 rounded-tl-sm',
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <MarkdownContent content={message.content} />
        )}
      </div>
    </div>
  );
}
