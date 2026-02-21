import { useState } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CancellationFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
  expiresAt: string | null;
  onCancelled: () => void;
}

type Step = 'confirm' | 'reason' | 'final';

const CANCEL_REASONS = [
  { value: 'too_expensive', label: 'Muito caro para mim' },
  { value: 'not_using', label: 'Não estou usando o suficiente' },
  { value: 'found_alternative', label: 'Encontrei outra solução' },
  { value: 'missing_features', label: 'Faltam funcionalidades' },
  { value: 'technical_issues', label: 'Problemas técnicos' },
  { value: 'temporary_pause', label: 'Quero pausar temporariamente' },
  { value: 'other', label: 'Outro motivo' },
] as const;

export function CancellationFlow({
  open,
  onOpenChange,
  planName,
  expiresAt,
  onCancelled,
}: CancellationFlowProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('confirm');
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultExpiresAt, setResultExpiresAt] = useState<string | null>(null);

  const handleClose = () => {
    setStep('confirm');
    setReason('');
    setFeedback('');
    setIsSubmitting(false);
    setResultExpiresAt(null);
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!reason) {
      toast({
        title: 'Selecione um motivo',
        description: 'Por favor, nos diga o motivo do cancelamento.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: 'Sessão expirada', description: 'Faça login novamente.', variant: 'destructive' });
        return;
      }

      const response = await supabase.functions.invoke('cancel-subscription', {
        body: { reason, feedback: feedback || undefined },
      });

      if (response.error) {
        // Extract the actual error message from the edge function response
        const ctx = (response.error as any)?.context;
        let serverMsg: string | null = null;
        try {
          if (ctx instanceof Response) {
            const body = await ctx.json();
            serverMsg = body?.error || body?.msg || null;
          } else if (typeof ctx === 'object' && ctx?.error) {
            serverMsg = ctx.error;
          } else if (typeof ctx === 'string') {
            serverMsg = ctx;
          }
        } catch {
          // could not parse response body
        }
        console.error('cancel-subscription error:', { message: response.error.message, serverMsg });
        throw new Error(serverMsg || 'Erro ao cancelar assinatura.');
      }

      const result = response.data as { success: boolean; expiresAt?: string };
      setResultExpiresAt(result.expiresAt || expiresAt);
      setStep('final');
      onCancelled();
    } catch (err: any) {
      const description = err?.message && err.message !== 'Erro ao cancelar assinatura.'
        ? err.message
        : 'Não foi possível processar o cancelamento no momento. Por favor, tente novamente mais tarde ou entre em contato com nosso suporte: suporte@euanapratica.com';
      toast({
        title: 'Erro ao cancelar',
        description,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedExpiry = resultExpiresAt
    ? new Date(resultExpiresAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === 'confirm' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Cancelar {planName}?
              </DialogTitle>
              <DialogDescription>
                Tem certeza que deseja cancelar sua assinatura? Você manterá acesso até o final do período atual.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800 font-medium">
                  Ao cancelar, você perderá acesso a:
                </p>
                <ul className="text-sm text-amber-700 mt-2 space-y-1 list-disc list-inside">
                  <li>Análises de currículo ilimitadas</li>
                  <li>Biblioteca e Masterclass</li>
                  <li>Descontos exclusivos em serviços</li>
                  <li>Hotseats e Prime Jobs</li>
                </ul>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={handleClose}>
                  Manter Plano
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 gap-2"
                  onClick={() => setStep('reason')}
                >
                  Continuar
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'reason' && (
          <>
            <DialogHeader>
              <DialogTitle>Por que está cancelando?</DialogTitle>
              <DialogDescription>
                Sua resposta nos ajuda a melhorar o serviço.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                {CANCEL_REASONS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setReason(r.value)}
                    className={cn(
                      'w-full text-left p-3 rounded-xl border text-sm font-medium transition-all',
                      reason === r.value
                        ? 'border-primary bg-primary/5 text-foreground'
                        : 'border-border text-muted-foreground hover:border-primary/30'
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              {reason && (
                <div className="animate-fade-in">
                  <Textarea
                    placeholder="Algo mais que gostaria de compartilhar? (opcional)"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" className="gap-2" onClick={() => setStep('confirm')}>
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 gap-2"
                  onClick={handleSubmit}
                  disabled={!reason || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cancelando...
                    </>
                  ) : (
                    'Confirmar Cancelamento'
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'final' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Cancelamento Confirmado
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Sua assinatura foi marcada para cancelamento.
              </p>
              {formattedExpiry && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-800 font-medium">
                    Você manterá acesso ao plano {planName} até{' '}
                    <span className="font-bold">{formattedExpiry}</span>.
                  </p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Se mudar de ideia, você pode reativar sua assinatura a qualquer momento antes dessa data.
              </p>
              <Button className="w-full" onClick={handleClose}>
                Entendido
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
