# Meu Hub — Visão Executiva (CEO)

> **Resumo**: "Meu Hub" transforma o painel do usuário em um centro de acesso unificado que mostra, em um único lugar, tudo que cada cliente possui: serviços comprados, mentorias ativas, cursos e ferramentas incluídas no plano. O impacto principal é redução de churn por abandono passivo (clientes que esquecem o que compraram) e geração de upsell contextual.

---

## O Problema que Resolve

Antes do Meu Hub, um cliente que comprava uma sessão de Rota60 precisava:
1. Lembrar que havia comprado
2. Saber onde agendar
3. Navegar até a página correta

Resultado: abandono passivo — clientes que compraram mas nunca usaram o serviço. Abandono passivo destrói NPS, gera reembolsos tardios e reduz LTV.

---

## O que é Meu Hub

Uma seção em `/dashboard/hub` (página "Seu Hub") que aparece automaticamente quando o usuário tem pelo menos um serviço ou ferramenta. Ela organiza tudo em 4 seções intuitivas:

| Seção | Ícone | O que aparece |
|-------|-------|---------------|
| **Ação Necessária** | 🔔 Âmbar | Serviços comprados mas não iniciados/agendados |
| **Em Andamento** | ▶ Verde | Mentorias ativas, cursos em progresso, sessões confirmadas |
| **Próximos Eventos** | 📅 Azul | Eventos ao vivo futuros, serviços ainda não iniciados |
| **Histórico** | 🕐 Cinza | Sessões concluídas, cursos finalizados |

E uma seção extra **Ferramentas do seu Plano** (ícone ⚡) para ferramentas de IA incluídas na assinatura (ex.: ResumePass AI, Tradutor de Títulos).

---

## Tipos de Serviço Suportados

| Tipo | Exemplos | Comportamento Principal |
|------|----------|------------------------|
| `consulting` | Rota60, LinkedIn Review | Comprado → ação necessária → agendado → concluído |
| `live_mentoring` | Mentoria Mensal | Sempre ativo enquanto vigente; mostra próxima sessão do Espaço |
| `recorded_course` | Cursos gravados | Progresso calculado; inicia em "não iniciado", avança com uso |
| `live_event` | Hotseats, Masterclasses | Data futura = "próximo evento"; data passada = histórico |
| `ai_tool` | ResumePass, Tradutor | Sempre disponível; exibe créditos do plano |

---

## Impacto Esperado no Negócio

### Retenção (Churn Ativo)
- Usuários com sessão de consultoria comprada mas não agendada veem um card âmbar com CTA "Agendar Sessão"
- Reduz o intervalo compra→uso de semanas para dias
- Clientes que usam o serviço têm NPS e probabilidade de renovação muito maiores

### Upsell Contextual
- Usuário que concluiu uma sessão de consultoria vê o card em "Histórico" com badge "Concluído"
- A seção abaixo (upsell de serviços) fica mais relevante: "você já usou, quer mais?"
- Clientes com plano Básico veem ferramentas limitadas → CTA natural para upgrade

### LTV por Múltiplas Compras
- Sistema suporta que o mesmo usuário compre Rota60 E LinkedIn Review (rows separadas por `service_id`)
- Se comprar o mesmo serviço duas vezes → `sessions_total` incrementa (não perde o histórico)
- Histórico de todas as compras visível em "Meus Pedidos"

---

## Como o Acesso é Concedido

| Origem | Campo `access_source` | Exemplo |
|--------|----------------------|---------|
| Compra via Ticto | `purchase` | Rota60, LinkedIn Review |
| Incluído no plano | `plan` | ResumePass AI (Pro/VIP) |
| Concessão manual | `admin_grant` | Admin libera acesso manualmente |
| Gratuito | `free` | Eventos abertos, demos |

O badge no card do serviço reflete a origem: **"Comprado"** (roxo) ou **"Incluso no plano"** (azul).

---

## Configuração de Serviços

A equipe de produto/admin configura cada serviço em `/admin/hub-services` com:
- **Tipo de serviço** (`service_type`): define o comportamento do card
- **Plano vinculado** (`plan_feature_key`): se definido, o serviço aparece como ferramenta de plano quando o usuário tem aquele feature habilitado
- **Link de agendamento** (`route`): onde o CTA leva o usuário

---

## Métricas para Acompanhar

| Métrica | Onde Ver | Target |
|---------|----------|--------|
| % de sessions_total usadas vs compradas | Supabase: `user_hub_services` | >80% |
| Tempo médio compra→primeira sessão | `bookings.scheduled_start - user_hub_services.started_at` | <7 dias |
| Taxa de cards "Ação Necessária" → "Em Andamento" | Conversão no funil | >70% em 30d |
| Churn de usuários com acesso ativo vs sem | Supabase Analytics | Diferença >30% |

---

## Fases de Expansão

1. **Fase 1 (atual)**: Serviços comprados + ferramentas de plano
2. **Fase 2**: Progresso de cursos sincronizado com `metadata.progress_percent`
3. **Fase 3**: Notificações push/email automáticas para cards "Ação Necessária" há mais de 7 dias
4. **Fase 4**: Dashboard de jornada completa com linha do tempo visual
