
# Plano: Correção de Fluxo de Compra/Acesso e Histórico de Pedidos

## Problemas Identificados

### 1. Lógica de Acesso Incorreta
O serviço "Interview Test" está com `status: 'available'` mas deveria ser `'premium'`. Isso faz com que o código trate como "gratuito para todos":

```typescript
// Em HubServiceCard.tsx (linha 88)
const canAccess = service.status === 'available' || hasAccess;
// ↑ Se status é 'available', canAccess SEMPRE será true!
```

**Resultado:** O botão mostra "Acessar Agora" em vez de "Desbloquear Acesso".

### 2. Tabela user_hub_services Vazia
Não há registros em `user_hub_services`, indicando que nenhum acesso foi liberado ainda.

### 3. Falta Histórico de Compras
Não existe página de "Meus Pedidos" para usuários nem para admin.

---

## Arquitetura da Solução

```text
+------------------+     +-------------------+     +------------------+
| Admin Panel      |     | Hub Services DB   |     | HubServiceCard   |
| (fix status)     | --> | status='premium'  | --> | Lógica corrigida |
+------------------+     +-------------------+     +------------------+
                                                          |
                                   +----------------------+
                                   |
                   +---------------+---------------+
                   |                               |
            hasAccess=true                  hasAccess=false
            (user_hub_services)            (sem registro)
                   |                               |
                   v                               v
         +------------------+             +---------------------+
         | Acessar Agora    |             | Desbloquear Acesso  |
         | (rota interna)   |             | (ticto_checkout_url)|
         +------------------+             +---------------------+
                                                   |
                                                   v
                                          +----------------+
                                          | Ticto Checkout |
                                          +----------------+
                                                   |
                                                   v
                                          +----------------+
                                          | Webhook libera |
                                          | user_hub_svcs  |
                                          +----------------+
```

---

## Correções Necessárias

### 1. Corrigir Status do Serviço (Banco de Dados)
Atualizar o serviço "Interview Test" para `status = 'premium'`:

```sql
UPDATE hub_services 
SET status = 'premium' 
WHERE ticto_checkout_url IS NOT NULL 
  AND status = 'available';
```

### 2. Ajustar Lógica do HubServiceCard
Atualizar o componente para:
- Serviços `available` = gratuitos para todos
- Serviços `premium` = exigem entrada em `user_hub_services`
- Serviços `coming_soon` = desabilitados

**Arquivo:** `src/components/hub/HubServiceCard.tsx`

A lógica atual já está correta (verifica `hasAccess` via hook), o problema é o status errado no banco.

### 3. Criar Página "Meus Pedidos" (Usuário)
**Arquivo Novo:** `src/pages/orders/MyOrders.tsx`

