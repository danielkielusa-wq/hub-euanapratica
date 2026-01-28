
# Plano: Correcao da Pagina de Gestao de Usuarios (/admin/usuarios)

## Problema Identificado

A pagina `/admin/usuarios` mostra "Nenhum usuario encontrado" porque a query do Supabase falha com erro **400**:

```
"Could not find a relationship between 'profiles' and 'user_roles' in the schema cache"
```

### Causa Raiz

A tabela `user_roles` tem uma foreign key para `auth.users(id)`:
```sql
user_roles_user_id_fkey: user_roles.user_id -> auth.users.id
```

Porem, o PostgREST **nao consegue** seguir relacionamentos para o schema `auth` (reservado). A query atual tenta usar embedding:

```typescript
.select(`
  id, email, full_name, ...
  user_roles!inner(role),  // <- Falha aqui
  user_espacos(count)
`)
```

O PostgREST nao encontra FK entre `profiles` e `user_roles` porque ela nao existe - apenas existe FK para `auth.users`.

---

## Solucao: Adicionar Foreign Key para profiles

Como `profiles.id` e sempre igual a `auth.users.id` (definido pelo trigger `handle_new_user`), podemos adicionar uma FK adicional:

```sql
ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_user_id_profiles_fkey
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;
```

### Por que isso funciona?
- PostgREST detecta FKs no schema `public`
- A relacao `profiles.id <-> user_roles.user_id` se torna navegavel
- A query embedded `user_roles!inner(role)` passa a funcionar

---

## Implementacao

### Parte 1: Migracao de Banco de Dados

**Adicionar FK de user_roles para profiles:**

```sql
-- Add foreign key from user_roles to profiles
-- This enables PostgREST to navigate the relationship
ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_user_id_profiles_fkey
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;
```

### Parte 2: Melhoria no Hook (Fallback de Seguranca)

Mesmo com a FK, e prudente adicionar tratamento de erro para o hook:

**Arquivo:** `src/hooks/useAdminUsers.ts`

```typescript
export function useAdminUsers(filters: UserFilters = {}) {
  return useQuery({
    queryKey: ['admin-users', filters],
    queryFn: async () => {
      // Query with embedded relationship (works after FK is added)
      let query = supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          phone,
          profile_photo_url,
          status,
          created_at,
          last_login_at,
          user_roles!inner(role),
          user_espacos(count)
        `)
        .order('created_at', { ascending: false });

      // ... filters ...

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching admin users:', error);
        throw error;
      }

      // Transform data
      return (data || []).map((user: any) => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        profile_photo_url: user.profile_photo_url,
        status: user.status || 'active',
        created_at: user.created_at,
        last_login_at: user.last_login_at,
        role: user.user_roles?.[0]?.role || 'student',
        enrollments_count: user.user_espacos?.[0]?.count || 0
      })) as UserExtended[];
    }
  });
}
```

---

## Resumo das Alteracoes

| Componente | Tipo | Descricao |
|------------|------|-----------|
| Migracao SQL | Nova | Adiciona FK `user_roles.user_id -> profiles.id` |
| `useAdminUsers.ts` | Melhoria | Adiciona logging de erro para debug |

---

## Fluxo Apos Correcao

```
1. Admin acessa /admin/usuarios
   → Hook executa query com embedding
   → PostgREST segue FK user_roles -> profiles
   → Retorna todos os usuarios com suas roles

2. Tabela renderiza:
   | Usuario      | Papel        | Status | Acoes    |
   |--------------|--------------|--------|----------|
   | Admin Teste  | Administrador| Ativo  | [menu]   |
   | Mentor Teste | Mentor       | Ativo  | [menu]   |
   | Aluno Teste  | Aluno        | Ativo  | [menu]   |

3. Funcoes administrativas disponiveis:
   - Alterar Papel (dropdown -> salvar)
   - Ver Historico (modal de audit logs)
   - Ativar/Desativar usuario
   - Excluir permanentemente (hard delete via Edge Function)
   - Criar novo usuario (dialog)
```

---

## Verificacao Pos-Implementacao

1. Acessar `/admin/usuarios` como admin
2. Verificar que todos os usuarios aparecem na tabela
3. Testar "Alterar Papel" em um usuario
4. Testar "Ver Historico" 
5. Testar "Desativar Usuario"
6. Testar "Criar Novo Usuario"
7. Testar "Excluir Permanentemente" (com cautela!)

---

## Notas Tecnicas

### Por que nao mudar a query?
Poderiamos fazer 2 queries separadas (profiles + user_roles) e fazer join no frontend, mas:
- Menos eficiente (2 roundtrips)
- Mais codigo para manter
- A FK adicional e a solucao correta do ponto de vista de modelagem

### Seguranca
A FK adicional nao afeta RLS pois:
- `user_roles` ja tem policies baseadas em `has_role(auth.uid(), 'admin')`
- A FK apenas cria relacionamento para navegacao, nao altera permissoes
