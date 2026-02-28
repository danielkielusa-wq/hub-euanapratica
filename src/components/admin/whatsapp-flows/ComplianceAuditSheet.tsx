import { useState } from 'react';
import { ShieldCheck, ShieldAlert, ShieldX, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useFlowAuditData, AuditFlowWithSteps, AuditData, WhatsAppFlowStep } from '@/hooks/useAdminWhatsAppFlows';

// ── Types ─────────────────────────────────────────────────────────────────────

type Severity = 'critical' | 'warning' | 'info';

interface Finding {
  code: string;
  severity: Severity;
  title: string;
  recommendation: string;
}

interface FlowAuditResult {
  flow: AuditFlowWithSteps;
  findings: Finding[];
  score: number;
}

// ── Compliance Check Rules ────────────────────────────────────────────────────

const CTA_WORDS = ['assine', 'compre', 'acesse', 'clique', 'cadastre', 'garanta', 'aproveite'];
const LINK_PATTERN = /https?:\/\/|\.com\.br\b|\.com\//i;
const STOP_PATTERN = /\b(parar|stop|pare|descadastrar|desinscrever)\b/i;

function getMessageText(step: WhatsAppFlowStep, templateBodies: Record<string, string>): string {
  const config = step.config as Record<string, unknown>;
  if (step.step_type !== 'message') return '';
  // For template-based steps, resolve the actual template body
  if (config?.content_type === 'template' && config?.template_name) {
    const templateName = String(config.template_name);
    return templateBodies[templateName] || `[template: ${templateName}]`;
  }
  return String(config?.message_text || '');
}

function auditFlow(flow: AuditFlowWithSteps, templateBodies: Record<string, string>): FlowAuditResult {
  const findings: Finding[] = [];
  const steps = flow.steps;
  const messageSteps = steps.filter((s) => s.step_type === 'message');
  const waitReplySteps = steps.filter((s) => s.step_type === 'wait_reply');

  // Sort by step_order for sequential analysis
  const ordered = [...steps].sort((a, b) => a.step_order - b.step_order);
  const firstMessageStep = ordered.find((s) => s.step_type === 'message');

  // ── CRITICAL checks ──

  // 1. Link in first message step
  if (firstMessageStep) {
    const text = getMessageText(firstMessageStep, templateBodies);
    if (LINK_PATTERN.test(text)) {
      findings.push({
        code: 'LINK_IN_FIRST_MESSAGE',
        severity: 'critical',
        title: 'Link na primeira mensagem',
        recommendation: 'Envie o link apenas após o usuário responder (após um passo wait_reply).',
      });
    }
  }

  // 2. wait_reply timeout action advances flow
  for (const step of waitReplySteps) {
    const config = step.config as Record<string, unknown>;
    const timeoutAction = config?.timeout_action as Record<string, unknown> | undefined;
    if (timeoutAction?.type === 'next') {
      findings.push({
        code: 'TIMEOUT_ADVANCES_FLOW',
        severity: 'critical',
        title: 'Timeout avança o fluxo sem confirmação',
        recommendation:
          `Etapa "${step.display_name || step.step_key}": configure o timeout_action como "Encerrar fluxo" para não enviar mensagens a quem não respondeu.`,
      });
    }
  }

  // 3. No STOP instruction in any message
  const anyStopInstruction = messageSteps.some((s) => STOP_PATTERN.test(getMessageText(s, templateBodies)));
  if (messageSteps.length > 0 && !anyStopInstruction) {
    findings.push({
      code: 'NO_STOP_INSTRUCTION',
      severity: 'critical',
      title: 'Sem instrução de cancelamento',
      recommendation:
        'Inclua "Responda PARAR para cancelar" em pelo menos uma etapa de mensagem.',
    });
  }

  // ── WARNING checks ──

  // 4. No reply gate (messages without any wait_reply)
  if (messageSteps.length > 0 && waitReplySteps.length === 0) {
    findings.push({
      code: 'NO_REPLY_GATE',
      severity: 'warning',
      title: 'Fluxo unidirecional sem confirmação',
      recommendation:
        'Adicione um passo wait_reply para medir engajamento antes de continuar o fluxo.',
    });
  }

  // 5. Consecutive message steps with no delay between them
  for (let i = 0; i < ordered.length - 1; i++) {
    if (ordered[i].step_type === 'message' && ordered[i + 1].step_type === 'message') {
      findings.push({
        code: 'CONSECUTIVE_MESSAGES',
        severity: 'warning',
        title: 'Mensagens consecutivas sem delay',
        recommendation:
          `Etapas "${ordered[i].display_name || ordered[i].step_key}" e "${ordered[i + 1].display_name || ordered[i + 1].step_key}": adicione um delay de pelo menos 1 minuto entre elas.`,
      });
      break; // Report once per flow
    }
  }

  // 6. Excessive message steps (> 3)
  if (messageSteps.length > 3) {
    findings.push({
      code: 'EXCESSIVE_MESSAGES',
      severity: 'warning',
      title: `Muitas mensagens no fluxo (${messageSteps.length})`,
      recommendation:
        'Reduza para no máximo 3 etapas de mensagem ou segmente o conteúdo em fluxos separados.',
    });
  }

  // 7. CTA in first message
  if (firstMessageStep) {
    const text = getMessageText(firstMessageStep, templateBodies).toLowerCase();
    const foundCta = CTA_WORDS.find((w) => text.includes(w));
    if (foundCta) {
      findings.push({
        code: 'CTA_IN_FIRST_MESSAGE',
        severity: 'warning',
        title: 'CTA na primeira mensagem',
        recommendation:
          `A palavra "${foundCta}" foi detectada na primeira etapa. Primeiro contato deve ser uma pergunta, não uma oferta.`,
      });
    }
  }

  // ── INFO checks ──

  // 8. Session timeout > 7 days
  if ((flow.session_timeout_hours || 168) > 168) {
    findings.push({
      code: 'LONG_SESSION_TIMEOUT',
      severity: 'info',
      title: `Timeout de sessão longo (${flow.session_timeout_hours}h)`,
      recommendation:
        'Considere reduzir para 24-48h para limpar sessões inativas e reduzir ruído.',
    });
  }

  // ── Score ──
  const penalty = findings.reduce((acc, f) => {
    if (f.severity === 'critical') return acc + 20;
    if (f.severity === 'warning') return acc + 10;
    return acc + 5;
  }, 0);

  const score = Math.max(0, 100 - penalty);

  return { flow, findings, score };
}

