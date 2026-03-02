import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Play, Search, CheckCircle2, AlertCircle, X, Bell } from 'lucide-react';
import { useTriggerFlowManually } from '@/hooks/useAdminWhatsAppFlows';
import { InfoTooltip } from './InfoTooltip';
import { supabase } from '@/integrations/supabase/client';

interface ManualTriggerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flowId: string;
  flowName: string;
}

interface FoundLead {
  name: string;
  phone: string;
  email: string;
  access_token: string | null;
  source: 'career_evaluation' | 'lead';
}

export function ManualTriggerDialog({ open, onOpenChange, flowId, flowName }: ManualTriggerDialogProps) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [leadName, setLeadName] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundLead, setFoundLead] = useState<FoundLead | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [notifyOnComplete, setNotifyOnComplete] = useState(true);
  const trigger = useTriggerFlowManually();

  const handleEmailSearch = async () => {
    if (!email.trim()) return;
    setSearching(true);
    setFoundLead(null);
    setNotFound(false);

    const trimmedEmail = email.trim();

    // 1. Try career_evaluations first (has report data + access_token for {{reportLink}})
    const { data: evals } = await supabase
      .from('career_evaluations')
      .select('name, phone, email, access_token')
      .eq('email', trimmedEmail)
      .order('created_at', { ascending: false })
      .limit(5);

    if (evals && evals.length > 0) {
      // Pick the first one that has a phone
      const withPhone = evals.find((e) => e.phone);
      const eval_ = withPhone || evals[0];
      const resolvedPhone = eval_.phone || '';
      const resolvedName = eval_.name || '';
      const resolvedEmail = eval_.email || trimmedEmail;
      setFoundLead({ name: resolvedName, phone: resolvedPhone, email: resolvedEmail, access_token: eval_.access_token || null, source: 'career_evaluation' });
      if (resolvedPhone) setPhone(resolvedPhone);
      setLeadName(resolvedName);
      setSearching(false);
      return;
    }

    // 2. Fallback: leads table
    const { data: leads } = await supabase
      .from('leads')
      .select('name, phone, email')
      .eq('email', trimmedEmail)
      .order('created_at', { ascending: false })
      .limit(5);

    if (leads && leads.length > 0) {
      const withPhone = leads.find((l) => l.phone);
      const lead = withPhone || leads[0];
      setFoundLead({ name: lead.name || '', phone: lead.phone || '', email: lead.email || trimmedEmail, access_token: null, source: 'lead' });
      if (lead.phone) setPhone(lead.phone);
      setLeadName(lead.name || '');
    } else {
      setNotFound(true);
    }
    setSearching(false);
  };

  const handleClearLead = () => {
    setFoundLead(null);
    setNotFound(false);
    setEmail('');
    setPhone('');
    setLeadName('');
  };

  const handleTrigger = () => {
    if (!phone.trim()) return;
    trigger.mutate(
      {
        flowId,
        phone: phone.trim(),
        leadName: leadName.trim() || undefined,
        accessToken: foundLead?.access_token || undefined,
        notifyOnComplete,
      },
      {
        onSuccess: () => {
          setEmail('');
          setPhone('');
          setLeadName('');
          setFoundLead(null);
          setNotFound(false);
          onOpenChange(false);
        },
      },
    );
  };

  const handleClose = (v: boolean) => {
    if (!v) {
      setEmail('');
      setPhone('');
      setLeadName('');
      setFoundLead(null);
      setNotFound(false);
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-[24px] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Disparar fluxo manualmente</DialogTitle>
          <DialogDescription>
            Enviar o fluxo <strong>{flowName}</strong> para um contato especifico.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Email lookup */}
          <div className="space-y-2">
            <Label>Buscar lead por email (opcional)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="email@exemplo.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (foundLead || notFound) handleClearLead();
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleEmailSearch(); }}
                className="rounded-xl"
                disabled={!!foundLead}
              />
              {foundLead ? (
                <Button variant="ghost" size="icon" className="shrink-0" onClick={handleClearLead}>
                  <X className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 rounded-xl"
                  onClick={handleEmailSearch}
                  disabled={!email.trim() || searching}
                >
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              )}
            </div>

            {/* Found lead card */}
            {foundLead && (
              <div className={`flex items-start gap-2 rounded-xl p-3 text-sm ${
                foundLead.phone
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-amber-50 border border-amber-200'
              }`}>
                {foundLead.phone ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                )}
                <div>
                  <p className={`font-medium ${foundLead.phone ? 'text-green-800' : 'text-amber-800'}`}>
                    {foundLead.name || '(sem nome)'}
                  </p>
                  <p className={`text-xs ${foundLead.phone ? 'text-green-700' : 'text-amber-700'}`}>
                    {foundLead.email}
                  </p>
                  {foundLead.phone ? (
                    <p className="text-xs text-green-700 font-mono">{foundLead.phone}</p>
                  ) : (
                    <p className="text-xs text-amber-700 mt-1">Lead encontrado mas sem telefone. Preencha abaixo.</p>
                  )}
                  <p className={`text-[10px] mt-0.5 ${foundLead.phone ? 'text-green-600' : 'text-amber-600'}`}>
                    {foundLead.source === 'career_evaluation' ? 'Avaliação de carreira' : 'Lead'}
                  </p>
                </div>
              </div>
            )}

            {/* Not found */}
            {notFound && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Nenhum lead encontrado para este email.
              </div>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="trigger-phone">Telefone</Label>
            <Input
              id="trigger-phone"
              placeholder="+5511999999999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded-xl"
            />
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>Sempre use o prefixo <code className="bg-muted px-1 rounded">+</code> com o codigo do pais:</p>
              <p>Brasil: <code className="bg-muted px-1 rounded">+5511999999999</code></p>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="trigger-name">Nome do contato (opcional)</Label>
            <Input
              id="trigger-name"
              placeholder="Joao Silva"
              value={leadName}
              onChange={(e) => setLeadName(e.target.value)}
              className="rounded-xl"
            />
          </div>

          {/* Webhook notification */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="flex items-center gap-1.5">
                <Bell className="w-4 h-4" />
                Notificar ao concluir
                <InfoTooltip content="Dispara webhook N8N quando o fluxo finalizar (sucesso ou erro). Configure a automacao com o evento 'flow_session.completed'." />
              </Label>
              <p className="text-xs text-muted-foreground">
                Webhook com resultado da execucao
              </p>
            </div>
            <Switch
              checked={notifyOnComplete}
              onCheckedChange={setNotifyOnComplete}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-xl" onClick={() => handleClose(false)}>
            Cancelar
          </Button>
          <Button
            className="rounded-xl gap-2"
            onClick={handleTrigger}
            disabled={!phone.trim() || trigger.isPending}
          >
            {trigger.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Disparar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
