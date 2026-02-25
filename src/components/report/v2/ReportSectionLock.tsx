import { Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface ReportSectionLockProps {
  title: string;
  description: string;
  ctaText?: string;
  variant?: 'inline' | 'full';
}

/**
 * Overlay component shown when a report section is locked (limited access).
 * variant="inline" - used inside accordion items or step lists (smaller)
 * variant="full"   - used to replace full sections (larger, centered)
 */
export function ReportSectionLock({
  title,
  description,
  ctaText = 'Desbloquear relatório completo',
  variant = 'full',
}: ReportSectionLockProps) {
  const navigate = useNavigate();

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-muted/60 border border-dashed border-muted-foreground/20 p-3 select-none">
        <div className="shrink-0 w-7 h-7 rounded-full bg-muted-foreground/10 flex items-center justify-center">
          <Lock className="w-3.5 h-3.5 text-muted-foreground/60" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-muted-foreground">{title}</p>
          <p className="text-[10px] text-muted-foreground/70 mt-0.5 leading-relaxed">{description}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 text-xs gap-1 h-7 px-2.5"
          onClick={() => navigate('/pricing')}
        >
          Ver planos
          <ArrowRight className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-muted-foreground/20 bg-muted/30 p-6 sm:p-8 flex flex-col items-center text-center gap-4 select-none">
      <div className="w-10 h-10 rounded-full bg-muted-foreground/10 flex items-center justify-center">
        <Lock className="w-5 h-5 text-muted-foreground/50" />
      </div>
      <div className="space-y-1.5">
        <p className="font-semibold text-sm text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">{description}</p>
      </div>
      <Button
        variant="default"
        size="sm"
        className="gap-2"
        onClick={() => navigate('/pricing')}
      >
        {ctaText}
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
