

# Plano: Corrigir Gravação de Uso e Bloqueio de Quota no Currículo USA

## Problemas Identificados

### 1. Falha Silenciosa na Gravação de Uso (Crítico)
O edge function `analyze-resume` tenta gravar o uso via RPC mas falha com "connection reset" intermitente. O código atual (linhas 471-478) apenas loga o erro e continua:

```typescript
const { error: logError } = await supabase.rpc('record_curriculo_usage', {
  p_user_id: userId,
});

if (logError) {
  console.error("Error logging usage:", logError);
  // Don't fail the request, just log the error  <-- PROBLEMA!
}
```

**Resultado**: Análise retorna sucesso mas uso não é registrado → usuário pode executar análises infinitas.

### 2. Uso do Service Role Key
A edge function usa o token do usuário para fazer a chamada RPC. Para garantir gravação confiável, devemos usar o `SUPABASE_SERVICE_ROLE_KEY` para a operação de INSERT no usage_logs.

### 3. Retry Logic Ausente
Não há mecanismo de retry para falhas de rede transitórias.

---

## Solução Proposta

### Parte 1: Modificar Edge Function para Garantir Gravação

1. **Criar cliente admin com Service Role Key** para operações de gravação
2. **Inserir diretamente na tabela** em vez de usar RPC (mais confiável)
3. **Implementar retry logic** para falhas transitórias
4. **Falhar a análise** se o uso não puder ser gravado após retries (previne abuso)

```typescript
// Create admin client for reliable writes
const adminSupabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Retry logic with exponential backoff
const recordUsageWithRetry = async (userId: string, maxRetries = 3) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const { error } = await adminSupabase
      .from('usage_logs')
      .insert({ user_id: userId, app_id: 'curriculo_usa' });
    
    if (!error) return true;
    
    console.error(`Usage recording attempt ${attempt + 1} failed:`, error);
    if (attempt < maxRetries - 1) {
      await new Promise(r => setTimeout(r, 200 * Math.pow(2, attempt)));
    }
  }
  return false;
};

// Usage in the flow (BEFORE returning the AI result)
const usageRecorded = await recordUsageWithRetry(userId);
if (!usageRecorded) {
  return new Response(
    JSON.stringify({ 
      error: 'Falha ao registrar uso. Tente novamente.',
      error_code: 'USAGE_RECORDING_FAILED'
    }),
    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// Only return success after usage is recorded
return new Response(JSON.stringify(result), {...});
```

### Parte 2: Adicionar RLS Policy para INSERT via Service Role

Precisamos adicionar uma policy que permita inserção pelo service role:

```sql
-- Allow service role to insert usage logs
CREATE POLICY "Service role can insert usage logs"
  ON public.usage_logs FOR INSERT
  WITH CHECK (true);
```

Nota: O service role bypassa RLS, mas é boa prática ter a policy documentada.

### Parte 3: Frontend - Refetch Quota Após Erro

No `useCurriculoAnalysis.ts`, garantir que o refetch ocorra após qualquer erro:

```typescript
} catch (error: unknown) {
  // Always refetch quota on error to sync state
  await refetchQuota();
  // ... resto do handling
}
```

---

## Resumo das Alterações

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `supabase/functions/analyze-resume/index.ts` | Modificar | Usar service role para gravação + retry logic + falhar se não gravar |
| `src/hooks/useCurriculoAnalysis.ts` | Modificar | Refetch quota após erros |
| Migração SQL | Criar | Adicionar policy para service role INSERT (opcional, documenta intenção) |

---

## Fluxo Corrigido

```
1. Usuário clica "Analisar"
   → Frontend verifica quota (client-side, UX)
   → Edge function recebe request

2. Edge function:
   → Verifica quota no banco (server-side, segurança)
   → Se quota OK, processa com IA
   → ANTES de retornar resultado:
     → Tenta gravar uso com retry (3 tentativas)
     → Se falhar todas: retorna erro 500
     → Se sucesso: retorna resultado da análise

3. Frontend:
   → Recebe resultado
   → Refetch quota para atualizar UI
   → Navega para página de resultado
```

---

## Por Que Falhar se Não Gravar?

É crítico que o uso seja registrado **antes** de entregar o resultado. Se permitirmos retornar sucesso sem gravar uso:
- Usuários mal-intencionados podem explorar a falha
- Custo de IA (Gemini) é perdido sem cobrança
- Métricas de negócio ficam incorretas

---

## Benefícios da Solução

1. **Confiabilidade**: Retry logic reduz falhas transitórias
2. **Segurança**: Uso é gravado antes de entregar resultado
3. **Consistência**: Frontend sempre reflete estado real do banco
4. **Auditoria**: Service role operations são logadas pelo Supabase
5. **Integridade**: Impossível receber análise sem ter uso registrado

