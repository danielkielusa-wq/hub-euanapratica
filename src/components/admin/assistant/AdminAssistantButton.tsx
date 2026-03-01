import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { AdminAssistantChat } from './AdminAssistantChat';

export function AdminAssistantButton() {
  const { user } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);

  if (!user || user.role !== 'admin') return null;

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => setChatOpen(true)}
            size="icon"
            className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white border-0"
            aria-label="Aurora — Assistente IA"
          >
            <Sparkles className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Aurora — Assistente IA</p>
        </TooltipContent>
      </Tooltip>

      <AdminAssistantChat
        open={chatOpen}
        onClose={() => setChatOpen(false)}
      />
    </>
  );
}
