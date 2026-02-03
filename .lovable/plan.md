
# Plano: Sistema de Controle de Acesso Baseado em Planos

## Visao Geral

Este plano implementa uma arquitetura completa de controle de acesso por assinatura onde TODAS as funcionalidades da plataforma respeitam dinamicamente as configuracoes de plano definidas pelos administradores.

---

## Analise do Estado Atual

### O Que Ja Existe

| Componente | Status | Observacoes |
|------------|--------|-------------|
| Tabela `plans` | Existe | Contem id, name, price, monthly_limit, features (JSONB) |
| Tabela `user_subscriptions` | Existe | Contem user_id, plan_id, status, starts_at, expires_at |
| Hook `useSubscription` | Existe | Retorna quota do usuario (planId, remaining, features) |
| Trigger Hot Seats | Existe | Sincroniza membros PRO/VIP automaticamente |
| RPC `get_user_quota` | Existe | Retorna limites e uso do mes |
| `PlanConfigCard` | Existe | UI basica para configurar features Curriculo USA |

### O Que Falta Implementar

1. **Schema de Planos Expandido**: Novos campos para precos anuais, features de acesso, descontos por produto
2. **Admin UI Redesenhada**: Baseada no arquivo `plan-2.tsx` com secoes completas
3. **Sistema de Descontos**: Vincular desconto % aos hub_services (produtos)
4. **Access Control Centralizado**: Hook unificado `usePlanAccess` 
5. **Navegacao Dinamica**: Sidebar que respeita features do plano
6. **Job Concierge**: Estrutura preparatoria para futuro

---

## Arquitetura Proposta

```text
+-----------------------------------------------+
|            Database: plans (expandido)        |
|  - price_monthly, price_annual                |
|  - features: { hotseats, community, library,  |
|                masterclass, job_concierge,    |
|                resume_pass_limit, discounts } |
+-----------------------------------------------+
                     |
                     v
+-----------------------------------------------+
|          RPC: get_full_plan_config            |
|  - Retorna configuracao completa do plano     |
|  - Inclui descontos por produto               |
+-----------------------------------------------+
                     |
                     v
+-----------------------------------------------+
|       Hook: usePlanAccess (centralizado)      |
|  - hasFeature('hotseats') => boolean          |
|  - getLimit('resume_pass') => number          |
|  - getDiscount('consulting') => number        |
|  - canAccess('/biblioteca') => boolean        |
+-----------------------------------------------+
                     |
         +-----------+-----------+
         |           |           |
         v           v           v
+-------------+ +-------------+ +-------------+
| DashboardLayout | ServiceGuard | FreeToolsSection |
| - Menu dinamico | - Paywall   | - Limites UI |
+-------------+ +-------------+ +-------------+
```

---

## Mudancas no Banco de Dados

### 1. Expandir Tabela `plans`

```sql
ALTER TABLE plans ADD COLUMN IF NOT EXISTS price_annual numeric DEFAULT 0;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS theme text DEFAULT 'gray';
```

### 2. Atualizar Estrutura JSONB `features`

A coluna `features` sera expandida para incluir:

```jsonb
{
  // Limites
  "resume_pass_limit": 1,
  "job_concierge_count": 0,
  
  // Toggles de Acesso
  "hotseats": false,
  "hotseat_priority": false,
  "hotseat_guaranteed": false,
  "community": true,
  "library": false,
  "masterclass": false,
  "job_concierge": false,
  
  // Features Curriculo USA (existente)
  "show_improvements": false,
  "show_power_verbs": false,
  "show_cheat_sheet": false,
  "allow_pdf": false,
  
  // Descontos por Categoria de Produto
  "discounts": {
    "base": 0,
    "consulting": 0,
    "curriculum": 0,
    "mentorship_group": 0,
    "mentorship_individual": 0
  },
  
  // Cupom aplicado automaticamente
  "coupon_code": ""
}
```

### 3. Criar Tabela de Mapeamento Produto-Desconto (Opcional)

Para vincular descontos diretamente aos produtos em `hub_services`:

```sql
CREATE TABLE IF NOT EXISTS plan_product_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id TEXT REFERENCES plans(id) ON DELETE CASCADE,
  hub_service_id UUID REFERENCES hub_services(id) ON DELETE CASCADE,
  discount_percent INTEGER DEFAULT 0,
  coupon_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(plan_id, hub_service_id)
);
```

---

## Arquivos a Criar

### 1. `src/hooks/usePlanAccess.ts` - Hook Centralizado

