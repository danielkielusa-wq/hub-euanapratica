import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Search } from 'lucide-react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const REPORT_BASE = 'https://hub.euanapratica.com/diagnostico/';
const PER_PAGE = 20;

interface LeadRow {
  id: string;
  created_at: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  current_phase: string | null;
  lead_temperature: string | null;
  recommended_product: string | null;
  investment_capacity: string | null;
  main_barrier: string | null;
  access_token: string | null;
  status: string | null;
}

type PeriodDays = 7 | 30 | 90 | 0;

function parseInvestment(v: string | null): number {
  if (!v) return 0;
  const m = String(v).match(/([\d.,]+)/);
  if (m) return parseFloat(m[1].replace('.', '').replace(',', '.'));
  return 0;
}

function countBy<T>(arr: T[], key: (item: T) => string | null): Record<string, number> {
  const map: Record<string, number> = {};
  arr.forEach(item => {
    const k = key(item);
    if (k) map[k] = (map[k] || 0) + 1;
  });
  return map;
}

// Animated counter hook
function useAnimatedValue(target: number) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = display;
    const duration = 600;
    const startTime = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - startTime) / duration, 1);
      setDisplay(Math.round(start + (target - start) * p));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return display;
}

function KPICard({ label, value, suffix, sub, accent }: { label: string; value: number; suffix?: string; sub: string; accent: string }) {
  const animated = useAnimatedValue(value);
  return (
    <div className="relative overflow-hidden rounded-xl border border-[#21262d] bg-[#0d1117] p-5">
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: accent }} />
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8b949e] mb-2">{label}</p>
      <p className="font-mono text-3xl font-bold text-[#e6edf3]">{animated.toLocaleString('pt-BR')}{suffix}</p>
      <p className="font-mono text-xs text-[#8b949e] mt-2">{sub}</p>
    </div>
  );
}

function KPICardText({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[#21262d] bg-[#0d1117] p-5">
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: accent }} />
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8b949e] mb-2">{label}</p>
      <p className="font-mono text-lg font-bold text-[#e6edf3] leading-tight">{value}</p>
      <p className="font-mono text-xs text-[#8b949e] mt-2">{sub}</p>
    </div>
  );
}

