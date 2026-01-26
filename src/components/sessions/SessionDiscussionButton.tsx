import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSessionPostCount } from '@/hooks/useSessionPosts';
import { SessionDiscussionDrawer } from './SessionDiscussionDrawer';
import { cn } from '@/lib/utils';

interface SessionDiscussionButtonProps {
  sessionId: string;
  sessionTitle: string;
  className?: string;
}

export function SessionDiscussionButton({ 
  sessionId, 
  sessionTitle,
  className 
}: SessionDiscussionButtonProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { data: postCount = 0 } = useSessionPostCount(sessionId);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          setIsDrawerOpen(true);
        }}
        className={cn(
          "rounded-xl min-h-[40px] text-muted-foreground hover:text-foreground",
          className
        )}
      >
        <MessageCircle className="h-4 w-4 mr-1.5" />
        Discussão
        {postCount > 0 && (
          <span className="ml-1.5 bg-primary text-primary-foreground text-xs font-medium px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
            {postCount > 99 ? '99+' : postCount}
          </span>
        )}
      </Button>

      <SessionDiscussionDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        sessionId={sessionId}
        sessionTitle={sessionTitle}
      />
    </>
  );
}
