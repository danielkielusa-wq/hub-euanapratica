import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminAssistantChat } from './AdminAssistantChat';

export function AdminAssistantButton() {
  const { user } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);

  // Poll unacknowledged alerts every 60s
  const alertCountQuery = useQuery({
    queryKey: ['assistant-alerts-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('assistant_alerts')
        .select('id', { count: 'exact', head: true })
        .eq('acknowledged', false);
      if (error) return 0;
      return count || 0;
    },
    refetchInterval: 60000,
    enabled: !!user && user.role === 'admin',
  });

  const alertCount = alertCountQuery.data || 0;

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
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 shadow-md animate-in zoom-in">
                {alertCount > 9 ? '9+' : alertCount}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Aurora — Assistente IA{alertCount > 0 ? ` (${alertCount} alertas)` : ''}</p>
        </TooltipContent>
      </Tooltip>

      <AdminAssistantChat
        open={chatOpen}
        onClose={() => setChatOpen(false)}
      />
    </>
  );
}
