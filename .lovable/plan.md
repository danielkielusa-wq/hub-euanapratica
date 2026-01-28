
# Plano: Unificacao Gestao de Produtos + Meu Hub (Stripe Ready)

## Visao Geral

Atualmente existem DOIS sistemas separados:
1. **Tabela `products`** - Usada por AdminProducts (simples, focada em acesso)
2. **Tabela `hub_services`** - Usada por StudentHub (mais completa, com icones/status)

**Decisao de Arquitetura**: Vamos unificar usando a tabela `hub_services` como source of truth, pois ela ja possui os campos necessarios para display e Stripe. A tabela `products` sera deprecada em favor de `hub_services`.

---

## PARTE 1: AJUSTE DE BANCO DE DADOS

### 1.1 Adicionar Campos a `hub_services`

Novos campos necessarios para o design premium e conversao:

```sql
ALTER TABLE public.hub_services ADD COLUMN IF NOT EXISTS ribbon TEXT;
-- Valores: 'NOVO', 'POPULAR', 'EXCLUSIVO', null

ALTER TABLE public.hub_services ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT 'ai_tool';
-- Valores: 'ai_tool', 'live_mentoring', 'recorded_course', 'consulting'

ALTER TABLE public.hub_services ADD COLUMN IF NOT EXISTS price NUMERIC(10,2) DEFAULT 0;
-- Preco numerico para calculo/display

ALTER TABLE public.hub_services ADD COLUMN IF NOT EXISTS cta_text TEXT DEFAULT 'Acessar Agora';
-- Texto do botao personalizado

ALTER TABLE public.hub_services ADD COLUMN IF NOT EXISTS redirect_url TEXT;
-- URL de destino apos compra/acesso

ALTER TABLE public.hub_services ADD COLUMN IF NOT EXISTS accent_color TEXT;
-- Cor de destaque opcional (hex)
```

### 1.2 RLS Policies (ja existentes)

As policies atuais sao suficientes:
- Admins podem gerenciar (ALL)
- Usuarios autenticados podem visualizar (`is_visible_in_hub = true`)

---

## PARTE 2: ADMIN PANEL - REDESIGN COMPLETO

### 2.1 Nova Estrutura Visual (Inspiracao: Imagem de Referencia)

**Header da Pagina:**
```
Gestao de Produtos
Administre o catalogo de servicos do Hub e as regras de checkout.
                                          [+ Criar Servico]
```

**Tabela Premium:**
| ORD. | SERVICO | MODALIDADE | PRECO / STRIPE ID | STATUS | ACOES |
|------|---------|------------|-------------------|--------|-------|
| 1 | [icon] Imersao Fevereiro POPULAR | RECORDED COURSE | R$ 2.197,00 # Sem Stripe ID | VISIVEL | Edit/Del |
| 2 | [icon] Curriculo USA AI NOVO | AI TOOL | R$ 97,00 # price_1QxABC123 | VISIVEL | Edit/Del |

**Colunas:**
- Ordem (numero editavel inline)
- Icone + Nome + Ribbon badge + Categoria
- Modalidade (badge colorido)
- Preco formatado + Stripe ID (monospace, copiavel)
- Status (badge VISIVEL/OCULTO)
- Acoes (Edit/Delete icons)

### 2.2 Modal de Edicao (Sections)

**Design baseado na imagem de referencia:**

```
+------------------------------------------------------------------+
| Novo Produto                                               [X]   |
| Defina regras de acesso, precificacao e como o servico           |
| aparece no Hub.                                                   |
+------------------------------------------------------------------+
| [icon] IDENTIDADE & VISIBILIDADE                                 |
|                                                                   |
| NOME DO PRODUTO *          FITA DE DESTAQUE (RIBBON)             |
| [Ex: Mentoria Elite Track] [Ex: NOVO, POPULAR             v]     |
|                                                                   |
| DESCRICAO NO HUB                                                  |
| [Texto curto que aparecera no card do servico...            ]    |
+------------------------------------------------------------------+
| [cards] TIPO DE SERVICO        [icons] ICONE VISUAL              |
|                                                                   |
| [x] FERRAMENTA DE IA           [ ][FileCheck][Monitor][Globe]    |
| [ ] MENTORIA AO VIVO           [GradCap][Award][Building2]       |
| [ ] CURSO GRAVADO              [Sparkles]                        |
| [ ] CONSULTORIA AD-HOC                                           |
+------------------------------------------------------------------+
| [tag] PRECIFICACAO             [tag] CONVERSAO & CHECKOUT        |
|                                                                   |
| [x] ONE TIME PURCHASE          STRIPE PRICE ID                   |
| [ ] LIFETIME                   [price_...]                       |
| [ ] SUBSCRIPTION MONTHLY                                         |
| [ ] SUBSCRIPTION ANNUAL        TEXTO DO BOTAO (CTA)              |
|                                [Acessar Agora]                   |
| PRECO DE VENDA (R$) | ORDEM                                      |
| [R$ 0             ] | [1  ]    URL DE REDIRECIONAMENTO           |
|                               [/dashboard/ia ou https://...  ]   |
+------------------------------------------------------------------+
|                         [Cancelar] [Salvar Produto & Publicar]   |
+------------------------------------------------------------------+
```

