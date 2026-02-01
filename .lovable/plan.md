
# Plano: Sistema de Leads Avançado com CTAs Dinâmicos

## Visão Geral

Implementar três melhorias no sistema de leads:
1. Adicionar opção "Leads Importados" no menu admin
2. Botão de refresh na tabela para regenerar relatório via IA
3. CTAs dinâmicos baseados em serviços configurados no hub_services
4. Novo modal de visualização do relatório seguindo o design anexado

---

## 1. Adicionar ao Menu de Navegação

### Arquivo: `src/components/layouts/DashboardLayout.tsx`

Adicionar item na seção "FERRAMENTAS" do admin:

| Ação | Descrição |
|------|-----------|
| Import | Adicionar `FileSpreadsheet` icon |
| Nav Item | `{ label: 'Leads Importados', href: '/admin/leads', icon: FileSpreadsheet }` |

---

## 2. Botão de Refresh na Tabela

### Arquivo: `src/components/admin/leads/LeadsTable.tsx`

Modificações:
- Adicionar botão de refresh (`RefreshCw` icon) em cada row
- Ao clicar, chamar edge function `format-lead-report` com `forceRefresh: true`
- Mostrar estado de loading durante regeneração
- Atualizar a row na tabela após sucesso
- Adicionar botão "Ver Relatório" que abre modal interno

Novo componente de ação:
```tsx
<Button
  variant="ghost"
  size="icon"
  onClick={() => handleRefresh(evaluation.id)}
  disabled={refreshingId === evaluation.id}
  title="Regenerar relatório"
>
  <RefreshCw className={cn("w-4 h-4", refreshingId === evaluation.id && "animate-spin")} />
</Button>
```

### Edge Function: `supabase/functions/format-lead-report/index.ts`

Modificar para aceitar parâmetro `forceRefresh`:
- Se `forceRefresh: true`, ignorar cache e regenerar
- Limpar `formatted_report` antes de chamar IA
- Retornar novo conteúdo formatado

---

## 3. CTAs Dinâmicos Baseados em Hub Services

### Edge Function: `format-lead-report/index.ts`

Modificar o prompt de IA para:

1. **Buscar serviços disponíveis** do `hub_services` onde `status = 'available'`
2. **Passar lista de serviços** no contexto do prompt
3. **Adicionar campo `recommendations`** no schema de tool calling

Novo schema para recommendations:
```typescript
recommendations: {
  type: "array",
  items: {
    type: "object",
    properties: {
      service_id: { type: "string", description: "ID do serviço recomendado" },
      type: { type: "string", enum: ["PRIMARY", "SECONDARY", "UPGRADE"] },
      reason: { type: "string", description: "Por que este serviço é recomendado para o lead" }
    }
  }
}
```

### Atualizar tipo `FormattedReportData` em `src/types/leads.ts`:

```typescript
recommendations?: Array<{
  service_id: string;
  type: 'PRIMARY' | 'SECONDARY' | 'UPGRADE';
  reason: string;
}>;
```

---

## 4. Modal de Visualização do Relatório (Admin)

### Novo Componente: `src/components/admin/leads/LeadReportModal.tsx`

Seguindo o layout do template `AdminUserReportModal.tsx`:

#### Estrutura Visual

```text
┌─────────────────────────────────────────────────────────────┐
│  Header: Globe Icon + "Relatório Individual" + Print/Close  │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Greeting Card (com fase destacada)                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ Inglês   │ │Experiênc.│ │ Objetivo │ │Financeiro│        │
│  │ Badge    │ │  Badge   │ │  Badge   │ │  Badge   │        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ROTA EUA Section (Dark - R O T A grid)              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Plano de Ação (3 passos numerados)                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  PRÓXIMOS PASSOS ESTRATÉGICOS (CTAs)                 │   │
│  │  ┌─────────────────────┐ ┌─────────┐                 │   │
│  │  │  PRIMARY (2 cols)   │ │SECONDARY│                 │   │
│  │  │  Dark card          │ │ + UPGRADE│                 │   │
│  │  └─────────────────────┘ └─────────┘                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  Footer: Status indicator + "Baixar PDF" button             │
└─────────────────────────────────────────────────────────────┘
```

