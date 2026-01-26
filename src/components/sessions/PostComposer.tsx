import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';

interface PostComposerProps {
  onSubmit: (content: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function PostComposer({ onSubmit, isSubmitting = false }: PostComposerProps) {
  const [content, setContent] = useState('');

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;
    
    try {
      await onSubmit(content);
      setContent('');
    } catch (error) {
      console.error('Error submitting post:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex gap-2 items-end">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Escreva sua dúvida ou comentário..."
        className="bg-muted/50 rounded-xl min-h-[60px] max-h-[120px] resize-none border-border/40 focus-visible:ring-primary/30"
        maxLength={1000}
        disabled={isSubmitting}
      />
      <Button
        variant="gradient"
        size="icon"
        disabled={!content.trim() || isSubmitting}
        onClick={handleSubmit}
        className="rounded-xl h-[60px] w-[48px] shrink-0"
      >
        {isSubmitting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Send className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
}
