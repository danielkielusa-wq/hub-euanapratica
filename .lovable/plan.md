
# Plano: Adicionar Seletor de Plano na Página Admin de Assinaturas

## Problema Identificado

A funcionalidade de alterar planos já existe no backend (função RPC `admin_change_user_plan`) e no hook (`changePlan`), mas **não há interface** para o admin realizar essa ação. O `UserDetailDrawer` exibe apenas o plano atual como badge estático.

---

## Solução

Adicionar um **seletor de plano interativo** no drawer de detalhes do usuário que permita ao admin alterar o plano de Basic → Pro → VIP (ou qualquer combinação).

---

## Mudanças Necessárias

### 1. Atualizar `AdminSubscriptions.tsx`

Passar as props necessárias para o drawer:

```typescript
// Adicionar changePlan ao destructuring do hook
const { 
  users, 
  plans,  // já disponível
  isLoading, 
  error, 
  fetchUsers, 
  fetchPlans, 
  changePlan,  // NOVO - já existe no hook
  resetUsage 
} = useAdminSubscriptions();

// Novo estado para controle de loading
const [isChangingPlan, setIsChangingPlan] = useState(false);

// Nova função handler
const handleChangePlan = async (userId: string, newPlanId: string): Promise<boolean> => {
  setIsChangingPlan(true);
  const success = await changePlan(userId, newPlanId);
  setIsChangingPlan(false);
  if (success && selectedUser) {
    // Atualizar o usuário selecionado com novo plano
    const newPlan = plans.find(p => p.id === newPlanId);
    if (newPlan) {
      setSelectedUser({ 
        ...selectedUser, 
        plan_id: newPlanId, 
        plan_name: newPlan.name,
        monthly_limit: newPlan.monthly_limit
      });
    }
  }
  return success;
};

// Passar para o drawer
<UserDetailDrawer
  user={selectedUser}
  open={drawerOpen}
  onOpenChange={setDrawerOpen}
  onResetUsage={handleResetUsage}
  isResetting={isResetting}
  plans={plans}                    // NOVO
  onChangePlan={handleChangePlan}  // NOVO
  isChangingPlan={isChangingPlan}  // NOVO
/>
```

### 2. Atualizar `UserDetailDrawer.tsx`

Adicionar o seletor de plano na seção de "Plano Atual":

```typescript
// Novas props
interface Plan {
  id: string;
  name: string;
  price: number;
  monthly_limit: number;
}

interface UserDetailDrawerProps {
  user: UserWithUsage | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResetUsage: (userId: string) => Promise<boolean>;
  isResetting?: boolean;
  plans?: Plan[];                                      // NOVO
  onChangePlan?: (userId: string, planId: string) => Promise<boolean>;  // NOVO
  isChangingPlan?: boolean;                           // NOVO
}
```

**Novo componente de seleção de plano:**

```typescript
{/* Plano Atual - ATUALIZADO */}
<div className="bg-gray-50 rounded-2xl p-4">
  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
    Plano Atual
  </p>
  <div className="flex items-center gap-2">
    <PlanBadge planId={user.plan_id} planName={user.plan_name} size="lg" />
    
    {/* Botão Editar */}
    {plans && plans.length > 0 && (
      <Select
        value={user.plan_id}
        onValueChange={(value) => onChangePlan?.(user.user_id, value)}
        disabled={isChangingPlan}
      >
        <SelectTrigger className="w-auto h-8 border-dashed">
          {isChangingPlan ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Pencil className="w-3 h-3" />
          )}
        </SelectTrigger>
        <SelectContent>
          {plans.map((plan) => (
            <SelectItem key={plan.id} value={plan.id}>
              <div className="flex items-center gap-2">
                {plan.id === 'vip' && <Crown className="w-4 h-4 text-amber-500" />}
                {plan.id === 'pro' && <Zap className="w-4 h-4 text-purple-500" />}
                {plan.id === 'basic' && <Sparkles className="w-4 h-4 text-gray-500" />}
                <span>{plan.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({plan.monthly_limit === 999 ? '∞' : plan.monthly_limit} análises/mês)
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )}
  </div>
</div>
```

---

## Imports Necessários

No `UserDetailDrawer.tsx`:

```typescript
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger 
} from '@/components/ui/select';
import { Crown, Zap, Sparkles, Pencil } from 'lucide-react';
```

---

## Fluxo de Usuário

```text
Admin abre drawer do usuário
        │
        ▼
Vê badge "Básico" + botão de edição (ícone lápis)
        │
        ▼
Clica no botão → abre dropdown com planos
        │
        ▼
Seleciona "VIP" → loading enquanto processa
        │
        ▼
RPC admin_change_user_plan é chamada
        │
        ▼
Toast de sucesso + badge atualiza para "VIP"
        │
        ▼
Lista de usuários é recarregada automaticamente
```

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/admin/AdminSubscriptions.tsx` | Passar `plans`, `onChangePlan`, `isChangingPlan` para drawer |
| `src/components/admin/subscriptions/UserDetailDrawer.tsx` | Adicionar Select de planos |

---

## Segurança

A função RPC `admin_change_user_plan` já implementa:
- Verificação de autenticação (`auth.uid() IS NULL`)
- Validação de role admin (`has_role(auth.uid(), 'admin')`)
- Registro de auditoria em `user_audit_logs`

Não são necessárias mudanças de segurança.

---

## Design Visual

O seletor aparecerá como um **botão discreto com ícone de lápis** ao lado do badge do plano, mantendo a estética clean do drawer. Ao abrir, exibe um dropdown elegante com os 3 planos disponíveis, cada um com seu ícone característico (Crown/Zap/Sparkles).