Design: Padrão "Startup Elite" (fundo #F5F5F7, bordas 32px)

Conteúdo:
- Lista de transações do `payment_logs` filtrada por `user_id`
- Colunas: Nome do Serviço, Data, Valor, Status (Badge)
- Botão "Acessar" se status = 'processed'

```typescript
// Buscar histórico do usuário
const { data } = await supabase
  .from('payment_logs')
  .select(`
    *,
    service:hub_services(name, route)
  `)
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });
```

### 4. Criar Página "Histórico de Compras" (Admin)
**Arquivo Novo:** `src/pages/admin/AdminOrders.tsx`

Design: Consistente com outros painéis admin

Conteúdo:
- Lista de TODAS as transações do `payment_logs`
- Colunas: Usuário, Email, Serviço, Data, Valor, Status
- Filtros: Status, Data, Usuário

```typescript
// Buscar todas as transações (admin)
const { data } = await supabase
  .from('payment_logs')
  .select(`
    *,
    profile:profiles(full_name, email),
    service:hub_services(name)
  `)
  .order('created_at', { ascending: false });
```

### 5. Ajustar RLS para payment_logs
Permitir que usuários vejam suas próprias transações:

```sql
-- Usuários podem ver seus próprios logs
CREATE POLICY "Users can view own payment logs"
ON public.payment_logs FOR SELECT
USING (user_id = auth.uid());
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/pages/orders/MyOrders.tsx` | Criar | Histórico de compras do usuário |
| `src/pages/admin/AdminOrders.tsx` | Criar | Histórico de todas as compras (admin) |
| `src/hooks/usePaymentHistory.ts` | Criar | Hook para buscar payment_logs |
| `src/App.tsx` | Modificar | Adicionar rotas `/meus-pedidos` e `/admin/pedidos` |
| Migration SQL | Criar | Adicionar RLS e corrigir status do serviço |

---

## Detalhes Técnicos

### MyOrders.tsx - Estrutura

```typescript
export default function MyOrders() {
  const { user } = useAuth();
  const { data: orders, isLoading } = usePaymentHistory(user?.id);
  
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#F5F5F7] p-6">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-bold mb-6">Meus Pedidos</h1>
          
          <div className="space-y-4">
            {orders?.map((order) => (
              <Card key={order.id} className="rounded-[32px] p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3>{order.service?.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(order.created_at), "dd/MM/yyyy HH:mm")}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={order.status === 'processed' ? 'default' : 'secondary'}>
                      {order.status === 'processed' ? 'Aprovado' : 'Aguardando'}
                    </Badge>
                    {order.status === 'processed' && order.service?.route && (
                      <Link to={order.service.route}>
                        <Button size="sm">Acessar</Button>
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
```

### usePaymentHistory Hook

```typescript
export function usePaymentHistory(userId?: string) {
  return useQuery({
    queryKey: ['payment-history', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_logs')
        .select(`
          *,
          service:hub_services(name, route)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useAdminPaymentHistory() {
  return useQuery({
    queryKey: ['admin-payment-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_logs')
        .select(`
          *,
          profile:profiles(full_name, email),
          service:hub_services(name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}
```

### AdminOrders.tsx - Estrutura

```typescript
export default function AdminOrders() {
  const { data: orders, isLoading } = useAdminPaymentHistory();
  
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-muted/30 p-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-2xl font-bold mb-6">Histórico de Compras</h1>
          
          <Card className="rounded-2xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Transação</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders?.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.profile?.full_name}</p>
                        <p className="text-sm text-muted-foreground">{order.profile?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{order.service?.name || 'N/A'}</TableCell>
                    <TableCell>
                      {format(new Date(order.created_at), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {order.transaction_id}
                    </TableCell>
                    <TableCell>
                      <Badge variant={order.status === 'processed' ? 'default' : 'secondary'}>
                        {order.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
```

---

## Migração SQL

```sql
-- 1. Atualizar status de serviços com checkout Ticto para 'premium'
UPDATE hub_services 
SET status = 'premium' 
WHERE ticto_checkout_url IS NOT NULL 
  AND status = 'available'
  AND price > 0;

-- 2. Permitir usuários verem seus próprios payment_logs
CREATE POLICY "Users can view own payment logs"
ON public.payment_logs FOR SELECT
USING (user_id = auth.uid());
```

---

## Novas Rotas

```typescript
// Em App.tsx

// Meus Pedidos (usuário)
<Route path="/meus-pedidos" element={
  <ProtectedRoute allowedRoles={['student', 'mentor', 'admin']}>
    <MyOrders />
  </ProtectedRoute>
} />

// Histórico de Compras (admin)
<Route path="/admin/pedidos" element={
  <ProtectedRoute allowedRoles={['admin']}>
    <AdminOrders />
  </ProtectedRoute>
} />
```

---

## Fluxo Completo Corrigido

1. Admin configura serviço premium com `status='premium'` e `ticto_checkout_url`
2. Usuário acessa Hub e vê botão "Desbloquear Acesso"
3. Clique redireciona para Ticto checkout (com email preenchido)
4. Pagamento processado → Webhook libera acesso em `user_hub_services`
5. Usuário redirecionado para `/payment-success`
6. Cache invalidado → Hub mostra "Acessar Agora"
7. Usuário pode ver histórico em `/meus-pedidos`
8. Admin pode ver todas as compras em `/admin/pedidos`

---

## Checklist de Verificação

- [ ] Serviços premium têm `status='premium'` no banco
- [ ] `ticto_product_id` corresponde ao ID enviado no webhook
- [ ] RLS permite usuário ver seus próprios `payment_logs`
- [ ] Rotas `/meus-pedidos` e `/admin/pedidos` registradas
- [ ] Menu lateral inclui link para "Meus Pedidos"
