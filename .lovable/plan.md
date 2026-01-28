
# Plano: Correcao do Sistema de Creditos - Uso Nao Sendo Registrado

## Diagnostico do Problema

### Causa Raiz Identificada
O erro nos logs da Edge Function mostra claramente:
```
"Error logging usage: new row violates row-level security policy for table \"usage_logs\""
```

**O que esta acontecendo:**
1. A Edge Function `analyze-resume` tenta inserir diretamente na tabela `usage_logs` (linha 471)
2. A tabela `usage_logs` NAO tem politica RLS para INSERT
3. O insert falha silenciosamente (o erro e apenas logado, nao impede o resultado)
4. A analise e retornada ao usuario, mas o uso NUNCA e registrado
5. O Admin mostra 0/1 para todos porque a tabela esta vazia

### Evidencia
```sql
SELECT * FROM usage_logs ORDER BY created_at DESC LIMIT 10;
-- Resultado: [] (tabela vazia!)
```

---

## Solucao

### Alteracao Unica Necessaria

**Arquivo:** `supabase/functions/analyze-resume/index.ts`

**Problema (linha 471-474):**
```typescript
const { error: logError } = await supabase.from("usage_logs").insert({
  user_id: userId,
  app_id: "curriculo_usa",
});
```

**Solucao:**
Usar a funcao RPC `record_curriculo_usage` que ja existe e tem `SECURITY DEFINER` (ignora RLS):

```typescript
const { error: logError } = await supabase.rpc('record_curriculo_usage', {
  p_user_id: userId,
});
```

### Por que isso funciona

A funcao RPC `record_curriculo_usage` ja existe no banco:
```sql
CREATE FUNCTION public.record_curriculo_usage(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER  -- <-- IGNORA RLS!
AS $$
BEGIN
  INSERT INTO public.usage_logs (user_id, app_id)
  VALUES (p_user_id, 'curriculo_usa');
  RETURN true;
END;
$$
```

O `SECURITY DEFINER` executa a funcao com os privilegios do OWNER (superuser), ignorando as politicas RLS.

---

## O Que Sera Corrigido Automaticamente

Apos esta unica alteracao:

| Problema | Status |
|----------|--------|
| Admin mostra 0/1 para todos | Corrigido - Mostrara uso real |
| Header mostra 1/1 mesmo apos analise | Corrigido - Mostrara 0/1 |
| Bloqueio preventivo nao funciona | Corrigido - Bloqueara quando remaining=0 |
| Tokens de IA desperdicados | Corrigido - Gatekeeper funcionara |

### Fluxo Apos Correcao

```text
1. Usuario com 1 credito acessa /curriculo
   → Header mostra "1/1 analises"
   → Botao "Analisar" habilitado

2. Usuario executa analise
   → Edge function registra uso via RPC
   → Linha inserida em usage_logs
   → refetchQuota() atualiza o hook
   → Header atualiza para "0/1 analises"
   → Admin atualiza para "1/1 uso"

3. Usuario tenta segunda analise
   → Header mostra "0/1" em vermelho pulsante
   → Botao mostra "Limite Atingido - Faca Upgrade"
   → Clique abre UpgradeModal
   → Edge function retorna 402 sem chamar Gemini
```

---

## Implementacao

### Arquivo a Modificar
`supabase/functions/analyze-resume/index.ts`

### Alteracao Especifica
Linhas 470-479:

**DE:**
```typescript
// ========== RECORD USAGE: Log successful analysis ==========
const { error: logError } = await supabase.from("usage_logs").insert({
  user_id: userId,
  app_id: "curriculo_usa",
});

if (logError) {
  console.error("Error logging usage:", logError);
  // Don't fail the request, just log the error
}
// ========== END RECORD USAGE ==========
```

**PARA:**
```typescript
// ========== RECORD USAGE: Log successful analysis via RPC (bypasses RLS) ==========
const { error: logError } = await supabase.rpc('record_curriculo_usage', {
  p_user_id: userId,
});

if (logError) {
  console.error("Error logging usage:", logError);
  // Don't fail the request, just log the error
}
// ========== END RECORD USAGE ==========
```

---

## Verificacao Pos-Implementacao

### Teste Manual Recomendado

1. **Resetar uso atual** (se houver): Admin → Assinaturas → Resetar
2. **Verificar contador inicial**: Usuario deve ver "1/1" no header
3. **Executar analise**: Fazer upload + descricao + analisar
4. **Verificar apos analise**:
   - Header deve mostrar "0/1" em vermelho
   - Admin deve mostrar "1/1" com barra cheia
   - `SELECT * FROM usage_logs` deve ter 1 registro
5. **Tentar segunda analise**:
   - Botao deve estar desabilitado
   - Clique deve abrir modal de upgrade
   - Edge function deve retornar 402 (verificar logs)

### Query de Verificacao
```sql
SELECT 
  u.email, 
  COUNT(ul.id) as usage_count,
  p.monthly_limit
FROM profiles u
LEFT JOIN usage_logs ul ON ul.user_id = u.id 
  AND ul.created_at >= date_trunc('month', now())
LEFT JOIN user_subscriptions us ON us.user_id = u.id
LEFT JOIN plans p ON p.id = COALESCE(us.plan_id, 'basic')
GROUP BY u.email, p.monthly_limit;
```

---

## Resumo Tecnico

| Item | Detalhes |
|------|----------|
| **Arquivos alterados** | 1 (supabase/functions/analyze-resume/index.ts) |
| **Linhas modificadas** | 1 linha (471) |
| **Tipo de alteracao** | Mudar INSERT direto para chamada RPC |
| **Risco** | Baixo - RPC ja existe e funciona |
| **Deploy necessario** | Sim - Edge function sera redeployada |

