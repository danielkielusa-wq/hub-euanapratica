
# Plano de Correção: Convites e Sistema de Créditos

## Resumo dos Problemas Identificados

1. **Link de Convite Inválido**: O e-mail gera links para `/register`, mas a rota correta é `/cadastro`
2. **Erro ao Alterar Plano (Admin)**: A constraint no banco não aceita as ações `plan_changed` e `usage_reset`
3. **Display de Créditos Incorreto**: O cabeçalho mostra infinito ao invés do limite real do usuário

---

## Parte 1: Correção do Fluxo de Convites

### 1.1 Corrigir Rota do Link de Convite
**Arquivo**: `supabase/functions/send-espaco-invitation/index.ts`

Alterar a linha que gera o link de convite:
```typescript
// DE:
const inviteLink = `${origin}/register?token=${invitation.token}&espaco_id=${espaco_id}`

// PARA:
const inviteLink = `${origin}/cadastro?token=${invitation.token}&espaco_id=${espaco_id}`
```

### 1.2 Atualizar Página de Registro
**Arquivo**: `src/pages/Register.tsx`

Modificar para:
- Armazenar o `espaco_id` da URL para redirecionamento apos onboarding
- Processar o convite automaticamente apos registro

### 1.3 Adicionar Redirecionamento pos-Onboarding
**Arquivo**: `src/pages/Onboarding.tsx`

Apos completar onboarding, verificar se existe um `espaco_id` pendente no localStorage e redirecionar para a pagina do Espaco.

---

## Parte 2: Correção do Erro de Plano (Prioridade Alta)

### 2.1 Atualizar Constraint do Banco de Dados

**Migracao SQL necessaria**:
```sql
-- Remover constraint antiga
ALTER TABLE public.user_audit_logs 
DROP CONSTRAINT IF EXISTS user_audit_logs_action_check;

-- Adicionar nova constraint com acoes adicionais
ALTER TABLE public.user_audit_logs 
ADD CONSTRAINT user_audit_logs_action_check 
CHECK (action = ANY (ARRAY[
  'created', 
  'updated', 
  'status_changed', 
  'role_changed', 
  'profile_updated', 
  'login',
  'plan_changed',    -- NOVA
  'usage_reset'      -- NOVA
]));
```

Isso permitira que as funcoes RPC `admin_change_user_plan` e `admin_reset_user_usage` funcionem corretamente.

---

## Parte 3: Sincronizacao de Creditos e Display

### 3.1 Atualizar Cabecalho do Curriculo USA
**Arquivo**: `src/components/curriculo/CurriculoHeader.tsx`

Substituir o icone fixo de infinito pelo componente `QuotaDisplay` que ja existe:

```typescript
import { QuotaDisplay } from '@/components/curriculo/QuotaDisplay';

export function CurriculoHeader() {
  return (
    <div className="flex items-center justify-between">
      {/* ... logo ... */}
      <QuotaDisplay />  {/* Usa os dados reais do plano */}
    </div>
  );
}
```

### 3.2 Verificar Display no Admin
**Arquivo**: `src/pages/admin/AdminSubscriptions.tsx`

O codigo ja esta correto (linha 239 mostra `∞` para limite 999), mas o problema esta no RPC que nao consegue salvar devido ao erro de constraint. Apos corrigir a migracao, funcionara.

---

## Parte 4: Consistencia de Feature Gating

### 4.1 Logica de Bloqueio
**Arquivo**: `src/pages/curriculo/CurriculoReport.tsx`

A logica atual bloqueia features baseado em `quota.features` (ex: `show_improvements`), que esta correto. O bloqueio NAO depende do numero de creditos restantes - depende apenas das features do plano.

- Usuario Basico com 1 credito: ve score + metricas, mas Melhorias e Entrevista ficam bloqueados
- Usuario Pro/VIP: todas features disponiveis

**Nenhuma alteracao necessaria** - o sistema ja funciona assim.

---

## Resumo de Arquivos a Modificar

| Arquivo | Tipo de Alteracao |
|---------|------------------|
| `supabase/migrations/xxx_fix_audit_constraint.sql` | Nova migracao (constraint) |
| `supabase/functions/send-espaco-invitation/index.ts` | Corrigir rota do link |
| `src/components/curriculo/CurriculoHeader.tsx` | Usar QuotaDisplay |
| `src/pages/Register.tsx` | Armazenar espaco_id |
| `src/pages/Onboarding.tsx` | Redirecionar para Espaco |

---

## Detalhes Tecnicos

### Constraint Atual (problema):
```sql
CHECK ((action = ANY (ARRAY['created', 'updated', 'status_changed', 
'role_changed', 'profile_updated', 'login'])))
```

### Nova Constraint (solucao):
```sql
CHECK ((action = ANY (ARRAY['created', 'updated', 'status_changed', 
'role_changed', 'profile_updated', 'login', 'plan_changed', 'usage_reset'])))
```

### Fluxo de Convite Corrigido:
```
1. Mentor clica "Convidar Aluno"
2. Sistema envia email com link /cadastro?token=X&espaco_id=Y
3. Usuario clica no link e ve formulario de registro
4. Usuario cria conta → processa convite automaticamente
5. Redirect para onboarding
6. Apos onboarding → redirect para /dashboard/espacos/{espaco_id}
```

---

## Ordem de Implementacao Recomendada

1. **Primeiro**: Corrigir a constraint do banco (libera funcionalidade de admin)
2. **Segundo**: Corrigir o link do convite (de /register para /cadastro)
3. **Terceiro**: Atualizar CurriculoHeader para usar QuotaDisplay
4. **Quarto**: Implementar redirecionamento pos-onboarding para Espaco