// ── Sub-components ────────────────────────────────────────────────────────────

const SEVERITY_CONFIG = {
  critical: {
    label: 'Crítico',
    className: 'bg-red-100 text-red-700 border-red-200',
    dot: 'bg-red-500',
  },
  warning: {
    label: 'Atenção',
    className: 'bg-amber-100 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  info: {
    label: 'Info',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
    dot: 'bg-blue-400',
  },
};

function FindingItem({ finding }: { finding: Finding }) {
  const cfg = SEVERITY_CONFIG[finding.severity];
  return (
    <div className="flex gap-3 py-2">
      <div className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${cfg.dot}`} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{finding.title}</span>
          <Badge variant="outline" className={`text-xs ${cfg.className}`}>
            {cfg.label}
          </Badge>
        </div>
        <p className="mt-0.5 text-xs text-gray-500">{finding.recommendation}</p>
      </div>
    </div>
  );
}

function ScoreDisplay({ score, results }: { score: number; results: FlowAuditResult[] }) {
  const criticals = results.flatMap((r) => r.findings.filter((f) => f.severity === 'critical')).length;
  const warnings = results.flatMap((r) => r.findings.filter((f) => f.severity === 'warning')).length;
  const infos = results.flatMap((r) => r.findings.filter((f) => f.severity === 'info')).length;

  const color =
    score >= 80 ? 'text-green-600' : score >= 60 ? 'text-amber-600' : 'text-red-600';
  const barColor =
    score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500';
  const Icon = score >= 80 ? ShieldCheck : score >= 60 ? ShieldAlert : ShieldX;

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-center gap-4">
        <Icon className={`h-10 w-10 flex-shrink-0 ${color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-bold ${color}`}>{score}</span>
            <span className="text-gray-400 text-lg">/100</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full transition-all ${barColor}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
        {criticals > 0 && (
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
            {criticals} crítico{criticals !== 1 ? 's' : ''}
          </span>
        )}
        {warnings > 0 && (
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
            {warnings} aviso{warnings !== 1 ? 's' : ''}
          </span>
        )}
        {infos > 0 && (
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-blue-400 inline-block" />
            {infos} info{infos !== 1 ? 's' : ''}
          </span>
        )}
        {criticals + warnings + infos === 0 && (
          <span className="text-green-600 font-medium">Nenhum problema encontrado.</span>
        )}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface ComplianceAuditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ComplianceAuditSheet({ open, onOpenChange }: ComplianceAuditSheetProps) {
  const [results, setResults] = useState<FlowAuditResult[] | null>(null);
  const { refetch, isFetching } = useFlowAuditData();

  async function runAudit() {
    setResults(null);
    const { data } = await refetch();
    if (data) {
      const { flows, templateBodies } = data;
      const auditResults = flows.map((f) => auditFlow(f, templateBodies));
      // Sort: flows with issues first, then clean ones
      auditResults.sort((a, b) => a.score - b.score);
      setResults(auditResults);
    }
  }

  const overallScore = results && results.length > 0
    ? Math.round(results.reduce((acc, r) => acc + r.score, 0) / results.length)
    : results ? 100 : null; // No active flows = perfect score

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            Auditoria de Conformidade WhatsApp
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Run button */}
          <Button
            onClick={runAudit}
            disabled={isFetching}
            className="w-full"
            variant={results ? 'outline' : 'default'}
          >
            {isFetching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analisando fluxos...
              </>
            ) : results ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Executar novamente
              </>
            ) : (
              <>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Executar Auditoria
              </>
            )}
          </Button>

          {/* Empty state */}
          {!results && !isFetching && (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <ShieldCheck className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-500">
                Analisa todos os fluxos ativos e detecta riscos de bloqueio pelo WhatsApp.
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Verifica links, CTAs, falta de PARAR/STOP, timeouts e padrões de envio.
              </p>
            </div>
          )}

          {/* Score + Results */}
          {results && overallScore !== null && (
            <>
              <ScoreDisplay score={overallScore} results={results} />

              <div className="space-y-3">
                {results.map((result) => (
                  <div key={result.flow.id} className="rounded-lg border bg-white">
                    <div className="flex items-center justify-between px-4 py-3 border-b">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {result.flow.display_name}
                        </p>
                        <p className="text-xs text-gray-400">{result.flow.name}</p>
                      </div>
                      {result.findings.length === 0 ? (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200 flex-shrink-0 ml-2"
                        >
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          OK
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-red-50 text-red-700 border-red-200 flex-shrink-0 ml-2"
                        >
                          {result.score}/100
                        </Badge>
                      )}
                    </div>

                    {result.findings.length > 0 && (
                      <div className="divide-y px-4">
                        {result.findings.map((finding, i) => (
                          <FindingItem key={`${finding.code}-${i}`} finding={finding} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {results.length === 0 && (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <p className="text-sm text-gray-500">Nenhum fluxo ativo encontrado.</p>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
