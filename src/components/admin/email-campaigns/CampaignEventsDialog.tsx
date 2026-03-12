import { useState } from 'react';
import {
  MailOpen, MousePointerClick, AlertTriangle, ShieldAlert, CheckCircle2,
  Loader2, ExternalLink,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  useCampaignEvents,
  computeEventStats,
  type EmailCampaign,
  type EmailCampaignEvent,
} from '@/hooks/useAdminEmailCampaigns';

interface Props {
  campaign: EmailCampaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EVENT_ICONS: Record<string, typeof MailOpen> = {
  open: MailOpen,
  click: MousePointerClick,
  bounce: AlertTriangle,
  complaint: ShieldAlert,
  delivered: CheckCircle2,
};

const EVENT_COLORS: Record<string, string> = {
  open: 'text-blue-600 bg-blue-50',
  click: 'text-green-600 bg-green-50',
  bounce: 'text-red-600 bg-red-50',
  complaint: 'text-orange-600 bg-orange-50',
  delivered: 'text-emerald-600 bg-emerald-50',
};

const EVENT_LABELS: Record<string, string> = {
  open: 'Abertura',
  click: 'Clique',
  bounce: 'Bounce',
  complaint: 'Spam',
  delivered: 'Entregue',
};

export function CampaignEventsDialog({ campaign, open, onOpenChange }: Props) {
  const [tab, setTab] = useState('resumo');
  const { data: events = [], isLoading } = useCampaignEvents(open ? campaign?.id ?? null : null);
  const stats = campaign ? computeEventStats(events, campaign.contacts_sent) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Metricas — {campaign?.name}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs value={tab} onValueChange={setTab} className="flex-1 min-h-0 flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="resumo">Resumo</TabsTrigger>
              <TabsTrigger value="eventos">Eventos ({events.length})</TabsTrigger>
              <TabsTrigger value="links">Links Clicados</TabsTrigger>
            </TabsList>

            {/* ── RESUMO ── */}
            <TabsContent value="resumo" className="space-y-4 mt-4">
              {stats && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <MetricCard
                      icon={CheckCircle2}
                      label="Entregues"
                      value={stats.delivered}
                      color="text-emerald-600"
                    />
                    <MetricCard
                      icon={MailOpen}
                      label="Aberturas unicas"
                      value={stats.uniqueOpens}
                      sub={`${stats.openRate.toFixed(1)}% de ${campaign?.contacts_sent}`}
                      color="text-blue-600"
                    />
                    <MetricCard
                      icon={MousePointerClick}
                      label="Cliques unicos"
                      value={stats.uniqueClicks}
                      sub={`${stats.clickRate.toFixed(1)}% de ${campaign?.contacts_sent}`}
                      color="text-green-600"
                    />
                    <MetricCard
                      icon={AlertTriangle}
                      label="Bounces"
                      value={stats.bounces}
                      sub={stats.bounces > 0 ? `${stats.bounceRate.toFixed(1)}%` : undefined}
                      color="text-red-600"
                    />
                  </div>

                  {stats.complaints > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-orange-600 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-orange-800">
                          {stats.complaints} reclamacao(oes) de spam
                        </p>
                        <p className="text-xs text-orange-600">
                          Revise o conteudo e a audiencia para evitar problemas de entregabilidade.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Detalhes</p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                      <span className="text-muted-foreground">Total enviados</span>
                      <span className="font-medium">{campaign?.contacts_sent}</span>
                      <span className="text-muted-foreground">Aberturas totais</span>
                      <span className="font-medium">{stats.opens}</span>
                      <span className="text-muted-foreground">Cliques totais</span>
                      <span className="font-medium">{stats.clicks}</span>
                    </div>
                  </div>

                  {events.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      Nenhum evento registrado ainda. Os eventos aparecem conforme os destinatarios interagem com o email.
                    </p>
                  )}
                </>
              )}
            </TabsContent>

            {/* ── EVENTOS ── */}
            <TabsContent value="eventos" className="mt-4 flex-1 min-h-0 overflow-auto">
              <EventsTable events={events} />
            </TabsContent>

            {/* ── LINKS ── */}
            <TabsContent value="links" className="mt-4 flex-1 min-h-0 overflow-auto">
              <ClickedLinksTable events={events} />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Sub-components ─────────────────────────────────────────────────

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: typeof MailOpen;
  label: string;
  value: number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-background border rounded-lg p-3 text-center">
      <Icon className={`h-5 w-5 mx-auto mb-1 ${color}`} />
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function EventsTable({ events }: { events: EmailCampaignEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-8">
        Nenhum evento registrado
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Tipo</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Detalhes</TableHead>
          <TableHead className="w-[150px]">Data</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.map((event) => {
          const Icon = EVENT_ICONS[event.event_type] || MailOpen;
          const colorClass = EVENT_COLORS[event.event_type] || '';
          return (
            <TableRow key={event.id}>
              <TableCell>
                <Badge variant="outline" className={`${colorClass} border-0 gap-1`}>
                  <Icon className="h-3 w-3" />
                  {EVENT_LABELS[event.event_type] || event.event_type}
                </Badge>
              </TableCell>
              <TableCell className="text-sm font-mono truncate max-w-[180px]" title={event.email}>
                {event.email}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {event.link_url && (
                  <span className="truncate block max-w-[180px]" title={event.link_url}>
                    {event.link_url}
                  </span>
                )}
                {event.metadata && (event.metadata as any).bounce_type && (
                  <span className="text-red-600">
                    {(event.metadata as any).bounce_type}: {(event.metadata as any).bounce_message?.slice(0, 80)}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                {new Date(event.created_at).toLocaleString('pt-BR')}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function ClickedLinksTable({ events }: { events: EmailCampaignEvent[] }) {
  const clickEvents = events.filter(e => e.event_type === 'click' && e.link_url);

  // Group by URL
  const linkMap = new Map<string, { count: number; uniqueEmails: Set<string>; lastClick: string }>();
  for (const ev of clickEvents) {
    const url = ev.link_url!;
    const existing = linkMap.get(url);
    if (existing) {
      existing.count++;
      existing.uniqueEmails.add(ev.email);
      if (ev.created_at > existing.lastClick) existing.lastClick = ev.created_at;
    } else {
      linkMap.set(url, { count: 1, uniqueEmails: new Set([ev.email]), lastClick: ev.created_at });
    }
  }

  const links = Array.from(linkMap.entries())
    .map(([url, data]) => ({ url, ...data }))
    .sort((a, b) => b.count - a.count);

  if (links.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-8">
        Nenhum clique registrado
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>URL</TableHead>
          <TableHead className="w-[80px] text-center">Cliques</TableHead>
          <TableHead className="w-[80px] text-center">Unicos</TableHead>
          <TableHead className="w-[130px]">Ultimo clique</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {links.map((link) => (
          <TableRow key={link.url}>
            <TableCell>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline truncate block max-w-[320px] inline-flex items-center gap-1"
                title={link.url}
              >
                {link.url.replace(/^https?:\/\//, '').slice(0, 50)}
                {link.url.length > 50 ? '...' : ''}
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </TableCell>
            <TableCell className="text-center font-medium">{link.count}</TableCell>
            <TableCell className="text-center">{link.uniqueEmails.size}</TableCell>
            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
              {new Date(link.lastClick).toLocaleString('pt-BR')}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
