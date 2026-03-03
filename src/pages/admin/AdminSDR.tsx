import { useState, useCallback, useRef } from 'react';
import {
  Loader2, Users, Target, Send, BarChart3, Plus, Upload,
  Sparkles, Play, Pause, Trash2, Eye, Mail, MessageCircle,
  Linkedin, Filter, RefreshCw,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import {
  useSDRStats,
  useSDRProspects,
  useSDRCampaigns,
  useSDRTemplates,
  useCreateProspect,
  useImportProspectsCSV,
  useQualifyProspects,
  useDeleteProspect,
  useCreateCampaign,
  useUpdateCampaign,
  useStartSequence,
  useGenerateMessage,
  useSendOutreach,
  useSDROutreachLogs,
  type SDRProspect,
  type SDRCampaign,
} from '@/hooks/useAdminSDR';

// ── Helpers ──────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  new: 'Novo',
  qualifying: 'Qualificando...',
  qualified: 'Qualificado',
  in_sequence: 'Em Sequência',
  replied: 'Respondeu',
  converted: 'Convertido',
  opted_out: 'Opt-out',
  bounced: 'Bounced',
  disqualified: 'Descartado',
};

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-slate-100 text-slate-700',
  qualifying: 'bg-yellow-100 text-yellow-700',
  qualified: 'bg-blue-100 text-blue-700',
  in_sequence: 'bg-purple-100 text-purple-700',
  replied: 'bg-green-100 text-green-700',
  converted: 'bg-emerald-100 text-emerald-700',
  opted_out: 'bg-red-100 text-red-700',
  bounced: 'bg-orange-100 text-orange-700',
  disqualified: 'bg-gray-100 text-gray-700',
};

const TEMP_COLORS: Record<string, string> = {
  'muito-quente': 'bg-red-100 text-red-700',
  quente: 'bg-orange-100 text-orange-700',
  morno: 'bg-yellow-100 text-yellow-700',
  frio: 'bg-blue-100 text-blue-700',
};

const CHANNEL_ICONS: Record<string, typeof Mail> = {
  email: Mail,
  whatsapp: MessageCircle,
  linkedin: Linkedin,
};

// ── Main Component ───────────────────────────────────────────────

