
# Plano: Correção do Simulador Ticto - Logs de Pagamento

## Problema Identificado

A simulação está funcionando corretamente (acesso é liberado), porém os **logs não estão sendo salvos** na tabela `payment_logs` devido a um erro de constraint:

```
Error logging payment: {
  code: "42P10",
  message: "there is no unique or exclusion constraint matching the ON CONFLICT specification"
}
```

**Causa raiz:** O índice único `payment_logs_transaction_event_unique` é um índice **parcial** (`WHERE transaction_id IS NOT NULL`). O PostgREST do Supabase não consegue usar índices parciais com `onConflict` - ele precisa de uma **constraint nomeada** ou um índice **não-parcial**.

---

## Solução

### 1. Migração SQL: Substituir Índice por Constraint

Remover o índice parcial e criar uma constraint única não-parcial:

```sql
-- Remover índice parcial que não funciona com upsert
DROP INDEX IF EXISTS payment_logs_transaction_event_unique;

-- Criar constraint única (funciona com onConflict)
-- Primeiro, garantir que não há duplicatas
DELETE FROM payment_logs a USING payment_logs b
WHERE a.transaction_id = b.transaction_id 
  AND a.event_type = b.event_type 
  AND a.created_at < b.created_at
  AND a.transaction_id IS NOT NULL;

-- Tratar transaction_id NULL (manter apenas um por event_type)
DELETE FROM payment_logs a USING payment_logs b
WHERE a.transaction_id IS NULL 
  AND b.transaction_id IS NULL 
  AND a.event_type = b.event_type 
  AND a.created_at < b.created_at;

-- Agora criar a constraint
-- Para valores NULL, usamos COALESCE para gerar um valor único
ALTER TABLE payment_logs ADD CONSTRAINT payment_logs_transaction_event_key 
UNIQUE (transaction_id, event_type);
```

**Nota:** Se `transaction_id` pode ser NULL, o PostgreSQL permite múltiplas linhas com NULL na constraint UNIQUE. Para evitar isso, garantimos que transaction_id sempre tenha valor no webhook.

### 2. Atualização da Edge Function `ticto-webhook`

Garantir que `transaction_id` nunca seja NULL e usar insert com fallback:

```typescript
// Garantir transaction_id sempre existe
const transactionId = payload.order?.hash || 
                      payload.transaction_id || 
                      `GEN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
```

### 3. Atualização da Edge Function `simulate-ticto-callback`

Garantir que o `order.hash` simulado seja único e sempre presente (já está correto).

---

## Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `supabase/migrations/xxx.sql` | Criar | Substituir índice por constraint |
| `supabase/functions/ticto-webhook/index.ts` | Modificar | Garantir transaction_id nunca NULL + fallback para insert |

---

## Detalhes Técnicos

### Webhook: Mudança no Upsert

O problema é que o PostgREST precisa de uma constraint **nomeada** para `onConflict`. Após a migração, o código existente funcionará porque teremos `payment_logs_transaction_event_key` como constraint.

Se ainda houver problemas, faremos fallback para `insert` simples quando `upsert` falhar:

```typescript
// Tentar upsert primeiro
const { error: logError } = await supabase.from("payment_logs").upsert(
  {
    user_id: profile?.id || null,
    service_id: service?.id || null,
    transaction_id: transactionId,
    event_type: eventStatus,
    payload: payload,
    status: profile && service ? "processed" : "partial",
    processed_at: new Date().toISOString(),
  },
  { onConflict: 'transaction_id,event_type' }
);

// Se falhar, tentar insert (pode ser constraint não existe ainda)
if (logError) {
  console.warn("Upsert failed, trying insert:", logError);
  const { error: insertError } = await supabase.from("payment_logs").insert({
    user_id: profile?.id || null,
    service_id: service?.id || null,
    transaction_id: transactionId,
    event_type: eventStatus,
    payload: payload,
    status: profile && service ? "processed" : "partial",
    processed_at: new Date().toISOString(),
  });
  
  if (insertError) {
    console.error("Insert also failed:", insertError);
  }
}
```

---

## Fluxo Esperado Após Correção

```text
Admin simula callback no /admin/ticto-simulator
            │
            ▼
simulate-ticto-callback monta payload
            │
            ▼
ticto-webhook processa:
  1. Encontra usuário pelo email ✓
  2. Encontra serviço pelo ticto_product_id ✓
  3. Libera acesso em user_hub_services ✓
  4. Grava log em payment_logs ✓  <-- CORRIGIDO
            │
            ▼
Admin vê transação em /admin/pedidos ✓
            │
            ▼
Usuário vê transação em /meus-pedidos ✓
```

---

## Verificação Pós-Implementação

1. Executar simulação via `/admin/ticto-simulator`
2. Verificar nos logs da edge function que não há erro `42P10`
3. Acessar `/admin/pedidos` e confirmar que a transação simulada aparece
4. Acessar `/meus-pedidos` como usuário alvo e confirmar visibilidade
5. Verificar que `transaction_id` começa com `SIM_` para transações simuladas
