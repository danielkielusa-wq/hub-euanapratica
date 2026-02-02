
# Plano: Sincronizacao de Assinatura e Hot Seats

## Problema Identificado

### Bug #1: Estado do Plano Nao Atualiza no "Meu Hub"

**Causa Raiz**: O hook `useSubscription` (linha 61-65) usa `supabase.auth.getUser()` para obter o ID do usuario:

```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  setQuota(null);
  return;
}
```

Isso retorna o usuario **real** autenticado (admin), nao o usuario impersonado. O contexto de impersonacao (`AuthContext`) nao e utilizado.

### Feature #1: Membros de Hot Seats Baseado no Plano

**Situacao Atual**:
- Hot Seats existe: `667b04c4-431f-4a6c-9799-b5b82e770b4b` (status: active, category: workshop)
- Nenhum usuario esta matriculado automaticamente
- Nao existe trigger para sincronizar membros com plano

---

## Solucao Proposta

### Parte 1: Corrigir useSubscription para Suportar Impersonacao

| Arquivo | Mudanca |
|---------|---------|
| `src/hooks/useSubscription.ts` | Usar `userId` do `AuthContext` em vez de `supabase.auth.getUser()` |

**Codigo Atual:**
```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) { ... }
const { data } = await supabase.rpc('get_user_quota', { p_user_id: user.id });
```

**Codigo Novo:**
```typescript
import { useAuth } from '@/contexts/AuthContext';

export function useSubscription(): UseSubscriptionReturn {
  const { user } = useAuth(); // Usa usuario efetivo (impersonado ou real)
  
  const fetchQuota = useCallback(async () => {
    if (!user?.id) {
      setQuota(null);
      return;
    }
    const { data } = await supabase.rpc('get_user_quota', { p_user_id: user.id });
    // ...
  }, [user?.id]); // Dependencia no user.id
}
```

**Impacto**: Quando admin inicia impersonacao, o `user.id` muda para o usuario impersonado, e `fetchQuota` e re-executado automaticamente.

---

### Parte 2: Refetch Automatico na Impersonacao

| Arquivo | Mudanca |
|---------|---------|
| `src/hooks/useSubscription.ts` | Adicionar `user?.id` como dependencia do useEffect |

**Logica:**
```typescript
useEffect(() => {
  fetchQuota();
}, [fetchQuota, user?.id]); // Refetch quando user muda
```

Isso garante que ao iniciar/encerrar impersonacao, os dados de quota sao buscados novamente.

---

### Parte 3: Atualizar useHubEvents para Contexto de Usuario

| Arquivo | Mudanca |
|---------|---------|
| `src/hooks/useHubEvents.ts` | Usar `user` do AuthContext diretamente (ja usa, mas precisa refetch) |

O hook ja usa `useAuth()`, mas precisa invalidar a query quando o usuario muda:

```typescript
return useQuery({
  queryKey: ['hub-events', user?.id, limit],
  // ...
});
```

Isso ja esta correto - a queryKey inclui `user?.id`, entao quando o user muda, a query e refetched.

---

### Parte 4: Database Trigger para Hot Seats

Criar trigger no PostgreSQL que:
1. **ON INSERT/UPDATE** em `user_subscriptions`:
   - Se `plan_id IN ('pro', 'vip')` → Adicionar usuario ao Hot Seats
   - Se `plan_id = 'basic'` → Remover usuario do Hot Seats

2. **Definir constante** para Hot Seats ID (ou usar uma tabela de config)

**SQL Migration:**

