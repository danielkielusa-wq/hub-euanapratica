
# Plano: Hub de Educação e Upsell Premium "EUA Na Prática"

## Visão Geral

Reestruturar completamente a página "Meu Hub" para se transformar em um dashboard de startup premium (estilo SaaS série A), integrando o sistema de créditos, assinaturas, eventos/calendário e gatilhos de upsell elegantes. Inclui também a criação de uma nova página de "Catálogo Completo".

---

## Arquitetura do Sistema Integrado

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                         MEU HUB REDESIGN                                  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─ MEMBER CARD PREMIUM ────────────────────────────────────────────┐    │
│  │  Gradiente blue-600→indigo-800 | rounded-[40px]                  │    │
│  │  • Plano Atual + Badge (Basic/Pro/VIP)                           │    │
│  │  • Status "Ativo" + Data Renovação                               │    │
│  │  • Widget Créditos (barra de progresso)                          │    │
│  │  • Botão "Fazer Upgrade" com ícone Zap                           │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  ┌─ EVENTOS & HOT SEATS ────────────────────────────────────────────┐    │
│  │  Título: "Eventos & Hot Seats" + link "Ver Calendário Completo"  │    │
│  │  Grid 3 colunas: Cards de sessões ao vivo                        │    │
│  │  • Básico: Acesso livre                                          │    │
│  │  • Pro: Bloqueado com backdrop-blur + Lock para plano Basic      │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  ┌─ ECOSSISTEMA DE FERRAMENTAS ─────────────────────────────────────┐    │
│  │  Grid de cards brancos rounded-[32px]                            │    │
│  │  • Currículo USA (IA)                                            │    │
│  │  • MentorLink (Beta)                                             │    │
│  │  • Biblioteca de Materiais                                       │    │
│  │  Badge Pro/VIP para ferramentas premium                          │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  ┌─ HIGH-TOUCH SERVICES ────────────────────────────────────────────┐    │
│  │  Banner de Destaque (is_highlighted = true, exclusivo)           │    │
│  │  Grid 3 colunas: Serviços avulsos dinâmicos                      │    │
│  │  Link: "Ver catálogo completo →"                                 │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  ┌─ SOCIAL PROOF FOOTER ────────────────────────────────────────────┐    │
│  │  "+50 alunos trabalhando nos EUA | Pro tem 40% mais convites"    │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Member Card Premium (Header)

### Dados Dinâmicos
- **Fonte**: `useSubscription()` hook existente
- **Campos**:
  - `quota.planId` → Badge (BASIC / PRO / VIP)
  - `quota.planName` → Nome do plano
  - `quota.remaining` / `quota.monthlyLimit` → Barra de progresso
  - Data de renovação (calculada ou nova coluna)

### Design Visual
```typescript
// Estrutura do componente
<div className="relative overflow-hidden rounded-[40px] bg-gradient-to-r from-blue-600 to-indigo-800 p-6 md:p-8">
  <div className="flex items-center justify-between">
    {/* Left: Avatar + Plan Info */}
    <div className="flex items-center gap-4">
      <Crown className="h-12 w-12 text-amber-400" /> {/* VIP */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/70">ASSINATURA ATIVA</span>
          <Badge className="bg-white/20 text-white">MENSAL</Badge>
        </div>
        <h2 className="text-2xl font-bold text-white">Plano {planName}</h2>
        <p className="text-white/80 text-sm">Sua jornada acelerada para os EUA.</p>
      </div>
    </div>
    
    {/* Right: Credits Widget + Upgrade Button */}
    <div className="flex items-center gap-4">
      <div className="rounded-2xl bg-white/10 backdrop-blur px-4 py-2">
        <span className="text-xs text-white/70">CRÉDITOS CURRÍCULO USA</span>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-white">{remaining}/{limit}</span>
          <Progress value={(remaining/limit)*100} className="w-24" />
        </div>
        <span className="text-xs text-white/60">Renova em 12 dias</span>
      </div>
      <Button className="bg-white text-indigo-800 hover:bg-white/90 gap-2">
        Fazer Upgrade <Zap className="h-4 w-4" />
      </Button>
    </div>
  </div>
</div>
```

---

## 2. Seção: Eventos & Hot Seats

### Integração com Calendário
- **Fonte de dados**: `sessions` table + `espacos` + `user_espacos`
- **Lógica**: Buscar sessões futuras (próximos 30 dias) onde:
  - Status = 'scheduled' ou 'live'
  - Ordenar por `datetime` ASC
  - Limitar a 3-6 sessões