### 2.3 Componentes Admin

**Novos Arquivos:**
- `src/pages/admin/AdminHubServices.tsx` (substitui AdminProducts)
- `src/components/admin/hub/HubServiceForm.tsx` - Modal de edicao
- `src/components/admin/hub/ServiceTypeSelector.tsx` - Cards de tipo
- `src/components/admin/hub/IconSelector.tsx` - Grid de icones Lucide

**Hook Atualizado:**
- `src/hooks/useAdminHubServices.ts` - CRUD para hub_services

---

## PARTE 3: STUDENT HUB - REDESIGN DINAMICO

### 3.1 Logica de Exibicao

```typescript
// Buscar servicos da tabela hub_services (nao hardcoded)
const { data: services } = useHubServices(); // is_visible_in_hub = true
const { data: userAccess } = useUserHubAccess(); // user_hub_services

// Separar em secoes
const activeServices = services?.filter(s => 
  userAccess.includes(s.id) || s.status === 'available'
);

const exploreServices = services?.filter(s => 
  (s.status === 'premium' && !userAccess.includes(s.id)) || 
  s.status === 'coming_soon'
);
```

### 3.2 Card Visual Atualizado

Baseado no design premium:

```
+---------------------------------------------+
| [RIBBON: POPULAR]              [Badge: IA]  |
|                                             |
|         [Icon 48px - FileCheck]             |
|                                             |
|      Curriculo USA AI [Sparkles]            |
|      CARREIRA                               |
|                                             |
|   Valide se seu curriculo passa nos         |
|   robos (ATS) das empresas americanas...    |
|                                             |
|   [ R$ 97,00 / unico ]                      |
|                                             |
|   [========= Acessar Agora -> =========]    |
|   ou                                        |
|   [------ Desbloquear Acesso [Lock] ------] |
+---------------------------------------------+
```

**Logica de Botoes:**

```typescript
if (hasAccess) {
  // Botao primario cheio
  return (
    <Button className="bg-primary text-white">
      {service.cta_text || 'Acessar Agora'} <ArrowRight />
    </Button>
  );
  // Acao: navigate(service.redirect_url || service.route)
} else if (service.status === 'coming_soon') {
  // Botao desabilitado
  return <Button disabled>Em Breve</Button>;
} else {
  // Botao outline com cadeado
  return (
    <Button variant="outline">
      <Lock /> Desbloquear Acesso
    </Button>
  );
  // Acao: Stripe Checkout ou redirect para pagina de vendas
}
```

### 3.3 Stripe Checkout Integration

**Fluxo de Compra (preparado para Stripe):**

1. Usuario clica em "Desbloquear Acesso"
2. Frontend chama edge function com `service.stripe_price_id`
3. Edge function cria Stripe Checkout Session
4. Usuario e redirecionado para Stripe
5. Apos pagamento, Stripe Webhook atualiza `user_hub_services`

**Nota**: A integracao completa com Stripe sera habilitada quando o usuario ativar o Stripe. O sistema esta "payment ready".

---

## PARTE 4: TIPOS E HOOKS

### 4.1 Tipo Atualizado

```typescript
// src/types/hub.ts
export type ServiceType = 'ai_tool' | 'live_mentoring' | 'recorded_course' | 'consulting';
export type ServiceStatus = 'available' | 'premium' | 'coming_soon';
export type ProductType = 'one_time' | 'lifetime' | 'subscription_monthly' | 'subscription_annual';

export interface HubService {
  id: string;
  name: string;
  description: string | null;
  icon_name: string;
  status: ServiceStatus;
  service_type: ServiceType;
  ribbon: string | null; // 'NOVO', 'POPULAR', 'EXCLUSIVO'
  category: string | null;
  route: string | null;
  redirect_url: string | null;
  cta_text: string;
  
  // Display
  is_visible_in_hub: boolean;
  is_highlighted: boolean;
  display_order: number;
  accent_color: string | null;
  
  // Pricing
  price: number;
  price_display: string | null;
  currency: string;
  product_type: ProductType;
  stripe_price_id: string | null;
  
  created_at: string;
  updated_at: string;
}
```

