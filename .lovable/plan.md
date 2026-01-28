
# Plano: Tela de Teste para Simulacao de Callbacks Ticto

## Objetivo

Criar uma tela administrativa que permita simular callbacks da Ticto para testar o fluxo completo de pos-pagamento sem efetuar pagamentos reais. A tela deve chamar diretamente a Edge Function `ticto-webhook` com payloads simulados.

---

## Arquitetura da Solucao

```text
+---------------------------+
|  Admin: Simulador Ticto   |
|  /admin/ticto-simulator   |
+---------------------------+
            |
            v
+---------------------------+
|  Selecao de Produto       |
|  (hub_services)           |
+---------------------------+
            |
            v
+---------------------------+
|  Selecao de Usuario       |
|  (profiles - email)       |
+---------------------------+
            |
            v
+---------------------------+
|  Selecao de Status        |
|  (paid, refunded, etc)    |
+---------------------------+
            |
            v
+---------------------------+
|  Preview do Payload JSON  |
+---------------------------+
            |
            v
+---------------------------+
|  [Simular Callback]       |
|  (POST ticto-webhook)     |
+---------------------------+
            |
            v
+---------------------------+
|  Resultado (sucesso/erro) |
|  + Logs da requisicao     |
+---------------------------+
```

---

## Funcionalidades da Tela

### 1. Seletor de Produto
- Dropdown com todos os produtos do catalogo (`hub_services`)
- Cada opcao mostra:
  - Nome do produto
  - Tipo do servico (badge)
  - Ticto Product ID (se configurado)
- Ao selecionar, preenche automaticamente o `product_id` no payload

### 2. Seletor de Usuario (Email)
- Campo de busca com autocomplete
- Lista usuarios da tabela `profiles`
- Permite simular pagamento para qualquer usuario cadastrado
- Opcao de inserir email manualmente (para testar usuarios nao cadastrados)

### 3. Seletor de Status de Pagamento
Os status disponiveis no sistema (conforme webhook):

| Status | Descricao | Acao no Sistema |
|--------|-----------|-----------------|
| `paid` | Pagamento confirmado | Libera acesso |
| `completed` | Transacao completa | Libera acesso |
| `approved` | Pagamento aprovado | Libera acesso |
| `authorized` | Pagamento autorizado | Libera acesso |
| `venda_realizada` | Venda realizada (Ticto) | Libera acesso |
| `waiting_payment` | Aguardando pagamento | Apenas registra log |
| `refunded` | Reembolsado | Revoga acesso |
| `chargedback` | Chargeback | Revoga acesso |
| `cancelled` | Cancelado | Revoga acesso |

### 4. Preview do Payload
- Card com preview do JSON que sera enviado
- Formato identico ao payload real da Ticto:

```json
{
  "status": "paid",
  "token": "[TICTO_SECRET_KEY]",
  "item": {
    "product_id": 123456,
    "product_name": "Interview Test"
  },
  "customer": {
    "name": "Usuario Teste",
    "email": "usuario@teste.com"
  },
  "order": {
    "hash": "SIM_xxxxxxxxxx",
    "paid_amount": 9900
  }
}
```

### 5. Botao de Simulacao
- Chama a Edge Function `ticto-webhook` diretamente
- Inclui o token de autenticacao (TICTO_SECRET_KEY)
- Mostra resultado:
  - Sucesso: Toast verde + preview da resposta
  - Erro: Toast vermelho + detalhes do erro

### 6. Logs de Resultado
- Painel mostrando:
  - Status da requisicao (200, 401, 500)
  - Tempo de resposta
  - Corpo da resposta JSON
  - Acoes executadas (acesso liberado, log criado, etc)

---

## Detalhes Tecnicos

### Novo Arquivo: `src/pages/admin/AdminTictoSimulator.tsx`

Estrutura do componente:

```typescript
export default function AdminTictoSimulator() {
  const { data: services } = useAdminHubServices();
  const { data: users } = useAdminUsers(); // ou busca de profiles
  
  const [selectedService, setSelectedService] = useState<HubService | null>(null);
  const [selectedEmail, setSelectedEmail] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('paid');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  
  const generatePayload = () => ({
    status: selectedStatus,
    token: '[enviado pelo backend]', // NAO expor token real no frontend
    item: {
      product_id: selectedService?.ticto_product_id || 'SIMULATED_ID',
      product_name: selectedService?.name
    },
    customer: {
      name: 'Simulacao Admin',
      email: selectedEmail
    },
    order: {
      hash: `SIM_${Date.now()}`,
      paid_amount: (selectedService?.price || 0) * 100
    }
  });
  
  const handleSimulate = async () => {
    // Chama edge function diretamente via Supabase client
    // O token sera passado via header no backend
  };
  
  return (/* UI */);
}
```

