import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Send, Loader2, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubmissionMessages, useSendSubmissionMessage } from '@/hooks/useSubmissions';
import { cn } from '@/lib/utils';

interface SubmissionMessagesProps {
  submissionId: string;
  canReply?: boolean;
}

export function SubmissionMessages({ submissionId, canReply = true }: SubmissionMessagesProps) {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  
  const { data: messages, isLoading } = useSubmissionMessages(submissionId);
  const sendMessage = useSendSubmissionMessage();

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    await sendMessage.mutateAsync({
      submission_id: submissionId,
      message: newMessage.trim()
    });

    setNewMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </CardContent>
      </Card>
    );
  }

  const hasMessages = messages && messages.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Histórico de Mensagens
          {hasMessages && (
            <span className="text-sm font-normal text-muted-foreground">
              ({messages.length} {messages.length === 1 ? 'mensagem' : 'mensagens'})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Messages list */}
        {hasMessages ? (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id;
              const initials = msg.sender?.full_name
                ?.split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2) || 'U';

              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3",
                    isOwn && "flex-row-reverse"
                  )}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className={cn(
                      "text-xs",
                      isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "flex-1 max-w-[80%]",
                    isOwn && "flex flex-col items-end"
                  )}>
                    <div className={cn(
                      "rounded-lg px-4 py-2",
                      isOwn 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted"
                    )}>
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {msg.sender?.full_name || 'Usuário'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        • {format(new Date(msg.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma mensagem ainda</p>
          </div>
        )}

        {/* Reply input */}
        {canReply && (
          <div className="border-t pt-4">
            <div className="flex gap-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                rows={2}
                className="resize-none"
                disabled={sendMessage.isPending}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sendMessage.isPending}
                size="icon"
                className="h-auto"
              >
                {sendMessage.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