### 4.2 Hooks Atualizados

```typescript
// src/hooks/useAdminHubServices.ts
export function useAdminHubServices() { ... } // CRUD completo (sem filtro is_visible)
export function useCreateHubService() { ... }
export function useUpdateHubService() { ... }
export function useDeleteHubService() { ... }

// src/hooks/useHubServices.ts (update)
// Ja existe, apenas garantir que retorna todos os campos
```

---

## PARTE 5: RESUMO DE ARQUIVOS

### Criar:
| Arquivo | Descricao |
|---------|-----------|
| `src/pages/admin/AdminHubServices.tsx` | Nova pagina de gestao |
| `src/components/admin/hub/HubServiceForm.tsx` | Modal de edicao completo |
| `src/components/admin/hub/ServiceTypeSelector.tsx` | Selector visual de tipo |
| `src/components/admin/hub/IconSelector.tsx` | Grid de icones Lucide |
| `src/hooks/useAdminHubServices.ts` | Hooks CRUD para admin |
| `src/types/hub.ts` | Tipos TypeScript |

### Modificar:
| Arquivo | Descricao |
|---------|-----------|
| `src/components/hub/HubServiceCard.tsx` | Novo design com ribbon/tipo |
| `src/pages/hub/StudentHub.tsx` | Usar dados dinamicos |
| `src/hooks/useHubServices.ts` | Retornar campos adicionais |
| `src/App.tsx` | Atualizar rota /admin/produtos |
| `src/components/layouts/DashboardLayout.tsx` | Menu label |
| Migracao SQL | Novos campos em hub_services |

### Deprecar:
| Arquivo | Acao |
|---------|------|
| `src/pages/admin/AdminProducts.tsx` | Substituir por AdminHubServices |
| `src/hooks/useAdminProducts.ts` | Migrar para useAdminHubServices |

---

## PARTE 6: DESIGN SYSTEM APLICADO

### Paleta de Cores
- Background pagina: `#F5F5F7` (`bg-muted/30`)
- Cards: `#FFFFFF` (`bg-card`)
- Primary: `#2563EB` (`text-primary`)
- Text: `#1F2937` (`text-foreground`)
- Muted: `#6B7280` (`text-muted-foreground`)

### Componentes
- Cards: `rounded-[32px]` ou `rounded-[40px]`
- Shadows: `shadow-sm` base, `shadow-md` hover
- Transicoes: `transition-all duration-300 hover:-translate-y-1`
- Badges de Tipo:
  - AI TOOL: `bg-primary/10 text-primary`
  - LIVE MENTORING: `bg-green-100 text-green-700`
  - RECORDED COURSE: `bg-purple-100 text-purple-700`
  - CONSULTING: `bg-orange-100 text-orange-700`

### Icones Disponiveis no Selector
```typescript
const availableIcons = [
  'FileCheck', 'GraduationCap', 'Award', 'Monitor', 
  'Globe', 'Building2', 'Sparkles', 'Briefcase',
  'BookOpen', 'Mic', 'Video', 'Users', 'Rocket'
];
```

---

## PARTE 7: RESPONSIVIDADE

- **Mobile (< 768px)**: 1 coluna, cards full width
- **Tablet (768px - 1024px)**: 2 colunas
- **Desktop (> 1024px)**: 3 colunas
- **Modal**: Full screen em mobile, `max-w-2xl` centered em desktop
- **Tabela Admin**: Scroll horizontal em mobile

---

## ORDEM DE IMPLEMENTACAO

1. **Migracao SQL** - Adicionar campos a hub_services
2. **Tipos TypeScript** - Criar src/types/hub.ts
3. **Hooks Admin** - useAdminHubServices.ts
4. **Componentes Admin** - Form, Selectors
5. **AdminHubServices Page** - Tabela + Modal
6. **Atualizar HubServiceCard** - Design premium
7. **Atualizar StudentHub** - Logica dinamica
8. **Atualizar Rotas** - App.tsx e DashboardLayout
9. **Testar fluxo completo**
