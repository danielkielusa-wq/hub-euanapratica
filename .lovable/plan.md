
# Plano: Deletar Função get-secrets

## Objetivo

Remover a função temporária `get-secrets` que foi criada apenas para você visualizar o `SUPABASE_SERVICE_ROLE_KEY`. Esta função expõe credenciais sensíveis e deve ser removida por segurança.

## Ações

| Ação | Arquivo | Descrição |
|------|---------|-----------|
| Deletar | `supabase/functions/get-secrets/index.ts` | Remover o arquivo da função |
| Editar | `supabase/config.toml` | Remover configuração `[functions.get-secrets]` |
| Deploy | Supabase Edge Functions | Deletar função deployada |

## Resultado

- Função `get-secrets` completamente removida do projeto
- Nenhuma exposição de credenciais via endpoint público
- Configuração limpa sem referências à função