#### Componentes Reutilizáveis

- **DiagnosticCard**: Grid 2x2 com métricas
- **RotaSection**: Seção dark com as 4 fases
- **ActionPlanCard**: Lista numerada de ações
- **RecommendationCards**: Grid de CTAs (PRIMARY em 2 cols, resto empilhado)

#### Mapeamento de Cores (brand-* → design tokens)

| Template | Projeto |
|----------|---------|
| `brand-50` | `bg-primary/5` |
| `brand-100` | `text-blue-100` |
| `brand-600` | `text-primary` |
| `brand-900` | `bg-[#1e3a8a]` |
| `gray-900` | `text-foreground` |
| `gray-50` | `bg-muted` |

---

## 5. Integração na LeadsTable

### Modificar `LeadsTable.tsx`:

```tsx
// Estados
const [selectedEvaluation, setSelectedEvaluation] = useState<CareerEvaluation | null>(null);
const [isModalOpen, setIsModalOpen] = useState(false);
const [refreshingId, setRefreshingId] = useState<string | null>(null);

// Funções
const handleViewReport = (evaluation: CareerEvaluation) => {
  setSelectedEvaluation(evaluation);
  setIsModalOpen(true);
};

const handleRefresh = async (id: string) => {
  setRefreshingId(id);
  const { data, error } = await supabase.functions.invoke('format-lead-report', {
    body: { evaluationId: id, forceRefresh: true }
  });
  if (!error && data?.content) {
    // Atualizar a lista local
    setEvaluations(prev => prev.map(e => 
      e.id === id 
        ? { ...e, formatted_report: JSON.stringify(data.content), formatted_at: new Date().toISOString() }
        : e
    ));
    toast({ title: 'Relatório regenerado!' });
  }
  setRefreshingId(null);
};
```

---

## 6. Arquivos a Modificar/Criar

| Ação | Arquivo | Descrição |
|------|---------|-----------|
| Modificar | `src/components/layouts/DashboardLayout.tsx` | Adicionar menu item |
| Modificar | `src/components/admin/leads/LeadsTable.tsx` | Botões refresh e view |
| Criar | `src/components/admin/leads/LeadReportModal.tsx` | Modal de visualização |
| Modificar | `supabase/functions/format-lead-report/index.ts` | forceRefresh + recommendations |
| Modificar | `src/types/leads.ts` | Adicionar campo recommendations |

---

## 7. Fluxo do Usuário

```text
Admin navega para Leads Importados (via menu)
          │
          ▼
Visualiza tabela com leads importados
          │
          ├── Clica em "Ver" → Abre LeadReportModal com relatório formatado
          │                     └── Exibe CTAs dinâmicos baseados em hub_services
          │
          ├── Clica em "Refresh" → Edge function regenera relatório
          │                        └── Atualiza row na tabela
          │
          └── Clica em "Copy" → Copia URL pública do relatório
```

---

## 8. CTAs Dinâmicos - Lógica de Matching

A IA receberá a lista de serviços disponíveis:
- **Currículo e LinkedIn Magnético** → Recomendado se fase = "O"
- **Sessão de Direção ROTA EUA** → Recomendado se fase = "R"
- **Mentoria em Grupo** → Recomendado como UPGRADE
- **Mentoria Individual** → Recomendado como UPGRADE premium

O prompt instruirá a IA a:
1. Analisar a fase atual do lead (R, O, T, A)
2. Selecionar até 3 serviços relevantes
3. Classificar como PRIMARY, SECONDARY ou UPGRADE
4. Explicar o motivo da recomendação

---

## Resumo de Mudanças

| Arquivo | Linhas Estimadas |
|---------|------------------|
| `DashboardLayout.tsx` | +2 linhas |
| `LeadsTable.tsx` | ~80 linhas modificadas |
| `LeadReportModal.tsx` | ~350 linhas (novo) |
| `format-lead-report/index.ts` | ~60 linhas modificadas |
| `types/leads.ts` | ~10 linhas |

