import { MessageCircle } from 'lucide-react';

export function EmptyDiscussionState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <MessageCircle className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground font-medium">
        Ainda não há discussões aqui.
      </p>
      <p className="text-sm text-muted-foreground mt-1">
        Comece o tópico!
      </p>
    </div>
  );
}
