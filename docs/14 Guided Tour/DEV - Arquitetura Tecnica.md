# Guided Tour & Primeiros Passos — Arquitetura Tecnica (DEV)

## Visao geral

Duas features: (1) tour interativo com driver.js e (2) checklist de primeiros passos. Ambas usam uma unica coluna JSONB em `profiles`. O checklist usa flags no JSONB — clicar em um item marca como concluido imediatamente.

## Stack

- **driver.js** v1.3+ — Lib de product tour (~5KB gzip), zero deps
- **canvas-confetti** — Ja existia no projeto, usado na celebracao do checklist
- **TanStack Query v5** — Gerenciamento de estado async (padrao do projeto)
- **Supabase PostgREST** — Queries diretas, sem Edge Function

## Arquitetura de dados

### Coluna JSONB

```sql
-- profiles.guided_tour_state JSONB DEFAULT '{}'
{
  "tour_completed": boolean,              -- true apos completar ou pular o tour
  "checklist_dismissed": boolean,          -- true apos fechar com X ou auto-dismiss
  "catalog_visited": boolean,              -- true apos visitar /catalogo (legado)
  "step_complete_profile": boolean,        -- true ao clicar "Complete seu perfil"
  "step_first_community_post": boolean,    -- true ao clicar "Faca seu primeiro post"
  "step_analyze_resume": boolean,          -- true ao clicar "Analise seu curriculo"
  "step_explore_catalog": boolean          -- true ao clicar "Explore o catalogo"
}
```

### Checklist items — flag-based

Os 4 itens do checklist sao armazenados como flags `step_*` no JSONB. Ao clicar em um item, a flag e setada imediatamente (antes de navegar) via `useUpdateGuidedTourState()`.

| Item | Flag JSONB | Navega para |
|------|-----------|-------------|
| Complete seu perfil | `step_complete_profile` | `/perfil` |
| Primeiro post | `step_first_community_post` | `/comunidade` |
| Analise de curriculo | `step_analyze_resume` | `/curriculo` |
| Explore catalogo | `step_explore_catalog` (ou `catalog_visited` legado) | `/catalogo` |

Esse modelo garante feedback imediato ao usuario (item fica verde instantaneamente ao voltar ao Hub).

### Migration

```
supabase/migrations/20260225200000_guided_tour_state.sql
```

Backfill: usuarios com `has_completed_onboarding = true` recebem `{"tour_completed": true, "checklist_dismissed": true}` para nunca verem o tour/checklist.

## Arquivos

### Novos
| Arquivo | Descricao |
|---------|-----------|
| `src/types/guidedTour.ts` | Tipos: `GuidedTourState`, `ChecklistItemStatus`, `ChecklistItemKey` |
| `src/hooks/useGuidedTour.ts` | 3 hooks: `useGuidedTourState`, `useUpdateGuidedTourState`, `useChecklistStatus` |
| `src/components/guided-tour/DashboardTour.tsx` | Componente headless que dispara driver.js |
| `src/components/guided-tour/GettingStartedChecklist.tsx` | Card visual do checklist |
| `src/components/guided-tour/tour-styles.css` | Override CSS do popover driver.js |

### Modificados
| Arquivo | Mudanca |
|---------|---------|
| `src/components/layouts/SidebarNav.tsx` | `tourId?: string` na interface, `data-tour` nos Links |
| `src/pages/hub/StudentHub.tsx` | Monta `<DashboardTour />` + `<GettingStartedChecklist />` |
| `src/pages/hub/ServiceCatalog.tsx` | `useEffect` marca `catalog_visited: true` |
| `src/main.tsx` | Import de `driver.js/dist/driver.css` |

## Fluxo de dados

