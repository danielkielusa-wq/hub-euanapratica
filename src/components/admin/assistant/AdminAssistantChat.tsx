import { useRef, useEffect, useState, type KeyboardEvent } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { useAdminAssistant } from '@/hooks/useAdminAssistant';
import { MessageBubble } from './MessageBubble';

interface AdminAssistantChatProps {
  open: boolean;
  onClose: () => void;
}

const SUGGESTED_QUESTIONS = [
  'Como funciona o sistema de email?',
  'Quais são os planos de assinatura?',
  'Como fazer deploy de Edge Functions?',
  'O que verificar quando CORS falha?',
];

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8 shrink-0 bg-amber-100">
        <AvatarFallback className="bg-amber-100 text-amber-700">
          <Sparkles className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="bg-muted/60 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Aurora está pensando</span>
          <span className="flex gap-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
          </span>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onSuggestionClick }: { onSuggestionClick: (q: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 py-8">
      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mb-4">
        <Sparkles className="h-8 w-8 text-amber-600" />
      </div>
      <h3 className="text-lg font-semibold mb-1">Olá! Eu sou a Aurora</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-[280px]">
        Sua assistente IA do Hub. Pergunte qualquer coisa sobre o sistema.
      </p>
      <div className="space-y-2 w-full max-w-[320px]">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => onSuggestionClick(q)}
            className="w-full text-left text-sm px-4 py-2.5 rounded-xl border border-border/60 hover:bg-muted/50 hover:border-border transition-colors"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AdminAssistantChat({ open, onClose }: AdminAssistantChatProps) {
  const isMobile = useIsMobile();
  const { messages, isLoading, sendMessage, clearHistory } = useAdminAssistant();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      });
    }
  }, [messages, isLoading]);

  // Focus textarea when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [open]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const msg = input;
    setInput('');
    await sendMessage(msg);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (question: string) => {
    sendMessage(question);
  };

  const chatContent = (
    <div className="flex flex-col h-full min-h-0">
      {/* Messages feed */}
      <ScrollArea className="flex-1 min-h-0">
        <div ref={scrollRef} className="px-4 py-4">
          {messages.length === 0 ? (
            <EmptyState onSuggestionClick={handleSuggestionClick} />
          ) : (
            <div className="space-y-4 pb-2">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {isLoading && <TypingIndicator />}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="shrink-0 p-4 bg-background/80 backdrop-blur-md border-t border-border/40">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte sobre o sistema..."
            className="min-h-[44px] max-h-[120px] resize-none text-sm"
            disabled={isLoading}
          />
          <div className="flex flex-col gap-1">
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="h-10 w-10 shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
            {messages.length > 0 && (
              <Button
                size="icon"
                variant="ghost"
                onClick={clearHistory}
                className="h-8 w-8 shrink-0"
                title="Limpar conversa"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const headerContent = (
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
        <Sparkles className="h-4.5 w-4.5 text-amber-600" />
      </div>
      <div>
        <span className="font-semibold">Aurora</span>
        <span className="text-xs text-muted-foreground block">Assistente IA do Admin</span>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DrawerContent className="h-[90vh] max-h-[90vh]">
          <DrawerHeader className="border-b border-border/40 pb-4">
            <DrawerTitle>{headerContent}</DrawerTitle>
            <DrawerDescription className="sr-only">
              Chat com Aurora, assistente IA administrativa
            </DrawerDescription>
          </DrawerHeader>
          {chatContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/40 shrink-0">
          <SheetTitle>{headerContent}</SheetTitle>
          <SheetDescription className="sr-only">
            Chat com Aurora, assistente IA administrativa
          </SheetDescription>
        </SheetHeader>
        {chatContent}
      </SheetContent>
    </Sheet>
  );
}
