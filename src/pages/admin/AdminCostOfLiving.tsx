import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useAdminCostOfLiving } from '@/hooks/useAdminCostOfLiving';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, RefreshCw, MapPin, Download, Search } from 'lucide-react';
import type { CityData } from '@/pages/cost-of-living/types';

const EMPTY_CITY = {
  city_name: '', state_code: '', slug: '',
  latitude: 0, longitude: 0,
  base_rent: 0, base_food: 0, base_transport: 0, base_other: 0,
  salaries_by_field: {} as Record<string, number>,
  ranking: null as number | null,
  cheaper_alternative: null as string | null,
  cheaper_alternative_pct: null as number | null,
};

export default function AdminCostOfLiving() {
  const {
    cities, leads, isLoading, isLoadingLeads, isSaving,
    fetchCities, createCity, updateCity, deleteCity, toggleCity, fetchLeads,
  } = useAdminCostOfLiving();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<CityData | null>(null);
  const [form, setForm] = useState(EMPTY_CITY);
  const [salariesJson, setSalariesJson] = useState('{}');
  const [leadsSearch, setLeadsSearch] = useState('');

  const openCreate = () => {
    setEditingCity(null);
    setForm(EMPTY_CITY);
    setSalariesJson('{}');
    setDialogOpen(true);
  };

  const openEdit = (city: CityData) => {
    setEditingCity(city);
    setForm({
      city_name: city.city_name,
      state_code: city.state_code,
      slug: city.slug,
      latitude: city.latitude,
      longitude: city.longitude,
      base_rent: city.base_rent,
      base_food: city.base_food,
      base_transport: city.base_transport,
      base_other: city.base_other,
      salaries_by_field: city.salaries_by_field,
      ranking: city.ranking,
      cheaper_alternative: city.cheaper_alternative,
      cheaper_alternative_pct: city.cheaper_alternative_pct,
    });
    setSalariesJson(JSON.stringify(city.salaries_by_field, null, 2));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const parsed = JSON.parse(salariesJson);
      const data = { ...form, salaries_by_field: parsed };

      if (editingCity) {
        await updateCity(editingCity.id, data);
      } else {
        await createCity(data as any);
      }
      setDialogOpen(false);
    } catch {
      toast({ title: 'JSON de salários inválido', variant: 'destructive' });
    }
  };

  const handleDelete = async (city: CityData) => {
    if (!window.confirm(`Excluir ${city.city_name}?`)) return;
    await deleteCity(city.id);
  };

  const exportLeadsCsv = () => {
    if (leads.length === 0) return;
    const headers = ['Nome', 'Email', 'Cidade', 'Salário', 'Família', 'Filhos', 'Estilo', 'Área', 'Sobra/Falta', 'Data'];
    const rows = leads.map(l => [
      l.name || '', l.email, l.city_slug || '', l.salary || '', l.family_size || '',
      l.children, l.lifestyle || '', l.field || '', l.result_leftover || '',
      new Date(l.created_at).toLocaleDateString('pt-BR'),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-custo-de-vida-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Custo de Vida EUA</h1>
            <p className="text-muted-foreground">Gerencie cidades, configurações e leads capturados</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchCities} disabled={isLoading}>
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </Button>
        </div>

        <Tabs defaultValue="cities">
          <TabsList>
            <TabsTrigger value="cities">Cidades ({cities.length})</TabsTrigger>
            <TabsTrigger value="leads" onClick={() => fetchLeads()}>Leads</TabsTrigger>
          </TabsList>

          {/* ── CITIES TAB ── */}
          <TabsContent value="cities" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={openCreate}><Plus size={16} className="mr-2" /> Adicionar Cidade</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cities.map(city => (
                <Card key={city.id} className={!city.enabled ? 'opacity-60' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MapPin size={16} className="text-indigo-500" />
                        {city.city_name}, {city.state_code}
                      </CardTitle>
                      <Switch
                        checked={city.enabled}
                        onCheckedChange={(val) => toggleCity(city.id, val)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Rent:</span> <span className="font-mono">${city.base_rent}</span></div>
                      <div><span className="text-muted-foreground">Food:</span> <span className="font-mono">${city.base_food}</span></div>
                      <div><span className="text-muted-foreground">Transport:</span> <span className="font-mono">${city.base_transport}</span></div>
                      <div><span className="text-muted-foreground">Other:</span> <span className="font-mono">${city.base_other}</span></div>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Total base:</span>{' '}
                      <span className="font-mono font-semibold">${city.base_rent + city.base_food + city.base_transport + city.base_other}/mês</span>
                    </div>
                    {city.ranking && (
                      <Badge variant="outline">{city.ranking}ª mais cara</Badge>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(city)}>
                        <Edit size={14} className="mr-1" /> Editar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(city)} className="text-destructive hover:text-destructive">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ── LEADS TAB ── */}
          <TabsContent value="leads" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  placeholder="Buscar por email ou nome..."
                  value={leadsSearch}
                  onChange={(e) => setLeadsSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchLeads({ search: leadsSearch })}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="sm" onClick={() => fetchLeads({ search: leadsSearch })} disabled={isLoadingLeads}>
                <Search size={14} className="mr-1" /> Buscar
              </Button>
              <Button variant="outline" size="sm" onClick={exportLeadsCsv} disabled={leads.length === 0}>
                <Download size={14} className="mr-1" /> CSV
              </Button>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Cidade</TableHead>
                    <TableHead>Salário</TableHead>
                    <TableHead>Família</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingLeads ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                  ) : leads.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum lead encontrado</TableCell></TableRow>
                  ) : leads.map(lead => (
                    <TableRow key={lead.id}>
                      <TableCell>{lead.name || '-'}</TableCell>
                      <TableCell className="font-mono text-sm">{lead.email}</TableCell>
                      <TableCell>{lead.city_slug || '-'}</TableCell>
                      <TableCell className="font-mono">{lead.salary ? `$${lead.salary.toLocaleString()}` : '-'}</TableCell>
                      <TableCell>{lead.family_size || '-'}{lead.children > 0 ? ` (${lead.children} filhos)` : ''}</TableCell>
                      <TableCell>
                        {lead.result_leftover != null ? (
                          <span className={lead.result_leftover >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                            {lead.result_leftover >= 0 ? '+' : '-'}${Math.abs(lead.result_leftover).toLocaleString()}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ── CITY DIALOG ── */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCity ? 'Editar Cidade' : 'Nova Cidade'}</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome da cidade</Label>
                <Input value={form.city_name} onChange={e => setForm({ ...form, city_name: e.target.value })} placeholder="Orlando" />
              </div>
              <div className="space-y-2">
                <Label>Estado (sigla)</Label>
                <Input value={form.state_code} onChange={e => setForm({ ...form, state_code: e.target.value })} placeholder="FL" maxLength={2} />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="orlando-fl" />
              </div>
              <div className="space-y-2">
                <Label>Ranking (posição)</Label>
                <Input type="number" value={form.ranking || ''} onChange={e => setForm({ ...form, ranking: e.target.value ? parseInt(e.target.value) : null })} />
              </div>
              <div className="space-y-2">
                <Label>Latitude</Label>
                <Input type="number" step="0.0001" value={form.latitude} onChange={e => setForm({ ...form, latitude: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Longitude</Label>
                <Input type="number" step="0.0001" value={form.longitude} onChange={e => setForm({ ...form, longitude: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>

            <h4 className="font-semibold mt-4">Custos base mensais (USD, solteiro moderado)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Aluguel (Rent)</Label>
                <Input type="number" value={form.base_rent} onChange={e => setForm({ ...form, base_rent: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Alimentação (Food)</Label>
                <Input type="number" value={form.base_food} onChange={e => setForm({ ...form, base_food: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Transporte (Car)</Label>
                <Input type="number" value={form.base_transport} onChange={e => setForm({ ...form, base_transport: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Outros (Rest)</Label>
                <Input type="number" value={form.base_other} onChange={e => setForm({ ...form, base_other: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <Label>Alternativa mais barata (slug)</Label>
              <div className="grid grid-cols-2 gap-4">
                <Input value={form.cheaper_alternative || ''} onChange={e => setForm({ ...form, cheaper_alternative: e.target.value || null })} placeholder="houston-tx" />
                <Input type="number" value={form.cheaper_alternative_pct || ''} onChange={e => setForm({ ...form, cheaper_alternative_pct: e.target.value ? parseInt(e.target.value) : null })} placeholder="% economia" />
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <Label>Salários por área (JSON)</Label>
              <textarea
                value={salariesJson}
                onChange={e => setSalariesJson(e.target.value)}
                className="w-full h-40 bg-slate-50 border rounded-md p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder='{"Tech": 85000, "Healthcare": 62000}'
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={isSaving === 'new' || isSaving === editingCity?.id}>
                {isSaving ? 'Salvando...' : editingCity ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