function MetricBars({ entries, color }: { entries: { label: string; value: number; display: string }[]; color: string }) {
  const max = Math.max(...entries.map(e => e.value), 1);
  if (!entries.length) return <span className="text-sm text-[#8b949e]">Sem dados</span>;
  return (
    <div className="space-y-2.5">
      {entries.map(e => (
        <div key={e.label} className="flex items-center gap-2.5">
          <span className="text-xs text-[#8b949e] w-36 flex-shrink-0 truncate" title={e.label}>{e.label}</span>
          <div className="flex-1 h-2 bg-[#161b22] rounded overflow-hidden">
            <div className="h-full rounded transition-all duration-500" style={{ width: `${(e.value / max) * 100}%`, background: color }} />
          </div>
          <span className="font-mono text-xs text-[#e6edf3] w-10 text-right flex-shrink-0">{e.display}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminLeadsDashboard() {
  const { toast } = useToast();
  const [allData, setAllData] = useState<LeadRow[]>([]);
  const [period, setPeriod] = useState<PeriodDays>(7);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('');
  const [search, setSearch] = useState('');
  const [filterTemp, setFilterTemp] = useState('');
  const [filterPhase, setFilterPhase] = useState('');
  const [page, setPage] = useState(1);

  const volumeCanvasRef = useRef<HTMLCanvasElement>(null);
  const phasesCanvasRef = useRef<HTMLCanvasElement>(null);
  const tempCanvasRef = useRef<HTMLCanvasElement>(null);
  const chartsRef = useRef<{ volume?: Chart; phases?: Chart; temp?: Chart }>({});

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const { data, error } = await supabase
        .from('career_evaluations')
        .select('id,created_at,full_name,email,phone,current_phase,lead_temperature,recommended_product,investment_capacity,main_barrier,access_token,status')
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      setAllData((data as LeadRow[]) || []);
      setLastUpdate(new Date().toLocaleTimeString('pt-BR'));
    } catch {
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filtered by period
  const filteredData = useMemo(() => {
    if (period === 0) return allData;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - period);
    return allData.filter(d => new Date(d.created_at) >= cutoff);
  }, [allData, period]);

  // KPIs
  const kpis = useMemo(() => {
    const total = filteredData.length;
    const hot = filteredData.filter(d => (d.lead_temperature || '').toLowerCase() === 'quente').length;
    const completed = filteredData.filter(d => d.status === 'completed' || d.access_token).length;
    const rate = total ? Math.round((completed / total) * 100) : 0;
    const prods = countBy(filteredData, d => d.recommended_product);
    const sorted = Object.entries(prods).sort((a, b) => b[1] - a[1]);
    return { total, hot, completed, rate, topProduct: sorted[0]?.[0] || '—', topProductCount: sorted[0]?.[1] || 0 };
  }, [filteredData]);

  // Phases list for filter
  const phases = useMemo(() => [...new Set(filteredData.map(d => d.current_phase).filter(Boolean))].sort() as string[], [filteredData]);

  // Business metrics
  const metrics = useMemo(() => {
    // LTV by phase
    const ltvMap: Record<string, { sum: number; count: number }> = {};
    filteredData.forEach(d => {
      const p = d.current_phase || 'Não definido';
      if (!ltvMap[p]) ltvMap[p] = { sum: 0, count: 0 };
      ltvMap[p].sum += parseInvestment(d.investment_capacity);
      ltvMap[p].count++;
    });
    const ltv = Object.entries(ltvMap)
      .map(([k, v]) => ({ label: k, value: v.count ? Math.round(v.sum / v.count) : 0, display: `R$${v.count ? Math.round(v.sum / v.count) : 0}` }))
      .sort((a, b) => b.value - a.value).slice(0, 5);

    const barriers = Object.entries(countBy(filteredData, d => d.main_barrier))
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([k, v]) => ({ label: k, value: v, display: String(v) }));

    const products = Object.entries(countBy(filteredData, d => d.recommended_product))
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([k, v]) => ({ label: k, value: v, display: String(v) }));

    return { ltv, barriers, products };
  }, [filteredData]);

  // Table filtered + paginated
  const tableData = useMemo(() => {
    let data = filteredData;
    if (search) {
      const s = search.toLowerCase();
      data = data.filter(d => (d.full_name || '').toLowerCase().includes(s) || (d.email || '').toLowerCase().includes(s));
    }
    if (filterTemp) data = data.filter(d => (d.lead_temperature || '').toLowerCase() === filterTemp);
    if (filterPhase) data = data.filter(d => d.current_phase === filterPhase);
    return data;
  }, [filteredData, search, filterTemp, filterPhase]);

  const totalPages = Math.max(1, Math.ceil(tableData.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageSlice = tableData.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  useEffect(() => { setPage(1); }, [search, filterTemp, filterPhase, period]);

  // Charts
  useEffect(() => {
    const refs = chartsRef.current;
    if (refs.volume) { refs.volume.destroy(); refs.volume = undefined; }
    if (refs.phases) { refs.phases.destroy(); refs.phases = undefined; }
    if (refs.temp) { refs.temp.destroy(); refs.temp = undefined; }

    Chart.defaults.color = '#8b949e';
    Chart.defaults.borderColor = '#21262d';
    Chart.defaults.font.family = "'JetBrains Mono', monospace";
    Chart.defaults.font.size = 11;

    // Volume line
    if (volumeCanvasRef.current) {
      const volMap: Record<string, number> = {};
      filteredData.forEach(d => { const day = d.created_at?.slice(0, 10); if (day) volMap[day] = (volMap[day] || 0) + 1; });
      const days = Object.keys(volMap).sort();
      const ctx = volumeCanvasRef.current.getContext('2d')!;
      const grad = ctx.createLinearGradient(0, 0, 0, 260);
      grad.addColorStop(0, 'rgba(0,212,255,.3)');
      grad.addColorStop(1, 'rgba(0,212,255,0)');
      refs.volume = new Chart(ctx, {
        type: 'line',
        data: { labels: days.map(d => d.slice(5)), datasets: [{ data: days.map(d => volMap[d]), borderColor: '#00d4ff', backgroundColor: grad, fill: true, tension: .4, pointRadius: 2, pointHoverRadius: 5 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
      });
    }

    // Phases donut
    if (phasesCanvasRef.current) {
      const phaseMap = countBy(filteredData, d => d.current_phase || 'Não definido');
      const labels = Object.keys(phaseMap);
      const colors = ['#00d4ff', '#3fb950', '#d29922', '#f85149', '#a371f7', '#db6d28', '#8b949e', '#58a6ff'];
      refs.phases = new Chart(phasesCanvasRef.current, {
        type: 'doughnut',
        data: { labels, datasets: [{ data: labels.map(l => phaseMap[l]), backgroundColor: colors.slice(0, labels.length), borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 8, font: { size: 10 } } } } }
      });
    }

    // Temperature bar
    if (tempCanvasRef.current) {
      const tempMap = { quente: 0, morno: 0, frio: 0 };
      filteredData.forEach(d => { const t = (d.lead_temperature || '').toLowerCase() as keyof typeof tempMap; if (tempMap[t] !== undefined) tempMap[t]++; });
      refs.temp = new Chart(tempCanvasRef.current, {
        type: 'bar',
        data: { labels: ['Quente', 'Morno', 'Frio'], datasets: [{ data: [tempMap.quente, tempMap.morno, tempMap.frio], backgroundColor: ['#f85149', '#d29922', '#00d4ff'], borderRadius: 6, barThickness: 24 }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, grid: { display: false } }, y: { grid: { display: false } } } }
      });
    }

    return () => {
      if (refs.volume) { refs.volume.destroy(); refs.volume = undefined; }
      if (refs.phases) { refs.phases.destroy(); refs.phases = undefined; }
      if (refs.temp) { refs.temp.destroy(); refs.temp = undefined; }
    };
  }, [filteredData]);

  const openReport = (accessToken: string, email: string | null) => {
    if (email) {
      navigator.clipboard.writeText(email).then(() => toast({ title: 'Email copiado — cole no gate do relatório' })).catch(() => {});
    }
    window.open(REPORT_BASE + accessToken, '_blank');
  };

  const tempBadgeClass = (t: string) => {
    const v = t.toLowerCase();
    if (v === 'quente') return 'bg-red-500/15 text-red-400';
    if (v === 'morno') return 'bg-yellow-500/15 text-yellow-400';
    if (v === 'frio') return 'bg-cyan-500/15 text-cyan-400';
    return '';
  };

  const periodButtons: { label: string; days: PeriodDays }[] = [
    { label: '7D', days: 7 }, { label: '30D', days: 30 }, { label: '90D', days: 90 }, { label: 'Tudo', days: 0 },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <RefreshCw className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-[1400px] mx-auto" style={{ fontFamily: "'Syne', sans-serif" }}>
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-2xl font-extrabold tracking-tight">Leads Dashboard</h1>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex bg-[#0d1117] border border-[#21262d] rounded-lg overflow-hidden">
              {periodButtons.map(b => (
                <button key={b.days} onClick={() => setPeriod(b.days)}
                  className={`px-4 py-2 text-xs font-semibold transition-all ${period === b.days ? 'bg-cyan-500 text-[#080c10]' : 'text-[#8b949e] hover:text-[#e6edf3]'}`}
                >{b.label}</button>
              ))}
            </div>
            <button onClick={fetchData} title="Atualizar"
              className="w-9 h-9 flex items-center justify-center bg-[#0d1117] border border-[#21262d] rounded-lg text-[#8b949e] hover:border-cyan-500 hover:text-cyan-500 transition-all">
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            {lastUpdate && <span className="font-mono text-xs text-[#8b949e]">Atualizado: {lastUpdate}</span>}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard label="Total Leads" value={kpis.total} sub={period ? `Últimos ${period} dias` : 'Todo o período'} accent="#00d4ff" />
          <KPICard label="Leads Quentes" value={kpis.hot} sub={kpis.total ? `${Math.round((kpis.hot / kpis.total) * 100)}% do total` : ''} accent="#3fb950" />
          <KPICard label="Taxa Conclusão" value={kpis.rate} suffix="%" sub={`${kpis.completed} de ${kpis.total}`} accent="#d29922" />
          <KPICardText label="Produto Top" value={kpis.topProduct} sub={kpis.topProductCount ? `${kpis.topProductCount} leads` : ''} accent="#a371f7" />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
          <div className="bg-[#0d1117] border border-[#21262d] rounded-xl p-5">
            <h3 className="text-sm font-bold mb-4">Volume de Leads</h3>
            <div className="relative h-[260px]"><canvas ref={volumeCanvasRef} /></div>
          </div>
          <div className="bg-[#0d1117] border border-[#21262d] rounded-xl p-5">
            <h3 className="text-sm font-bold mb-4">Fases do Funil</h3>
            <div className="relative h-[260px]"><canvas ref={phasesCanvasRef} /></div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="bg-[#0d1117] border border-[#21262d] rounded-xl p-5">
          <h3 className="text-sm font-bold mb-4">Temperatura dos Leads</h3>
          <div className="relative h-[180px]"><canvas ref={tempCanvasRef} /></div>
        </div>

        {/* Business Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-[#0d1117] border border-[#21262d] rounded-xl p-5">
            <h3 className="text-sm font-bold mb-4">LTV Estimado por Fase</h3>
            <MetricBars entries={metrics.ltv} color="#00d4ff" />
          </div>
          <div className="bg-[#0d1117] border border-[#21262d] rounded-xl p-5">
            <h3 className="text-sm font-bold mb-4">Principais Barreiras</h3>
            <MetricBars entries={metrics.barriers} color="#d29922" />
          </div>
          <div className="bg-[#0d1117] border border-[#21262d] rounded-xl p-5">
            <h3 className="text-sm font-bold mb-4">Produtos Recomendados</h3>
            <MetricBars entries={metrics.products} color="#3fb950" />
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#0d1117] border border-[#21262d] rounded-xl p-5">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <h3 className="text-sm font-bold">Leads Recentes</h3>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8b949e]" />
                <input type="text" placeholder="Buscar nome/email..." value={search} onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-2 bg-[#161b22] border border-[#21262d] rounded-lg text-xs text-[#e6edf3] font-mono outline-none focus:border-cyan-500 w-52" />
              </div>
              <select value={filterTemp} onChange={e => setFilterTemp(e.target.value)}
                className="px-3 py-2 bg-[#161b22] border border-[#21262d] rounded-lg text-xs text-[#e6edf3] font-mono outline-none focus:border-cyan-500">
                <option value="">Temperatura</option>
                <option value="quente">Quente</option>
                <option value="morno">Morno</option>
                <option value="frio">Frio</option>
              </select>
              <select value={filterPhase} onChange={e => setFilterPhase(e.target.value)}
                className="px-3 py-2 bg-[#161b22] border border-[#21262d] rounded-lg text-xs text-[#e6edf3] font-mono outline-none focus:border-cyan-500">
                <option value="">Fase</option>
                {phases.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#21262d]">
                  {['Data', 'Nome', 'Email', 'Telefone', 'Fase', 'Temperatura', 'Produto', 'Relatório'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#8b949e] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageSlice.map(d => (
                  <tr key={d.id} className="border-b border-[#21262d] hover:bg-[#161b22] transition-colors">
                    <td className="px-3 py-2.5 font-mono whitespace-nowrap">{d.created_at ? new Date(d.created_at).toLocaleDateString('pt-BR') : '—'}</td>
                    <td className="px-3 py-2.5 font-mono">{d.full_name || '—'}</td>
                    <td className="px-3 py-2.5 font-mono">{d.email || '—'}</td>
                    <td className="px-3 py-2.5 font-mono">{d.phone || '—'}</td>
                    <td className="px-3 py-2.5"><span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/15 text-purple-400">{d.current_phase || '—'}</span></td>
                    <td className="px-3 py-2.5"><span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${tempBadgeClass(d.lead_temperature || '')}`}>{d.lead_temperature || '—'}</span></td>
                    <td className="px-3 py-2.5 font-mono">{d.recommended_product || '—'}</td>
                    <td className="px-3 py-2.5">
                      {d.access_token ? (
                        <button onClick={() => openReport(d.access_token!, d.email)} className="text-cyan-400 font-mono font-semibold hover:underline">Ver →</button>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
                {!pageSlice.length && (
                  <tr><td colSpan={8} className="px-3 py-8 text-center text-[#8b949e]">Nenhum lead encontrado</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-center gap-3 mt-4">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage <= 1}
              className="px-3 py-1.5 bg-[#161b22] border border-[#21262d] rounded-md text-xs disabled:opacity-30 hover:border-cyan-500 transition-all">← Anterior</button>
            <span className="font-mono text-xs text-[#8b949e]">{safePage}/{totalPages} ({tableData.length})</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}
              className="px-3 py-1.5 bg-[#161b22] border border-[#21262d] rounded-md text-xs disabled:opacity-30 hover:border-cyan-500 transition-all">Próxima →</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