```typescript
interface PlanAccess {
  // Identidade do Plano
  planId: string;
  planName: string;
  theme: 'gray' | 'blue' | 'purple';
  
  // Metodos de Acesso
  hasFeature: (feature: PlanFeatureKey) => boolean;
  getLimit: (feature: LimitedFeature) => number;
  getUsage: (feature: LimitedFeature) => number;
  getRemaining: (feature: LimitedFeature) => number;
  getDiscountForProduct: (serviceId: string) => number;
  getCouponCode: () => string;
  
  // Helpers para UI
  canAccessRoute: (route: string) => boolean;
  shouldShowUpgrade: (feature: string) => boolean;
  
  // Estado
  isLoading: boolean;
}

// Mapeamento de rotas para features
const ROUTE_FEATURES: Record<string, PlanFeatureKey> = {
  '/biblioteca': 'library',
  '/comunidade': 'community',
  '/masterclass': 'masterclass',
  '/curriculo': 'resume_pass', // Sempre disponivel, mas com limite
};
```

### 2. `src/types/plans.ts` - Tipos Centralizados

```typescript
export type PlanTier = 'basic' | 'pro' | 'vip';
export type PlanTheme = 'gray' | 'blue' | 'purple';

export interface PlanFeatures {
  // Limites
  resume_pass_limit: number;
  job_concierge_count: number;
  
  // Toggles de Acesso
  hotseats: boolean;
  hotseat_priority: boolean;
  hotseat_guaranteed: boolean;
  community: boolean;
  library: boolean;
  masterclass: boolean;
  job_concierge: boolean;
  
  // Features Curriculo USA
  show_improvements: boolean;
  show_power_verbs: boolean;
  show_cheat_sheet: boolean;
  allow_pdf: boolean;
  
  // Descontos
  discounts: {
    base: number;
    consulting: number;
    curriculum: number;
    mentorship_group: number;
    mentorship_individual: number;
  };
  
  coupon_code: string;
}

export interface FullPlanConfig {
  id: string;
  name: string;
  price_monthly: number;
  price_annual: number;
  theme: PlanTheme;
  is_active: boolean;
  features: PlanFeatures;
  display_features: string[];
}
```

### 3. `src/components/guards/FeatureGate.tsx` - Wrapper Reutilizavel

```typescript
interface FeatureGateProps {
  feature: PlanFeatureKey;
  children: ReactNode;
  fallback?: ReactNode; // Mostrar upgrade prompt
  showLocked?: boolean; // Mostrar com blur + cadeado
}

export function FeatureGate({ feature, children, fallback, showLocked }: FeatureGateProps) {
  const { hasFeature, planName } = usePlanAccess();
  
  if (!hasFeature(feature)) {
    if (showLocked) {
      return (
        <LockedFeatureOverlay feature={feature}>
          {children}
        </LockedFeatureOverlay>
      );
    }
    return fallback || <UpgradePrompt feature={feature} />;
  }
  
  return <>{children}</>;
}
```

---

## Arquivos a Modificar

### 1. `src/pages/admin/AdminPlans.tsx` - Nova UI Completa

Substituir pela UI do arquivo `plan-2.tsx` com:

- **Header**: Nome do plano editavel, toggle ativo/inativo
- **Precos**: Campos para mensal e anual com calculo automatico de desconto %
- **Secao ResumePass AI**: Limite mensal
- **Secao Features**: Toggles para community, hotseats, library, masterclass
- **Secao Job Concierge**: Toggle + contador de vagas/mes
- **Secao Prioridade**: Checkbox para prioridade e garantia de vaga
- **Secao Descontos**: Cupom + % por categoria de produto

Design:
- Cards com `rounded-[32px]`
- Headers coloridos por tema (gray, blue/brand, purple)
- Icones Lucide: Zap, Users, Crown, Percent, Briefcase, Ticket

### 2. `src/hooks/useAdminPlans.ts` - Expandir para Novos Campos

```typescript
export interface ExpandedPlanConfig {
  id: string;
  name: string;
  theme: 'gray' | 'blue' | 'purple';
  is_active: boolean;
  price_monthly: number;
  price_annual: number;
  features: PlanFeatures; // Expandido
  display_features: string[];
}
```

### 3. `src/components/layouts/DashboardLayout.tsx` - Navegacao Dinamica

