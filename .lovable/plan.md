

# Plano: Corrigir Webhook Ticto (Erro 401)

## Problema Identificado

A função `ticto-webhook` está retornando **401 Unauthorized** porque:

1. **Token no lugar errado** - A Ticto envia o token no **body JSON** (`payload.token`), não no header
2. **Mapeamento de campos incorreto** - O payload real usa estrutura diferente da documentada

### Payload Real da Ticto (baseado no teste):

```json
{
  "status": "waiting_payment",  // Campo principal de status
  "token": "RGvEA2PlW...",      // Token no body, não no header
  "item": {
    "product_id": 1,            // ID do produto
    "offer_id": 16,             // ID da oferta
    "product_name": "..."
  },
  "customer": {
    "email": "emailteste@customerteste.com.io",
    "name": "Cliente Teste"
  },
  "order": {
    "hash": "TOB12609GU88Q5"    // ID da transação
  }
}
```

---

## Correções Necessarias

### 1. Validação de Token (Linha 38-56)

**Antes:**
```typescript
const tictoToken = req.headers.get("X-Ticto-Token") || req.headers.get("Authorization")?.replace("Bearer ", "");
```

**Depois:**
```typescript
// Parse payload PRIMEIRO para acessar o token
const payload = await req.json();

// Token pode vir no body (payload.token) OU no header
const tictoToken = payload.token || 
                   req.headers.get("X-Ticto-Token") || 
                   req.headers.get("Authorization")?.replace("Bearer ", "");

console.log("Token validation:", { 
  receivedToken: tictoToken?.substring(0, 20) + "...", 
  hasExpectedToken: !!expectedToken 
});
```

### 2. Mapeamento de Campos Corrigido

**Email:** `payload.customer?.email`
**Product ID:** `payload.item?.product_id` ou `payload.item?.offer_id`
**Transaction ID:** `payload.order?.hash` ou `payload.transaction_id`
**Status:** `payload.status` ou `payload.event`

### 3. Adicionar Mais Status de Venda

A Ticto usa diferentes status. Adicionar:
- `"paid"` - Pagamento confirmado
- `"completed"` - Venda finalizada
- `"approved"` - Aprovado
- `"authorized"` - Autorizado (cartão)

**Nota:** `"waiting_payment"` é boleto aguardando, NÃO deve liberar acesso.

---

## Codigo Corrigido

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-ticto-token",
};

interface TictoPayload {
  status?: string;
  event?: string;
  token?: string;
  item?: {
    product_id?: number;
    offer_id?: number;
    product_name?: string;
  };
  customer?: {
    name?: string;
    email?: string;
    phone?: { ddd?: string; ddi?: string; number?: string };
  };
  order?: {
    hash?: string;
    paid_amount?: number;
  };
  transaction_id?: string;
  [key: string]: unknown;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Parse payload PRIMEIRO (token pode estar no body)
    const payload: TictoPayload = await req.json();
    
    console.log("Ticto webhook received:", {
      status: payload.status,
      productId: payload.item?.product_id,
      email: payload.customer?.email,
      tokenPresent: !!payload.token
    });

    // 2. Validar token - pode vir no body OU header
    const expectedToken = Deno.env.get("TICTO_SECRET_KEY");
    const receivedToken = payload.token || 
                          req.headers.get("X-Ticto-Token") || 
                          req.headers.get("Authorization")?.replace("Bearer ", "");

    if (!expectedToken) {
      console.error("TICTO_SECRET_KEY not configured");
      return new Response(JSON.stringify({ error: "Webhook not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!receivedToken || receivedToken !== expectedToken) {
      console.error("Token mismatch:", { 
        received: receivedToken?.substring(0, 20) + "...",
        expected: expectedToken?.substring(0, 20) + "..."
      });
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 4. Extrair dados do payload corretamente
    const eventStatus = (payload.status || payload.event || "").toLowerCase();
    const customerEmail = payload.customer?.email?.toLowerCase();
    const productId = String(payload.item?.product_id || payload.item?.offer_id || "");
    const transactionId = payload.order?.hash || payload.transaction_id;

    console.log("Parsed data:", { eventStatus, customerEmail, productId, transactionId });

    // 5. Processar evento de venda
    const saleEvents = ["paid", "completed", "approved", "authorized", "venda_realizada"];
    
    if (saleEvents.includes(eventStatus)) {
      // ... resto da logica de processamento
    }

    // 6. Retornar sucesso (SEMPRE 200 para evitar retry)
    return new Response(JSON.stringify({ success: true, status: eventStatus }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

---

## Verificacao do Secret

Tambem preciso confirmar que o valor do `TICTO_SECRET_KEY` configurado corresponde exatamente ao token que a Ticto envia. 

No payload de teste, o token e:
```
RGvEA2PlWhyMPxg6FjfbNFa90EydvH51T0T4pCXkjOZHcgJ4tqQbcrL0wDQZHINoKtgQPwWyi3CCZujoVTwZgK8JyAAV70cC2WGl
```

**Verifique se esse e o mesmo valor que voce configurou como `TICTO_SECRET_KEY`.**

---

## Arquivo a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/ticto-webhook/index.ts` | Corrigir validacao de token + mapeamento de campos |

---

## Logs de Debug Adicionados

Apos a correcao, os logs mostrarao:
- Token recebido vs esperado (primeiros 20 chars para seguranca)
- Status do evento
- Email e Product ID extraidos
- Se encontrou usuario/servico no banco

