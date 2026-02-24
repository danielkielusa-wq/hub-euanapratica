# Idea Kanban — Documentacao

> Quadro Kanban para gestao do funil de ideias de negocio. Acessivel em `/admin/idea-kanban` pelo painel Admin.

---

## Visao Geral

O **Idea Kanban** e uma ferramenta de gestao do pipeline de ideias de negocio, organizada em 6 estagios progressivos. Cada ideia avanca por estagios de validacao, desde a faisca inicial ate a execucao ativa. Os dados sao persistidos no **Supabase** (tabela `business_ideas`).

---

## Arquivos

| Arquivo | Responsabilidade |
|---|---|
| `src/pages/admin/AdminIdeaKanban.tsx` | Componente React principal (toda a UI) |
| `src/hooks/useAdminIdeas.ts` | Hook Supabase CRUD (TanStack Query + optimistic updates) |
| `src/components/layouts/SidebarNav.tsx` | Link no menu admin (secao GESTAO DO NEGOCIO) |
| `src/App.tsx` | Rota `/admin/idea-kanban` com `ProtectedRoute allowedRoles=['admin']` |
| `supabase/migrations/20260223210000_create_business_ideas.sql` | Tabela `business_ideas` DDL + RLS + grants |
| `supabase/migrations/20260223220000_seed_partner_ecosystem_ideas.sql` | 16 ideias seed do ecossistema de parceiros |

---

## Colunas do Pipeline

| Coluna | Cor | Indice | Significado |
|---|---|---|---|
| **Raw Spark** | `#7C3AED` — roxo | 0 | Ideia bruta, ainda nao qualificada |
| **Qualified** | `#D97706` — ambar | 1 | Ideia com buyer e dor identificados |
| **Validated** | `#059669` — verde | 2 | Ideia com sinal de mercado real |
| **Designed** | `#2563EB` — azul | 3 | Ideia com escopo e modelo definidos |
| **Active** | `#DC2626` — vermelho | 4 | Execucao em andamento |
| **Parked** | `#6B7280` — cinza | 5 | Pausada para revisao futura |

---

## Modelo de Dados

```typescript
interface BusinessIdea {
  id: string;
  user_id: string;
  column_status: string;     // 'spark' | 'qualified' | 'validated' | 'designed' | 'active' | 'parked'
  name: string;
  one_liner: string;
  problem: string;
  persona: string;
  interest_score: number;    // 0-5 estrelas
  tags: string[];
  notes: string;
  existing_assets: string;

  // Desbloqueados na coluna Qualified+ (indice >= 1)
  market_size: string | null;       // 'niche' | 'growing' | 'massive'
  competition: string | null;       // 'none' | 'crowded' | 'blue_ocean'
  unfair_advantage: string;
  distribution_hypothesis: string;
  revenue_model: string;

  // Desbloqueados na coluna Validated+ (indice >= 2)
  validation_method: string | null; // 'interview' | 'landing_page' | 'pre_sale' | 'prototype'
  signals_collected: string;
  strongest_objection: string;
  kill_criteria: string;

  // Desbloqueados na coluna Designed+ (indice >= 3)
  pricing_model: string;
  mvp_scope: string;
  key_metric: string;
  integrations: string;

  gate_answers: Record<string, string>;
  created_at: string;
  updated_at: string;
}
```

### Persistencia

- **Backend:** tabela `business_ideas` no Supabase (PostgREST direto)
- **Hook:** `useAdminIdeas.ts` — TanStack Query com `useQuery` + `useMutation`
- **Optimistic updates:** drag-and-drop usa cache otimista com rollback em caso de erro

---

## Campos por Camada

Os campos desbloqueados dependem do indice da coluna atual do card:

```
Todas as colunas  -> name, one_liner, problem, persona, interest_score, tags, notes, existing_assets
Qualified+        -> market_size, competition, unfair_advantage, distribution_hypothesis, revenue_model
Validated+        -> validation_method, signals_collected, strongest_objection, kill_criteria
Designed+         -> pricing_model, mvp_scope, key_metric, integrations
```

---

## Health Dot (Indicador de Completude)

Cada card exibe um ponto colorido no canto inferior direito calculado sobre os campos **desbloqueados** da coluna atual:

| Cor | Criterio |
|---|---|
| Vermelho `#EF4444` | < 40% dos campos preenchidos |
| Amarelo `#F59E0B` | 40-80% dos campos preenchidos |
| Verde `#10B981` | > 80% dos campos preenchidos |

---

## Filtros e Ordenacao

### Filtros

| Filtro | Logica |
|---|---|
| By Status | Mostra todas as ideias (sem filtro) |
| By Total Ideas | Mostra todas + badge com total |
| Most Promising | `interest_score >= 4` |
| Needs Validation | `column_status === 'spark' \|\| column_status === 'qualified'` |
| Parked | `column_status === 'parked'` |

### Ordenacao

| Opcao | Campo |
|---|---|
| Newest | `created_at` desc |
| Oldest | `created_at` asc |
| Interest Score | `interest_score` desc |

---

## Drag & Drop

Implementado com a **HTML5 Drag and Drop API** via eventos React (`onDragStart`, `onDragOver`, `onDragLeave`, `onDrop`).

- O estado de drag e mantido em `useRef` (sem re-render durante o arraste)
- Ao soltar em uma coluna diferente, o card muda imediatamente (optimistic update)
- Se o update no Supabase falhar, o card volta a coluna original (rollback)
- A zona de drop fica com fundo colorido (15% opacidade da cor da coluna) durante hover

---

## Drawer de Edicao

Utiliza o componente `Sheet` do shadcn/ui (`side="right"`, largura 480px).

- Abre ao clicar em qualquer card
- Exibe apenas os campos desbloqueados para a coluna atual
- Campo **Column** permite mover o card para qualquer coluna diretamente pelo drawer
- Botao **Save** persiste no Supabase (nao fecha o drawer)
- Botao **Delete** remove a ideia permanentemente
- Secao **Gate Answers** (read-only) aparece se houver respostas registradas

---

## Tags Disponiveis

| Tag | Cor | Uso |
|---|---|---|
| SaaS | Azul | Software products |
| Marketplace | Roxo | Two-sided platforms |
| Content | Verde | Content-driven |
| B2B | Ambar | Business-to-business |
| B2C | Rosa | Business-to-consumer |
| AI/ML | Indigo | AI/Machine Learning |
| Affiliate | Amarelo | Affiliate/referral partnerships |
| LeadGen | Verde claro | Lead generation services |
| Service | Laranja | Service-based |
| Community | Ciano | Community-driven |
| Data | Lilas | Data products/intelligence |
| Ads | Rosa escuro | Advertising/sponsored content |

---

## Documentacao por Role

Para documentacao detalhada por role, veja:

- **CEO:** `docs/13 Partner Ecosystem/CEO.md` — visao executiva, canais de receita, quick wins
- **DEV:** `docs/13 Partner Ecosystem/DEV.md` — schema, hook, troubleshooting, deployment
