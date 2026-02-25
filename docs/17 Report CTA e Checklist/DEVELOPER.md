# Report CTA e Checklist — Guia para Developer

> Ultima atualizacao: 2026-02-25

## Visao Geral

Correcao dos links de CTA no relatorio de lead (modo limitado) e adicao de um item no checklist de boas-vindas para que usuarios que assinaram possam encontrar seu relatorio completo.

**Problemas resolvidos:**

1. `/assinar` nao existia como rota → corrigido para `/pricing`
2. `https://hub.euanapratica.com/consultoria` nao existia → URL agora vem de `app_configs`
3. Apos assinar, usuario nao tinha como encontrar o relatorio → item adicionado ao checklist

**Fluxo:**

```
app_configs (key='report_cta_consultoria_url')
    |
    v
V2CTAFinal.tsx — fetch direto via supabase.from('app_configs')
    |
    v
Botao "Agendar sessao" abre URL configurada

get_user_report_token() RPC — SECURITY DEFINER
    |
    v
useGuidedTour.ts — useChecklistStatus() monta item dinamico
    |
    v
GettingStartedChecklist.tsx — renderiza "Ver diagnostico de carreira"
    |
    v
PublicReport.tsx — marca step_view_report ao visualizar
```

---

## Arquivos Criados / Modificados

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| [20260225500000_add_report_cta_config.sql](../../supabase/migrations/20260225500000_add_report_cta_config.sql) | Criado | Seed de `report_cta_consultoria_url` + RPC `get_user_report_token()` + GRANT anon |
| [V2CTAFinal.tsx](../../src/components/report/v2/V2CTAFinal.tsx) | Modificado | Fetch consultoria URL de `app_configs`; `/assinar` → `/pricing` |
| [ReportSectionLock.tsx](../../src/components/report/v2/ReportSectionLock.tsx) | Modificado | `/assinar` → `/pricing` (ambos os botoes) |
| [guidedTour.ts](../../src/types/guidedTour.ts) | Modificado | Adicionado `step_view_report` e `view_report` key |
| [useGuidedTour.ts](../../src/hooks/useGuidedTour.ts) | Modificado | Novo hook `useUserReportToken()` + item dinamico no checklist |
| [PublicReport.tsx](../../src/pages/report/PublicReport.tsx) | Modificado | useEffect marca `step_view_report` para usuarios autenticados |
| [AdminSettings.tsx](../../src/pages/admin/AdminSettings.tsx) | Modificado | Campo editavel para URL de agendamento na secao Leads/Webhook |

---

## Banco de Dados

### Migration `20260225500000`

```sql
-- 1. Seed da URL de agendamento em app_configs
INSERT INTO app_configs (key, value, description)
VALUES ('report_cta_consultoria_url', 'https://hub.euanapratica.com', '...')
ON CONFLICT (key) DO NOTHING;

-- 2. Grant SELECT para anon (pagina publica do relatorio precisa ler app_configs)
GRANT SELECT ON public.app_configs TO anon;

-- 3. RPC para buscar token do relatorio do usuario autenticado
CREATE FUNCTION get_user_report_token() RETURNS text
```

### RPC `get_user_report_token()`

- **Tipo:** SECURITY DEFINER (acessa `auth.users` e `career_evaluations` sem RLS)
- **Retorno:** `text` (access_token) ou `NULL`
- **Grant:** apenas `authenticated`
- **Logica:**
  1. Busca email do usuario via `auth.uid()` em `auth.users`
  2. Busca `career_evaluations` onde `LOWER(email) = LOWER(v_email)` e `formatted_report IS NOT NULL`
  3. Ordena por `updated_at DESC`, retorna o mais recente

**Por que match por email e nao por user_id:** Leads importados via admin ou webhook nao tem `user_id` populado na `career_evaluations`. O email e o unico vinculo confiavel entre o lead e o usuario registrado.

---

## Frontend — CTA Fix

### V2CTAFinal.tsx

O componente agora busca a URL de agendamento diretamente do banco:

