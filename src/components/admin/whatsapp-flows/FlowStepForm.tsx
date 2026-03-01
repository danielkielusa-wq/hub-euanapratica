import { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, X, Plus } from 'lucide-react';
import {
  useCreateStep,
  useUpdateStep,
  type WhatsAppFlowStep,
  type StepFormInput,
} from '@/hooks/useAdminWhatsAppFlows';

interface StepAction {
  type: 'next' | 'end' | 'goto';
  target?: string | null;
}

interface WaitReplyMatch {
  keywords: string[];
  action: StepAction;
}

const DELAY_PRESETS = [
  { label: '10s', duration: 10, unit: 'seconds' },
  { label: '30s', duration: 30, unit: 'seconds' },
  { label: '30min', duration: 30, unit: 'minutes' },
  { label: '1h', duration: 1, unit: 'hours' },
  { label: '2h', duration: 2, unit: 'hours' },
  { label: '24h', duration: 24, unit: 'hours' },
  { label: '48h', duration: 48, unit: 'hours' },
  { label: '7d', duration: 7, unit: 'days' },
];

interface FlowStepFormProps {
  open: boolean;
  onClose: () => void;
  flowId: string;
  step: WhatsAppFlowStep | null;
  addStepType: 'message' | 'delay' | 'wait_reply' | null;
  addAtOrder: number;
  existingSteps: WhatsAppFlowStep[];
}