### Novo Hook: `useHubEvents()`
```typescript
// Busca sessões públicas/do mentor + aplica lógica de acesso por plano
export function useHubEvents() {
  // Buscar sessões dos espaços onde o usuário está matriculado
  // OU sessões marcadas como "públicas" (futura coluna)
  // Retornar com flag: canAccess based on user plan
}
```

### Card de Evento
```typescript
interface EventCardProps {
  title: string;
  description: string;
  datetime: Date;
  type: 'hot_seat' | 'workshop_live';
  requiredPlan: 'basic' | 'pro' | 'vip';
  userPlan: string;
}

// Se userPlan < requiredPlan → mostrar backdrop-blur + Lock
```

### Design do Card Bloqueado
```typescript
<div className="relative overflow-hidden rounded-[24px] border">
  {/* Conteúdo com blur */}
  <div className={cn(
    !canAccess && "backdrop-blur-sm"
  )}>
    {/* Icon, Title, Date, etc */}
  </div>
  
  {/* Overlay de bloqueio */}
  {!canAccess && (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60">
      <div className="text-center text-white p-4">
        <Lock className="h-8 w-8 mx-auto mb-2 text-amber-400" />
        <p className="text-sm">Assista a mentoria de outros alunos ao vivo</p>
        <Badge className="mt-2 bg-amber-500">Disponível no Plano Pro</Badge>
      </div>
    </div>
  )}
</div>
```

---

## 3. Ecossistema de Ferramentas

### Lógica de Acesso
- **Fonte**: `hub_services` + `user_hub_services` + `plans.features`
- **Regra**:
  - `service.status === 'available'` → Acesso livre
  - `service.status === 'premium'` → Verificar se usuário tem acesso OU se plano inclui

### Badges por Plano
- Plano Basic: Sem badge especial
- Plano Pro: Badge prata `<Badge className="bg-gray-200 text-gray-700">PRO</Badge>`
- Plano VIP: Badge dourado `<Badge className="bg-amber-100 text-amber-700">VIP</Badge>`

### Cards de Ferramentas (Redesign)
```typescript
<div className="rounded-[32px] bg-white border border-gray-100 p-6 
                transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] 
                hover:border-blue-200">
  {/* Icon Container */}
  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
    <FileCheck className="h-7 w-7 text-blue-600" />
  </div>
  
  {/* Content */}
  <h3 className="mb-2 font-semibold text-lg">Currículo USA</h3>
  <p className="text-sm text-muted-foreground mb-4">
    Valide seu CV nos robôs ATS americanos com IA.
  </p>
  
  {/* CTA */}
  <Link to="/curriculo">
    <span className="text-sm font-medium text-blue-600 hover:underline">
      Acessar agora →
    </span>
  </Link>
</div>
```

---

## 4. High-Touch Services (Serviços Premium)

### Banner de Destaque
- **Fonte**: `hub_services` WHERE `is_highlighted = true`
- **Regra Admin**: Permitir apenas UM produto como destaque (validar no frontend/backend)

### Migração SQL Necessária
Não é necessária migração - já existe `is_highlighted` boolean na tabela.

### Validação no Admin (Lógica)
```typescript
// No useUpdateHubService, ao setar is_highlighted = true:
// 1. Primeiro fazer UPDATE em todos os outros para false
// 2. Depois atualizar o selecionado para true
```

### Layout do Banner
```typescript
<div className="rounded-[48px] bg-gradient-to-r from-slate-50 to-indigo-50 border p-8 
                flex items-center justify-between">
  <div className="flex-1">
    <Badge className="mb-2 bg-amber-100 text-amber-700">OPORTUNIDADE PREMIUM</Badge>
    <h2 className="text-2xl font-bold mb-2">{service.name}</h2>
    <p className="text-muted-foreground mb-4">{service.description}</p>
    <div className="flex gap-3">
      <Button className="bg-blue-600">Agendar Diagnóstico</Button>
      <Button variant="outline">Saiba mais</Button>
    </div>
  </div>
  <div className="w-48 h-48 rounded-3xl bg-indigo-800 flex items-center justify-center">
    <span className="text-white text-center font-medium">
      ESPECIALIDADE<br/>{service.category}
    </span>
  </div>
</div>
```

### Grid de Serviços Avulsos
- **Fonte**: `hub_services` WHERE `service_type = 'consulting'` OR `service_type = 'live_mentoring'`
- **Excluir**: O serviço que já está em destaque

---

## 5. Nova Página: Catálogo Completo

### Rota
`/catalogo` ou `/hub/catalogo`

### Funcionalidades
1. **Filtros em Pills**: Todos, Mentoria, Carreira, Networking, Jurídico, Suporte
2. **Busca**: Campo de pesquisa
3. **Grid de Cards**: Todos os `hub_services` visíveis
4. **Footer CTA**: "Não encontrou o que procurava? Fale com Especialista"

