# 🚀 Setup Completo - Sistema de Upsell Contextual

## 📋 Problema Identificado

A edge function `analyze-post-for-upsell` **NÃO estava configurada** no `supabase/config.toml`, impedindo o deploy e funcionamento do sistema.

## ✅ Correções Aplicadas

1. ✅ Adicionada configuração da edge function no [supabase/config.toml](supabase/config.toml#L43-L44)
2. ✅ Criado script de verificação SQL: [CHECK_UPSELL_SETUP.sql](supabase/CHECK_UPSELL_SETUP.sql)

## 🔧 Passos para Ativar o Sistema

### Passo 1: Verificar Estado Atual do Banco

Execute o script de verificação no **SQL Editor** do Supabase Dashboard:

```bash
# Abra o arquivo e copie todo o conteúdo
supabase/CHECK_UPSELL_SETUP.sql
```

**Acesse**: [Supabase Dashboard](https://supabase.com/dashboard/project/seqgnxynrcylxsdzbloa/sql) > SQL Editor > Colar e Executar

**Verifique os resultados**:
- ❌ Se alguma tabela não existir → **Vá para Passo 2**
- ✅ Se tudo existir → **Vá para Passo 3**

---

### Passo 2: Aplicar Migrations (se necessário)

Se as tabelas não existirem, aplique as migrations consolidadas:

**Opção A - Via Dashboard (Recomendado)**

1. Abra: [supabase/migrations/APPLY_ALL_UPSELL_MIGRATIONS.sql](supabase/migrations/APPLY_ALL_UPSELL_MIGRATIONS.sql)
2. Copie TODO o conteúdo do arquivo
3. Acesse: [SQL Editor](https://supabase.com/dashboard/project/seqgnxynrcylxsdzbloa/sql)
4. Cole e Execute

**Opção B - Via CLI (se tiver Supabase CLI local)**

```bash
cd c:\Users\I335869\ENP_HUB\hub-euanapratica

# Link com o projeto remoto (se ainda não estiver linkado)
supabase link --project-ref seqgnxynrcylxsdzbloa

# Aplicar migrations pendentes
supabase db push
```

---

### Passo 3: Deploy da Edge Function

A edge function precisa ser deployed no Supabase.

**Opção A - Via CLI (Recomendado)**

```bash
cd c:\Users\I335869\ENP_HUB\hub-euanapratica

# Fazer deploy de todas as funções (incluindo analyze-post-for-upsell)
supabase functions deploy analyze-post-for-upsell

# OU fazer deploy de todas as funções
supabase functions deploy
```

**Opção B - Via Dashboard**

1. Acesse: [Edge Functions](https://supabase.com/dashboard/project/seqgnxynrcylxsdzbloa/functions)
2. Clique em **Deploy new function**
3. Selecione: `analyze-post-for-upsell`
4. Confirme o deploy

---

### Passo 4: Configurar API Anthropic

A edge function precisa da API key do Claude para funcionar.

1. Acesse a aplicação: **Admin > APIs**
2. Procure por **"Anthropic API"** (ou "anthropic_api")
3. Clique em **Editar**
4. No campo `api_key`, adicione sua **Claude API Key** ([Obter aqui](https://console.anthropic.com/))
5. **Salvar**

**Verificar via SQL** (se necessário):

```sql
-- Ver se API está configurada
SELECT name, base_url, credentials->>'api_key' as has_key
FROM api_configs
WHERE api_key = 'anthropic_api';

-- Se não existir, criar manualmente:
INSERT INTO api_configs (name, base_url, credentials, description)
VALUES (
  'anthropic_api',
  'https://api.anthropic.com/v1',
  '{"api_key": "sua-api-key-aqui"}'::jsonb,
  'API do Claude (Anthropic) para análise de posts'
);
```

---

### Passo 5: Ativar Sistema e Configurar Serviços

#### 5.1 - Ativar Sistema Globalmente

1. Acesse: **Admin > Settings > Upsell Contextual**
2. Ative o switch **"Sistema Ativo"**
3. Revise o **Prompt Template** (já vem pré-configurado)
4. Clique em **Salvar Configurações**

**Verificar via SQL**:

```sql
-- Ver configurações atuais
SELECT key, value FROM app_configs WHERE key LIKE 'upsell_%';

-- Ativar sistema (se necessário)
UPDATE app_configs SET value = 'true' WHERE key = 'upsell_enabled';
```

#### 5.2 - Configurar Serviços com Keywords

Para que o sistema sugira serviços, é necessário configurar **keywords** em cada serviço.

1. Acesse: **Admin > Gestão de Produtos**
2. Edite o serviço desejado (ex: "Currículo e LinkedIn Internacional")
3. Na seção **"Upsell Contextual"**:
   - ✅ Ative **"Visível para Upsell"**
   - Adicione **Keywords** separadas por vírgula

**Exemplo de Keywords por Serviço**:

| Serviço | Keywords Sugeridas |
|---------|-------------------|
| **Currículo e LinkedIn Internacional** | `curriculo, currículo, cv, resume, linkedin, aplicação, ignorada, sem resposta, não chamam, ghosting` |
| **Mock Interview VIP** | `entrevista, nervoso, medo, ansiedade, interview, technical interview, behavioral, travar, branco, preparação` |
| **Sessão de Direção ROTA EUA** | `começar, carreira, internacional, orientação, direção, rota, caminho, perdido, onde começar, por onde` |
| **Salary Negotiation** | `oferta, salário, negociar, proposta, offer, compensation, package, negociação, aceitar` |

**Configurar via SQL** (exemplo):

```sql
-- Atualizar serviço de Currículo com keywords
UPDATE hub_services
SET
  keywords = ARRAY['curriculo', 'currículo', 'cv', 'resume', 'linkedin', 'aplicação', 'ignorada', 'sem resposta', 'ghosting'],
  is_visible_for_upsell = true
WHERE name ILIKE '%currículo%' OR name ILIKE '%linkedin%';

-- Ver serviços configurados
SELECT id, name, keywords, is_visible_for_upsell, is_visible_in_hub
FROM hub_services
WHERE is_visible_in_hub = true
ORDER BY is_visible_for_upsell DESC;
```

---

### Passo 6: Testar o Sistema

#### 6.1 - Criar Post de Teste

1. Acesse: **Comunidade** na aplicação
2. Crie um novo post com:
   - **Título**: "Curriculo? O que fazer"
   - **Conteúdo**: "Meu currículo não está recebendo respostas das empresas. O que devo fazer?"

#### 6.2 - Verificar Logs da Edge Function

1. Acesse: [Edge Functions Logs](https://supabase.com/dashboard/project/seqgnxynrcylxsdzbloa/functions/analyze-post-for-upsell/logs)
2. Procure por logs recentes (últimos minutos)
3. **Logs esperados**:
   - ✅ `Pre-filter passed: X services matched`
   - ✅ `Claude response: {...}`
   - ✅ `Upsell created successfully: [impression-id]`

**Possíveis erros nos logs**:
- ❌ `Upsell system is disabled globally` → Sistema desativado (Passo 5.1)
- ❌ `No services available for upsell` → Serviços não configurados (Passo 5.2)
- ❌ `No keyword matches found` → Keywords não batem com o texto
- ❌ `Anthropic API key not configured` → API não configurada (Passo 4)
- ❌ `Claude API failed: 401` → API key inválida
- ❌ `rate_limited` → Usuário já recebeu card nos últimos 7 dias

#### 6.3 - Verificar Impression Criada

Execute no SQL Editor:

```sql
-- Ver impressions criadas
SELECT
  ui.id,
  ui.shown_at,
  p.full_name as usuario,
  hs.name as servico,
  ui.confidence_score,
  ui.microcopy,
  ui.reason,
  cp.title as post_titulo
FROM upsell_impressions ui
JOIN profiles p ON ui.user_id = p.id
JOIN hub_services hs ON ui.service_id = hs.id
JOIN community_posts cp ON ui.post_id = cp.id
ORDER BY ui.shown_at DESC
LIMIT 5;
```

#### 6.4 - Verificar Visualização no Frontend

1. Volte para o post criado
2. **Deve aparecer um card de upsell** logo após o conteúdo do post
3. O card deve ter:
   - ✨ Ícone Sparkles
   - Microcopy gerado pelo Claude
   - Nome do serviço + preço
   - Botão "Ver Detalhes"
   - Botão X discreto (hover)

---

## 🔍 Diagnóstico de Problemas

### Card não aparece após criar post

**Checklist**:

1. ✅ Sistema está ativo? `SELECT value FROM app_configs WHERE key = 'upsell_enabled'`
2. ✅ API Anthropic configurada? `SELECT credentials->>'api_key' FROM api_configs WHERE name = 'anthropic_api'`
3. ✅ Serviço tem keywords? `SELECT keywords FROM hub_services WHERE is_visible_for_upsell = true`
4. ✅ Keywords batem com o texto do post?
5. ✅ Edge function deployed? Verificar logs no dashboard
6. ✅ Usuário não atingiu rate limit? (1 card a cada 7 dias)

### Edge function retorna erro 500

- Verificar logs detalhados no dashboard
- Verificar se API key está correta
- Verificar se as tabelas existem

### Pre-filtro não encontra matches

- Verificar se as keywords estão escritas corretamente
- Testar com variações: `curriculo` vs `currículo`
- Adicionar mais keywords aos serviços

---

## 📊 Monitoramento

### Queries Úteis

```sql
-- Taxa de conversão
SELECT
  COUNT(*) FILTER (WHERE clicked_at IS NOT NULL)::FLOAT / COUNT(*) as click_rate,
  COUNT(*) FILTER (WHERE dismissed_at IS NOT NULL)::FLOAT / COUNT(*) as dismiss_rate,
  COUNT(*) FILTER (WHERE converted_at IS NOT NULL)::FLOAT / COUNT(*) as conversion_rate
FROM upsell_impressions;

-- Serviços mais sugeridos
SELECT
  hs.name,
  COUNT(*) as impressions,
  AVG(ui.confidence_score) as avg_confidence,
  COUNT(*) FILTER (WHERE ui.clicked_at IS NOT NULL) as clicks
FROM upsell_impressions ui
JOIN hub_services hs ON ui.service_id = hs.id
GROUP BY hs.name
ORDER BY impressions DESC;

-- Usuários em blacklist
SELECT
  p.full_name,
  hs.name as servico_bloqueado,
  ub.blacklisted_until,
  ub.reason
FROM upsell_blacklist ub
JOIN profiles p ON ub.user_id = p.id
JOIN hub_services hs ON ub.service_id = hs.id
WHERE ub.blacklisted_until > NOW()
ORDER BY ub.created_at DESC;
```

---

## 🎯 Próximos Passos

Após configurar tudo:

1. ✅ Configurar keywords em **TODOS os serviços** que deseja oferecer via upsell
2. ✅ Testar com diferentes textos de post
3. ✅ Monitorar taxa de conversão
4. ✅ Ajustar prompt template se necessário (Admin > Settings > Upsell)
5. ✅ Ajustar rate limit se desejar (padrão: 7 dias)

---

## 📚 Arquivos Relevantes

- [supabase/config.toml](supabase/config.toml) - Configuração da edge function
- [supabase/functions/analyze-post-for-upsell/index.ts](supabase/functions/analyze-post-for-upsell/index.ts) - Lógica principal
- [src/hooks/useCommunityPosts.ts](src/hooks/useCommunityPosts.ts#L127-L148) - Dispara análise após criar post
- [src/components/community/UpsellCard.tsx](src/components/community/UpsellCard.tsx) - Componente visual do card
- [supabase/migrations/APPLY_ALL_UPSELL_MIGRATIONS.sql](supabase/migrations/APPLY_ALL_UPSELL_MIGRATIONS.sql) - Todas as migrations consolidadas

---

## ❓ Dúvidas?

Se algo não funcionar:

1. Execute [CHECK_UPSELL_SETUP.sql](supabase/CHECK_UPSELL_SETUP.sql) e envie os resultados
2. Verifique os logs da edge function no dashboard
3. Execute: `SELECT * FROM upsell_impressions ORDER BY shown_at DESC LIMIT 1;`