export function FlowStepForm({
  open,
  onClose,
  flowId,
  step,
  addStepType,
  addAtOrder,
  existingSteps,
}: FlowStepFormProps) {
  const createStep = useCreateStep();
  const updateStep = useUpdateStep();
  const isEditing = !!step;
  const isSaving = createStep.isPending || updateStep.isPending;

  const stepType = step?.step_type || addStepType || 'message';

  // Common fields
  const [stepKey, setStepKey] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Message fields
  const [contentType, setContentType] = useState<'inline' | 'template'>('inline');
  const [messageText, setMessageText] = useState('');
  const [templateName, setTemplateName] = useState('');

  // Delay fields
  const [delayDuration, setDelayDuration] = useState(60);
  const [delayUnit, setDelayUnit] = useState<'seconds' | 'minutes' | 'hours' | 'days'>('minutes');

  // Wait reply fields
  const [timeoutMinutes, setTimeoutMinutes] = useState(1440);
  const [timeoutAction, setTimeoutAction] = useState<StepAction>({ type: 'end' });
  const [matches, setMatches] = useState<WaitReplyMatch[]>([
    { keywords: [], action: { type: 'next' } },
  ]);
  const [defaultAction, setDefaultAction] = useState<StepAction>({ type: 'next' });
  const [newKeyword, setNewKeyword] = useState('');
  const [editingMatchIdx, setEditingMatchIdx] = useState<number | null>(null);

  useEffect(() => {
    if (step) {
      setStepKey(step.step_key);
      setDisplayName(step.display_name || '');
      const config = step.config as any;

      if (step.step_type === 'message') {
        setContentType(config.content_type || 'inline');
        setMessageText(config.message_text || '');
        setTemplateName(config.template_name || '');
      } else if (step.step_type === 'delay') {
        setDelayDuration(config.duration || 60);
        setDelayUnit(config.unit || 'minutes');
      } else if (step.step_type === 'wait_reply') {
        setTimeoutMinutes(config.timeout_minutes || 1440);
        setTimeoutAction(config.timeout_action || { type: 'end' });
        setMatches(config.matches || [{ keywords: [], action: { type: 'next' } }]);
        setDefaultAction(config.default_action || { type: 'next' });
      }
    } else {
      const nextOrder = addAtOrder + 1;
      const prefix = addStepType === 'message' ? 'msg' : addStepType === 'delay' ? 'delay' : 'wait';
      setStepKey(`${prefix}_${nextOrder}`);
      setDisplayName('');
      setContentType('inline');
      setMessageText('');
      setTemplateName('');
      setDelayDuration(60);
      setDelayUnit('minutes');
      setTimeoutMinutes(1440);
      setTimeoutAction({ type: 'end' });
      setMatches([{ keywords: [], action: { type: 'next' } }]);
      setDefaultAction({ type: 'next' });
      setNewKeyword('');
      setEditingMatchIdx(null);
    }
  }, [step, addStepType, addAtOrder, open]);

  const buildConfig = (): Record<string, unknown> => {
    if (stepType === 'message') {
      return {
        content_type: contentType,
        ...(contentType === 'inline' ? { message_text: messageText } : { template_name: templateName }),
      };
    }
    if (stepType === 'delay') {
      return { duration: delayDuration, unit: delayUnit };
    }
    if (stepType === 'wait_reply') {
      return {
        timeout_minutes: timeoutMinutes,
        timeout_action: timeoutAction,
        matches,
        default_action: defaultAction,
      };
    }
    return {};
  };

  const handleSubmit = async () => {
    const config = buildConfig();

    if (isEditing) {
      await updateStep.mutateAsync({
        id: step!.id,
        flow_id: flowId,
        step_key: stepKey,
        display_name: displayName || undefined,
        config,
      });
    } else {
      // Compute new step_order: insert after addAtOrder, shifting others
      const newOrder = addAtOrder + 1;
      const input: StepFormInput = {
        flow_id: flowId,
        step_order: newOrder,
        step_key: stepKey,
        display_name: displayName || undefined,
        step_type: stepType,
        config,
      };
      await createStep.mutateAsync(input);
    }
    onClose();
  };

  // ── Keyword match helpers ──
  const addKeywordToMatch = (matchIdx: number) => {
    const kw = newKeyword.trim().toLowerCase();
    if (!kw) return;
    setMatches((prev) =>
      prev.map((m, i) =>
        i === matchIdx && !m.keywords.includes(kw)
          ? { ...m, keywords: [...m.keywords, kw] }
          : m
      )
    );
    setNewKeyword('');
  };

  const removeKeywordFromMatch = (matchIdx: number, kw: string) => {
    setMatches((prev) =>
      prev.map((m, i) =>
        i === matchIdx ? { ...m, keywords: m.keywords.filter((k) => k !== kw) } : m
      )
    );
  };

  const addMatch = () => {
    setMatches((prev) => [...prev, { keywords: [], action: { type: 'next' } }]);
  };

  const removeMatch = (idx: number) => {
    setMatches((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateMatchAction = (idx: number, action: StepAction) => {
    setMatches((prev) => prev.map((m, i) => (i === idx ? { ...m, action } : m)));
  };

  // Step key options for goto actions
  const gotoOptions = existingSteps
    .filter((s) => s.id !== step?.id)
    .map((s) => ({ key: s.step_key, label: s.display_name || s.step_key }));

  const ActionSelect = ({
    value,
    onChange,
  }: {
    value: StepAction;
    onChange: (action: StepAction) => void;
  }) => (
    <div className="flex gap-2 items-center">
      <Select
        value={value.type}
        onValueChange={(type) => onChange({ type: type as any, target: null })}
      >
        <SelectTrigger className="w-40 rounded-xl h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="next">Proximo passo</SelectItem>
          <SelectItem value="end">Encerrar fluxo</SelectItem>
          <SelectItem value="goto">Ir para...</SelectItem>
        </SelectContent>
      </Select>
      {value.type === 'goto' && (
        <Select
          value={value.target || ''}
          onValueChange={(target) => onChange({ type: 'goto', target })}
        >
          <SelectTrigger className="w-40 rounded-xl h-8">
            <SelectValue placeholder="Etapa..." />
          </SelectTrigger>
          <SelectContent>
            {gotoOptions.map((opt) => (
              <SelectItem key={opt.key} value={opt.key}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent className="sm:max-w-lg overflow-auto">
        <SheetHeader>
          <SheetTitle>
            {isEditing ? 'Editar Etapa' : 'Nova Etapa'} —{' '}
            {{ message: 'Mensagem', delay: 'Delay', wait_reply: 'Aguardar Resposta' }[stepType]}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5 py-4">
          {/* Common: step_key + display_name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Chave</Label>
              <Input
                value={stepKey}
                onChange={(e) => setStepKey(e.target.value.replace(/\s/g, '_').toLowerCase())}
                className="rounded-xl font-mono text-sm h-9"
                disabled={isEditing}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nome de exibicao</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enviar teaser"
                className="rounded-xl h-9"
              />
            </div>
          </div>

          {/* ── Message Config ── */}
          {stepType === 'message' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={contentType === 'inline' ? 'default' : 'outline'}
                  className="rounded-xl"
                  onClick={() => setContentType('inline')}
                >
                  Texto direto
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={contentType === 'template' ? 'default' : 'outline'}
                  className="rounded-xl"
                  onClick={() => setContentType('template')}
                >
                  Template existente
                </Button>
              </div>

              {contentType === 'inline' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Mensagem</Label>
                    <span className={`text-xs ${messageText.length > 4096 ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                      {messageText.length}/4096
                    </span>
                  </div>
                  <Textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={'Ola {{leadName}}, seu relatorio ficou pronto!'}
                    className={`rounded-xl resize-none ${messageText.length > 4096 ? 'border-destructive' : ''}`}
                    rows={4}
                    maxLength={4096}
                  />
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs text-muted-foreground mr-1">Variaveis:</span>
                    {['{{leadName}}', '{{leadEmail}}', '{{leadPhone}}', '{{reportLink}}'].map(
                      (v) => (
                        <Badge
                          key={v}
                          variant="outline"
                          className="text-[10px] cursor-pointer hover:bg-muted"
                          onClick={() => setMessageText((prev) => prev + ' ' + v)}
                        >
                          {v}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Nome do template</Label>
                  <Input
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="report_ready_teaser"
                    className="rounded-xl font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Deve corresponder ao nome em Templates WhatsApp
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Delay Config ── */}
          {stepType === 'delay' && (
            <div className="space-y-4">
              <div className="flex gap-3 items-end">
                <div className="space-y-1.5">
                  <Label>Duracao</Label>
                  <Input
                    type="number"
                    value={delayDuration}
                    onChange={(e) => setDelayDuration(Number(e.target.value))}
                    className="rounded-xl w-24"
                    min={1}
                  />
                </div>
                <Select value={delayUnit} onValueChange={(v) => setDelayUnit(v as any)}>
                  <SelectTrigger className="w-32 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seconds">Segundos</SelectItem>
                    <SelectItem value="minutes">Minutos</SelectItem>
                    <SelectItem value="hours">Horas</SelectItem>
                    <SelectItem value="days">Dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs text-muted-foreground mr-1">Presets:</span>
                {DELAY_PRESETS.map((p) => (
                  <Badge
                    key={p.label}
                    variant="outline"
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => {
                      setDelayDuration(p.duration);
                      setDelayUnit(p.unit as any);
                    }}
                  >
                    {p.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* ── Wait Reply Config ── */}
          {stepType === 'wait_reply' && (
            <div className="space-y-5">
              {/* Timeout */}
              <div className="flex gap-3 items-end">
                <div className="space-y-1.5">
                  <Label>Timeout (minutos)</Label>
                  <Input
                    type="number"
                    value={timeoutMinutes}
                    onChange={(e) => setTimeoutMinutes(Number(e.target.value))}
                    className="rounded-xl w-28"
                    min={1}
                  />
                </div>
                <div className="space-y-1.5 flex-1">
                  <Label>Se nao responder:</Label>
                  <ActionSelect value={timeoutAction} onChange={setTimeoutAction} />
                </div>
              </div>

              {/* Keyword matches */}
              <div className="space-y-3">
                <Label>Respostas esperadas</Label>
                {matches.map((match, matchIdx) => (
                  <div key={matchIdx} className="border rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Grupo {matchIdx + 1}
                      </span>
                      {matches.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeMatch(matchIdx)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>

                    {/* Keywords */}
                    <div className="flex flex-wrap gap-1">
                      {match.keywords.map((kw) => (
                        <Badge key={kw} variant="secondary" className="gap-1 rounded-lg">
                          "{kw}"
                          <button
                            type="button"
                            onClick={() => removeKeywordFromMatch(matchIdx, kw)}
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      <Input
                        value={editingMatchIdx === matchIdx ? newKeyword : ''}
                        onChange={(e) => {
                          setEditingMatchIdx(matchIdx);
                          setNewKeyword(e.target.value);
                        }}
                        onFocus={() => setEditingMatchIdx(matchIdx)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addKeywordToMatch(matchIdx);
                          }
                        }}
                        placeholder="Palavra..."
                        className="rounded-xl h-8 text-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-xl h-8"
                        onClick={() => {
                          setEditingMatchIdx(matchIdx);
                          addKeywordToMatch(matchIdx);
                        }}
                      >
                        +
                      </Button>
                    </div>

                    {/* Action */}
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Acao:</span>
                      <ActionSelect
                        value={match.action}
                        onChange={(action) => updateMatchAction(matchIdx, action)}
                      />
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-1"
                  onClick={addMatch}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar grupo de respostas
                </Button>
              </div>

              {/* Default action */}
              <div className="space-y-1.5">
                <Label>Resposta padrao (qualquer outra)</Label>
                <ActionSelect value={defaultAction} onChange={setDefaultAction} />
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="pt-4 border-t">
          <Button variant="outline" className="rounded-xl" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="rounded-xl" onClick={handleSubmit} disabled={!stepKey.trim() || isSaving}>
            {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {isEditing ? 'Salvar' : 'Adicionar'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
