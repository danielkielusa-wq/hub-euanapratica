import { useState } from 'react';
import { Bug, MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FeedbackModal } from './FeedbackModal';

export function FeedbackFloatingButton() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => setModalOpen(true)}
            size="icon"
            className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-shadow"
            aria-label="Enviar feedback"
          >
            <div className="relative">
              <MessageSquarePlus className="h-5 w-5" />
              <Bug className="h-3 w-3 absolute -top-1 -right-1" />
            </div>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Reportar Bug ou Sugestão</p>
        </TooltipContent>
      </Tooltip>

      <FeedbackModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
