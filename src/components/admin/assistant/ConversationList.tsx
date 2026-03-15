import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/hooks/useAdminAssistant';

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}sem`;
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: ConversationListProps) {
  return (
    <div className="border-b border-border/40 bg-muted/20">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">Conversas</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={onNew}
          className="h-7 px-2 text-xs"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Nova
        </Button>
      </div>
      <ScrollArea className="max-h-40">
        <div className="px-2 pb-2 space-y-0.5">
          {conversations.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">Nenhuma conversa ainda</p>
          )}
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={cn(
                'flex items-center gap-2 px-2 py-1.5 rounded-md text-xs cursor-pointer group transition-colors',
                activeId === conv.id
                  ? 'bg-amber-100/50 text-amber-900 dark:bg-amber-900/20 dark:text-amber-200'
                  : 'hover:bg-muted/60',
              )}
              onClick={() => onSelect(conv.id)}
            >
              <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate">{conv.title}</span>
              <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(conv.updated_at)}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(conv.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10"
                title="Excluir conversa"
              >
                <Trash2 className="h-3 w-3 text-destructive/60" />
              </button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