```sql
-- Funcao para sincronizar Hot Seats baseado no plano
CREATE OR REPLACE FUNCTION sync_hot_seats_membership()
RETURNS TRIGGER AS $$
DECLARE
  hot_seats_id UUID := '667b04c4-431f-4a6c-9799-b5b82e770b4b';
  is_premium BOOLEAN;
BEGIN
  -- Determinar se o plano e premium (pro ou vip)
  is_premium := NEW.plan_id IN ('pro', 'vip') AND NEW.status = 'active';
  
  IF is_premium THEN
    -- Adicionar ao Hot Seats se nao estiver
    INSERT INTO public.user_espacos (user_id, espaco_id, status, enrolled_by)
    VALUES (NEW.user_id, hot_seats_id, 'active', NULL)
    ON CONFLICT (user_id, espaco_id) DO UPDATE SET status = 'active';
  ELSE
    -- Remover do Hot Seats
    UPDATE public.user_espacos 
    SET status = 'cancelled'
    WHERE user_id = NEW.user_id AND espaco_id = hot_seats_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
CREATE TRIGGER trg_sync_hot_seats_on_subscription
AFTER INSERT OR UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION sync_hot_seats_membership();

-- Adicionar constraint de unicidade se nao existir
ALTER TABLE public.user_espacos 
ADD CONSTRAINT user_espacos_user_espaco_unique 
UNIQUE (user_id, espaco_id);
```

---

### Parte 5: Migrar Usuarios Existentes

Executar script unico para sincronizar usuarios atuais:

```sql
-- Adicionar usuarios PRO/VIP existentes ao Hot Seats
INSERT INTO public.user_espacos (user_id, espaco_id, status)
SELECT 
  us.user_id,
  '667b04c4-431f-4a6c-9799-b5b82e770b4b' as espaco_id,
  'active' as status
FROM public.user_subscriptions us
WHERE us.plan_id IN ('pro', 'vip') AND us.status = 'active'
ON CONFLICT (user_id, espaco_id) DO UPDATE SET status = 'active';

-- Remover usuarios FREE do Hot Seats (se houver)
UPDATE public.user_espacos 
SET status = 'cancelled'
WHERE espaco_id = '667b04c4-431f-4a6c-9799-b5b82e770b4b'
AND user_id NOT IN (
  SELECT user_id FROM public.user_subscriptions 
  WHERE plan_id IN ('pro', 'vip') AND status = 'active'
);
```

---

## Arquivos a Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/hooks/useSubscription.ts` | Modificar | Usar `useAuth()` em vez de `supabase.auth.getUser()` |
| `src/hooks/useHubEvents.ts` | Verificar | Ja usa user.id na queryKey (correto) |
| Database | Migracao | Criar trigger `sync_hot_seats_membership` |
| Database | Migracao | Adicionar constraint unique em `user_espacos` |
| Database | Migracao | Script para sincronizar usuarios existentes |

---

## Fluxo Apos Implementacao

```text
Admin muda plano de Wagner → Free para PRO
    ↓
Trigger dispara em user_subscriptions
    ↓
Funcao sync_hot_seats_membership()
    ↓
INSERT/UPDATE em user_espacos (Hot Seats)
    ↓
Wagner agora ve Hot Seats na agenda

---

Admin inicia impersonacao de Wagner
    ↓
AuthContext.impersonatedUser = Wagner
    ↓
useSubscription detecta mudanca em user.id
    ↓
fetchQuota() chamado com Wagner.id
    ↓
Meu Hub mostra "Plano PRO" + limites corretos
```

---

## Criterios de Aceitacao

| Cenario | Resultado Esperado |
|---------|-------------------|
| Admin muda Free → PRO | Hot Seats concedido imediatamente |
| Admin muda PRO → Free | Hot Seats removido imediatamente |
| Impersonacao de PRO | Meu Hub mostra "Plano PRO" |
| Impersonacao de Free | Meu Hub mostra "Plano Free" |
| ResumePass limites | Atualizam baseado no plano impersonado |
| Calendario do usuario | Mostra Hot Seats apenas para PRO/VIP |

---

## Consideracoes Tecnicas

1. **RLS**: O trigger usa `SECURITY DEFINER` para bypass de RLS, ja que e executado pelo sistema
2. **Idempotencia**: `ON CONFLICT DO UPDATE` garante que multiplas chamadas nao criam duplicatas
3. **Performance**: Trigger e leve (uma query INSERT/UPDATE)
4. **Auditoria**: Enrollment history ja e logado pelo trigger existente `log_enrollment_change`