```typescript
// Antes: Menu estatico
// Depois: Menu que verifica acesso antes de renderizar

const getVisibleNavItems = (section: NavSection, checkAccess: Function) => {
  return section.items.filter(item => {
    // Sempre mostrar itens principais
    if (!item.requiresFeature) return true;
    
    // Verificar se feature esta habilitada no plano
    return checkAccess(item.requiresFeature);
  });
};

// Itens que requerem verificacao
{ label: 'Comunidade', href: '/comunidade', icon: Users, requiresFeature: 'community' },
{ label: 'Biblioteca', href: '/biblioteca', icon: Library, requiresFeature: 'library' },
```

Opcoes de comportamento para itens bloqueados:
1. **Ocultar completamente** (recomendado para simplicidade)
2. **Mostrar desabilitado** com icone de cadeado e tooltip "Disponivel no PRO"

### 4. `src/components/guards/ServiceGuard.tsx` - Verificar Features do Plano

```typescript
// Adicionar verificacao de feature alem de servico contratado
export function ServiceGuard({ serviceRoute, requiredFeature, children }) {
  const { hasAccess } = useServiceAccess(serviceRoute);
  const { hasFeature, getRemaining } = usePlanAccess();
  
  // Verificar se feature esta habilitada E se tem limite disponivel
  const featureEnabled = requiredFeature ? hasFeature(requiredFeature) : true;
  const hasQuota = getRemaining('resume_pass') > 0; // Para features limitadas
  
  if (!hasAccess || !featureEnabled) {
    // Redirecionar com toast apropriado
  }
  
  return <>{children}</>;
}
```

### 5. `src/pages/hub/StudentHub.tsx` - Respeitar Features do Plano

Adicionar:
- Secao de Eventos (Hotseats) apenas se `features.hotseats = true`
- Badge de plano com cor correta (gray/blue/purple)
- Indicador de creditos restantes para ResumePass
- Desconto automatico nos precos exibidos

### 6. `src/components/hub/SecondaryServicesGrid.tsx` - Aplicar Descontos

```typescript
// Ao exibir preco de um produto
const { getDiscountForProduct } = usePlanAccess();
const discount = getDiscountForProduct(service.id);
const finalPrice = service.price * (1 - discount / 100);

// UI mostra:
// - Preco original riscado
// - Preco com desconto
// - Badge "Seu desconto PRO: 10% off"
```

---

## Fluxo de Dados

### Atualizacao de Plano (Admin)

```text
Admin edita plano no /admin/planos
    ↓
Salva em plans.features (JSONB)
    ↓
RPC get_user_quota retorna novos valores
    ↓
usePlanAccess detecta mudanca
    ↓
UI atualiza imediatamente (menus, badges, limites)
```

### Verificacao de Acesso (Usuario)

```text
Usuario tenta acessar /biblioteca
    ↓
ServiceGuard consulta usePlanAccess
    ↓
hasFeature('library') = false?
    ↓
Redireciona para /dashboard/hub + toast "Disponivel no PRO"
```

### Aplicacao de Desconto (Checkout)

```text
Usuario visualiza produto no Hub
    ↓
usePlanAccess.getDiscountForProduct(serviceId)
    ↓
UI exibe preco original e descontado
    ↓
Cupom automatico aplicado via coupon_code do plano
```

---

## Secao Tecnica: RPC Expandida

### Criar `get_full_plan_access`

