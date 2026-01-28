
# Plano: Integração de Pagamento com Ticto

## Visão Geral

Substituir a integração Stripe pela Ticto para processamento de pagamentos no Hub de Serviços. A integração consiste em três partes:

1. **Schema do Banco** - Adicionar campos Ticto e remover dependência do Stripe
2. **Checkout Flow** - Redirecionar para URL de checkout da Ticto com email do usuário
3. **Webhook Receiver** - Edge Function para processar postbacks e liberar acesso

---

## PARTE 1: MIGRAÇÃO DO BANCO DE DADOS

### 1.1 Novos Campos na Tabela `hub_services`

| Campo Atual | Ação | Novo Campo |
|-------------|------|------------|
| `stripe_price_id` | Manter (compatibilidade) + Adicionar novos | - |
| - | Adicionar | `ticto_product_id` |
| - | Adicionar | `ticto_checkout_url` |

**SQL Migration:**
```sql
-- Adicionar campos Ticto na tabela hub_services
ALTER TABLE public.hub_services 
  ADD COLUMN IF NOT EXISTS ticto_product_id TEXT,
  ADD COLUMN IF NOT EXISTS ticto_checkout_url TEXT;

-- Tabela para armazenar configurações globais da Ticto (Admin)
-- O secret_key será armazenado como Supabase Secret por segurança
```

### 1.2 Tabela de Log de Transações

Nova tabela para auditoria de pagamentos:

```sql
CREATE TABLE public.payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  service_id UUID REFERENCES public.hub_services(id),
  transaction_id TEXT, -- ID único da Ticto
  event_type TEXT NOT NULL, -- 'venda_realizada', 'reembolso', etc
  payload JSONB, -- Payload completo para debug
  status TEXT DEFAULT 'received',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Apenas admins podem ver
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage payment logs"
ON public.payment_logs FOR ALL USING (has_role(auth.uid(), 'admin'));
```

---

## PARTE 2: AJUSTES NO ADMIN (Formulário de Produto)

### 2.1 Arquivo: `src/components/admin/hub/HubServiceForm.tsx`

**Modificações na seção PRECIFICAÇÃO:**

Substituir o campo "Stripe Price ID" por:

- **Ticto Product ID** - ID do produto na Ticto
- **Ticto Checkout URL** - URL completa do checkout (ex: `https://pay.ticto.com.br/ABC123`)

```
┌─────────────────────────────────────────────────────────────┐
│ [CreditCard] PRECIFICAÇÃO & TICTO                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ MODELO DE COBRANÇA          STATUS                          │
│ [One Time Purchase ▾]       [Premium (Requer Compra) ▾]     │
│                                                             │
│ PREÇO (R$)      ORDEM       TICTO PRODUCT ID                │
│ [97.00     ]    [1  ]       [PROD_abc123         ]          │
│                                                             │
│ TICTO CHECKOUT URL                                          │
│ [https://pay.ticto.com.br/checkout/ABC123            ]      │
│                                                             │
│ TEXTO DE PREÇO (OPCIONAL)                                   │
│ [R$ 97 à vista                                        ]     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/types/hub.ts` | Adicionar `ticto_product_id` e `ticto_checkout_url` nos tipos |
| `src/components/admin/hub/HubServiceForm.tsx` | Novos campos no formulário |
| `src/hooks/useAdminHubServices.ts` | Salvar novos campos no create/update |

---

## PARTE 3: LÓGICA DE CHECKOUT NO HUB

### 3.1 Arquivo: `src/components/hub/HubServiceCard.tsx`

**Função `handleUnlock` atualizada:**

```typescript
const handleUnlock = () => {
  // Verificar se tem URL de checkout da Ticto configurada
  if (service.ticto_checkout_url) {
    // Anexar email do usuário logado para pré-preencher checkout
    const checkoutUrl = new URL(service.ticto_checkout_url);
    if (user?.email) {
      checkoutUrl.searchParams.set('email', user.email);
    }
    // Abrir em nova aba
    window.open(checkoutUrl.toString(), '_blank');
  } else if (service.redirect_url) {
    // Fallback para URL genérica
    window.open(service.redirect_url, '_blank');
  } else {
    toast.error('Checkout não configurado para este produto');
  }
};
```

### 3.2 Passar Contexto do Usuário

O `HubServiceCard` precisa receber o email do usuário:

```typescript
// Em StudentHub.tsx
const { user } = useAuth();

// Passar para o card
<HubServiceCard 
  service={service} 
  hasAccess={...} 
  userEmail={user?.email}
/>
```

---

## PARTE 4: EDGE FUNCTION - WEBHOOK RECEIVER

### 4.1 Nova Edge Function: `ticto-webhook`

**Arquivo:** `supabase/functions/ticto-webhook/index.ts`

**Responsabilidades:**
1. Validar token de autenticação
2. Processar evento "Venda Realizada" (status autorizado)
3. Localizar usuário pelo email
4. Localizar produto pelo `ticto_product_id`
5. Inserir/atualizar registro em `user_hub_services`
6. Logar transação em `payment_logs`

**Estrutura do Payload da Ticto (baseado na documentação):**