```
StudentHub.tsx
├── <DashboardTour />
│   ├── useGuidedTourState()  →  profiles.guided_tour_state
│   ├── Se tour_completed=false && role=student:
│   │   └── setTimeout(800ms) → driver({ steps, onDestroyStarted })
│   └── onDestroyStarted → useUpdateGuidedTourState({ tour_completed: true })
│
└── <GettingStartedChecklist />
    ├── useGuidedTourState()  →  checklist_dismissed?
    ├── useChecklistStatus()  →  deriva items de tourState.step_* flags
    ├── Render: Card com 4 items + progress bar
    ├── Click item → updateTourState({ step_<key>: true }) + navigate(href)
    ├── Dismiss (X) → updateTourState({ checklist_dismissed: true })
    └── All completed → canvas-confetti → auto-dismiss apos 3s
```

## Hook: useGuidedTour.ts

### useGuidedTourState()
- `useQuery(['guided-tour-state', userId])`
- `staleTime: 5min` (nao precisa ser super fresh)
- Cast `Json | null` → `GuidedTourState`

### useUpdateGuidedTourState()
- `useMutation` que faz read-then-merge (merge parcial no JSONB)
- Invalida `['guided-tour-state']` no `onSuccess`
- Cast `newState as any` para contornar tipagem `Json` do Supabase

### useChecklistStatus()
- Nao usa `useQuery` proprio — deriva items de `useGuidedTourState()`
- Retorna `{ data: ChecklistItemStatus[], isLoading }` (mesma interface)
- Cada item verifica `tourState.step_<key>` para determinar conclusao
- Zero queries adicionais (lê do mesmo cache que `useGuidedTourState`)

## DashboardTour.tsx — Detalhes

### Guards (nao dispara se)
- `isLoading` — ainda carregando estado
- `tourState?.tour_completed` — ja viu
- `tourStartedRef.current` — ja disparou neste mount (StrictMode guard)
- `user?.role !== 'student'` — so para alunos

### Desktop vs Mobile
- Desktop (>= 1024px): 7 steps com spotlight nos `[data-tour="..."]` da sidebar
- Mobile (< 1024px): 3 steps sem spotlight (sidebar oculta no mobile)

### CTA final
O ultimo step tem HTML customizado com botoes `data-tour-cta="comunidade|curriculo|catalogo"`. Um event listener delegado no `document` captura cliques e navega via `useNavigate()`.

### z-index
driver.js overlay usa z-index ~100010. A sidebar tem z-40. Sem conflito.

## Como estender

### Adicionar novo item ao checklist
1. Adicionar key em `ChecklistItemKey` e flag `step_<key>` em `GuidedTourState` (`src/types/guidedTour.ts`)
2. Adicionar item no array de `useChecklistStatus()` (`src/hooks/useGuidedTour.ts`)
3. Pronto — o componente renderiza automaticamente e marca via click

### Adicionar novo step ao tour
1. Adicionar `tourId` no item da sidebar (`SidebarNav.tsx`)
2. Adicionar step em `desktopSteps` (`DashboardTour.tsx`)
3. Pronto

### Criar tour para outra feature
1. Criar novo componente tipo `FeatureXTour.tsx` seguindo o padrao de `DashboardTour.tsx`
2. Adicionar nova flag no JSONB: `"feature_x_tour_completed": boolean`
3. Montar no local desejado

### Desativar completamente
Remover 2 imports + 2 linhas JSX em `StudentHub.tsx`. O JSONB pode ficar sem impacto.

## Testes manuais

1. **Novo usuario**: Cadastrar → onboarding → Hub → tour aparece apos ~1s
2. **Pular tour**: Clicar X → reload → tour nao reaparece
3. **Tour completo**: Passar todos os steps → CTA final → botoes navegam
4. **Checklist items**: Clicar em cada item → navega para pagina → voltar ao Hub → item aparece marcado (verde)
5. **Confetti + auto-dismiss**: Completar 4/4 → confetti dispara → card desaparece automaticamente apos 3s
6. **Dismiss checklist**: Clicar X → reload → checklist nao aparece
7. **Usuario existente**: Logar com conta antiga → nada aparece
8. **Admin/Mentor**: Logar → nada aparece (tour so para student)
9. **Mobile**: Redimensionar < 1024px → tour simplificado sem sidebar
