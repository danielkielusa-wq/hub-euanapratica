
# Plano: Correcao Definitiva da Pagina de Gestao de Usuarios

## Problema Identificado

A query atual no hook `useAdminUsers` falha com **erro 400**:

```
"Could not find a relationship between 'profiles' and 'user_espacos'"
```

### Analise do Erro

A query tenta fazer embedding de duas tabelas relacionadas:
```typescript
.select(`
  ...
  user_roles!inner(role),   // ✅ Agora funciona (FK adicionada)
  user_espacos(count)       // ❌ FALHA - FK aponta para auth.users
`)
```

**Estrutura atual de FKs:**
- `user_roles.user_id -> profiles.id` ✅ (adicionada na migracao anterior)
- `user_espacos.user_id -> auth.users.id` ❌ (PostgREST nao consegue seguir)

PostgREST so consegue navegar FKs dentro do schema `public`. Como `user_espacos.user_id` referencia `auth.users`, a navegacao falha.

---

## Solucao

Duas abordagens possiveis:

### Opcao A: Adicionar FK de user_espacos para profiles (Recomendada)
```sql
ALTER TABLE public.user_espacos
ADD CONSTRAINT user_espacos_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
```

**Vantagens:**
- Query simples com embedding
- Consistente com a correcao de user_roles
- Performance otima (uma query)

### Opcao B: Mudar o hook para queries separadas

**Desvantagens:**
- 2 roundtrips ao banco
- Mais codigo para manter

---

## Implementacao (Opcao A)

### Parte 1: Migracao de Banco de Dados

Adicionar FK `user_espacos.user_id -> profiles.id`:

```sql
-- Add foreign key from user_espacos to profiles
-- This enables PostgREST to navigate the relationship
ALTER TABLE public.user_espacos
ADD CONSTRAINT user_espacos_user_id_profiles_fkey
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;
```

### Parte 2: Nenhuma Alteracao no Hook

O hook ja esta correto. Apos a FK ser adicionada, a query funcionara automaticamente.

---

## Por Que a FK Adicional Funciona?

Como `profiles.id` e sempre igual a `auth.users.id` (definido pelo trigger `handle_new_user`), podemos ter duas FKs:

1. `user_espacos.user_id -> auth.users.id` (cascata de delecao do auth)
2. `user_espacos.user_id -> profiles.id` (permite navegacao PostgREST)

Ambas apontam para o mesmo UUID, mas servem propositos diferentes:
- A FK para `auth.users` garante integridade quando o usuario e deletado do auth
- A FK para `profiles` permite queries com embedding no PostgREST

---

## Resumo das Alteracoes

| Componente | Tipo | Descricao |
|------------|------|-----------|
| Migracao SQL | Nova | Adiciona FK `user_espacos.user_id -> profiles.id` |

---

## Fluxo Apos Correcao

```text
1. Admin acessa /admin/usuarios
   → Hook executa query com embedding
   → PostgREST segue ambas as FKs:
     - profiles -> user_roles ✅
     - profiles -> user_espacos ✅
   → Retorna todos os usuarios com roles e contagem de espacos

2. Tabela renderiza corretamente:
   | Usuario      | Papel        | Status | Ultimo Login | Espacos | Cadastro | Acoes   |
   |--------------|--------------|--------|--------------|---------|----------|---------|
   | Admin Teste  | Administrador| Ativo  | ha 1 hora    | 0       | 24/01    | [menu]  |
   | Mentor Teste | Mentor       | Ativo  | ha 2 dias    | 2       | 24/01    | [menu]  |
   | Aluno Kiel   | Aluno        | Ativo  | ha 3 dias    | 1       | 25/01    | [menu]  |

3. Funcoes administrativas disponiveis:
   - Alterar Papel ✅
   - Ver Historico ✅
   - Ativar/Desativar ✅
   - Criar Usuario ✅
   - Excluir Permanentemente ✅
```

---

## Verificacao Pos-Implementacao

1. Acessar `/admin/usuarios` como admin
2. Verificar que todos os 7 usuarios aparecem na tabela
3. Verificar que a coluna "Espacos" mostra contagem correta
4. Testar cada funcao administrativa
5. Verificar filtros (papel, busca, mostrar inativos)

---

## Notas Tecnicas

### Seguranca
A FK adicional nao afeta RLS pois:
- `user_espacos` ja tem policies baseadas em `is_admin_or_mentor()`
- A FK apenas cria relacionamento para navegacao, nao altera permissoes
- Dados ja existentes permanecem intactos

### Consistencia
Esta correcao segue o mesmo padrao aplicado a `user_roles`, garantindo que todas as tabelas com `user_id` possam ser acessadas via embedding no PostgREST.
