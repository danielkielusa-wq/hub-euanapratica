import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sparkles, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MarkdownContent } from './MarkdownContent';
import { ToolCallBlock } from './ToolCallBlock';
import { ActionConfirmCard } from './ActionConfirmCard';
import type { ChatMessage, PendingAction } from '@/hooks/useAdminAssistant';

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
  onConfirmAction?: (action: PendingAction) => void;
  onCancelAction?: (action: PendingAction) => void;
}

export function MessageBubble({ message, isStreaming, onConfirmAction, onCancelAction }: MessageBubbleProps) {
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
          <>
            {message.toolCalls?.map((tc) => (
              <ToolCallBlock key={tc.id} toolCall={tc} />
            ))}
            {message.content && <MarkdownContent content={message.content} />}
            {message.pendingAction && onConfirmAction && onCancelAction && (
              <ActionConfirmCard
                action={message.pendingAction}
                onConfirm={onConfirmAction}
                onCancel={onCancelAction}
              />
            )}
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-amber-500 animate-pulse ml-0.5 align-text-bottom rounded-sm" />
            )}
          </>
        )}
      </div>
    </div>
  );
}
