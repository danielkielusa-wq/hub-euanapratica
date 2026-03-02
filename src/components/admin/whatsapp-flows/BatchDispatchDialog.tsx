import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Users, FileText, ListChecks,
  ChevronRight, ChevronLeft, AlertTriangle, Calendar, Bell,
} from 'lucide-react';
import {
  usePreviewBatchContacts,
  useCreateBatchJob,
  type PreviewResult,
} from '@/hooks/useAdminBatchDispatch';
import { InfoTooltip } from './InfoTooltip';

interface BatchDispatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flowId: string;
  flowName: string;
}

type Step = 'source' | 'config' | 'preview';

export function BatchDispatchDialog({
  open, onOpenChange, flowId, flowName,
}: BatchDispatchDialogProps) {
  const preview = usePreviewBatchContacts();
  const createBatch = useCreateBatchJob();

  const [step, setStep] = useState<Step>('source');
  const [batchName, setBatchName] = useState('');
  const [sourceType, setSourceType] = useState<'report_backfill' | 'manual_list'>('report_backfill');
  const [contactsPerCycle, setContactsPerCycle] = useState(2);
  const [maxContacts, setMaxContacts] = useState<number | ''>('');
  const [businessHoursOnly, setBusinessHoursOnly] = useState(true);
  const [manualPhones, setManualPhones] = useState('');
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:30');
  const [notifyOnComplete, setNotifyOnComplete] = useState(true);

  // Reset on open/close
  useEffect(() => {
    if (open) {
      setStep('source');
      setBatchName(`Lote ${new Date().toLocaleDateString('pt-BR')}`);
      setSourceType('report_backfill');
      setContactsPerCycle(2);
      setMaxContacts('');
      setBusinessHoursOnly(true);
      setManualPhones('');
      setPreviewResult(null);
      setScheduleEnabled(false);
      // Default schedule date: tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setScheduleDate(tomorrow.toISOString().slice(0, 10));
      setScheduleTime('09:30');
      setNotifyOnComplete(true);
    }
  }, [open]);

  // Parsed manual contacts
  const parsedManualContacts = manualPhones
    .split(/[\n,;]+/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 10);

  const totalEligible = sourceType === 'report_backfill'
    ? (previewResult?.eligible_count ?? '?')
    : parsedManualContacts.length;

  const effectiveMax = typeof maxContacts === 'number' && maxContacts > 0 ? maxContacts : undefined;
  const contactCount = typeof totalEligible === 'number' && effectiveMax
    ? Math.min(totalEligible, effectiveMax)
    : totalEligible;

  const estimatedHours = typeof contactCount === 'number'
    ? Math.ceil(contactCount / (contactsPerCycle * 12)) || 1
    : '?';

  const handlePreview = async () => {
    if (sourceType === 'report_backfill') {
      const result = await preview.mutateAsync(flowId);
      setPreviewResult(result);
    }
    setStep('preview');
  };

  // Build scheduledAt ISO string from BRT date/time inputs
  const buildScheduledAt = (): string | undefined => {
    if (!scheduleEnabled || !scheduleDate || !scheduleTime) return undefined;
    // BRT is UTC-3. Convert local BRT input to UTC.
    const [hours, minutes] = scheduleTime.split(':').map(Number);
    const utcHours = hours + 3; // BRT → UTC
    const dt = new Date(`${scheduleDate}T${String(utcHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00Z`);
    return dt.toISOString();
  };

  const handleCreate = () => {
    createBatch.mutate(
      {
        flowId,
        name: batchName.trim(),
        sourceType,
        contactsPerCycle,
        maxContacts: typeof maxContacts === 'number' && maxContacts > 0 ? maxContacts : undefined,
        businessHoursOnly,
        manualContacts: sourceType === 'manual_list'
          ? parsedManualContacts.map((phone) => ({ phone }))
          : undefined,
        scheduledAt: buildScheduledAt(),
        notifyOnComplete,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  const handleClose = (v: boolean) => {
    if (!v && !createBatch.isPending) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg rounded-[24px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Envio em Lote
          </DialogTitle>
          <DialogDescription>
            Fluxo: <strong>{flowName}</strong>
          </DialogDescription>
        </DialogHeader>

        {/* ── Step 1: Source ──────────────────────────── */}
        {step === 'source' && (
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label>Nome do lote</Label>
              <Input
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                className="rounded-xl"
                placeholder="Ex: Backfill Fevereiro 2026"
              />
            </div>

            <div className="space-y-2">
              <Label>Origem dos contatos</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSourceType('report_backfill')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${
                    sourceType === 'report_backfill'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <FileText className="w-6 h-6" />
                  <span className="text-sm font-medium">Backfill Relatorios</span>
                  <span className="text-[10px] text-muted-foreground text-center">
                    Leads com relatorio pronto que nunca receberam o fluxo
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setSourceType('manual_list')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${
                    sourceType === 'manual_list'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <ListChecks className="w-6 h-6" />
                  <span className="text-sm font-medium">Lista Manual</span>
                  <span className="text-[10px] text-muted-foreground text-center">
                    Cole numeros de telefone manualmente
                  </span>
                </button>
              </div>
            </div>

            {sourceType === 'manual_list' && (
              <div className="space-y-2">
                <Label>Telefones (um por linha)</Label>
                <Textarea
                  value={manualPhones}
                  onChange={(e) => setManualPhones(e.target.value)}
                  placeholder={"+5511999999999\n+5521988888888\n+5531977777777"}
                  className="rounded-xl resize-none font-mono text-sm"
                  rows={5}
                />
                <p className="text-xs text-muted-foreground">
                  {parsedManualContacts.length} telefone(s) detectado(s)
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Config ─────────────────────────── */}
        {step === 'config' && (
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label className="flex items-center">
              Contatos por ciclo (a cada 5 min)
              <InfoTooltip content="O cron roda a cada 5 minutos. Com delay de 30-60s entre contatos, use no máximo 2-3 para evitar bloqueio. 2 × 12 ciclos/hora = ~24 contatos/hora." />
            </Label>
              <Input
                type="number"
                value={contactsPerCycle}
                onChange={(e) => setContactsPerCycle(Math.max(1, Math.min(3, Number(e.target.value))))}
                className="rounded-xl w-24"
                min={1}
                max={3}
              />
              <p className="text-xs text-muted-foreground">
                ~{contactsPerCycle * 12} contatos/hora (com delay de 30-60s entre cada)
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center">
                Limite de contatos
                <InfoTooltip content="Limita o numero total de contatos neste lote. Util para testes graduais: envie primeiro para 30, valide, depois aumente. Deixe vazio para enviar a todos os elegiveis." />
              </Label>
              <Input
                type="number"
                value={maxContacts}
                onChange={(e) => setMaxContacts(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
                className="rounded-xl w-32"
                min={1}
                placeholder="Todos"
              />
              <p className="text-xs text-muted-foreground">
                {typeof maxContacts === 'number' && maxContacts > 0
                  ? `Apenas os primeiros ${maxContacts} contatos serao incluidos`
                  : 'Todos os contatos elegiveis serao incluidos'}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="flex items-center">
                  Somente horario comercial
                  <InfoTooltip content="Processa apenas entre 9h-20h horário de Brasília (BRT = UTC-3). Fora deste horário o cron pula o lote até o próximo dia útil. Recomendado para evitar mensagens em horários inapropriados." />
                </Label>
                <p className="text-xs text-muted-foreground">
                  Processar apenas entre 9h-20h (BRT)
                </p>
              </div>
              <Switch
                checked={businessHoursOnly}
                onCheckedChange={setBusinessHoursOnly}
              />
            </div>

            {/* Scheduling */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Agendar para depois
                  <InfoTooltip content="O lote ficará com status 'Agendado' até a data/hora escolhida. O cron verificará a cada 5 minutos se chegou a hora. Você pode cancelar o lote antes do início em 'Ver Lotes'." />
                </Label>
                <p className="text-xs text-muted-foreground">
                  Iniciar envio em data/hora futura
                </p>
              </div>
              <Switch
                checked={scheduleEnabled}
                onCheckedChange={setScheduleEnabled}
              />
            </div>

            {scheduleEnabled && (
              <div className="flex gap-3 items-end">
                <div className="space-y-1.5 flex-1">
                  <Label className="text-xs">Data</Label>
                  <Input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5 w-28">
                  <Label className="text-xs">Horario (BRT)</Label>
                  <Input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>
            )}

            {scheduleEnabled && scheduleDate && scheduleTime && (
              <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                O lote iniciara em{' '}
                <strong>
                  {new Date(scheduleDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                </strong>{' '}
                as <strong>{scheduleTime}</strong> (horario de Brasilia)
              </p>
            )}

            {/* Webhook notification */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="flex items-center gap-1.5">
                  <Bell className="w-4 h-4" />
                  Notificar ao concluir
                  <InfoTooltip content="Dispara um webhook N8N quando o lote finalizar (sucesso, erro ou pausa automatica). Configure a automacao em /admin/automacoes com o evento 'batch.completed'." />
                </Label>
                <p className="text-xs text-muted-foreground">
                  Webhook N8N com resumo do lote
                </p>
              </div>
              <Switch
                checked={notifyOnComplete}
                onCheckedChange={setNotifyOnComplete}
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-amber-800">
                  <p className="font-medium">Protecoes anti-bloqueio ativas</p>
                  <ul className="text-xs mt-1 space-y-0.5 list-disc pl-4">
                    <li>Delay de 30-60s entre contatos</li>
                    <li>Delay de 3-5s entre mensagens do fluxo</li>
                    <li>Verificacao de opt-out antes de cada envio</li>
                    <li>Pausa automatica se &gt;20% de erros</li>
                    {businessHoursOnly && <li>Apenas em horario comercial (BRT)</li>}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Preview + Confirm ──────────────── */}
        {step === 'preview' && (
          <div className="space-y-4 py-2">
            {preview.isPending ? (
              <div className="flex flex-col items-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">Buscando contatos elegiveis...</p>
              </div>
            ) : (
              <>
                <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                  {effectiveMax && typeof totalEligible === 'number' && totalEligible > effectiveMax && (
                    <div className="flex justify-between text-sm">
                      <span>Contatos elegiveis:</span>
                      <span className="text-muted-foreground font-mono">{totalEligible}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Contatos a enviar:</span>
                    <Badge variant="outline" className="font-mono">
                      {contactCount}{effectiveMax ? ` (limite: ${effectiveMax})` : ''}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Velocidade:</span>
                    <span className="text-muted-foreground">
                      ~{contactsPerCycle * 12}/hora
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tempo estimado:</span>
                    <span className="text-muted-foreground">
                      ~{estimatedHours}h
                      {businessHoursOnly ? ' (horario comercial)' : ''}
                    </span>
                  </div>
                  {scheduleEnabled && scheduleDate && scheduleTime && (
                    <div className="flex justify-between text-sm">
                      <span>Inicio agendado:</span>
                      <span className="text-blue-700 font-medium">
                        {new Date(scheduleDate + 'T12:00:00').toLocaleDateString('pt-BR')} as {scheduleTime} BRT
                      </span>
                    </div>
                  )}
                </div>

                {/* Sample contacts */}
                {previewResult && previewResult.sample.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs">Amostra (primeiros 10):</Label>
                    <div className="max-h-40 overflow-auto rounded-xl border divide-y">
                      {previewResult.sample.map((c, idx) => (
                        <div key={idx} className="px-3 py-1.5 text-xs flex justify-between">
                          <span>{c.name}</span>
                          <span className="font-mono text-muted-foreground">{c.phone}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {typeof contactCount === 'number' && contactCount === 0 && (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    Nenhum contato elegivel encontrado. Todos os leads ja receberam este fluxo ou optaram por sair.
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Footer: navigation ──────────────────────── */}
        <DialogFooter className="flex justify-between">
          <div>
            {step !== 'source' && (
              <Button
                variant="ghost"
                className="rounded-xl gap-1"
                onClick={() => setStep(step === 'preview' ? 'config' : 'source')}
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
              disabled={createBatch.isPending}
            >
              Cancelar
            </Button>

            {step === 'source' && (
              <Button
                className="rounded-xl gap-1"
                onClick={() => setStep('config')}
                disabled={
                  !batchName.trim() ||
                  (sourceType === 'manual_list' && parsedManualContacts.length === 0)
                }
              >
                Proximo
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}

            {step === 'config' && (
              <Button
                className="rounded-xl gap-1"
                onClick={handlePreview}
                disabled={preview.isPending}
              >
                {preview.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Visualizar
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}

            {step === 'preview' && (
              <Button
                className="rounded-xl gap-1"
                onClick={handleCreate}
                disabled={
                  createBatch.isPending ||
                  preview.isPending ||
                  (typeof contactCount === 'number' && contactCount === 0)
                }
              >
                {createBatch.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {scheduleEnabled ? 'Agendar Envio' : 'Confirmar Envio'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
