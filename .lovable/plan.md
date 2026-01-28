
# Plano: Ajuste de Logica de Compra vs. Acesso (Ticto Flow)

## Resumo

Implementar diferenciacao clara entre usuarios que ja pagaram (acesso direto) e usuarios que ainda precisam comprar (redirecionar para checkout Ticto), alem de criar uma pagina de confirmacao pos-pagamento e proteger rotas de servicos premium.

---

## Arquitetura da Solucao

```text
+-------------------+     +----------------------+     +------------------+
|   Meu Hub         | --> |  HubServiceCard      | --> |  Decisao         |
|   (StudentHub)    |     |  (logica de botao)   |     |  Acesso/Compra   |
+-------------------+     +----------------------+     +------------------+
                                    |
                   +----------------+----------------+
                   |                                 |
            hasAccess=true                    hasAccess=false
                   |                                 |
                   v                                 v
         +------------------+             +---------------------+
         | Redireciona para |             | Redireciona para    |
         | service.route    |             | ticto_checkout_url  |
         | (/curriculo)     |             | (checkout externo)  |
         +------------------+             +---------------------+
                                                    |
                                                    v
                                          +---------------------+
                                          | Ticto processa      |
                                          | pagamento           |
                                          +---------------------+
                                                    |
                                                    v
                                          +---------------------+
                                          | Redireciona para    |
                                          | /payment-success    |
                                          +---------------------+
                                                    |
                                                    v
                                          +---------------------+
                                          | Webhook Ticto       |
                                          | libera acesso       |
                                          +---------------------+
```

---

## 1. Corrigir Logica do Botao no HubServiceCard

**Arquivo:** `src/components/hub/HubServiceCard.tsx`

### Logica Atual (Problematica)
O componente nao diferencia corretamente o fluxo:
- Servicos `available` sao tratados como "liberados para todos"
- Servicos `premium` com `hasAccess=true` devem ir para a rota interna

### Logica Corrigida

```typescript
// Se usuario TEM acesso ativo -> ir para rota interna
if (hasAccess && service.route) {
  return <Link to={service.route}>...</Link>
}

// Se usuario NAO tem acesso -> ir para checkout Ticto
if (!hasAccess && service.ticto_checkout_url) {
  return <Button onClick={handleUnlock}>Desbloquear</Button>
}
```

### Alteracoes Especificas

| Cenario | Status Atual | Acao |
|---------|--------------|------|
| `hasAccess=true` + `route` existe | Mostra CTA interno | Navegar para `service.route` |
| `hasAccess=false` + `ticto_checkout_url` existe | Mostra "Desbloquear" | Abrir checkout Ticto |
| `status=available` (gratuito) | Todos tem acesso | Navegar para `service.route` |
| `status=coming_soon` | Desabilitado | Mostrar "Em Breve" |

---

## 2. Criar Pagina /payment-success

**Arquivo Novo:** `src/pages/PaymentSuccess.tsx`

### Design (Padrao Elite Startup)
- Fundo: `#F5F5F7` (bg-muted/30)
- Bordas arredondadas: `32px` (rounded-[32px])
- Glassmorphism sutil
- Icone de sucesso (CheckCircle) com animacao

### Componentes da Pagina

```text
+--------------------------------------------------+
|                                                  |
|    [✓ Icone Animado]                            |
|                                                  |
|    Pagamento Confirmado!                         |
|    Seu acesso foi liberado.                      |
|                                                  |
|    [Sincronizando seu acesso... ●●●]            |
|    (loader com delay de 3-5 segundos)            |
|                                                  |
|    [=== Ir para o meu Hub ===]                  |
|    (botao primario, gradiente Indigo-Purple)     |
|                                                  |
+--------------------------------------------------+
```

### Logica de Sincronizacao
1. Ao montar a pagina, mostrar loader "Sincronizando..."
2. Aguardar 3-5 segundos (tempo para webhook processar)
3. Revalidar `useUserHubAccess()` para atualizar cache
4. Mostrar botao "Ir para o meu Hub"

---

## 3. Criar Hook de Verificacao de Acesso a Servico

**Arquivo Novo:** `src/hooks/useServiceAccess.ts`

Hook para verificar se usuario tem acesso a um servico especifico:

```typescript
export function useServiceAccess(serviceRoute: string) {
  const { data: services } = useHubServices();
  const { data: userAccess } = useUserHubAccess();
  
  const service = services?.find(s => s.route === serviceRoute);
  
  // Verifica se servico e gratuito ou se usuario tem acesso
  const hasAccess = service?.status === 'available' || 
                   (service && userAccess?.includes(service.id));
  
  return { 
    hasAccess, 
    service, 
    isLoading: !services || !userAccess 
  };
}
```

---

## 4. Criar Componente de Protecao de Rota por Servico

**Arquivo Novo:** `src/components/guards/ServiceGuard.tsx`

Wrapper que verifica acesso antes de renderizar a pagina:

