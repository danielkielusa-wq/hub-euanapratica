
# Plano: Correção do Acesso ao Currículo USA

## Problema Identificado

O usuário está sendo redirecionado de `/curriculo` para `/dashboard/hub` porque:

1. **Não existe serviço cadastrado** na tabela `hub_services` com `route = '/curriculo'`
2. O `ServiceGuard` busca um serviço pela rota e, como não encontra, `hasAccess` retorna `false`
3. O usuário não tem nenhuma entrada em `user_hub_services`

**Porém**, conforme a arquitetura documentada, o Currículo USA é uma **ferramenta do plano de assinatura** (Basic/Pro/VIP), não um serviço avulso que precisa ser comprado separadamente. Todos os assinantes devem ter acesso (com limites de créditos diferentes por plano).

---

## Análise da Lógica de Acesso

### Lógica Atual (ServiceGuard)
```typescript
// useServiceAccess.ts
const hasAccess =
  service?.status === 'available' ||
  (service && userAccess?.includes(service.id));
```

Esta lógica é correta para **serviços avulsos** (consultorias, mentorias), mas o Currículo USA é diferente:
- Faz parte do **plano de assinatura**
- Todo usuário com assinatura ativa deveria ter acesso
- Os limites são controlados por créditos mensais (`useSubscription`)

---

## Solução

### Opção Recomendada: Modificar o ServiceGuard para Considerar Assinaturas

O `ServiceGuard` deve verificar também se o usuário tem uma **assinatura ativa** para serviços marcados como "incluídos no plano".

### Mudanças Necessárias

#### 1. Atualizar `useServiceAccess.ts`

Adicionar verificação de assinatura para ferramentas do plano:

```typescript
import { useHubServices, useUserHubAccess } from '@/hooks/useHubServices';
import { useSubscription } from '@/hooks/useSubscription';

// Rotas que são ferramentas incluídas em qualquer assinatura
const SUBSCRIPTION_INCLUDED_ROUTES = ['/curriculo'];

export function useServiceAccess(serviceRoute: string) {
  const { data: services, isLoading: servicesLoading } = useHubServices();
  const { data: userAccess, isLoading: accessLoading } = useUserHubAccess();
  const { quota, isLoading: subscriptionLoading } = useSubscription();

  const service = services?.find((s) => s.route === serviceRoute);
  
  // Verifica se é uma ferramenta incluída na assinatura
  const isSubscriptionTool = SUBSCRIPTION_INCLUDED_ROUTES.includes(serviceRoute);
  const hasActiveSubscription = quota?.planId != null;

  // User has access if:
  // 1. É uma ferramenta de assinatura E o usuário tem plano ativo
  // 2. Service status is 'available' (free for all)
  // 3. User has an active entry in user_hub_services for this service
  const hasAccess =
    (isSubscriptionTool && hasActiveSubscription) ||
    service?.status === 'available' ||
    (service && userAccess?.includes(service.id));

  return {
    hasAccess: !!hasAccess,
    service,
    isLoading: servicesLoading || accessLoading || subscriptionLoading,
  };
}
```

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useServiceAccess.ts` | Adicionar verificação de assinatura para rotas específicas |

---

## Lógica de Negócio

```text
Usuário acessa /curriculo
        │
        ▼
ServiceGuard verifica acesso
        │
        ├── É rota de assinatura? (/curriculo)
        │         │
        │         ├── SIM + Tem assinatura? → ACESSO PERMITIDO ✓
        │         │
        │         └── SIM + Sem assinatura → Redireciona para Hub
        │
        ├── Serviço está 'available'? → ACESSO PERMITIDO ✓
        │
        └── Usuário comprou o serviço? → ACESSO PERMITIDO ✓
```

---

## Verificação do `useSubscription`

Preciso confirmar que o hook `useSubscription` retorna os dados corretos para este usuário. Vou verificar o estado atual da assinatura do usuário.

---

## Verificação Pós-Implementação

1. Acessar `/curriculo` como `kiel.daniel@gmail.com`
2. Confirmar que a página carrega sem redirecionamento
3. Verificar que o widget de créditos exibe corretamente
4. Testar com usuário SEM assinatura → deve redirecionar para Hub com mensagem apropriada
