import { Loader2, CheckCircle2, XCircle, Clock, Ban } from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useCampaignContacts, type EmailCampaign } from '@/hooks/useAdminEmailCampaigns';

interface Props {
  campaign: EmailCampaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  queued: { label: 'Na fila', color: 'bg-gray-50 text-gray-700 border-gray-200', icon: Clock },
  processing: { label: 'Enviando', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Loader2 },
  sent: { label: 'Enviado', color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 },
  failed: { label: 'Falhou', color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
  skipped: { label: 'Pulado', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Ban },
};

export function CampaignContactsSheet({ campaign, open, onOpenChange }: Props) {
  const { data: contacts = [], isLoading } = useCampaignContacts(campaign?.id || null);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[640px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Contatos — {campaign?.name}</SheetTitle>
        </SheetHeader>

        {campaign && (
          <div className="grid grid-cols-4 gap-2 mt-4 mb-4">
            <div className="bg-muted rounded-lg p-3 text-center">
              <p className="text-lg font-bold">{campaign.contacts_sent}</p>
              <p className="text-xs text-muted-foreground">Enviados</p>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <p className="text-lg font-bold">{campaign.contacts_failed}</p>
              <p className="text-xs text-muted-foreground">Falharam</p>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <p className="text-lg font-bold">{campaign.contacts_skipped}</p>
              <p className="text-xs text-muted-foreground">Pulados</p>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <p className="text-lg font-bold">{campaign.contacts_queued}</p>
              <p className="text-xs text-muted-foreground">Na fila</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Detalhe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((c) => {
                const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.queued;
                return (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm font-mono">{c.email}</TableCell>
                    <TableCell className="text-sm">{c.recipient_name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cfg.color}>
                        {cfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                      {c.error_message || c.skip_reason || (c.processed_at ? new Date(c.processed_at).toLocaleString('pt-BR') : '-')}
                    </TableCell>
                  </TableRow>
                );
              })}
              {contacts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Nenhum contato
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </SheetContent>
    </Sheet>
  );
}
