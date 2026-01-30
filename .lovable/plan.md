
# Plano: Redesign do Relatório de Leads com Visual Premium

## Problema Atual

O relatório está sendo exibido como HTML bruto com formatação genérica. A IA retorna Markdown que é convertido para HTML simples, sem o visual premium desejado com:
- Grid de Diagnóstico (4 cards coloridos)
- Seção do Método ROTA EUA™ (banner escuro com stepper visual)
- Plano de Ação (3 passos com numeração verde)
- Recursos Recomendados (pills com ícones)

## Solução

Alterar a arquitetura para que a **IA retorne dados estruturados em JSON**, permitindo que componentes React renderizem o design premium de forma consistente.

---

## Mudanças Técnicas

### 1. Edge Function: `format-lead-report/index.ts`

**Alterar para usar Tool Calling** (extração estruturada):

```typescript
// Usar tool calling para obter JSON estruturado
body.tools = [{
  type: "function",
  function: {
    name: "format_career_report",
    description: "Estrutura os dados do relatório de carreira em seções organizadas",
    parameters: {
      type: "object",
      properties: {
        greeting: {
          type: "object",
          properties: {
            title: { type: "string" },
            subtitle: { type: "string" },
            phase_highlight: { type: "string" },
            phase_description: { type: "string" }
          }
        },
        diagnostic: {
          type: "object",
          properties: {
            english: { type: "object", properties: { level: {}, description: {} }},
            experience: { type: "object", properties: { summary: {}, details: {} }},
            objective: { type: "object", properties: { goal: {}, timeline: {} }},
            financial: { type: "object", properties: { income: {}, investment: {} }}
          }
        },
        rota_method: {
          type: "object",
          properties: {
            current_phase: { type: "string", enum: ["R", "O", "T", "A"] },
            phase_analysis: { type: "string" }
          }
        },
        action_plan: {
          type: "array",
          items: {
            type: "object",
            properties: {
              step: { type: "number" },
              title: { type: "string" },
              description: { type: "string" }
            }
          }
        },
        resources: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["youtube", "instagram", "guide", "articles", "ebook"] },
              label: { type: "string" },
              url: { type: "string" }
            }
          }
        },
        whatsapp_keyword: { type: "string" }
      }
    }
  }
}];
body.tool_choice = { type: "function", function: { name: "format_career_report" } };
```

**Saída**: Retorna JSON estruturado em vez de HTML

---

### 2. Tipo: `src/types/leads.ts`

Adicionar interface para o relatório estruturado:

```typescript
export interface FormattedReportData {
  greeting: {
    title: string;
    subtitle: string;
    phase_highlight: string;
    phase_description: string;
  };
  diagnostic: {
    english: { level: string; description: string };
    experience: { summary: string; details: string };
    objective: { goal: string; timeline: string };
    financial: { income: string; investment: string };
  };
  rota_method: {
    current_phase: 'R' | 'O' | 'T' | 'A';
    phase_analysis: string;
  };
  action_plan: Array<{
    step: number;
    title: string;
    description: string;
  }>;
  resources: Array<{
    type: 'youtube' | 'instagram' | 'guide' | 'articles' | 'ebook';
    label: string;
    url?: string;
  }>;
  whatsapp_keyword: string;
}
```

---

### 3. Componente: `src/components/report/FormattedReport.tsx`

**Redesign completo** com seções visuais premium:

#### Header Glassmorphism
- Ícone de Globo + "Relatório Individual"
- Botões Imprimir/Fechar

#### Saudação Personalizada
- Card com gradiente sutil
- Nome do lead em destaque
- Box informativo sobre a fase atual

#### Grid de Diagnóstico (2x2)
- 4 cards com ícones coloridos:
  - Inglês (azul) - Languages icon
  - Experiência (indigo) - Briefcase icon
  - Objetivo (purple) - Target icon
  - Financeiro (amber) - DollarSign icon
- Labels uppercase, valores em negrito
- Border radius 40px, sombras suaves