```typescript
interface TictoWebhookPayload {
  event: string; // 'venda_realizada', 'reembolso', etc
  transaction_id: string;
  product: {
    id: string;
    name: string;
  };
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  payment: {
    status: string;
    method: string;
    value: number;
  };
  // ... outros campos
}
```

**Fluxo de Processamento:**

```
┌──────────────────────────────────────────────────────────────┐
│                     TICTO WEBHOOK                            │
├──────────────────────────────────────────────────────────────┤
│  1. Receber POST da Ticto                                    │
│  2. Validar Header 'X-Ticto-Token' ou 'Authorization'        │
│  3. Parsear payload JSON                                     │
│                                                              │
│  4. Se evento = 'venda_realizada':                           │
│     a. Buscar profile por customer.email                     │
│     b. Buscar hub_service por ticto_product_id               │
│     c. Inserir em user_hub_services (status: 'active')       │
│     d. Logar em payment_logs                                 │
│                                                              │
│  5. Se evento = 'reembolso':                                 │
│     a. Atualizar user_hub_services (status: 'cancelled')     │
│     b. Logar em payment_logs                                 │
│                                                              │
│  6. Retornar 200 OK para confirmar recebimento               │
└──────────────────────────────────────────────────────────────┘
```

**Código da Edge Function:**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-ticto-token",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Validar token da Ticto
    const tictoToken = req.headers.get("X-Ticto-Token");
    const expectedToken = Deno.env.get("TICTO_SECRET_KEY");
    
    if (!tictoToken || tictoToken !== expectedToken) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // 2. Parsear payload
    const payload = await req.json();
    const event = payload.event || payload.status;
    
    // Admin client para escrita
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 3. Processar evento de venda
    if (event === "venda_realizada" || event === "authorized" || event === "approved") {
      const customerEmail = payload.customer?.email;
      const productId = payload.product?.id || payload.offer_id;

      // Buscar usuário pelo email
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", customerEmail)
        .maybeSingle();

      // Buscar serviço pelo ticto_product_id
      const { data: service } = await supabase
        .from("hub_services")
        .select("id")
        .eq("ticto_product_id", productId)
        .maybeSingle();

      if (profile && service) {
        // Liberar acesso ao serviço
        await supabase.from("user_hub_services").upsert({
          user_id: profile.id,
          service_id: service.id,
          status: "active",
          started_at: new Date().toISOString(),
        }, { onConflict: "user_id,service_id" });
      }

      // Logar transação
      await supabase.from("payment_logs").insert({
        user_id: profile?.id,
        service_id: service?.id,
        transaction_id: payload.transaction_id,
        event_type: event,
        payload: payload,
        status: "processed",
        processed_at: new Date().toISOString(),
      });
    }

    // 4. Processar reembolso
    if (event === "reembolso" || event === "refunded") {
      // Revogar acesso
      // ... lógica similar
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
```

### 4.2 Configuração TOML

```toml
[functions.ticto-webhook]
verify_jwt = false
```

---

## PARTE 5: SECRET NECESSÁRIO

Você mencionou que já gerou a API da Ticto. Precisarei que adicione o seguinte secret:

| Nome do Secret | Descrição |
|----------------|-----------|
| `TICTO_SECRET_KEY` | Token de validação do Postback (encontrado no painel Ticto em TICTOOLS > WEBHOOK) |

Quando você clicar para adicionar, um modal aparecerá para inserir o valor.

---

## PARTE 6: CONFIGURAÇÃO NA TICTO

Após deploy da Edge Function, você precisará configurar no painel da Ticto:

1. Acesse **TICTOOLS > WEBHOOK**
2. Clique em **+ADICIONAR**
3. Selecione o **PRODUTO**
4. No campo **URL**, cole: `https://buslxdknzogtgdnietow.supabase.co/functions/v1/ticto-webhook`
5. Selecione eventos: **Venda Realizada** e **Reembolso**

---

## RESUMO DE ARQUIVOS

### Criar:
| Arquivo | Descrição |
|---------|-----------|
| `supabase/functions/ticto-webhook/index.ts` | Edge Function webhook receiver |
| Migração SQL | Campos Ticto + tabela payment_logs |

### Modificar:
| Arquivo | Alteração |
|---------|-----------|
| `src/types/hub.ts` | Adicionar tipos Ticto |
| `src/components/admin/hub/HubServiceForm.tsx` | Campos Ticto no form |
| `src/hooks/useAdminHubServices.ts` | Persistir campos Ticto |
| `src/components/hub/HubServiceCard.tsx` | Checkout redirect com email |
| `src/pages/hub/StudentHub.tsx` | Passar email para cards |
| `supabase/config.toml` | Configurar ticto-webhook |

---

## ORDEM DE IMPLEMENTAÇÃO

1. Adicionar Secret `TICTO_SECRET_KEY`
2. Migração SQL (campos + tabela logs)
3. Atualizar tipos TypeScript
4. Atualizar formulário Admin
5. Atualizar hooks
6. Criar Edge Function
7. Atualizar HubServiceCard e StudentHub
8. Configurar webhook no painel Ticto
