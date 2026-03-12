import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { MentionTextarea } from './MentionTextarea';
import type { EspacoMember } from '@/hooks/useEspacoMembers';

interface PostComposerProps {
  onSubmit: (content: string) => Promise<void>;
  isSubmitting?: boolean;
  members?: EspacoMember[];
}

export function PostComposer({ onSubmit, isSubmitting = false, members = [] }: PostComposerProps) {
  const [content, setContent] = useState('');

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;

    try {
      await onSubmit(content);
      setContent('');
    } catch (error) {
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
      <MentionTextarea
        value={content}
        onChange={setContent}
        onKeyDown={handleKeyDown}
        members={members}
        placeholder="Escreva sua dúvida ou comentário... Use @ para mencionar"
        className="min-h-[80px] max-h-[150px]"
        maxLength={1000}
        disabled={isSubmitting}
      />
      <Button
        variant="gradient"
        size="icon"
        disabled={!content.trim() || isSubmitting}
        onClick={handleSubmit}
        className="rounded-xl h-[80px] w-[48px] shrink-0"
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