#### Seção Método ROTA EUA™
- Banner escuro (Navy #1e3a8a)
- Stepper horizontal R-O-T-A
- Fase atual destacada com background azul elétrico
- Texto de análise em box translúcido abaixo

#### Plano de Ação (3 Passos)
- Lista vertical de cards brancos
- Números em círculos verdes (1, 2, 3)
- Título + descrição para cada passo
- Espaçamento generoso

#### Recursos Recomendados
- Pills/chips com ícones (YouTube, Instagram, etc.)
- Destaque verde esmeralda para palavra-chave WhatsApp
- Ícone de WhatsApp

#### Rodapé
- Data de geração
- CTA "Baixar PDF Completo"

---

### 4. Novos Componentes Auxiliares

Criar em `src/components/report/`:

| Componente | Função |
|------------|--------|
| `ReportHeader.tsx` | Header glassmorphism com ações |
| `GreetingCard.tsx` | Saudação + fase atual |
| `DiagnosticGrid.tsx` | 4 cards de métricas |
| `RotaMethodSection.tsx` | Banner ROTA com stepper |
| `ActionPlanList.tsx` | 3 passos numerados |
| `ResourcesPills.tsx` | Pills de recursos + WhatsApp |
| `ReportFooter.tsx` | Data + CTA download |

---

### 5. App Config: Atualizar Prompt

Ajustar o prompt no banco para instruir a IA a retornar os dados de forma compatível com a estrutura JSON (o tool calling força isso, mas o prompt guia a qualidade do conteúdo).

---

## Fluxo Atualizado

```text
Usuário acessa /report/:token
         │
         ▼
Verifica email (gatekeeper)
         │
         ▼
Carrega dados da career_evaluation
         │
         ▼
Edge function format-lead-report
    ├── Envia dados para Lovable AI com tool calling
    ├── Recebe JSON estruturado
    └── Cacheia no banco (formatted_report como JSON string)
         │
         ▼
React renderiza componentes visuais premium
    ├── ReportHeader
    ├── GreetingCard
    ├── DiagnosticGrid
    ├── RotaMethodSection
    ├── ActionPlanList
    ├── ResourcesPills
    └── ReportFooter
```

---

## Design Guidelines

- **Border Radius**: 40px para cards principais, 24px para secundários, 12px para botões
- **Cores**: Navy (#1e3a8a), Azul Elétrico (#2563EB), Verde Esmeralda (#059669)
- **Tipografia**: Inter, weights 400/500/600/700
- **Sombras**: `shadow-sm` e `shadow-md` sutis
- **Glassmorphism**: `backdrop-blur-md` + `bg-white/80`
- **Espaçamento**: padding 24-32px entre seções
- **Responsivo**: Grid 2x2 → 1x4 em mobile

---

## Arquivos a Modificar/Criar

| Ação | Arquivo |
|------|---------|
| Modificar | `supabase/functions/format-lead-report/index.ts` |
| Modificar | `src/types/leads.ts` |
| Reescrever | `src/components/report/FormattedReport.tsx` |
| Criar | `src/components/report/ReportHeader.tsx` |
| Criar | `src/components/report/GreetingCard.tsx` |
| Criar | `src/components/report/DiagnosticGrid.tsx` |
| Criar | `src/components/report/RotaMethodSection.tsx` |
| Criar | `src/components/report/ActionPlanList.tsx` |
| Criar | `src/components/report/ResourcesPills.tsx` |
| Criar | `src/components/report/ReportFooter.tsx` |
| Modificar | `src/pages/report/PublicReport.tsx` |

---

## Benefícios

1. **Consistência Visual**: Mesma aparência premium para todos os relatórios
2. **Manutenibilidade**: Componentes modulares e reutilizáveis
3. **Qualidade de IA**: Tool calling garante estrutura válida
4. **Performance**: JSON é menor que HTML, cacheável
5. **Design System**: Segue os padrões "Elite SaaS" da plataforma
