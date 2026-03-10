import { useState, useEffect } from 'react';
import { Loader2, Search, Play, User, Mail, FileText } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import {
  useSearchLeads,
  useTestEmailAutomation,
  type EmailAutomation,
} from '@/hooks/useAdminEmailCampaigns';

interface Props {
  automation: EmailAutomation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TestAutomationDialog({ automation, open, onOpenChange }: Props) {
  const [query, setQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<{
    id: string;
    name: string;
    email: string;
    access_token: string | null;
  } | null>(null);

  const { data: leads, isLoading: isSearching } = useSearchLeads(query);
  const testMutation = useTestEmailAutomation();

  useEffect(() => {
    if (!open) {
      setQuery('');
      setSelectedLead(null);
    }
  }, [open]);

  const handleTest = () => {
    if (!automation || !selectedLead) return;
    testMutation.mutate(
      { automation, lead: selectedLead },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  if (!automation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Testar: {automation.name}</DialogTitle>
          <DialogDescription>
            Busque um lead com relatorio completo para disparar o teste.
            {automation.is_drip
              ? ' O lead sera matriculado no drip e o primeiro step sera enviado no proximo ciclo (ate 15 min).'
              : ' O email sera enviado imediatamente.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Search */}
          <div className="space-y-2">
            <Label>Buscar lead (nome ou email)</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Digite nome ou email..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedLead(null);
                }}
                className="pl-9"
              />
            </div>
          </div>

          {/* Search Results */}
          {query.length >= 2 && !selectedLead && (
            <div className="border rounded-lg max-h-[200px] overflow-y-auto">
              {isSearching ? (
                <div className="flex items-center justify-center py-6 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Buscando...
                </div>
              ) : !leads?.length ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Nenhum lead encontrado com relatorio completo.
                </div>
              ) : (
                leads.map((lead) => (
                  <button
                    key={lead.id}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left border-b last:border-b-0"
                    onClick={() => {
                      setSelectedLead(lead);
                      setQuery(lead.name);
                    }}
                  >
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{lead.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                    </div>
                    {lead.access_token && (
                      <Badge variant="outline" className="shrink-0 text-[10px] bg-green-50 text-green-700 border-green-200">
                        <FileText className="h-3 w-3 mr-0.5" /> Relatorio
                      </Badge>
                    )}
                  </button>
                ))
              )}
            </div>
          )}

          {/* Selected Lead */}
          {selectedLead && (
            <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{selectedLead.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{selectedLead.email}</span>
              </div>
              {selectedLead.access_token && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-mono">
                    ...{selectedLead.access_token.slice(-12)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Info */}
          <div className="text-xs text-muted-foreground bg-blue-50 rounded-lg p-3 space-y-1">
            <p><strong>Trigger event:</strong> {automation.trigger_event || 'N/A'}</p>
            {automation.is_drip && (
              <p><strong>Steps:</strong> {automation.drip_steps?.map(s => s.template_name).join(' → ')}</p>
            )}
            {!automation.is_drip && automation.template_name && (
              <p><strong>Template:</strong> {automation.template_name}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleTest}
            disabled={!selectedLead || testMutation.isPending}
          >
            {testMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Disparar Teste
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
