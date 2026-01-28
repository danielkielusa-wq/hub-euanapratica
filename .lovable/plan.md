
# Plano: Correção do Fluxo Pós-Pagamento Ticto

## Problemas Identificados

### 1. Duplicação de Registros no Histórico
A Ticto enviou o mesmo webhook duas vezes (evento "authorized") em 22:07:16 e 22:08:50 para a mesma transação `TOP28016LE59PQ`. O sistema registrou ambos porque não há constraint de unicidade.

### 2. Formulário Não Resetando Valores ao Editar
O `HubServiceForm` usa `useForm` com `defaultValues` definidos apenas na montagem inicial do componente. Quando o usuário clica em "Editar" um serviço diferente, o formulário não é resetado com os novos valores do serviço selecionado.

### 3. Redirecionamento Pós-Checkout Ticto
Este é um problema **externo ao sistema**: a URL de redirecionamento pós-compra deve ser configurada diretamente no painel da Ticto, não no nosso código. O sistema interno já possui a página `/payment-success` pronta.

---

## Solução Proposta

### A) Banco de Dados: Evitar Duplicações

Adicionar constraint única ou usar UPSERT no webhook para garantir que cada transação seja registrada apenas uma vez:

**Migração SQL:**
```sql
-- Criar índice único na combinação transaction_id + event_type
-- Isso permite múltiplos eventos diferentes para a mesma transação
-- (ex: "authorized", depois "refunded"), mas não o mesmo evento duplicado
CREATE UNIQUE INDEX IF NOT EXISTS payment_logs_transaction_event_unique 
ON payment_logs (transaction_id, event_type) 
WHERE transaction_id IS NOT NULL;
```

**Edge Function (ticto-webhook):**
Modificar o INSERT para usar UPSERT:
```typescript
// Antes: INSERT simples (cria duplicatas)
await supabase.from("payment_logs").insert({...})

// Depois: UPSERT com ON CONFLICT
await supabase.from("payment_logs").upsert({
  transaction_id: transactionId,
  event_type: eventStatus,
  // ... demais campos
}, { 
  onConflict: 'transaction_id,event_type',
  ignoreDuplicates: true 
});
```

---

### B) Formulário de Edição: Resetar Valores

**Arquivo:** `src/components/admin/hub/HubServiceForm.tsx`

O problema: `useForm` captura `defaultValues` apenas na montagem inicial. Solução: usar `useEffect` para chamar `form.reset()` quando o `service` prop mudar.

```typescript
// Adicionar useEffect para resetar o form quando service mudar
useEffect(() => {
  form.reset({
    name: service?.name || '',
    description: service?.description || '',
    icon_name: service?.icon_name || 'FileCheck',
    status: (service?.status as ServiceStatus) || 'available',
    service_type: service?.service_type || 'ai_tool',
    ribbon: service?.ribbon || null,
    category: service?.category || '',
    route: service?.route || '',
    redirect_url: service?.redirect_url || '',
    cta_text: service?.cta_text || 'Acessar Agora',
    is_visible_in_hub: service?.is_visible_in_hub ?? true,
    is_highlighted: service?.is_highlighted ?? false,
    display_order: service?.display_order || 0,
    price: service?.price || 0,
    price_display: service?.price_display || '',
    currency: service?.currency || 'BRL',
    product_type: (service?.product_type as ProductType) || 'one_time',
    stripe_price_id: service?.stripe_price_id || '',
    accent_color: service?.accent_color || '',
    ticto_product_id: service?.ticto_product_id || '',
    ticto_checkout_url: service?.ticto_checkout_url || '',
  });
}, [service, form]);
```

---

### C) UX Melhorada na Página de Sucesso

**Arquivo:** `src/pages/PaymentSuccess.tsx`

Melhorar a experiência com estados mais claros:

| Estado | Mensagem | Visual |
|--------|----------|--------|
| Sincronizando | "Estamos esperando a confirmação. Isso pode levar alguns minutos." | Loader suave |
| Confirmado | "Tudo certo! Seu conteúdo está liberado." | Botão "Acessar Conteúdo" |
| Fallback (webhook atrasado) | "Houve um atraso na confirmação. Você não precisa fazer nada." | Texto calmo |

---

### D) Limpar Entradas Duplicadas Existentes

**SQL de limpeza (executar manualmente):**
```sql
-- Remover entradas duplicadas, mantendo a mais recente
DELETE FROM payment_logs a
USING payment_logs b
WHERE a.transaction_id = b.transaction_id
  AND a.event_type = b.event_type
  AND a.created_at < b.created_at;
```

---

## Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `supabase/migrations/xxx.sql` | Criar | Adicionar constraint única |
| `supabase/functions/ticto-webhook/index.ts` | Modificar | Usar UPSERT em vez de INSERT |
| `src/components/admin/hub/HubServiceForm.tsx` | Modificar | Adicionar useEffect para resetar form |
| `src/pages/PaymentSuccess.tsx` | Modificar | Melhorar estados e mensagens |

---

## Fluxo Visual Corrigido

```text
Usuário paga na Ticto
        │
        ▼
Ticto redireciona para /payment-success
        │
        ▼
┌─────────────────────────────────────────┐
│  "Sincronizando seu acesso..."          │
│  (Loader suave, tom calmo)              │
│                                         │
│  Microcopy: "Estamos esperando a        │
│  confirmação. Isso pode levar alguns    │
│  minutos."                              │
└─────────────────────────────────────────┘
        │
        │ (4 segundos + invalidate cache)
        ▼
┌─────────────────────────────────────────┐
│  ✓ "Pagamento Confirmado!"              │
│                                         │
│  "Tudo certo! Seu conteúdo está         │
│  liberado."                             │
│                                         │
│  [=== Ir para o meu Hub ===]            │
└─────────────────────────────────────────┘
```

---

## Webhook: Mudança de INSERT para UPSERT

**Antes (linha 168-176):**
```typescript
await supabase.from("payment_logs").insert({
  user_id: profile?.id || null,
  service_id: service?.id || null,
  transaction_id: transactionId,
  event_type: eventStatus,
  payload: payload,
  status: profile && service ? "processed" : "partial",
  processed_at: new Date().toISOString(),
});
```

**Depois:**
```typescript
// Usar upsert para evitar duplicatas se webhook for reenviado
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
  { 
    onConflict: 'transaction_id,event_type',
    ignoreDuplicates: false // Atualiza se já existir
  }
);

if (logError) {
  console.warn("Error logging payment:", logError);
}
```

---

## Nota sobre Redirecionamento Ticto

O redirecionamento pós-checkout é configurado diretamente na Ticto. Você deve:

1. Acessar o painel da Ticto
2. Editar a oferta/produto
3. No campo "URL de Redirecionamento Pós-Compra", inserir:
   `https://enphub.lovable.app/payment-success`

Isso garantirá que após o pagamento, o usuário seja levado à nossa página de sucesso em vez da página genérica da Ticto.

---

## Sobre Agendamento (Calendly-like)

Conforme sua instrução, a funcionalidade de agendamento de reuniões será implementada posteriormente. Para o momento atual, após a confirmação do pagamento:

- O botão mudará de "Desbloquear Acesso" para "Acessar Conteúdo"
- No futuro, poderemos adicionar um segundo CTA para "Agendar Sessão" que abrirá um modal de calendário