```typescript
const [consultoriaUrl, setConsultoriaUrl] = useState('');

useEffect(() => {
  if (!isLimited) return; // So busca no modo limitado
  supabase
    .from('app_configs')
    .select('value')
    .eq('key', 'report_cta_consultoria_url')
    .single()
    .then(({ data }) => {
      if (data?.value) setConsultoriaUrl(data.value);
    });
}, [isLimited]);
```

**Fallback:** Se a query falhar ou retornar vazio, o botao usa `'https://hub.euanapratica.com'`.

**GRANT anon:** A migration adiciona `GRANT SELECT ON app_configs TO anon` porque o relatorio e acessivel sem autenticacao (supabase client usa anon key). A RLS policy `USING (true)` ja existia, mas sem o GRANT o PostgreSQL bloqueava antes de avaliar RLS.

### ReportSectionLock.tsx

Alteracao simples: `navigate('/assinar')` → `navigate('/pricing')` em ambos os botoes (inline e full).

---

## Frontend — Checklist

### useGuidedTour.ts

Novo hook privado `useUserReportToken()`:

```typescript
function useUserReportToken() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['user-report-token', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_report_token');
      if (error) return null;
      return data as string | null;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}
```

O `useChecklistStatus()` agora:
1. Chama `useUserReportToken()` em paralelo com `useGuidedTourState()`
2. Se `reportToken` existir, insere o item "Ver seu diagnostico de carreira" em 2a posicao
3. Marcacao: `completed: !!tourState.step_view_report`

### PublicReport.tsx

useEffect fire-and-forget que marca o step quando usuario autenticado visualiza o relatorio:

```typescript
useEffect(() => {
  if (!evaluation) return;
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (!user) return;
    // Read → merge → update guided_tour_state
    // So executa se step_view_report ainda nao estiver true
  });
}, [evaluation?.id]);
```

**Nao usa hook `useUpdateGuidedTourState`** porque PublicReport nao esta dentro do contexto de AuthProvider (pagina publica). Em vez disso, faz read-merge-update manual via supabase client.

### guidedTour.ts (tipos)

```typescript
// GuidedTourState
step_view_report?: boolean;

// ChecklistItemKey
| 'view_report';
```

---

## Admin UI

O campo fica em [AdminSettings.tsx](../../src/pages/admin/AdminSettings.tsx), secao **Leads / Webhook**:

- **State:** `consultoriaBookingUrl`
- **Config key:** `report_cta_consultoria_url`
- **Load:** No `useEffect` junto com os outros configs de webhook
- **Save:** No `handleSaveWebhook()` junto com webhook URL, base URL e webhook enabled
- **Change detection:** Incluido no `hasWebhookChanges` useEffect

---

## Deploy

```bash
# 1. Migration (ja aplicada em 2026-02-25)
supabase db push --include-all

# 2. Build frontend
npm run build

# 3. Nao envolve Edge Functions — nenhum deploy de functions necessario
```

---

## Troubleshooting

### Botao "Agendar sessao" abre URL errada
Verificar `app_configs` no Supabase:
```sql
SELECT value FROM app_configs WHERE key = 'report_cta_consultoria_url';
```
Se estiver com valor generico (`https://hub.euanapratica.com`), o admin precisa atualizar via `/admin/configuracoes`.

### Item "Ver diagnostico" nao aparece no checklist
1. Verificar se o usuario tem `career_evaluation` com email correspondente:
```sql
SELECT access_token, formatted_report IS NOT NULL as has_report
FROM career_evaluations
WHERE LOWER(email) = LOWER('email-do-usuario@example.com')
ORDER BY updated_at DESC
LIMIT 1;
```
2. Se `has_report` for `false`, o relatorio ainda nao foi processado
3. Se nao retornar nenhum resultado, o email do cadastro nao bate com o email do formulario de lead

### Erro "permission denied for table app_configs" no relatorio publico
O `GRANT SELECT TO anon` pode nao ter sido aplicado. Rodar manualmente:
```sql
GRANT SELECT ON public.app_configs TO anon;
```

### step_view_report nao marca como concluido
O useEffect em PublicReport so dispara se `evaluation` estiver carregado (o usuario passou pela verificacao de email). Se o usuario chegar diretamente autenticado como admin, o step tambem e marcado.
