import { useState } from 'react';
import { Shield, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PendingAction {
  id: string;
  name: string;
  args: Record<string, unknown>;
  description: string;
  status: 'pending' | 'confirming' | 'confirmed' | 'cancelled';
  result?: string;
}

interface ActionConfirmCardProps {
  action: PendingAction;
  onConfirm: (action: PendingAction) => void;
  onCancel: (action: PendingAction) => void;
}

export function ActionConfirmCard({ action, onConfirm, onCancel }: ActionConfirmCardProps) {
  const isPending = action.status === 'pending';
  const isConfirming = action.status === 'confirming';
  const isConfirmed = action.status === 'confirmed';
  const isCancelled = action.status === 'cancelled';

  return (
    <div className={cn(
      'my-2 rounded-lg border p-3 text-sm',
      isPending || isConfirming
        ? 'border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/20'
        : isConfirmed
          ? 'border-green-300 bg-green-50/50 dark:border-green-700 dark:bg-green-950/20'
          : 'border-border bg-muted/30',
    )}>
      <div className="flex items-start gap-2">
        <Shield className={cn(
          'h-4 w-4 mt-0.5 shrink-0',
          isPending || isConfirming ? 'text-amber-600' : isConfirmed ? 'text-green-600' : 'text-muted-foreground',
        )} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-xs text-muted-foreground mb-1">
            {isPending || isConfirming ? 'Ação requer confirmação' : isConfirmed ? 'Ação executada' : 'Ação cancelada'}
          </p>
          <p className="text-sm">{action.description}</p>

          {action.result && (
            <p className={cn(
              'text-xs mt-1',
              isConfirmed ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground',
            )}>
              {action.result}
            </p>
          )}

          {(isPending || isConfirming) && (
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                variant="default"
                onClick={() => onConfirm(action)}
                disabled={isConfirming}
                className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700"
              >
                {isConfirming ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Check className="h-3 w-3 mr-1" />
                )}
                Confirmar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCancel(action)}
                disabled={isConfirming}
                className="h-7 px-3 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
