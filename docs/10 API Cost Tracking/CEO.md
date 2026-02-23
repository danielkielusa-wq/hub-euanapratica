# Rastreamento de Custos de API — Visão Executiva

## O que é

O painel de **Custos de API** oferece visibilidade em tempo real sobre quanto a plataforma gasta com inteligência artificial a cada chamada de usuario. Toda vez que um usuário usa uma funcionalidade de IA — como análise de currículo, relatório de lead, tradutor de título ou prioridades CRM — o sistema registra automaticamente o custo associado.

---

## Onde acessar

**Menu lateral → Analytics → Custos de API**  
URL: `/admin/custos-api`

Acesso restrito a administradores.

---

## O que você vê no painel

### Cards de resumo (topo)
| Card | O que mostra |
|---|---|
| Hoje | Gasto total do dia atual |
| Esta Semana | Gasto dos últimos 7 dias corridos |
| Este Mês | Gasto do mês atual (destaque) |
| Mês Passado | Gasto do mês anterior (referência) |
| Requests (mês) | Número de chamadas de IA no mês |

### Gráfico de tendência diária
Linha do tempo mostrando o custo dia a dia. Útil para identificar picos de uso (ex.: campanha, lançamento) ou dias sem atividade.

### Custo por funcionalidade
Quais funções de IA consomem mais orçamento. Permite priorizar otimizações onde o impacto financeiro é maior.

### Custo por provedor
Divisão entre OpenAI e Anthropic — mostra tokens consumidos e custo por provedor. Ajuda a avaliar troca de modelo ou provedor.

### Maiores consumidores
Top 10 usuários por custo no período selecionado. Útil para identificar uso excessivo ou perfis de alto valor.

---

## Filtros de período

No canto superior direito, selecione o período desejado:
- **Hoje** — visão do dia corrente
- **7 dias** — última semana
- **30 dias** — último mês (padrão)

---

## Tabela de preços por modelo (manutenção)

No rodapé da página, há uma tabela editável com o preço de cada modelo de IA por 1 milhão de tokens. **Os preços não são automáticos** — devem ser atualizados manualmente quando os provedores (OpenAI, Anthropic) alterarem seus valores.

Como atualizar:
1. Acesse `/admin/custos-api`
2. Role até o final da página — seção **Tabela de Preços por Modelo**
3. Edite os valores de Input e Output para o modelo desejado
4. Clique em **Salvar**

> Os custos são recalculados apenas nas próximas chamadas. Registros anteriores não são alterados retroativamente.

---

## Modelos rastreados

| Modelo | Provedor | Uso principal |
|---|---|---|
| GPT-4o mini | OpenAI | Tradução de títulos, análise de post |
| GPT-4.1 mini | OpenAI | Análise de currículo, relatório de lead |
| Claude Haiku 4.5 | Anthropic | Prioridades CRM, recomendação de produto |
| Resend (e-mail) | Resend | Envio de e-mails transacionais |

---

## Por que isso importa

- **Controle de orçamento**: saiba exatamente quanto custa cada funcionalidade de IA por mês
- **Decisões de escala**: ao crescer a base de usuários, avalie se vale trocar de modelo ou negociar volume com provedores
- **Identificação de anomalias**: picos de custo inesperados podem indicar uso indevido ou bugs
- **Comparação de provedores**: dados reais para decidir entre OpenAI e Anthropic por função

---

## Observações

- O rastreamento é **prospectivo**: apenas chamadas realizadas após a ativação do sistema (22/02/2026) são registradas
- Custos são calculados com base nos preços configurados na tabela — mantenha-a atualizada
- O registro de custo é assíncrono (não impacta a velocidade de resposta ao usuário)
