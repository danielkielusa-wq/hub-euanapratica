# Leads Dashboard — Documentação

> Recurso admin-only em `/admin/leads-dashboard`
> Fonte de dados: tabela `career_evaluations` no Supabase (até 1.000 registros, ordenado por data DESC)

---

## Índice

- [Para o CEO](#para-o-ceo)
- [Para o Time de Vendas / Sales](#para-o-time-de-vendas--sales)
- [Para o Time de Marketing](#para-o-time-de-marketing)
- [Para o Dev](#para-o-dev)

---

## Para o CEO

### O que é o Leads Dashboard?

O Leads Dashboard é o painel central de inteligência sobre todos que realizaram uma avaliação de carreira pelo hub. Ele transforma dados brutos da jornada do lead em métricas visuais que permitem tomar decisões estratégicas sobre produto, vendas e crescimento.

### O que você enxerga em tempo real

| Métrica | O que significa |
|---|---|
| **Total de Avaliações** | Quantas pessoas iniciaram o diagnóstico no período selecionado |
| **Concluídas** | Avaliações onde a IA processou e gerou o relatório com sucesso |
| **Com Erro** | Falhas no processamento — sinaliza problema técnico que precisa atenção |
| **Relatórios Acessados** | Quantos leads voltaram para ler o relatório gerado — indicador de engajamento |

### KPIs estratégicos

**LTV Estimado (Lifetime Value)**
- Mostra o potencial financeiro agregado dos leads do período
- Inclui a média por lead e a taxa de leads com orçamento disponível
- Quanto maior o LTV médio, mais qualificado é o público atraído

**Barreiras Comuns**
- Lista as principais dificuldades detectadas pela IA nas respostas dos leads
- As mais comuns: Inglês, Experiência, Clareza, Financeiro, Visto, Família, Tempo
- Direciona onde investir em conteúdo e argumento de vendas

**Produtos Sugeridos**
- Top 5 produtos que a IA recomendou para os leads do período
- Mostra onde está concentrada a demanda — insumo direto para decisão de portfólio

### Filtros de período

Botões no canto superior: **7D · 30D · 90D · Tudo**

Permite comparar crescimento entre períodos e identificar sazonalidade.

### Como usar no dia a dia

1. Abrir o dashboard toda segunda-feira → checar volume da semana anterior (7D)
2. Comparar taxa de conclusão: se `Concluídas / Total < 80%` → acionar dev
3. Checar LTV médio: tendência de alta = público mais qualificado chegando
4. Verificar se os produtos sugeridos batem com o portfólio atual

---

## Para o Time de Vendas / Sales

### Para que serve

O dashboard te dá acesso aos leads qualificados pela IA **antes de qualquer contato comercial**, com informações que normalmente só conseguiríamos em uma call de descoberta.

### Como priorizar leads

A tabela "Leads Recentes" tem tudo que você precisa para montar sua fila de abordagem:

**Score de Prontidão (Readiness Score)**
- Barra visual de 0 a 100
- 🟢 Verde (>70): lead pronto, alta probabilidade de compra
- 🟡 Amarelo (40–70): precisa de nutrição
- 🔴 Vermelho (<40): ainda em fase de descoberta

**Temperatura do Lead**
- 🔴 QUENTE: alta intenção, abordagem imediata
- 🟡 MORNO: intenção moderada, nutrir e aguardar
- 🔵 FRIO: curiosidade inicial, entrada em funil de longo prazo

**Fase ROTA**
- Indica em qual etapa da jornada de carreira o lead se encontra
- Direciona o argumento: cada fase tem dores e objetivos diferentes

### Como acessar o relatório de um lead

1. Localizar o lead na tabela (use a busca por nome ou email)
2. Clicar em **"Ver Relatório"** — o email é automaticamente copiado para a área de transferência
3. O relatório completo abre em nova aba
4. Cole o email no campo de acesso do relatório
5. Leia o diagnóstico completo antes de ligar ou enviar mensagem

> **Dica**: O relatório tem as barreiras específicas do lead, o produto recomendado e a análise de prontidão. Use isso como script de abertura da conversa.

### Filtros disponíveis na tabela

| Filtro | Quando usar |
|---|---|
| **Busca** | Nome ou email específico |
| **Status** | `Concluído` para só ver leads com relatório pronto |
| **Temperatura** | Filtrar apenas `QUENTE` para sua lista de hoje |
| **Fase** | Separar leads por etapa da jornada para argumentos diferentes |

### Rotina sugerida

- **Diária**: Filtrar por `QUENTE` + `Concluído` + `7D` → lista de hoje
- **Semanal**: Ver 30D → leads mornos que já têm 1+ semana sem contato
- **Mensal**: Ver 90D → identificar leads frios que voltaram (se `access_count > 0` → sinal de retomada de interesse)

---

## Para o Time de Marketing

### Para que serve

O dashboard revela com precisão o perfil do público que chega pelo funil, quais barreiras mais aparecem e quais produtos a IA mais recomenda. É o insumo mais rico para criação de conteúdo e ajuste de campanhas.

### Leitura do Volume de Avaliações

O gráfico de área mostra o volume diário de novos leads no período. Use para:

- Medir o impacto de campanhas: pico no dia/dia seguinte a um lançamento = campanha funcionou
- Identificar dias da semana com mais volume → agendar publicações nesses dias
- Detectar quedas → analisar o que mudou (algoritmo, budget, sazonalidade)

### Distribuição Fase ROTA

O gráfico de rosca mostra em qual fase da jornada os leads se encontram. Se a maioria está em fases iniciais:
- Público ainda em fase de descoberta → conteúdo de consciência de problema
- Se a maioria está em fases avançadas → público mais maduro → conteúdo de decisão

### Barreiras Comuns — Calendário editorial pronto

Cada barreira é uma pauta de conteúdo:

| Barreira | Conteúdo sugerido |
|---|---|
| **Inglês** | "Como melhorar o inglês para trabalhar em TI internacional" |
| **Experiência** | "Profissional sênior no Brasil, júnior lá fora — o que fazer?" |
| **Clareza** | "Não sei qual área de TI escolher — guia completo" |
| **Financeiro** | "Quanto custa a transição de carreira para a Europa?" |
| **Visto** | "Como funciona o visto de trabalho em Portugal/Alemanha/Irlanda" |
| **Família** | "Mudar de país com família — o que considerar" |
| **Tempo** | "Como estudar para a transição sem largar o emprego atual" |

### Produtos Sugeridos — Validação de portfólio

O ranking de produtos sugeridos pela IA indica onde está a maior concentração de demanda qualificada. Use para:

- Priorizar anúncios para os produtos no topo da lista
- Criar landing pages específicas para os produtos mais recomendados
- Identificar produtos com baixa recomendação → avaliar se precisam de reposicionamento

### Taxa de Acesso ao Relatório

`Relatórios Acessados / Concluídos` = taxa de retorno do lead.

- Alta taxa (>50%): o funil pós-avaliação está funcionando — o lead volta
- Baixa taxa (<30%): email de entrega do relatório pode estar caindo em spam, ou o lead não está sendo bem nutrido para retornar

### Filtro por período para análise de campanha

1. Selecionar o período da campanha (ex: 30D)
2. Verificar volume por dia no gráfico
3. Comparar com período anterior (ex: 30D → 90D → calcular crescimento)

---

## Para o Dev

### Arquitetura

```
src/pages/admin/AdminLeadsDashboard.tsx  ← componente principal (single file, ~510 linhas)
src/components/layouts/SidebarNav.tsx    ← link no menu admin (grupo ANALYTICS)
src/App.tsx                              ← rota protegida /admin/leads-dashboard
```

### Rota e proteção

```tsx
// App.tsx
<Route
  path="/admin/leads-dashboard"
  element={
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminLeadsDashboard />
    </ProtectedRoute>
  }
/>
```

Acesso restrito a usuários com `role = 'admin'` via `ProtectedRoute`.

### Fonte de dados

```ts
supabase
  .from('career_evaluations')
  .select(`
    id, created_at, name, email, phone, area,
    phase_name, phase_emoji, rota_letter,
    lead_temperature, recommended_product_name,
    investment_range, impediment, access_token,
    processing_status, readiness_score, estimated_ltv,
    has_budget,
    has_english_barrier, has_experience_barrier,
    has_financial_barrier, has_family_barrier,
    has_visa_barrier, has_time_barrier, has_clarity_barrier,
    access_count
  `)
  .order('created_at', { ascending: false })
  .limit(1000)
```

> Limite hard-coded em 1.000 registros. Se o volume crescer significativamente, considerar paginação server-side ou views materializadas.

### Interface TypeScript

```ts
interface LeadRow {
  id: string;
  created_at: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  area: string | null;
  phase_name: string | null;
  phase_emoji: string | null;
  rota_letter: string | null;
  lead_temperature: string | null;
  recommended_product_name: string | null;
  investment_range: string | null;
  impediment: string | null;
  access_token: string | null;
  processing_status: string | null;  // 'completed' | 'error' | 'pending'
  readiness_score: number | null;    // 0–100
  estimated_ltv: number | null;
  has_budget: boolean | null;
  has_english_barrier: boolean | null;
  has_experience_barrier: boolean | null;
  has_financial_barrier: boolean | null;
  has_family_barrier: boolean | null;
  has_visa_barrier: boolean | null;
  has_time_barrier: boolean | null;
  has_clarity_barrier: boolean | null;
  access_count: number | null;
}
```

### Lógica de estado

| Estado | Tipo | Função |
|---|---|---|
| `allData` | `LeadRow[]` | Cache completo dos dados brutos |
| `period` | `7 \| 30 \| 90 \| 0` | Filtro de período (0 = tudo) |
| `search` | `string` | Busca por nome/email na tabela |
| `statusFilter` | `string` | Filtro por `processing_status` |
| `tempFilter` | `string` | Filtro por `lead_temperature` |
| `phaseFilter` | `string` | Filtro por `phase_name` |
| `page` | `number` | Página atual da tabela |

O filtro de período é aplicado via `useMemo` sobre `allData`, gerando `periodData`. Todos os gráficos e KPIs derivam de `periodData`.

### Computed values (useMemo)

```
allData → periodData (filtro de data)
periodData → stats (KPIs)
periodData → volumeChartData (area chart diário)
periodData → phaseChartData (pie chart por fase/rota)
periodData → barriersData (progress bars, sorted DESC)
periodData → productsData (top 5 produtos)
periodData + filters → tableData → paginação
```

### Dependências de UI

- **Recharts**: `AreaChart`, `PieChart` (donut, innerRadius=60 outerRadius=80)
- **shadcn/ui**: não usado diretamente — componentes customizados `KPICard` e `Card`
- **Lucide React**: ícones
- **Tailwind CSS**: estilização completa

### Abertura de relatório

```ts
const openReport = (accessToken: string, email: string | null) => {
  if (email) {
    navigator.clipboard.writeText(email); // copia email para clipboard
  }
  window.open(REPORT_BASE + accessToken, '_blank');
};

const REPORT_BASE = 'https://hub.euanapratica.com/report/';
```

URL final: `https://hub.euanapratica.com/report/{access_token}`

### Paginação

- 20 registros por página (`PER_PAGE = 20`)
- Client-side sobre `tableData` (já filtrado)
- Reset automático para página 1 ao mudar qualquer filtro

```ts
useEffect(() => { setPage(1); }, [search, statusFilter, tempFilter, phaseFilter, period]);
```

### RLS / permissões

A tabela `career_evaluations` deve ter RLS configurada para leitura via `service_role` ou pela role `admin`. O componente usa o client Supabase autenticado — o usuário precisa estar logado com `role = 'admin'` para a query retornar dados.

Se a query retornar 0 rows sem erro, verificar:
1. RLS policies na tabela
2. `GRANT SELECT ON public.career_evaluations TO authenticated`

### Pontos de evolução futura

- **Paginação server-side**: quando superar ~5.000 registros, `limit(1000)` se torna gargalo
- **Real-time**: adicionar `supabase.channel()` subscription em `career_evaluations` para atualização automática sem refresh manual
- **Export CSV**: botão de download da tabela filtrada
- **Drill-down por lead**: modal com detalhes completos sem abrir nova aba
- **Alertas**: notificação quando `processing_status = 'error'` acumula acima de threshold configurável
