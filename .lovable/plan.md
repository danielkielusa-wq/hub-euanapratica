

# Plano: Impersonacao de Usuario para Administradores

## Objetivo

Permitir que administradores visualizem a plataforma exatamente como um usuario especifico veria, sem alterar a sessao real do Supabase Auth. Quando em modo de impersonacao, um botao flutuante permite retornar ao acesso de admin.

---

## Arquitetura de Seguranca

A implementacao usa uma abordagem de **sobreposicao visual** (overlay), nao uma impersonacao real:

```text
+------------------------------------------+
| Admin Real (Supabase Auth)               |
| - Mantem sessao original                 |
| - Mantem permissoes de admin no backend  |
+------------------------------------------+
           |
           v
+------------------------------------------+
| Estado de Impersonacao (React Context)   |
| - Armazena dados do usuario visualizado  |
| - Sobrescreve `user` no AuthContext      |
| - Permite ver UI como aquele usuario     |
+------------------------------------------+
```

**Importante**: O backend continua usando o token real do admin. Apenas a UI reflete a experiencia do usuario impersonado.

---

## Mudancas Necessarias

### 1. Atualizar AuthContext

| Acao | Descricao |
|------|-----------|
| Adicionar estado `impersonatedUser` | Armazena dados do usuario sendo visualizado |
| Adicionar funcao `impersonate(userId)` | Inicia a impersonacao |
| Adicionar funcao `stopImpersonation()` | Encerra a impersonacao |
| Expor `isImpersonating` | Flag booleana para UI |
| Expor `realUser` | Dados do admin real (para o botao voltar) |

**Codigo:**
```typescript
// Estado adicional
const [impersonatedUser, setImpersonatedUser] = useState<UserWithRole | null>(null);

// Nova propriedade computada
const effectiveUser = impersonatedUser || authState.user;
const isImpersonating = !!impersonatedUser;
const realUser = authState.user;

// Funcao para iniciar impersonacao
const impersonate = async (userId: string) => {
  // Buscar dados do usuario alvo
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();
  
  setImpersonatedUser({ ...profile, role: roleData.role });
};

// Funcao para encerrar
const stopImpersonation = () => setImpersonatedUser(null);
```

---

### 2. Criar Botao de Impersonacao na Tabela de Usuarios

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/admin/AdminUsers.tsx` | Adicionar item "Ver como Usuario" no DropdownMenu |

**Codigo do novo item:**
```tsx
<DropdownMenuItem onClick={() => handleImpersonate(user.id)}>
  <Eye className="mr-2 h-4 w-4" />
  Ver como Usuário
</DropdownMenuItem>
```

---

### 3. Criar Botao Flutuante de Retorno

| Arquivo | Acao |
|---------|------|
| `src/components/impersonation/ImpersonationBanner.tsx` | **NOVO** - Botao flutuante com nome do usuario e botao "Voltar" |

**Design:**
```text
+--------------------------------------------------+
| Visualizando como: João Silva  | [Voltar Admin] |
+--------------------------------------------------+
```

**Posicionamento:** Fixed no topo da tela (nao no bottom para evitar conflito com FeedbackFloatingButton)

**Codigo:**
```tsx
export function ImpersonationBanner() {
  const { isImpersonating, user, stopImpersonation } = useAuth();
  const navigate = useNavigate();

  if (!isImpersonating) return null;

  const handleExit = () => {
    stopImpersonation();
    navigate('/admin/usuarios');
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 py-2 px-4 flex items-center justify-center gap-4 shadow-md">
      <Eye className="h-4 w-4" />
      <span className="font-medium">
        Visualizando como: <strong>{user?.full_name}</strong>
      </span>
      <Button 
        size="sm" 
        variant="outline" 
        onClick={handleExit}
        className="bg-white hover:bg-amber-100"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Voltar ao Admin
      </Button>
    </div>
  );
}
```

---

### 4. Integrar Banner no Layout

| Arquivo | Mudanca |
|---------|---------|
| `src/App.tsx` | Adicionar `<ImpersonationBanner />` dentro do BrowserRouter |

---

### 5. Ajustar Layout para Acomodar Banner

| Arquivo | Mudanca |
|---------|---------|
| `src/components/layouts/DashboardLayout.tsx` | Adicionar padding-top quando `isImpersonating` |

**Codigo:**
```tsx
// No main content
<main className={cn(
  "lg:ml-64 pt-16 lg:pt-0 min-h-screen",
  isImpersonating && "pt-24 lg:pt-8" // Espaco extra para o banner
)}>
```

---

## Fluxo de Uso

```text
1. Admin acessa /admin/usuarios
2. Clica no menu de acoes (tres pontinhos) de um usuario
3. Seleciona "Ver como Usuario"
4. Sistema:
   a. Busca dados do usuario (profile + role)
   b. Armazena em impersonatedUser
   c. Redireciona para dashboard do usuario (/dashboard/hub)
5. Admin navega pela plataforma vendo tudo como o usuario
6. Banner amarelo no topo mostra "Visualizando como: Nome"
7. Ao clicar "Voltar ao Admin":
   a. Limpa impersonatedUser
   b. Redireciona para /admin/usuarios
```

---

## Arquivos a Criar/Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/contexts/AuthContext.tsx` | Modificar | Adicionar estado e funcoes de impersonacao |
| `src/types/auth.ts` | Modificar | Adicionar tipos para impersonacao no AuthContextType |
| `src/pages/admin/AdminUsers.tsx` | Modificar | Adicionar botao "Ver como Usuario" |
| `src/components/impersonation/ImpersonationBanner.tsx` | **Criar** | Banner flutuante de retorno |
| `src/components/layouts/DashboardLayout.tsx` | Modificar | Ajustar padding quando impersonando |
| `src/App.tsx` | Modificar | Adicionar ImpersonationBanner global |

---

## Secao Tecnica: Tipos

```typescript
interface AuthContextType extends AuthState {
  // Existentes
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  refreshUser: () => Promise<void>;
  
  // Novos
  impersonate: (userId: string) => Promise<void>;
  stopImpersonation: () => void;
  isImpersonating: boolean;
  realUser: UserWithRole | null; // Admin real
}
```

---

## Consideracoes de Seguranca

| Aspecto | Abordagem |
|---------|-----------|
| Autenticacao real | Nao e alterada - admin mantem seu token |
| Backend calls | Continuam usando token do admin (tem permissoes) |
| Somente UI | A impersonacao e puramente visual |
| Apenas admins | Botao so aparece na tela de AdminUsers |
| Audit log | Podemos logar quando admin inicia/encerra impersonacao |

---

## Resultado Final

- Administradores podem visualizar a plataforma exatamente como qualquer usuario
- Interface clara indica quando esta em modo de impersonacao
- Retorno facil ao acesso de admin com um clique
- Seguranca mantida - autenticacao real nao e alterada

