import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { EmailTemplate } from '@/hooks/useAdminEmailTemplates';

interface SendTestEmailDialogProps {
  template: EmailTemplate | null;
  onClose: () => void;
}

const DEFAULT_VALUES: Record<string, string> = {
  '{{firstName}}': 'Maria',
  '{{name}}': 'Maria Silva',
  '{{studentName}}': 'Maria Silva',
  '{{mentorName}}': 'Dr. Carlos Oliveira',
  '{{serviceName}}': 'Mentoria de Carreira',
  '{{planName}}': 'Plano Premium',
  '{{formattedDate}}': 'segunda-feira, 15 de março de 2026',
  '{{formattedTime}}': '14:00',
  '{{formattedStartTime}}': '14:00',
  '{{formattedEndTime}}': '15:00',
  '{{durationMinutes}}': '60',
  '{{dashboardLink}}': 'https://hub.euanapratica.com/dashboard/hub',
  '{{manageBookingLink}}': 'https://hub.euanapratica.com/dashboard/agendamentos',
  '{{inviteLink}}': 'https://hub.euanapratica.com/register?invite=TESTE123',
  '{{espacoName}}': 'Espaço de Mentoria Teste',
  '{{expiresAt}}': '28/02/2026',
  '{{changeCardUrl}}': 'https://hub.euanapratica.com/dashboard/assinatura',
  '{{invitedNameGreeting}}': ' <strong>Maria</strong>',
  '{{meetingLinkSection}}': '<div style="text-align:center;margin:32px 0"><a href="https://meet.google.com/test" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:16px 32px;border-radius:12px;font-weight:600">Entrar na Reunião</a></div>',
  '{{oldDateSection}}': '<div style="background:#fef2f2;border-radius:12px;padding:16px;margin:16px 0"><p style="color:#991b1b;margin:0"><s>segunda-feira, 10 de março de 2026 às 10:00</s></p></div>',
  '{{cancellationReasonSection}}': '<div style="background:#fafafa;border-radius:12px;padding:16px;margin:16px 0"><p style="color:#52525b;margin:0"><strong>Motivo:</strong> Conflito de agenda</p></div>',
  '{{studentNotes}}': 'Gostaria de discutir meu currículo e estratégia de networking.',
  '{{meetingLink}}': 'https://meet.google.com/test-meeting',
};

// Templates that have a standalone Edge Function with test_email support.
// For these, the dialog calls the function directly instead of send-test-email,
// so all dynamic variables (job cards, etc.) are generated with real data.
const STANDALONE_TEST_FUNCTIONS: Record<string, string> = {
  'prime_jobs_digest': 'send-prime-jobs-digest',
};

function getDefaultValue(variable: string): string {
  return DEFAULT_VALUES[variable] || `Valor de teste`;
}

export function SendTestEmailDialog({ template, onClose }: SendTestEmailDialogProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [isSending, setIsSending] = useState(false);

  // Pre-fill admin email on mount
  useEffect(() => {
    if (template) {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user?.email) setEmail(data.user.email);
      });

      // Initialize variables with defaults
      const vars: Record<string, string> = {};
      (template.variables || []).forEach((v: string) => {
        vars[v] = getDefaultValue(v);
      });
      setVariables(vars);
    }
  }, [template]);

  const standaloneFunction = template ? STANDALONE_TEST_FUNCTIONS[template.name] : null;

  const handleSend = async () => {
    if (!template || !email) return;

    setIsSending(true);
    try {
      let data: any;
      let error: any;

      if (standaloneFunction) {
        // Call the standalone function with test_email — it generates all dynamic content
        ({ data, error } = await supabase.functions.invoke(standaloneFunction, {
          body: { test_email: email },
        }));
      } else {
        ({ data, error } = await supabase.functions.invoke('send-test-email', {
          body: {
            template_name: template.name,
            to: email,
            variables,
          },
        }));
      }

      if (error) {
        let message = error.message;
        try {
          const body = error.context && typeof error.context.json === 'function'
            ? await error.context.json()
            : null;
          if (body?.error) message = body.error;
          else if (body?.message) message = body.message;
        } catch { /* use default message */ }
        throw new Error(message);
      }
      if (!data?.success) throw new Error(data?.message || 'Falha ao enviar');

      // Standalone functions return emailsSent count — check it
      if (standaloneFunction && data?.emailsSent === 0) {
        throw new Error(data?.message || 'Nenhum email enviado. Verifique os logs.');
      }

      toast({
        title: 'Email de teste enviado',
        description: `Enviado para ${email} com sucesso.`,
      });
      onClose();
    } catch (err: any) {
      toast({
        title: 'Erro ao enviar email de teste',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!template) return null;

  // Filter out auto-injected variables — these are handled by the Edge Function
  const AUTO_INJECTED = ['{{unsubscribeLink}}', '{{trackingPixel}}'];
  const templateVars = (template.variables || []).filter((v: string) => !AUTO_INJECTED.includes(v));

  return (
    <Dialog open={!!template} onOpenChange={onClose}>
      <DialogContent className="rounded-[24px] max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Enviar Email de Teste
          </DialogTitle>
          <DialogDescription>
            <span className="font-semibold">{template.display_name}</span>
            <span className="font-mono text-xs ml-2">({template.name})</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Recipient */}
          <div className="space-y-2">
            <Label htmlFor="test-email-to">Destinatário</Label>
            <Input
              id="test-email-to"
              type="email"
              placeholder="email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl"
            />
          </div>

          {/* Info note */}
          <div className="flex items-start gap-2 rounded-xl bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <span>O assunto será prefixado com <strong>[TESTE]</strong> para diferenciar de envios reais.</span>
          </div>

          {/* Variables — hidden for standalone templates (auto-generated with real data) */}
          {standaloneFunction ? (
            <div className="flex items-start gap-2 rounded-xl bg-green-50 border border-green-200 p-3 text-sm text-green-800">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              <span>As variaveis deste template (vagas, dica da semana, etc.) serao preenchidas automaticamente com dados reais do sistema.</span>
            </div>
          ) : (
            <>
              {templateVars.length > 0 && (
                <div className="space-y-3">
                  <Label>Variaveis do Template</Label>
                  {templateVars.map((v: string) => (
                    <div key={v} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs font-mono shrink-0">{v}</Badge>
                      </div>
                      <Input
                        value={variables[v] || ''}
                        onChange={(e) => setVariables(prev => ({ ...prev, [v]: e.target.value }))}
                        className="rounded-xl text-sm"
                        placeholder={`Valor para ${v}`}
                      />
                    </div>
                  ))}
                </div>
              )}

              {templateVars.length === 0 && (
                <p className="text-sm text-muted-foreground">Este template nao possui variaveis.</p>
              )}
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={!email || isSending}
            className="rounded-xl gap-2"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Enviar Teste
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