```typescript
interface ServiceGuardProps {
  serviceRoute: string;
  children: React.ReactNode;
}

export function ServiceGuard({ serviceRoute, children }) {
  const { hasAccess, isLoading } = useServiceAccess(serviceRoute);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    if (!isLoading && !hasAccess) {
      toast({
        title: "Servico nao contratado",
        description: "Adquira este servico no Hub para acessar.",
        variant: "destructive",
      });
      navigate('/dashboard/hub');
    }
  }, [hasAccess, isLoading]);
  
  if (isLoading) return <Loader />;
  if (!hasAccess) return null;
  
  return <>{children}</>;
}
```

---

## 5. Registrar Novas Rotas

**Arquivo:** `src/App.tsx`

### Nova Rota Publica
```typescript
// Pagina de sucesso de pagamento
<Route path="/payment-success" element={
  <ProtectedRoute allowedRoles={['student', 'mentor', 'admin']}>
    <PaymentSuccess />
  </ProtectedRoute>
} />
```

### Proteger Rotas de Servicos Premium
Para rotas como `/curriculo`, envolver com `ServiceGuard`:

```typescript
<Route path="/curriculo" element={
  <ProtectedRoute allowedRoles={['student', 'mentor', 'admin']}>
    <ServiceGuard serviceRoute="/curriculo">
      <CurriculoUSA />
    </ServiceGuard>
  </ProtectedRoute>
} />
```

---

## Arquivos a Criar/Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/pages/PaymentSuccess.tsx` | Criar | Pagina de confirmacao pos-pagamento |
| `src/hooks/useServiceAccess.ts` | Criar | Hook para verificar acesso a servico |
| `src/components/guards/ServiceGuard.tsx` | Criar | Guard de rota para servicos premium |
| `src/components/hub/HubServiceCard.tsx` | Modificar | Corrigir logica de botao |
| `src/App.tsx` | Modificar | Adicionar rota /payment-success |

---

## Detalhes Tecnicos

### PaymentSuccess.tsx - Estrutura
```typescript
export default function PaymentSuccess() {
  const [isSyncing, setIsSyncing] = useState(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Aguardar webhook processar
    const timer = setTimeout(() => {
      // Invalida cache para buscar novos acessos
      queryClient.invalidateQueries({ queryKey: ['user-hub-access'] });
      setIsSyncing(false);
    }, 4000); // 4 segundos de delay
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-6">
      <Card className="max-w-md w-full rounded-[32px] text-center p-8">
        <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
        <h1>Pagamento Confirmado!</h1>
        <p>Seu acesso foi liberado.</p>
        
        {isSyncing ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" />
            <span>Sincronizando seu acesso...</span>
          </div>
        ) : (
          <Button onClick={() => navigate('/dashboard/hub')}>
            Ir para o meu Hub
          </Button>
        )}
      </Card>
    </div>
  );
}
```

### HubServiceCard.tsx - Logica de Botao Atualizada
```typescript
// Determinar acao do botao
const getButtonAction = () => {
  // Coming soon - desabilitado
  if (isComingSoon) {
    return { type: 'disabled', label: 'Em Breve' };
  }
  
  // Usuario TEM acesso (premium desbloqueado ou disponivel)
  if (hasAccess) {
    return { 
      type: 'access', 
      label: service.cta_text || 'Acessar Agora',
      route: service.route 
    };
  }
  
  // Usuario NAO tem acesso - precisa comprar
  if (service.ticto_checkout_url) {
    return { 
      type: 'unlock', 
      label: 'Desbloquear Acesso',
      checkoutUrl: service.ticto_checkout_url 
    };
  }
  
  // Fallback
  return { type: 'details', label: 'Ver Detalhes' };
};
```

---

## Configuracao na Ticto

Apos implementar, configure no painel Ticto:

| Campo | Valor |
|-------|-------|
| URL de Redirecionamento Pos-Pagamento | `https://enphub.lovable.app/payment-success` |
| URL do Webhook | `https://buslxdknzogtgdnietow.supabase.co/functions/v1/ticto-webhook` |

---

## Fluxo Completo do Usuario

1. Usuario acessa **Meu Hub** (`/dashboard/hub`)
2. Ve um servico premium que nao possui
3. Clica em **"Desbloquear Acesso"**
4. E redirecionado para checkout Ticto (com email preenchido)
5. Completa o pagamento
6. Ticto redireciona para `/payment-success`
7. Pagina mostra "Sincronizando..." por 4 segundos
8. Webhook processa e libera acesso em `user_hub_services`
9. Usuario clica em "Ir para o meu Hub"
10. Servico agora aparece como **ativo** com botao "Acessar Agora"
11. Usuario pode acessar a rota interna do servico

---

## Seguranca

- Rotas premium protegidas pelo `ServiceGuard`
- Acesso digitando URL diretamente = redirect para Hub + toast de aviso
- Verificacao sempre feita contra banco de dados (nao client-side)
- Cache invalidado apos pagamento para refletir novo estado