### Nova Edge Function: `simulate-ticto-callback`

Para evitar expor o `TICTO_SECRET_KEY` no frontend, criaremos uma edge function intermediaria que:
1. Valida que o usuario e admin
2. Monta o payload com o token correto
3. Chama a `ticto-webhook` internamente

```typescript
// supabase/functions/simulate-ticto-callback/index.ts
serve(async (req) => {
  // 1. Validar que usuario e admin (via JWT)
  const authHeader = req.headers.get('Authorization');
  // ... validacao de role admin
  
  // 2. Pegar dados da requisicao
  const { email, product_id, status, amount } = await req.json();
  
  // 3. Montar payload Ticto simulado
  const tictoPayload = {
    status,
    token: Deno.env.get("TICTO_SECRET_KEY"),
    item: { product_id, product_name: 'Simulated' },
    customer: { email },
    order: { 
      hash: `SIM_${Date.now()}`,
      paid_amount: amount 
    }
  };
  
  // 4. Chamar ticto-webhook internamente
  const response = await fetch(
    `${Deno.env.get("SUPABASE_URL")}/functions/v1/ticto-webhook`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tictoPayload)
    }
  );
  
  // 5. Retornar resultado
  return new Response(JSON.stringify({
    success: response.ok,
    status: response.status,
    data: await response.json()
  }));
});
```

---

## Arquivos a Criar/Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/pages/admin/AdminTictoSimulator.tsx` | Criar | Tela principal do simulador |
| `supabase/functions/simulate-ticto-callback/index.ts` | Criar | Edge function para simulacao segura |
| `src/App.tsx` | Modificar | Adicionar rota `/admin/ticto-simulator` |
| `src/hooks/useAdminUsers.ts` | Verificar | Garantir que lista profiles para autocomplete |

---

## Design da Interface

### Layout Geral
- Fundo: `bg-muted/30` (padrao admin)
- Container centralizado: `max-w-3xl mx-auto`
- Cards com `rounded-2xl border bg-card`

### Secoes

1. **Header**
   - Titulo: "Simulador de Callbacks Ticto"
   - Subtitulo: "Teste o fluxo de pagamento sem transacoes reais"

2. **Card de Configuracao**
   - Select de Produto (com badges de tipo e preco)
   - Combobox/Input de Email (com autocomplete)
   - Select de Status do Pagamento (com cores indicativas)

3. **Card de Preview**
   - Titulo: "Payload a ser enviado"
   - Bloco de codigo JSON formatado
   - Botao "Copiar JSON"

4. **Botao de Acao**
   - "Simular Callback" (gradiente indigo-purple)
   - Loading state durante requisicao

5. **Card de Resultado** (apos simulacao)
   - Badge de status (verde/vermelho)
   - Tempo de resposta
   - JSON da resposta
   - Acoes executadas

---

## Fluxo de Uso

1. Admin acessa `/admin/ticto-simulator`
2. Seleciona um produto do catalogo
3. Digita ou seleciona email do usuario alvo
4. Escolhe o status a simular (ex: "paid")
5. Visualiza preview do payload
6. Clica em "Simular Callback"
7. Sistema chama edge function intermediaria
8. Edge function monta payload real e chama `ticto-webhook`
9. Resultado e exibido na tela
10. Admin verifica no Hub se acesso foi liberado

---

## Seguranca

- Tela acessivel apenas para role `admin`
- Token Ticto NUNCA exposto no frontend
- Edge function valida role via JWT antes de processar
- Transacoes simuladas tem prefixo `SIM_` para identificacao
- Logs registrados normalmente em `payment_logs`

---

## Rotas

Nova rota em `App.tsx`:

```typescript
<Route path="/admin/ticto-simulator" element={
  <ProtectedRoute allowedRoles={['admin']}>
    <AdminTictoSimulator />
  </ProtectedRoute>
} />
```

---

## Bonus: Link no Menu Admin

Adicionar item na sidebar de admin:
- Icone: `TestTube` ou `Webhook`
- Label: "Simulador Ticto"
- Rota: `/admin/ticto-simulator`
