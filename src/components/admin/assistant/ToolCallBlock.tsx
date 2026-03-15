import { useState } from 'react';
import { Database, ChevronDown, ChevronRight, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getToolLabel, type ToolCallDisplay } from '@/hooks/useAdminAssistant';

interface ToolCallBlockProps {
  toolCall: ToolCallDisplay;
}

export function ToolCallBlock({ toolCall }: ToolCallBlockProps) {
  const [expanded, setExpanded] = useState(false);
  const isCalling = toolCall.status === 'calling';
  const label = getToolLabel(toolCall.name);

  return (
    <div className="my-2 rounded-lg border border-border/50 bg-muted/30 text-xs overflow-hidden">
      <button
        onClick={() => !isCalling && setExpanded(!expanded)}
        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted/50 transition-colors text-left"
        disabled={isCalling}
      >
        <Database className="h-3.5 w-3.5 text-amber-600 shrink-0" />
        <span className="text-muted-foreground flex-1">{label}...</span>
        {isCalling ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
        ) : (
          <>
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </>
        )}
      </button>

      {expanded && toolCall.result && (
        <div className="px-3 pb-2 border-t border-border/30">
          <pre className={cn(
            "mt-2 p-2 rounded bg-background/80 text-[11px] leading-relaxed overflow-x-auto max-h-48 whitespace-pre-wrap break-words",
          )}>
            {formatToolResult(toolCall.result)}
          </pre>
        </div>
      )}
    </div>
  );
}

function formatToolResult(result: string): string {
  try {
    const parsed = JSON.parse(result);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return result;
  }
}