```sql
CREATE OR REPLACE FUNCTION get_full_plan_access(p_user_id UUID)
RETURNS TABLE (
  plan_id TEXT,
  plan_name TEXT,
  theme TEXT,
  price_monthly NUMERIC,
  price_annual NUMERIC,
  features JSONB,
  used_this_month INTEGER,
  remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(us.plan_id, 'basic'),
    COALESCE(p.name, 'Básico'),
    COALESCE(p.theme, 'gray'),
    COALESCE(p.price, 0),
    COALESCE(p.price_annual, 0),
    COALESCE(p.features, '{}'::jsonb),
    COALESCE((
      SELECT COUNT(*)::INTEGER 
      FROM usage_logs ul 
      WHERE ul.user_id = p_user_id 
        AND ul.app_id = 'curriculo_usa'
        AND ul.created_at >= date_trunc('month', now())
    ), 0),
    GREATEST(0, COALESCE((p.features->>'resume_pass_limit')::INT, 1) - ...)
  FROM (SELECT p_user_id AS user_id) u
  LEFT JOIN user_subscriptions us ON us.user_id = u.user_id AND us.status = 'active'
  LEFT JOIN plans p ON p.id = COALESCE(us.plan_id, 'basic');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Migracoes de Dados

### 1. Expandir `features` dos Planos Existentes

```sql
-- Adicionar novos campos aos features existentes
UPDATE plans SET features = features || jsonb_build_object(
  'hotseats', CASE WHEN id IN ('pro', 'vip') THEN true ELSE false END,
  'hotseat_priority', CASE WHEN id = 'vip' THEN true ELSE false END,
  'hotseat_guaranteed', CASE WHEN id = 'vip' THEN true ELSE false END,
  'community', true,
  'library', CASE WHEN id IN ('pro', 'vip') THEN true ELSE false END,
  'masterclass', CASE WHEN id IN ('pro', 'vip') THEN true ELSE false END,
  'job_concierge', CASE WHEN id = 'vip' THEN true ELSE false END,
  'job_concierge_count', CASE WHEN id = 'vip' THEN 20 ELSE 0 END,
  'resume_pass_limit', monthly_limit,
  'discounts', jsonb_build_object(
    'base', CASE id WHEN 'pro' THEN 10 WHEN 'vip' THEN 20 ELSE 0 END,
    'consulting', CASE id WHEN 'pro' THEN 10 WHEN 'vip' THEN 20 ELSE 0 END,
    'curriculum', CASE id WHEN 'pro' THEN 10 WHEN 'vip' THEN 20 ELSE 0 END,
    'mentorship_group', CASE id WHEN 'pro' THEN 5 WHEN 'vip' THEN 15 ELSE 0 END,
    'mentorship_individual', CASE id WHEN 'vip' THEN 10 ELSE 0 END
  ),
  'coupon_code', CASE id WHEN 'pro' THEN 'PRO10OFF' WHEN 'vip' THEN 'VIP20ELITE' ELSE '' END
)
WHERE is_active = true;
```

### 2. Adicionar Coluna `theme` e `price_annual`

```sql
ALTER TABLE plans ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'gray';
ALTER TABLE plans ADD COLUMN IF NOT EXISTS price_annual NUMERIC DEFAULT 0;

UPDATE plans SET 
  theme = CASE id WHEN 'basic' THEN 'gray' WHEN 'pro' THEN 'blue' WHEN 'vip' THEN 'purple' END,
  price_annual = price * 10 -- 2 meses gratis
WHERE is_active = true;
```

---

## Lista de Arquivos

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/types/plans.ts` | **CRIAR** | Tipos centralizados para planos |
| `src/hooks/usePlanAccess.ts` | **CRIAR** | Hook unificado de acesso |
| `src/components/guards/FeatureGate.tsx` | **CRIAR** | Wrapper para gates de feature |
| `src/pages/admin/AdminPlans.tsx` | **REESCREVER** | Nova UI baseada em plan-2.tsx |
| `src/hooks/useAdminPlans.ts` | **MODIFICAR** | Suporte a novos campos |
| `src/components/admin/plans/PlanConfigCard.tsx` | **REESCREVER** | Novo design com todas secoes |
| `src/components/layouts/DashboardLayout.tsx` | **MODIFICAR** | Navegacao dinamica |
| `src/components/guards/ServiceGuard.tsx` | **MODIFICAR** | Verificar features do plano |
| `src/pages/hub/StudentHub.tsx` | **MODIFICAR** | Respeitar features |
| `src/components/hub/SecondaryServicesGrid.tsx` | **MODIFICAR** | Aplicar descontos |
| `src/hooks/useSubscription.ts` | **MODIFICAR** | Retornar features expandidas |
| Database | **MIGRATION** | Expandir schema de plans |

---

## Proximos Passos Apos Implementacao

1. **Job Concierge**: Criar tabela de vagas curadas e UI de entrega
2. **Community**: Implementar forum interno ou integrar chat
3. **Masterclass**: Sistema de conteudo video com trilhas
4. **Analytics**: Tracking de conversao em upgrade prompts

---

## Criterios de Sucesso

| Criterio | Verificacao |
|----------|-------------|
| Zero Hardcoding | Nenhum componente assume disponibilidade de feature |
| Controle Admin | Todas configuracoes editaveis em /admin/planos |
| Efeito Imediato | Mudancas em plano refletem instantaneamente |
| Limites Invioaveis | Usuario nao consegue bypassar limites |
| UX Transparente | Usuario sempre sabe seu plano, limites e opcoes |
| Backend Seguro | RPC valida permissoes, frontend nao e confiavel |
| Performance | Cache de configuracoes, sem queries repetidas |
