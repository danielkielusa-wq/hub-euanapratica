# Menu Visibility System — Guia para Developer

> Ultima atualizacao: 2026-02-25

## Visao Geral

O sistema permite que admins controlem quais itens aparecem no menu lateral (sidebar) para alunos e mentores. A configuracao e armazenada como JSON em `app_configs` e consumida via TanStack Query com cache de 5 minutos.

**Fluxo:**
```
app_configs (key='menu_visibility', value=JSON)
    |
    v
useMenuVisibility() hook — TanStack Query, staleTime 5min
    |
    v
SidebarNav.tsx — filtra items pelo config
    |
    v
Admin UI (AdminSettings.tsx tab "Menu do App" ou /admin/menu-config)
```

---

## Arquivos Criados / Modificados

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| [useMenuVisibility.ts](../../src/hooks/useMenuVisibility.ts) | Criado | Hook principal — fetch, cache, update otimista |
| [AdminMenuConfig.tsx](../../src/pages/admin/AdminMenuConfig.tsx) | Criado | Pagina dedicada `/admin/menu-config` |
| [SidebarNav.tsx](../../src/components/layouts/SidebarNav.tsx) | Modificado | Adicionado `menuKey` nos items + filtro por visibilidade |
| [AdminSettings.tsx](../../src/pages/admin/AdminSettings.tsx) | Modificado | Nova tab "Menu do App" com toggles inline |
| [App.tsx](../../src/App.tsx) | Modificado | Rota `/admin/menu-config` protegida por admin |
| [20260225700000_add_menu_visibility_config.sql](../../supabase/migrations/20260225700000_add_menu_visibility_config.sql) | Criado | Seed do JSON inicial em app_configs |
| [20260225800000_fix_app_configs_grant.sql](../../supabase/migrations/20260225800000_fix_app_configs_grant.sql) | Criado | GRANT INSERT/UPDATE/DELETE para authenticated |

---

## Banco de Dados

### Armazenamento

Nao foi criada tabela nova. O sistema usa a tabela `app_configs` existente com a chave `menu_visibility`:

```sql
-- Chave: menu_visibility
-- Valor: JSON string
{
  "student": {
    "hub": true,
    "comunidade": true,
    "prime_jobs": false,
    ...
  },
  "mentor": {
    "dashboard": true,
    "disponibilidade": true,
    ...
  }
}
```

### Grants

A migration `20260225800000` adiciona o GRANT necessario:

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_configs TO authenticated;
```

**Por que e necessario:** Em PostgreSQL, RLS policies (`Admins can insert app configs`) controlam *quem* pode operar, mas o `GRANT` define *se* a role tem permissao para executar a operacao. Sem o `GRANT INSERT`, o PostgreSQL bloqueia **antes** de avaliar a RLS — retornando "permission denied" em vez de "violates row-level security".

---

## Hook `useMenuVisibility`

**Caminho:** [src/hooks/useMenuVisibility.ts](../../src/hooks/useMenuVisibility.ts)

### API

```typescript
const {
  config,           // MenuVisibilityConfig — objeto completo { student: {...}, mentor: {...} }
  isLoading,        // boolean
  isItemVisible,    // (role: MenuRole, key: string) => boolean
  updateVisibility, // (role: MenuRole, key: string, visible: boolean) => Promise<void>
} = useMenuVisibility();
```

### Comportamento

- **Fetch:** Query unica em `app_configs` filtrada por `key = 'menu_visibility'`
- **Cache:** TanStack Query com `staleTime: 5 * 60 * 1000` (5 minutos)
- **Fallback:** Se a chave nao existir ou o parse falhar, retorna `DEFAULT_CONFIG` (tudo `true`)
- **Merge:** Config do banco e mesclado com `DEFAULT_CONFIG` — chaves novas adicionadas ao codigo automaticamente ficam visiveis
- **Update otimista:** Ao togglear, o cache e atualizado imediatamente via `queryClient.setQueryData`. Se o upsert falhar, faz rollback

### Tipos exportados

```typescript
type MenuRole = 'student' | 'mentor';
type StudentMenuKey = 'hub' | 'comunidade' | 'agendamentos' | 'catalogo' | ... ;
type MentorMenuKey = 'dashboard' | 'espacos' | 'agendamentos' | ... ;
type MenuVisibilityConfig = {
  student: Record<StudentMenuKey, boolean>;
  mentor: Record<MentorMenuKey, boolean>;
};
```

---

## SidebarNav — Como funciona o filtro

**Caminho:** [src/components/layouts/SidebarNav.tsx](../../src/components/layouts/SidebarNav.tsx)

### `menuKey` nos items

Cada `NavItem` agora tem um campo opcional `menuKey` que mapeia para a chave no JSON de configuracao:

```typescript
{ label: 'Prime Jobs', href: '/prime-jobs', icon: Briefcase, menuKey: 'prime_jobs' }
```

### Logica de filtragem

No `getNavGroups()`, para alunos e mentores:

```typescript
groups
  .map(group => ({
    ...group,
    items: group.items.filter(item =>
      !item.menuKey || isItemVisible('student', item.menuKey)
    ),
  }))
  .filter(group => group.items.length > 0); // remove grupos vazios
