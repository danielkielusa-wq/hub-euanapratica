# Agenda Semanal — Guia de Utilizacao

> Planner operacional semanal com rituais diarios por papel e notificacoes automaticas as 6h BRT.
>
> Ultima atualizacao: 2026-03-03

---

## Sumario

- [O que e e para que serve](#o-que-e-e-para-que-serve)
- [Acessando a Agenda](#acessando-a-agenda)
- [Como usar no dia a dia](#como-usar-no-dia-a-dia)
- [Guia por Papel](#guia-por-papel)
  - [Fundador](#fundador)
  - [Assistente CRM](#assistente-crm)
  - [Creator](#creator)
- [Notificacoes Diarias](#notificacoes-diarias)
  - [Configurar Telegram](#configurar-telegram)
  - [Configurar Email](#configurar-email)
  - [Ativar via N8N](#ativar-via-n8n)
  - [Ativar via pg_cron](#ativar-via-pg_cron)
- [Referencia de Tarefas](#referencia-de-tarefas)

---

## O que e e para que serve

A **Agenda Semanal** e um planner operacional embutido na plataforma que define quais acoes devem ser feitas **todo dia de manha e ao final do dia** para manter o business funcionando.

Diferente de um to-do list generico, ela e:

- **Opinionada** — cada tarefa foi pensada para o contexto do ENP Hub, com links diretos para as telas certas
- **Dividida por papel** — cada tarefa indica se e para o Fundador, Assistente CRM ou Creator
- **Conectada a plataforma** — cada item tem um link para a pagina relevante (Leads Dashboard, WhatsApp Flows, etc.)
- **Automatizada** — envia a agenda do dia via Telegram e Email as 6h da manha

**Filosofia**: O objetivo nao e criar mais trabalho, mas criar **consistencia operacional**. Fazer as coisas certas todos os dias, nas telas certas, no momento certo.

---

## Acessando a Agenda

1. Acesse o admin: `hub.euanapratica.com/admin`
2. Na sidebar, clique em **PLANEJAMENTO → Agenda Semanal**
3. Ou acesse diretamente: `/admin/agenda-semanal`

---

## Como usar no dia a dia

### Interface principal

| Elemento | Funcao |
|----------|--------|
| Grid de 5 colunas | Segunda a Sexta, cada uma com tarefas de manha e final do dia |
| Dia atual | Destacado com borda dourada e fundo mais quente |
| Checkbox | Clique no card ou no quadrado para marcar como feito |
| Link de acao | Cada tarefa tem um link "→ NomeDaTela" que abre a pagina certa |
| Filtro de papel | Todos / Fundador / CRM / Creator — filtra as tarefas visiveis |
| Barra de progresso | Mostra % de conclusao da semana + mini-barra por dia |

### Navegacao semanal

- Setas `<` `>` no header para navegar entre semanas passadas e futuras
- Badge **Esta semana** indica a semana atual
- **Resetar semana** limpa todo o progresso da semana atual (sem afetar outras semanas)

### Persistencia

O progresso e salvo automaticamente no **navegador** (localStorage).

- Chave: `agenda-semanal-YYYY-MM-DD` (data da segunda-feira da semana)
- Cada semana tem seu proprio estado — a semana passada fica salva
- Nao sincroniza entre dispositivos diferentes (proposital — e um planner pessoal)

### Fluxo recomendado

```
6h00 — Receber notificacao no Telegram/Email com as tarefas de MANHA
8h00 — Abrir a plataforma, marcar as tarefas de manha conforme for fazendo
17h00 — Executar as tarefas de FINAL DO DIA
18h00 — Marcar tudo que foi feito antes de fechar o dia
```

---

## Guia por Papel

### Fundador

Foco em **visao estrategica** — metricas, financeiro, saude da plataforma, retrospectiva.

| Dia | Manha | Final do Dia |
|-----|-------|--------------|
| Seg | Revisao da semana anterior (leads, MRR, conversoes) | Definir 3 prioridades da semana |
| Ter | Saude do sistema + custos de API | — |
| Qua | Assinaturas: novos e cancelamentos | Analise de custos da semana |
| Qui | Revisar automacoes N8N | — |
| Sex | Retrospectiva: o que funcionou? | Inteligencia Semanal (relatorio de IA) |

**Telas-chave**: Leads Dashboard, Saude do Sistema, Assinaturas, Custos de API, Automacoes, Inteligencia Semanal

### Assistente CRM

Foco em **relacionamento ativo** — leads, WhatsApp, agendamentos, pipeline.

| Dia | Manha | Final do Dia |
|-----|-------|--------------|
| Seg | Leads novos + WhatsApp pendentes | Configurar disparos programados |
| Ter | Follow-up leads quentes | Atualizar pipeline de leads |
| Qua | Agendamentos e sessoes do dia | Contato ativo: leads em decisao |
| Qui | Lote WA: leads inativos | Follow-up de agendamentos |
| Sex | Fechar ciclo de leads | Relatorio de atividades CRM |

**Telas-chave**: Leads Dashboard, WhatsApp Flows (Envio em Lote), Agendamentos, Atividades

### Creator

Foco em **producao de conteudo** — pauta, producao, publicacao, analise de performance.

| Dia | Manha | Final do Dia |
|-----|-------|--------------|
| Seg | Planejar pauta da semana | Agendar posts e conteudos |
| Ter | Analisar engajamento recente | Criar rascunho de conteudo |
| Qua | Publicar conteudo de meio de semana | — |
| Qui | Produzir ou gravar conteudo | Editar e preparar conteudo |
| Sex | Publicar conteudo de fechamento | Analise de metricas de conteudo |

**Dica de timing**: Quarta tem pico de engajamento (publicar), Quinta e o melhor dia para gravar.

---

## Notificacoes Diarias

As 6h da manha de segunda a sexta, a plataforma envia automaticamente a agenda do dia via **Telegram** e **Email**.

### Formato da mensagem (Telegram)

```
📅 Agenda de Terça-feira — 04 de março

🌅 MANHÃ
├ 🟢 [CRM] Follow-up leads quentes
│    → Dashboard
├ 🟡 [Fundador] Saúde do sistema + custos de API
│    → Saúde
└ 🟠 [Creator] Analisar engajamento recente

🌙 FINAL DO DIA
├ 🟢 [CRM] Atualizar pipeline de leads
└ 🟠 [Creator] Criar rascunho de conteudo

🔗 Ver agenda completa no Hub
```

### Configurar Telegram

**Passo 1** — Criar o bot

1. No Telegram, busque **@BotFather**
2. Envie `/newbot` e siga as instrucoes (nome + username)
3. Copie o **token** gerado (formato: `123456789:ABC-DEF...`)

**Passo 2** — Descobrir seu Chat ID

1. Inicie uma conversa com o seu bot (clique em Start)
2. Busque **@userinfobot** e envie qualquer mensagem
3. Copie o numero `Id:` que ele te responder

**Passo 3** — Adicionar secrets no Supabase

```
Supabase Dashboard → Edge Functions → Secrets → Add new secret
```

| Secret | Valor |
|--------|-------|
| `TELEGRAM_BOT_TOKEN` | Token do @BotFather |
| `TELEGRAM_CHAT_ID` | Seu ID numerico |

### Configurar Email

O email e enviado via **Resend** usando a API key ja configurada em `Configuracoes → APIs Externas`.

So e preciso adicionar um secret:

```
Supabase Dashboard → Edge Functions → Secrets → Add new secret
ADMIN_NOTIFICATION_EMAIL = seu@email.com
```

### Ativar via N8N

**Opcao recomendada** se voce ja usa N8N para outras automacoes.

1. Crie um novo workflow no N8N
2. Adicione um no **Schedule Trigger**
3. Configure: `Cron Expression` → `0 6 * * 1-5`
   - ⚠️ Ative o fuso horario: N8N Settings → Timezone → `America/Sao_Paulo`
4. Adicione um no **HTTP Request** apos o Schedule
5. Configure:
   - Method: `POST`
   - URL: `https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/send-daily-agenda`
6. Em **Headers** adicione:
   - `x-internal-secret` → `<valor de INTERNAL_FUNCTION_SECRET>`
   - `Content-Type` → `application/json`
7. Ative o workflow

> O valor de `INTERNAL_FUNCTION_SECRET` esta em **app_configs** (tabela no Supabase) ou na variavel de ambiente do projeto.

### Ativar via pg_cron

**Opcao alternativa** se preferir nao usar N8N. O job ja foi criado pela migracao `20260303200000_schedule_daily_agenda.sql`.

Para verificar que o job esta ativo:

```sql
SELECT jobname, schedule, command, active
FROM cron.job
WHERE jobname = 'send-daily-agenda-6am-brt';
```

Resultado esperado:

```
jobname                    | schedule      | active
---------------------------+---------------+-------
send-daily-agenda-6am-brt  | 0 9 * * 1-5   | true
```

(`0 9 * * 1-5` = 9h UTC = 6h BRT, de seg a sex)

---

## Referencia de Tarefas

Tabela completa das 27 tarefas da agenda:

| ID | Dia | Periodo | Papel | Tarefa | Link |
|----|-----|---------|-------|--------|------|
| mon-m-1 | Seg | Manha | Fundador | Revisao da semana anterior | /admin/leads-dashboard |
| mon-m-2 | Seg | Manha | CRM | Leads novos + WhatsApp pendentes | /admin/leads-dashboard |
| mon-m-3 | Seg | Manha | Creator | Planejar pauta da semana | — |
| mon-e-1 | Seg | Final | Fundador | Definir 3 prioridades da semana | — |
| mon-e-2 | Seg | Final | CRM | Configurar disparos programados | /admin/whatsapp-flows |
| mon-e-3 | Seg | Final | Creator | Agendar posts e conteudos | — |
| tue-m-1 | Ter | Manha | CRM | Follow-up leads quentes | /admin/leads-dashboard |
| tue-m-2 | Ter | Manha | Fundador | Saude do sistema + custos de API | /admin/saude-sistema |
| tue-m-3 | Ter | Manha | Creator | Analisar engajamento recente | — |
| tue-e-1 | Ter | Final | CRM | Atualizar pipeline de leads | — |
| tue-e-2 | Ter | Final | Creator | Criar rascunho de conteudo | — |
| wed-m-1 | Qua | Manha | Fundador | Assinaturas: novos e cancelamentos | /admin/assinaturas |
| wed-m-2 | Qua | Manha | CRM | Agendamentos e sessoes do dia | /admin/agendamentos |
| wed-m-3 | Qua | Manha | Creator | Publicar conteudo de meio de semana | — |
| wed-e-1 | Qua | Final | Fundador | Analise de custos da semana | /admin/custos-api |
| wed-e-2 | Qua | Final | CRM | Contato ativo: leads em decisao | — |
| thu-m-1 | Qui | Manha | CRM | Lote WA: leads inativos | /admin/whatsapp-flows |
| thu-m-2 | Qui | Manha | Creator | Produzir ou gravar conteudo | — |
| thu-m-3 | Qui | Manha | Fundador | Revisar automacoes N8N | /admin/automacoes |
| thu-e-1 | Qui | Final | CRM | Follow-up de agendamentos | — |
| thu-e-2 | Qui | Final | Creator | Editar e preparar conteudo | — |
| fri-m-1 | Sex | Manha | Fundador | Retrospectiva da semana | — |
| fri-m-2 | Sex | Manha | CRM | Fechar ciclo de leads | — |
| fri-m-3 | Sex | Manha | Creator | Publicar conteudo de fechamento | — |
| fri-e-1 | Sex | Final | Fundador | Inteligencia Semanal | /admin/inteligencia-semanal |
| fri-e-2 | Sex | Final | CRM | Relatorio de atividades CRM | /admin/atividades |
| fri-e-3 | Sex | Final | Creator | Analise de metricas de conteudo | — |