export default function AdminSDR() {
  const [activeTab, setActiveTab] = useState('prospects');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProspects, setSelectedProspects] = useState<Set<string>>(new Set());
  const [showCreateProspect, setShowCreateProspect] = useState(false);
  const [showImportCSV, setShowImportCSV] = useState(false);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showProspectDetail, setShowProspectDetail] = useState<SDRProspect | null>(null);
  const [showPreviewMessage, setShowPreviewMessage] = useState<{
    prospectId: string;
    templateKey: string;
    campaignId?: string;
  } | null>(null);

  const stats = useSDRStats();
  const prospects = useSDRProspects(statusFilter);
  const campaigns = useSDRCampaigns();
  const templates = useSDRTemplates();
  const qualifyMutation = useQualifyProspects();
  const startSequenceMutation = useStartSequence();

  const statCards = [
    { label: 'Total Prospects', value: stats.data?.total_prospects || 0, icon: Users, color: 'text-blue-600' },
    { label: 'Campanhas Ativas', value: stats.data?.active_campaigns || 0, icon: Target, color: 'text-purple-600' },
    { label: 'Enviados', value: stats.data?.total_sent || 0, icon: Send, color: 'text-amber-600' },
    { label: 'Responderam', value: stats.data?.total_replied || 0, icon: BarChart3, color: 'text-green-600' },
    { label: 'Convertidos', value: stats.data?.total_converted || 0, icon: Sparkles, color: 'text-emerald-600' },
  ];

  const handleQualifySelected = () => {
    if (selectedProspects.size === 0) return;
    qualifyMutation.mutate(Array.from(selectedProspects));
    setSelectedProspects(new Set());
  };

  const handleStartSequence = (campaignId: string) => {
    startSequenceMutation.mutate({ campaignId });
  };

  const toggleSelectAll = () => {
    if (!prospects.data) return;
    if (selectedProspects.size === prospects.data.length) {
      setSelectedProspects(new Set());
    } else {
      setSelectedProspects(new Set(prospects.data.map((p) => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedProspects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">AI SDR Agent</h1>
            <p className="text-muted-foreground text-sm">Prospecção automatizada com IA</p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {statCards.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
                <p className="text-2xl font-bold">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="prospects">Prospects</TabsTrigger>
            <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          {/* ── Prospects Tab ───────────────────────────── */}
          <TabsContent value="prospects" className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="w-3.5 h-3.5 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button size="sm" onClick={() => setShowCreateProspect(true)}>
                <Plus className="w-4 h-4 mr-1" /> Novo Prospect
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowImportCSV(true)}>
                <Upload className="w-4 h-4 mr-1" /> Importar CSV
              </Button>

              {selectedProspects.size > 0 && (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleQualifySelected}
                    disabled={qualifyMutation.isPending}
                  >
                    {qualifyMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
                    Qualificar ({selectedProspects.size})
                  </Button>
                </>
              )}

              <Button size="sm" variant="ghost" onClick={() => prospects.refetch()}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            {prospects.isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">
                        <input
                          type="checkbox"
                          checked={!!prospects.data?.length && selectedProspects.size === prospects.data.length}
                          onChange={toggleSelectAll}
                          className="rounded"
                        />
                      </TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Temp.</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(prospects.data || []).map((p) => (
                      <TableRow key={p.id} className="cursor-pointer" onClick={() => setShowProspectDetail(p)}>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedProspects.has(p.id)}
                            onChange={() => toggleSelect(p.id)}
                            className="rounded"
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">{p.name}</div>
                            <div className="text-xs text-muted-foreground">{p.email || p.phone || '—'}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{p.headline || '—'}</TableCell>
                        <TableCell>
                          {p.ai_score != null ? (
                            <span className="font-bold text-sm">{p.ai_score}</span>
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          {p.ai_temperature ? (
                            <Badge variant="outline" className={TEMP_COLORS[p.ai_temperature] || ''}>
                              {p.ai_temperature}
                            </Badge>
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={STATUS_COLORS[p.outreach_status] || ''}>
                            {STATUS_LABELS[p.outreach_status] || p.outreach_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{p.source}</TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setShowProspectDetail(p); }}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!prospects.data?.length && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Nenhum prospect encontrado. Importe via CSV ou crie manualmente.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          {/* ── Campaigns Tab ───────────────────────────── */}
          <TabsContent value="campaigns" className="space-y-4">
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setShowCreateCampaign(true)}>
                <Plus className="w-4 h-4 mr-1" /> Nova Campanha
              </Button>
            </div>

            <div className="grid gap-4">
              {campaigns.isLoading && <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>}
              {(campaigns.data || []).map((c) => (
                <CampaignCard
                  key={c.id}
                  campaign={c}
                  onStart={() => handleStartSequence(c.id)}
                  isStarting={startSequenceMutation.isPending}
                />
              ))}
              {!campaigns.isLoading && !campaigns.data?.length && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Nenhuma campanha criada ainda.
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ── Templates Tab ───────────────────────────── */}
          <TabsContent value="templates" className="space-y-4">
            <div className="grid gap-4">
              {templates.isLoading && <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>}
              {(templates.data || []).map((t) => {
                const ChannelIcon = CHANNEL_ICONS[t.channel] || Mail;
                return (
                  <Card key={t.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <ChannelIcon className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">{t.template_key}</div>
                            <div className="text-xs text-muted-foreground">{t.channel} | Variante {t.variant}</div>
                          </div>
                        </div>
                        <Badge variant={t.is_active ? 'default' : 'secondary'}>
                          {t.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      {t.subject_template && (
                        <div className="mt-3 text-xs text-muted-foreground">
                          <strong>Assunto:</strong> {t.subject_template}
                        </div>
                      )}
                      <div className="mt-2 text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                        {t.body_template}
                      </div>
                      {t.ai_instructions && (
                        <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded text-xs text-amber-700 dark:text-amber-400">
                          <strong>AI:</strong> {t.ai_instructions}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Dialogs & Sheets ───────────────────────────── */}

      <CreateProspectDialog open={showCreateProspect} onClose={() => setShowCreateProspect(false)} />
      <ImportCSVDialog open={showImportCSV} onClose={() => setShowImportCSV(false)} />
      <CreateCampaignDialog
        open={showCreateCampaign}
        onClose={() => setShowCreateCampaign(false)}
        templates={templates.data || []}
      />
      {showProspectDetail && (
        <ProspectDetailSheet
          prospect={showProspectDetail}
          onClose={() => setShowProspectDetail(null)}
          templates={templates.data || []}
        />
      )}
    </DashboardLayout>
  );
}

// ── Campaign Card ────────────────────────────────────────────────

function CampaignCard({ campaign, onStart, isStarting }: {
  campaign: SDRCampaign;
  onStart: () => void;
  isStarting: boolean;
}) {
  const updateCampaign = useUpdateCampaign();
  const statusColor = {
    draft: 'bg-slate-100 text-slate-700',
    active: 'bg-green-100 text-green-700',
    paused: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-blue-100 text-blue-700',
  }[campaign.status] || '';

  const replyRate = campaign.total_sent > 0
    ? ((campaign.total_replied / campaign.total_sent) * 100).toFixed(1)
    : '0';

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{campaign.name}</h3>
              <Badge variant="outline" className={statusColor}>{campaign.status}</Badge>
            </div>
            {campaign.description && <p className="text-sm text-muted-foreground mt-1">{campaign.description}</p>}
          </div>
          <div className="flex gap-2">
            {campaign.status === 'draft' && (
              <Button size="sm" onClick={onStart} disabled={isStarting}>
                {isStarting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 mr-1" />}
                Iniciar
              </Button>
            )}
            {campaign.status === 'active' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateCampaign.mutate({ id: campaign.id, status: 'paused' })}
              >
                <Pause className="w-4 h-4 mr-1" /> Pausar
              </Button>
            )}
            {campaign.status === 'paused' && (
              <Button
                size="sm"
                onClick={() => updateCampaign.mutate({ id: campaign.id, status: 'active' })}
              >
                <Play className="w-4 h-4 mr-1" /> Retomar
              </Button>
            )}
          </div>
        </div>

        {/* Sequence steps */}
        <div className="flex flex-wrap gap-2 mt-3">
          {(campaign.sequence || []).map((step, i) => {
            const Icon = CHANNEL_ICONS[step.channel] || Mail;
            return (
              <div key={i} className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-md">
                <Icon className="w-3 h-3" />
                <span>{step.template_key}</span>
                {step.delay_hours > 0 && <span className="text-muted-foreground">({step.delay_hours}h)</span>}
              </div>
            );
          })}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mt-3 pt-3 border-t">
          <div className="text-center">
            <div className="text-lg font-bold">{campaign.total_prospects}</div>
            <div className="text-[10px] text-muted-foreground uppercase">Prospects</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">{campaign.total_sent}</div>
            <div className="text-[10px] text-muted-foreground uppercase">Enviados</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">{campaign.total_replied}</div>
            <div className="text-[10px] text-muted-foreground uppercase">Respostas</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">{replyRate}%</div>
            <div className="text-[10px] text-muted-foreground uppercase">Reply Rate</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Create Prospect Dialog ───────────────────────────────────────

function CreateProspectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createProspect = useCreateProspect();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', linkedin_url: '',
    headline: '', company: '', location: '', bio: '',
  });

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    createProspect.mutate(form, {
      onSuccess: () => {
        onClose();
        setForm({ name: '', email: '', phone: '', linkedin_url: '', headline: '', company: '', location: '', bio: '' });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Prospect</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>LinkedIn URL</Label><Input value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Cargo</Label><Input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} /></div>
            <div><Label>Empresa</Label><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
          </div>
          <div><Label>Localidade</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
          <div><Label>Bio / Resumo</Label><Textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={createProspect.isPending || !form.name.trim()}>
            {createProspect.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Import CSV Dialog ────────────────────────────────────────────

function ImportCSVDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const importCSV = useImportProspectsCSV();
  const [csvText, setCsvText] = useState('');
  const [preview, setPreview] = useState<Array<Record<string, string>>>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const parseCSV = useCallback((text: string) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return;
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
    const rows = lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = values[i] || ''; });
      return obj;
    }).filter((r) => r.name || r.nome);
    setPreview(rows.slice(0, 5));
    setCsvText(text);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => parseCSV(reader.result as string);
    reader.readAsText(file);
  };

  const handleImport = () => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
    const prospects = lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = values[i] || ''; });
      return {
        name: obj.name || obj.nome || '',
        email: obj.email || null,
        phone: obj.phone || obj.telefone || null,
        linkedin_url: obj.linkedin_url || obj.linkedin || null,
        headline: obj.headline || obj.cargo || null,
        company: obj.company || obj.empresa || null,
        location: obj.location || obj.local || null,
        bio: obj.bio || obj.resumo || null,
        source: 'csv' as const,
      };
    }).filter((p) => p.name);

    importCSV.mutate(prospects as Array<Partial<SDRProspect>>, {
      onSuccess: () => {
        onClose();
        setCsvText('');
        setPreview([]);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Prospects via CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Upload CSV</Label>
            <Input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFileUpload} className="mt-1" />
            <p className="text-xs text-muted-foreground mt-1">
              Colunas esperadas: name, email, phone, linkedin_url, headline, company, location, bio
            </p>
          </div>

          <div>
            <Label>Ou cole o CSV diretamente</Label>
            <Textarea
              rows={6}
              value={csvText}
              onChange={(e) => parseCSV(e.target.value)}
              placeholder={'name,email,headline,company,location\nJoão Silva,joao@email.com,Software Engineer,Nubank,São Paulo'}
              className="mt-1 font-mono text-xs"
            />
          </div>

          {preview.length > 0 && (
            <div>
              <Label>Preview ({preview.length} de {csvText.trim().split('\n').length - 1} linhas)</Label>
              <div className="overflow-x-auto mt-1 border rounded">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(preview[0]).map((k) => <TableHead key={k} className="text-xs">{k}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((row, i) => (
                      <TableRow key={i}>
                        {Object.values(row).map((v, j) => <TableCell key={j} className="text-xs">{v}</TableCell>)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleImport} disabled={importCSV.isPending || !csvText.trim()}>
            {importCSV.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            Importar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Create Campaign Dialog ───────────────────────────────────────

function CreateCampaignDialog({ open, onClose, templates }: {
  open: boolean;
  onClose: () => void;
  templates: Array<{ template_key: string; channel: string }>;
}) {
  const createCampaign = useCreateCampaign();
  const [form, setForm] = useState({
    name: '',
    description: '',
    ai_persona: 'professional',
    ai_context: '',
  });
  const [sequence, setSequence] = useState<Array<{ step: number; channel: string; delay_hours: number; template_key: string }>>([
    { step: 1, channel: 'email', delay_hours: 0, template_key: 'sdr_intro_email' },
    { step: 2, channel: 'email', delay_hours: 72, template_key: 'sdr_followup_email' },
    { step: 3, channel: 'whatsapp', delay_hours: 120, template_key: 'sdr_whatsapp_value' },
    { step: 4, channel: 'email', delay_hours: 168, template_key: 'sdr_final_email' },
  ]);

  const updateStep = (i: number, field: string, value: string | number) => {
    setSequence((prev) => prev.map((s, j) => j === i ? { ...s, [field]: value } : s));
  };

  const addStep = () => {
    setSequence((prev) => [...prev, { step: prev.length + 1, channel: 'email', delay_hours: 48, template_key: '' }]);
  };

  const removeStep = (i: number) => {
    setSequence((prev) => prev.filter((_, j) => j !== i).map((s, j) => ({ ...s, step: j + 1 })));
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    createCampaign.mutate(
      { ...form, sequence } as Partial<SDRCampaign>,
      {
        onSuccess: () => {
          onClose();
          setForm({ name: '', description: '', ai_persona: 'professional', ai_context: '' });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Campanha de Outreach</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div>
              <Label>Persona AI</Label>
              <Select value={form.ai_persona} onValueChange={(v) => setForm({ ...form, ai_persona: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Profissional</SelectItem>
                  <SelectItem value="friendly">Amigável</SelectItem>
                  <SelectItem value="consultative">Consultivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Descrição</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div><Label>Contexto AI (opcional)</Label><Textarea rows={2} value={form.ai_context} onChange={(e) => setForm({ ...form, ai_context: e.target.value })} placeholder="Contexto extra para a IA ao gerar mensagens desta campanha..." /></div>

          {/* Sequence Builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Sequência de Outreach</Label>
              <Button size="sm" variant="outline" onClick={addStep}><Plus className="w-3 h-3 mr-1" /> Passo</Button>
            </div>
            <div className="space-y-2">
              {sequence.map((step, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                  <span className="text-xs font-bold text-muted-foreground w-6">{step.step}</span>
                  <Select value={step.channel} onValueChange={(v) => updateStep(i, 'channel', v)}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={step.template_key} onValueChange={(v) => updateStep(i, 'template_key', v)}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Template" /></SelectTrigger>
                    <SelectContent>
                      {templates.map((t) => (
                        <SelectItem key={t.template_key} value={t.template_key}>
                          {t.template_key} ({t.channel})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      className="w-16"
                      value={step.delay_hours}
                      onChange={(e) => updateStep(i, 'delay_hours', parseInt(e.target.value) || 0)}
                    />
                    <span className="text-xs text-muted-foreground">h</span>
                  </div>
                  {sequence.length > 1 && (
                    <Button size="icon" variant="ghost" onClick={() => removeStep(i)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={createCampaign.isPending || !form.name.trim()}>
            {createCampaign.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            Criar Campanha
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Prospect Detail Sheet ────────────────────────────────────────

function ProspectDetailSheet({ prospect, onClose, templates }: {
  prospect: SDRProspect;
  onClose: () => void;
  templates: Array<{ template_key: string; channel: string }>;
}) {
  const outreachLogs = useSDROutreachLogs(prospect.id);
  const generateMsg = useGenerateMessage();
  const sendOutreach = useSendOutreach();
  const deleteMutation = useDeleteProspect();
  const [previewMsg, setPreviewMsg] = useState<{ subject?: string; body: string; logId?: string } | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('sdr_intro_email');

  const handleGenerate = async () => {
    const result = await generateMsg.mutateAsync({
      prospectId: prospect.id,
      templateKey: selectedTemplate,
    });
    if (result?.body) {
      setPreviewMsg({ subject: result.subject, body: result.body, logId: result.outreach_log_id });
    }
  };

  const handleSend = () => {
    if (!previewMsg?.logId) return;
    sendOutreach.mutate(previewMsg.logId, {
      onSuccess: () => setPreviewMsg(null),
    });
  };

  return (
    <Sheet open onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{prospect.name}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-4">
          {/* Info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Email:</span> {prospect.email || '—'}</div>
            <div><span className="text-muted-foreground">Phone:</span> {prospect.phone || '—'}</div>
            <div><span className="text-muted-foreground">Cargo:</span> {prospect.headline || '—'}</div>
            <div><span className="text-muted-foreground">Empresa:</span> {prospect.company || '—'}</div>
            <div><span className="text-muted-foreground">Local:</span> {prospect.location || '—'}</div>
            <div><span className="text-muted-foreground">Source:</span> {prospect.source}</div>
          </div>

          {/* AI Qualification */}
          {prospect.ai_qualification && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Qualificacao AI</h4>
              <div className="flex gap-2">
                <Badge className={TEMP_COLORS[prospect.ai_temperature || ''] || ''}>{prospect.ai_temperature}</Badge>
                <Badge variant="outline">Score: {prospect.ai_score}</Badge>
              </div>
              {(prospect.ai_qualification as Record<string, unknown>).pain_points && (
                <div className="text-xs">
                  <strong>Pain points:</strong>{' '}
                  {((prospect.ai_qualification as Record<string, unknown>).pain_points as string[]).join(', ')}
                </div>
              )}
              {(prospect.ai_qualification as Record<string, unknown>).reasoning && (
                <div className="text-xs text-muted-foreground">
                  {(prospect.ai_qualification as Record<string, unknown>).reasoning as string}
                </div>
              )}
            </div>
          )}

          {/* Generate Message */}
          <div className="space-y-3 p-3 bg-muted rounded-lg">
            <h4 className="font-semibold text-sm">Gerar Mensagem AI</h4>
            <div className="flex gap-2">
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.template_key} value={t.template_key}>
                      {t.template_key} ({t.channel})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={handleGenerate} disabled={generateMsg.isPending}>
                {generateMsg.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
                Gerar
              </Button>
            </div>

            {previewMsg && (
              <div className="space-y-2">
                {previewMsg.subject && (
                  <div className="text-xs"><strong>Assunto:</strong> {previewMsg.subject}</div>
                )}
                <div className="p-3 bg-background rounded border text-sm whitespace-pre-wrap">{previewMsg.body}</div>
                <Button size="sm" onClick={handleSend} disabled={sendOutreach.isPending}>
                  {sendOutreach.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
                  Enviar Agora
                </Button>
              </div>
            )}
          </div>

          {/* Outreach History */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Historico de Outreach</h4>
            {outreachLogs.isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {(outreachLogs.data || []).length === 0 && !outreachLogs.isLoading && (
              <p className="text-xs text-muted-foreground">Nenhum outreach enviado ainda.</p>
            )}
            {(outreachLogs.data || []).map((log) => {
              const Icon = CHANNEL_ICONS[log.channel] || Mail;
              return (
                <div key={log.id} className="flex items-start gap-2 p-2 border rounded text-xs">
                  <Icon className="w-3.5 h-3.5 mt-0.5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{log.status}</Badge>
                      <span className="text-muted-foreground">Step {log.step_number}</span>
                      {log.sent_at && <span className="text-muted-foreground">{new Date(log.sent_at).toLocaleDateString('pt-BR')}</span>}
                    </div>
                    <p className="mt-1 line-clamp-2 text-muted-foreground">{log.message_body}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Delete */}
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={() => {
              deleteMutation.mutate(prospect.id);
              onClose();
            }}
          >
            <Trash2 className="w-4 h-4 mr-1" /> Remover Prospect
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