### Componentes
```text
src/pages/hub/ServiceCatalog.tsx
src/components/hub/CatalogFilters.tsx
src/components/hub/ServiceCatalogCard.tsx
```

---

## 6. Prova Social Footer

```typescript
<div className="rounded-3xl bg-slate-50 p-6 flex items-center justify-between">
  <div className="flex items-center gap-4">
    {/* Avatars Stack */}
    <div className="flex -space-x-2">
      <Avatar className="border-2 border-white w-10 h-10" />
      <Avatar className="border-2 border-white w-10 h-10" />
      <Avatar className="border-2 border-white w-10 h-10" />
      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center 
                      text-xs font-semibold text-blue-600 border-2 border-white">+50</div>
    </div>
    <div>
      <p className="font-medium">Junte-se aos alunos que já estão nos EUA</p>
      <p className="text-sm text-muted-foreground">
        Mentorados Pro e VIP têm 40% mais chances de convite.
      </p>
    </div>
  </div>
  <Button variant="link" className="text-blue-600">
    Ver histórias de sucesso
  </Button>
</div>
```

---

## Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/hub/StudentHub.tsx` | Reescrever completamente |
| `src/pages/hub/ServiceCatalog.tsx` | Nova página de catálogo |
| `src/components/hub/MemberCard.tsx` | Header com plano e créditos |
| `src/components/hub/EventsSection.tsx` | Seção de eventos/hot seats |
| `src/components/hub/ToolsGrid.tsx` | Grid de ferramentas |
| `src/components/hub/ToolCard.tsx` | Card individual de ferramenta |
| `src/components/hub/FeaturedServiceBanner.tsx` | Banner de serviço destaque |
| `src/components/hub/ServicesGrid.tsx` | Grid de serviços avulsos |
| `src/components/hub/ServiceCard.tsx` | Card de serviço (refatorado) |
| `src/components/hub/SocialProofBanner.tsx` | Footer de prova social |
| `src/components/hub/CatalogFilters.tsx` | Filtros do catálogo |
| `src/hooks/useHubEvents.ts` | Hook para eventos/sessões do hub |

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/App.tsx` | Adicionar rota `/catalogo` |
| `src/hooks/useAdminHubServices.ts` | Validar destaque único |
| `src/types/hub.ts` | Adicionar novas categorias/tipos se necessário |

---

## Integração com Sistema de Créditos

### No MemberCard
```typescript
const { quota, isLoading } = useSubscription();

// Exibir:
// - quota.planName
// - quota.remaining / quota.monthlyLimit (barra de progresso)
// - Ícone baseado em quota.planId (Crown para VIP, Zap para Pro, Sparkles para Basic)
```

### Lógica de Bloqueio por Plano
```typescript
// Definir ordem de planos
const PLAN_ORDER = { basic: 0, pro: 1, vip: 2 };

// Verificar acesso
const canAccess = PLAN_ORDER[userPlan] >= PLAN_ORDER[requiredPlan];
```

---

## Design System Aplicado

| Elemento | Estilo |
|----------|--------|
| Cards | `rounded-[32px]` background branco |
| Member Card | `rounded-[40px]` gradiente blue-indigo |
| Banners | `rounded-[48px]` background sutil |
| Shadows | `shadow-sm` → `shadow-2xl` no hover |
| Transições | `transition-all duration-300 hover:scale-[1.02]` |
| Cores | Azul Corporativo #2563EB, Roxo VIP, Vermelho Live |
| Ícones | lucide-react (Radio/Mic2 para live) |
| Blur Locked | `backdrop-blur-sm` + overlay escuro |

---

## Fluxo de Navegação

```text
/dashboard/hub (Meu Hub)
    │
    ├── Ver Calendário Completo → /dashboard/agenda
    │
    ├── Acessar Ferramenta → /curriculo, /biblioteca, etc.
    │
    ├── Ver Catálogo Completo → /catalogo (NOVA)
    │
    └── Fazer Upgrade → Abre UpgradeModal
```

---

## Checklist de Implementação

1. Criar componente `MemberCard` com dados do `useSubscription`
2. Criar hook `useHubEvents` para buscar sessões futuras
3. Criar componente `EventsSection` com cards e lógica de bloqueio
4. Refatorar `HubServiceCard` ou criar novo `ToolCard`
5. Criar `FeaturedServiceBanner` para serviço destacado
6. Criar `ServicesGrid` para serviços avulsos
7. Criar `SocialProofBanner` com avatars e texto
8. Criar página `ServiceCatalog` com filtros e busca
9. Atualizar admin para validar destaque único
10. Registrar nova rota no `App.tsx`
11. Testar fluxo completo de upsell e acesso
