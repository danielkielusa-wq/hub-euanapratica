import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Zap, Keyboard, MousePointerClick, X } from 'lucide-react';
import {
  useCreateFlow,
  useUpdateFlow,
  type WhatsAppFlow,
  type FlowFormInput,
} from '@/hooks/useAdminWhatsAppFlows';
import { InfoTooltip } from './InfoTooltip';

const KNOWN_EVENTS = [
  'report.generated',
  'subscription.activated',
  'subscription.cancelled',
  'subscription.payment_failure',
  'booking.created',
  'booking.cancelled',
  'whatsapp.inbound',
];

interface FlowFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flow: WhatsAppFlow | null;
}

export function FlowFormDialog({ open, onOpenChange, flow }: FlowFormDialogProps) {
  const createFlow = useCreateFlow();
  const updateFlow = useUpdateFlow();
  const isEditing = !!flow;
  const isSaving = createFlow.isPending || updateFlow.isPending;

  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState<'event' | 'keyword' | 'manual'>('event');
  const [events, setEvents] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [matchType, setMatchType] = useState<'exact' | 'contains'>('exact');
  const [allowConcurrent, setAllowConcurrent] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(168);

  useEffect(() => {
    if (flow) {
      setName(flow.name);
      setDisplayName(flow.display_name);
      setDescription(flow.description || '');
      setTriggerType(flow.trigger_type);
      setEvents((flow.trigger_config.events as string[]) || []);
      setKeywords((flow.trigger_config.keywords as string[]) || []);
      setMatchType((flow.trigger_config.match_type as 'exact' | 'contains') || 'exact');
      setAllowConcurrent(flow.allow_concurrent);
      setSessionTimeout(flow.session_timeout_hours);
    } else {
      setName('');
      setDisplayName('');
      setDescription('');
      setTriggerType('event');
      setEvents([]);
      setKeywords([]);
      setKeywordInput('');
      setMatchType('exact');
      setAllowConcurrent(false);
      setSessionTimeout(168);
    }
  }, [flow, open]);

  const buildTriggerConfig = (): Record<string, unknown> => {
    if (triggerType === 'event') return { events };
    if (triggerType === 'keyword') return { keywords, match_type: matchType };
    return {};
  };

  const handleSubmit = async () => {
    const input: FlowFormInput = {
      name: name.trim(),
      display_name: displayName.trim(),
      description: description.trim() || undefined,
      trigger_type: triggerType,
      trigger_config: buildTriggerConfig(),
      allow_concurrent: allowConcurrent,
      session_timeout_hours: sessionTimeout,
    };

    if (isEditing) {
      await updateFlow.mutateAsync({ id: flow!.id, ...input });
    } else {
      await createFlow.mutateAsync(input);
    }
    onOpenChange(false);
  };

  const addKeyword = () => {
    const kw = keywordInput.trim().toLowerCase();
    if (kw && !keywords.includes(kw)) {
      setKeywords([...keywords, kw]);
    }
    setKeywordInput('');
  };

  const removeKeyword = (kw: string) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

  const toggleEvent = (event: string) => {
    setEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  const isValid =
    name.trim() &&
    displayName.trim() &&
    (triggerType === 'manual' || (triggerType === 'event' ? events.length > 0 : keywords.length > 0));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-[24px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Fluxo' : 'Novo Fluxo'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Name */}
          <div className="space-y-2">
            <Label>Nome interno</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value.replace(/\s/g, '_').toLowerCase())}
              placeholder="report_ready_drip"
              className="rounded-xl font-mono text-sm"
              disabled={isEditing}
            />
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label>Nome de exibicao</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Relatorio Pronto — Drip"
              className="rounded-xl"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Descricao</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o objetivo deste fluxo..."
              className="rounded-xl resize-none"
              rows={2}
            />
          </div>

          {/* Trigger Type */}
          <div className="space-y-2">
            <Label className="flex items-center">
              Tipo de disparo
              <InfoTooltip content={<><strong>Evento:</strong> disparado automaticamente pelo sistema (ex: relatório gerado, assinatura ativada). <strong>Palavra-chave:</strong> quando o lead envia uma mensagem que corresponde a uma palavra. <strong>Manual:</strong> só o admin pode iniciar via "Disparar Teste".</>} />
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { type: 'event' as const, label: 'Evento', icon: Zap, desc: 'Evento do sistema' },
                { type: 'keyword' as const, label: 'Palavra-chave', icon: Keyboard, desc: 'Mensagem recebida' },
                { type: 'manual' as const, label: 'Manual', icon: MousePointerClick, desc: 'Disparo manual' },
              ]).map(({ type, label, icon: Icon, desc }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTriggerType(type)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-center transition-colors ${
                    triggerType === type
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{label}</span>
                  <span className="text-[10px] text-muted-foreground">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Event Config */}
          {triggerType === 'event' && (
            <div className="space-y-2">
              <Label className="flex items-center">
                Eventos que disparam o fluxo
                <InfoTooltip content={<>Clique para selecionar um ou mais eventos. Quando o evento ocorrer no sistema, este fluxo será iniciado automaticamente para o lead envolvido.</>} />
              </Label>
              <div className="flex flex-wrap gap-2">
                {KNOWN_EVENTS.map((event) => (
                  <Badge
                    key={event}
                    variant={events.includes(event) ? 'default' : 'outline'}
                    className="cursor-pointer rounded-lg"
                    onClick={() => toggleEvent(event)}
                  >
                    {event}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Keyword Config */}
          {triggerType === 'keyword' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Palavras-chave</Label>
                <div className="flex gap-2">
                  <Input
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                    placeholder="Digite e pressione Enter"
                    className="rounded-xl"
                  />
                  <Button type="button" variant="outline" className="rounded-xl" onClick={addKeyword}>
                    Adicionar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {keywords.map((kw) => (
                    <Badge key={kw} variant="secondary" className="gap-1 rounded-lg">
                      "{kw}"
                      <button type="button" onClick={() => removeKeyword(kw)}>
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Label className="text-sm flex items-center">
                  Tipo de match:
                  <InfoTooltip content={<><strong>Exato:</strong> a mensagem do lead precisa ser exatamente a palavra-chave (ex: "sim"). <strong>Contém:</strong> basta a mensagem conter a palavra em qualquer posição (ex: "sim, quero").</>} />
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={matchType === 'exact' ? 'default' : 'outline'}
                    className="rounded-xl"
                    onClick={() => setMatchType('exact')}
                  >
                    Exato
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={matchType === 'contains' ? 'default' : 'outline'}
                    className="rounded-xl"
                    onClick={() => setMatchType('contains')}
                  >
                    Contem
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Options */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="flex items-center">
                Permitir sessoes simultanâeas
                <InfoTooltip content="Se desativado, um lead que já está neste fluxo não receberá uma nova sessão até a atual ser concluída ou expirar. Recomendado: desativado para fluxos de boas-vindas e onboarding." />
              </Label>
              <p className="text-xs text-muted-foreground">
                Contato pode estar no mesmo fluxo mais de uma vez
              </p>
            </div>
            <Switch checked={allowConcurrent} onCheckedChange={setAllowConcurrent} />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center">
              Timeout da sessão (horas)
              <InfoTooltip content="Sessões paradas em 'aguardando resposta' são encerradas automaticamente após este período. 24h = 1 dia, 168h = 7 dias. A sessão é marcada como 'expirada' e o lead pode iniciar um novo fluxo." />
            </Label>
            <Input
              type="number"
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(Number(e.target.value))}
              className="rounded-xl w-32"
              min={1}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button className="rounded-xl" onClick={handleSubmit} disabled={!isValid || isSaving}>
            {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {isEditing ? 'Salvar' : 'Criar Fluxo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
