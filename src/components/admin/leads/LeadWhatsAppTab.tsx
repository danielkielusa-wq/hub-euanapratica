import { useRef, useEffect } from 'react';
import { MessageSquare, Send, Check, CheckCheck, Phone, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatInTz } from '@/lib/timezone';
import { useUserTimezone } from '@/hooks/useUserTimezone';
import type { LeadInteraction } from '@/types/leads';

interface LeadWhatsAppTabProps {
  leadId: string;
  leadPhone: string | undefined;
  leadName: string;
  interactions: LeadInteraction[];
  onSendMessage: () => void;
  onSuggestWhatsApp: () => void;
}

function formatTime(dateStr: string, tz: string): string {
  return formatInTz(dateStr, tz, 'HH:mm');
}

function formatDate(dateStr: string, tz: string): string {
  return formatInTz(dateStr, tz, "dd 'de' MMMM 'de' yyyy");
}

function DeliveryIcon({ status }: { status?: string }) {
  if (!status) return null;
  if (status === 'read') {
    return <CheckCheck className="w-3 h-3 text-blue-500" />;
  }
  if (status === 'delivered') {
    return <CheckCheck className="w-3 h-3 text-gray-400" />;
  }
  if (status === 'sent') {
    return <Check className="w-3 h-3 text-gray-400" />;
  }
  return null;
}

export function LeadWhatsAppTab({
  leadId,
  leadPhone,
  leadName,
  interactions,
  onSendMessage,
  onSuggestWhatsApp,
}: LeadWhatsAppTabProps) {
  const tz = useUserTimezone();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter WhatsApp messages and sort ascending (oldest first for chat)
  const messages = interactions
    .filter((i) => i.channel === 'whatsapp')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  // Group messages by date
  const groupedByDate: { date: string; messages: LeadInteraction[] }[] = [];
  for (const msg of messages) {
    const dateKey = new Date(msg.created_at).toDateString();
    const lastGroup = groupedByDate[groupedByDate.length - 1];
    if (lastGroup && lastGroup.date === dateKey) {
      lastGroup.messages.push(msg);
    } else {
      groupedByDate.push({ date: dateKey, messages: [msg] });
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <Phone className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">{leadName}</h3>
            <p className="text-xs text-gray-400">{leadPhone || 'Sem telefone'}</p>
          </div>
          <Badge variant="outline" className="text-[10px] rounded-full">
            {messages.length} {messages.length === 1 ? 'mensagem' : 'mensagens'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs rounded-xl gap-1.5 border-violet-200 text-violet-700 hover:bg-violet-50"
            onClick={onSuggestWhatsApp}
          >
            <Sparkles className="w-3.5 h-3.5" /> Sugerir WhatsApp
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs rounded-xl gap-1.5 bg-green-600 hover:bg-green-700 text-white"
            onClick={onSendMessage}
            disabled={!leadPhone}
          >
            <Send className="w-3.5 h-3.5" />
            Enviar Mensagem
          </Button>
        </div>
      </div>

      {/* Chat area */}
      {messages.length === 0 ? (
        <Card variant="glass">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-sm text-gray-500">Nenhuma mensagem WhatsApp ainda.</p>
            <p className="text-xs text-gray-400 mt-1">
              {leadPhone
                ? 'Clique em "Enviar Mensagem" para iniciar a conversa.'
                : 'Este lead não possui telefone cadastrado.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card variant="glass" className="overflow-hidden">
          <div
            ref={scrollRef}
            className="p-4 space-y-1 max-h-[500px] overflow-y-auto bg-[#f0f2f5]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d1d5db' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          >
            {groupedByDate.map((group) => (
              <div key={group.date}>
                {/* Date separator */}
                <div className="flex justify-center my-3">
                  <span className="text-[10px] bg-white/90 text-gray-500 px-3 py-1 rounded-lg shadow-sm">
                    {formatDate(group.messages[0].created_at, tz)}
                  </span>
                </div>

                {/* Messages */}
                {group.messages.map((msg) => {
                  const isOutbound = msg.direction === 'outbound' || msg.type === 'whatsapp_sent';
                  const deliveryStatus = (msg.metadata as any)?.delivery_status;

                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex mb-1',
                        isOutbound ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[75%] rounded-xl px-3 py-2 shadow-sm',
                          isOutbound
                            ? 'bg-[#d9fdd3] rounded-tr-sm'
                            : 'bg-white rounded-tl-sm'
                        )}
                      >
                        {/* Sender name for inbound */}
                        {!isOutbound && (
                          <p className="text-[10px] font-semibold text-green-700 mb-0.5">
                            {leadName}
                          </p>
                        )}

                        {/* Message text */}
                        <p className="text-[13px] text-gray-800 whitespace-pre-wrap leading-relaxed">
                          {msg.content}
                        </p>

                        {/* Footer: time + delivery status */}
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          <span className="text-[10px] text-gray-400">
                            {formatTime(msg.created_at, tz)}
                          </span>
                          {isOutbound && <DeliveryIcon status={deliveryStatus} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