```

**Importante:**
- Items **sem** `menuKey` sao sempre visiveis (backward compatible)
- Admin nav **nao e filtrada** — admins sempre veem tudo
- Se todos os items de um grupo forem desativados, o grupo inteiro desaparece

---

## Admin UI

A configuracao esta acessivel em **dois lugares**:

1. **Pagina dedicada:** `/admin/menu-config` ([AdminMenuConfig.tsx](../../src/pages/admin/AdminMenuConfig.tsx))
2. **Tab em Configuracoes:** `/admin/configuracoes` → tab "Menu do App" ([AdminSettings.tsx](../../src/pages/admin/AdminSettings.tsx))

Ambos renderizam a mesma UI: dois cards (Alunos / Mentores) com toggles por item, agrupados pelas secoes do menu.

---

## Como adicionar um novo item ao menu

1. **SidebarNav.tsx:** Adicionar o item no array `studentNavGroups` ou `mentorNavGroups` com um `menuKey` unico
2. **useMenuVisibility.ts:** Adicionar a nova key no type (`StudentMenuKey` ou `MentorMenuKey`) e no `DEFAULT_CONFIG`
3. **AdminSettings.tsx:** Adicionar o item no array `STUDENT_MENU_ITEMS` ou `MENTOR_MENU_ITEMS`
4. **AdminMenuConfig.tsx:** Adicionar o item no array `STUDENT_ITEMS` ou `MENTOR_ITEMS`

**Nao e necessaria migration** — chaves novas no codigo que nao existem no JSON do banco ficam automaticamente visiveis graças ao merge com `DEFAULT_CONFIG`.

---

## Deploy

```bash
# 1. Migrations (se houver novas)
npx supabase db push --include-all

# 2. Build
npm run build

# 3. Deploy (nao envolve Edge Functions)
```

---

## Troubleshooting

### "permission denied for table app_configs"
A migration `20260225800000` adiciona o GRANT necessario. Se o erro persistir, rode manualmente:
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_configs TO authenticated;
```

### Toggle nao salva (erro silencioso)
Verifique se a RLS policy "Admins can update app configs" existe em `app_configs`. O update otimista vai fazer rollback e mostrar toast de erro.

### Item desativado mas ainda aparece no menu
O cache TanStack Query tem `staleTime` de 5 minutos. Outros usuarios verao a mudanca apos o cache expirar ou ao recarregar a pagina.

### Novo item adicionado ao codigo nao aparece nos toggles
Certifique-se de adicionar a chave nos **4 lugares** listados na secao "Como adicionar um novo item ao menu".
