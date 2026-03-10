import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  useCreateCampaign,
  useLaunchCampaign,
  usePreviewAudience,
  useEmailTemplatesList,
} from '@/hooks/useAdminEmailCampaigns';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 1 | 2 | 3 | 4;

export function CampaignWizardDialog({ open, onOpenChange }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [audienceType, setAudienceType] = useState('all_leads_with_report');
  const [manualEmails, setManualEmails] = useState('');
  const [filterTemp, setFilterTemp] = useState<string[]>([]);
  const [contactsPerCycle, setContactsPerCycle] = useState(10);
  const [scheduledAt, setScheduledAt] = useState('');

  const { data: templates = [] } = useEmailTemplatesList();
  const createCampaign = useCreateCampaign();
  const launchCampaign = useLaunchCampaign();
  const previewAudience = usePreviewAudience();

  const buildFilters = () => {
    if (audienceType === 'manual_list') {
      return {
        emails: manualEmails
          .split(/[\n,;]+/)
          .map((e) => e.trim())
          .filter(Boolean),
      };
    }
    if (audienceType === 'filter') {
      return { lead_temperature: filterTemp };
    }
    return {};
  };

  const handlePreview = () => {
    previewAudience.mutate({
      audience_type: audienceType,
      audience_filters: buildFilters(),
    });
    setStep(3);
  };

  const handleLaunch = async () => {
    try {
      const campaign = await createCampaign.mutateAsync({
        name,
        description: description || undefined,
        template_name: templateName,
        audience_type: audienceType,
        audience_filters: buildFilters(),
        contacts_per_cycle: contactsPerCycle,
        scheduled_at: scheduledAt || null,
      });

      await launchCampaign.mutateAsync(campaign.id);
      resetAndClose();
    } catch {
      // toast handled by hooks
    }
  };

  const resetAndClose = () => {
    setStep(1);
    setName('');
    setDescription('');
    setTemplateName('');
    setAudienceType('all_leads_with_report');
    setManualEmails('');
    setFilterTemp([]);
    setContactsPerCycle(10);
    setScheduledAt('');
    onOpenChange(false);
  };

  const isStep1Valid = name.trim() && templateName;
  const isStep2Valid = audienceType && (
    audienceType !== 'manual_list' || manualEmails.trim()
  ) && (
    audienceType !== 'filter' || filterTemp.length > 0
  );

  const isLaunching = createCampaign.isPending || launchCampaign.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => v ? null : resetAndClose()}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>
            Nova Campanha — Passo {step}/4
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Name + Template */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Nome da campanha</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Black Friday 2026"
              />
            </div>
            <div>
              <Label>Descricao (opcional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve descricao da campanha"
                rows={2}
              />
            </div>
            <div>
              <Label>Template de email</Label>
              <Select value={templateName} onValueChange={setTemplateName}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.name} value={t.name}>
                      {t.display_name} ({t.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 2: Audience */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label>Tipo de audiencia</Label>
              <Select value={audienceType} onValueChange={setAudienceType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_leads_with_report">Todos os leads com relatorio</SelectItem>
                  <SelectItem value="all_active_subscribers">Todos os assinantes ativos</SelectItem>
                  <SelectItem value="filter">Filtrar por criterios</SelectItem>
                  <SelectItem value="manual_list">Lista manual de emails</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {audienceType === 'manual_list' && (
              <div>
                <Label>Emails (um por linha ou separados por virgula)</Label>
                <Textarea
                  value={manualEmails}
                  onChange={(e) => setManualEmails(e.target.value)}
                  placeholder="email1@example.com&#10;email2@example.com"
                  rows={5}
                />
              </div>
            )}

            {audienceType === 'filter' && (
              <div>
                <Label>Temperatura do lead</Label>
                <div className="flex gap-2 mt-1">
                  {['frio', 'morno', 'quente', 'muito-quente'].map((t) => (
                    <Button
                      key={t}
                      variant={filterTemp.includes(t) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() =>
                        setFilterTemp((prev) =>
                          prev.includes(t)
                            ? prev.filter((x) => x !== t)
                            : [...prev, t]
                        )
                      }
                    >
                      {t}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label>Emails por ciclo (a cada 5 min)</Label>
              <Input
                type="number"
                value={contactsPerCycle}
                onChange={(e) => setContactsPerCycle(Number(e.target.value) || 10)}
                min={1}
                max={50}
              />
              <p className="text-xs text-muted-foreground mt-1">
                ~{contactsPerCycle * 12} emails/hora
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 3 && (
          <div className="space-y-4">
            {previewAudience.isPending ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Carregando preview...</span>
              </div>
            ) : previewAudience.data ? (
              <>
                <div className="bg-muted rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold">{previewAudience.data.total}</p>
                  <p className="text-sm text-muted-foreground">contatos encontrados</p>
                </div>
                {previewAudience.data.sample.length > 0 && (
                  <div>
                    <Label>Amostra (max 10):</Label>
                    <div className="mt-1 space-y-1">
                      {previewAudience.data.sample.map((s, i) => (
                        <div key={i} className="text-sm text-muted-foreground">
                          {s.name ? `${s.name} — ` : ''}{s.email}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhum contato encontrado para esta audiencia
              </p>
            )}
          </div>
        )}

        {/* Step 4: Schedule + Confirm */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="bg-muted rounded-xl p-4 space-y-2">
              <p><strong>Campanha:</strong> {name}</p>
              <p><strong>Template:</strong> {templateName}</p>
              <p><strong>Audiencia:</strong> {audienceType} ({previewAudience.data?.total || '?'} contatos)</p>
              <p><strong>Velocidade:</strong> {contactsPerCycle} emails/ciclo (~{contactsPerCycle * 12}/hora)</p>
            </div>
            <div>
              <Label>Agendar para (opcional — vazio = enviar agora)</Label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep((s) => (s - 1) as Step)}>
              Voltar
            </Button>
          )}
          {step === 1 && (
            <Button onClick={() => setStep(2)} disabled={!isStep1Valid}>
              Proximo
            </Button>
          )}
          {step === 2 && (
            <Button onClick={handlePreview} disabled={!isStep2Valid}>
              Preview
            </Button>
          )}
          {step === 3 && (
            <Button
              onClick={() => setStep(4)}
              disabled={!previewAudience.data?.total}
            >
              Proximo
            </Button>
          )}
          {step === 4 && (
            <Button onClick={handleLaunch} disabled={isLaunching}>
              {isLaunching && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {scheduledAt ? 'Agendar Campanha' : 'Enviar Agora'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
