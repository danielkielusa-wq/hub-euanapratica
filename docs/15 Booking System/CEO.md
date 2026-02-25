# Sistema de Agendamentos — Visão Executiva

## O que é

O sistema de **Agendamentos e Agenda** conecta alunos e mentores em dois formatos complementares:

| Formato | Como funciona | Quem inicia |
|---------|---------------|-------------|
| **Booking 1:1** | Aluno escolhe mentor, data e horário | Aluno |
| **Sessão em Grupo** | Mentor cria sessão para todos os inscritos de um Espaço | Mentor |
| **Evento Aberto** | Mentor cria hotseat, masterclass ou live — gratuito ou pago | Mentor |

---

## Como funciona para o aluno

### Booking 1:1

1. Aluno acessa um serviço do tipo "mentoria ao vivo" no Hub
2. Se possui acesso (via compra ou assinatura), é direcionado ao fluxo de agendamento
3. Escolhe mentor, data e horário disponível
4. A sessão é confirmada imediatamente — email enviado na hora
5. Lembretes automáticos 24h e 1h antes da sessão
6. Após a sessão, o mentor marca como concluída

Se o aluno **não** possui acesso ao serviço, vê uma mensagem com links para adquirir — funil natural de conversão.

### Agenda unificada (`/dashboard/agenda`)

O aluno tem uma visão de calendário mensal que mostra tudo:
- Sessões em grupo dos Espaços em que está inscrito
- Seus bookings 1:1 confirmados
- Eventos abertos criados pelo mentor (hotseats, masterclasses)

Dois filtros disponíveis: por tipo (grupo / 1:1) e por status.

---

## Como funciona para o mentor

O mentor tem três páginas no painel:

### Agenda unificada (`/mentor/agenda`)
Calendário mensal com todos os compromissos numa única visão. Sessões em grupo aparecem em indigo/roxo; bookings 1:1 em azul. Filtros por tipo e status. Botão **"Novo Evento"** para criar qualquer tipo.

### Minha Disponibilidade (`/mentor/disponibilidade`)
- Configura link de reunião por serviço (Google Meet, Zoom, etc.)
- Define horários semanais recorrentes (ex: segunda e quarta, 9h–17h)
- Cria bloqueios de agenda para períodos específicos (férias, feriados)

### Meus Agendamentos (`/mentor/agendamentos`)
- Lista de bookings 1:1 com dados do aluno
- Botão para entrar na reunião
- Marcar sessões como concluídas (com notas)
- Histórico com contadores de concluídas e no-shows

### Criar Eventos Abertos
O mentor pode criar **Eventos Abertos** — eventos standalone sem precisar de um Espaço vinculado:
- **Hotseat gratuito**: capacidade limitada, preço = R$0, visível para todos os alunos
- **Masterclass**: evento de aquisição para público mais amplo
- **Live especial**: conteúdo extra fora do calendário regular do Espaço

Campos configuráveis: título, descrição, data/hora, duração, capacidade de participantes, preço, visibilidade (público ou restrito ao Espaço).

---

## Como funciona para o administrador

O painel admin (`/admin/agendamentos`) tem 3 abas:

### Aba "Agendamentos"
- Todos os bookings 1:1 com filtros por status e mentor
- Ações: marcar como concluída, cancelar (com motivo), marcar no-show
- Visão completa: aluno, mentor, serviço, data, duração, status

### Aba "Disponibilidade"
- Atribui mentores a serviços (qual mentor atende qual tipo de sessão)
- Configura duração do slot, buffer entre sessões e link de reunião
- Gerencia horários semanais e bloqueios de qualquer mentor

### Aba "Políticas"
- Máximo de agendamentos simultâneos por aluno
- Máximo de reagendamentos por sessão
- Antecedência mínima/máxima para agendar
- Janela de cancelamento
- Duração e intervalo padrão dos slots

---

## Emails automáticos

6 tipos de email relacionados a bookings 1:1 (todos editáveis em Admin → Templates de Email):

| Momento | Email |
|---------|-------|
| Sessão criada | Confirmação de agendamento |
| 24h antes | Lembrete com detalhes e link |
| 1h antes | Lembrete urgente |
| Reagendamento | Nova data com data antiga riscada |
| Cancelamento | Confirmação do cancelamento |
| Não comparecimento | Aviso ao aluno |

Lembretes são disparados automaticamente por um job (a cada 15 minutos) — zero intervenção manual.

---

## Controle de acesso e funil de conversão

O fluxo de booking 1:1 só é acessível para alunos que **possuem o serviço** (tabela `user_hub_services`). Aluno sem acesso vê:

> "Você precisa adquirir este serviço" + links para catálogo e planos

Isso cria um funil natural: aluno descobre o serviço → tenta agendar → é incentivado a comprar.

Eventos Abertos com `is_public = true` são visíveis para qualquer aluno logado — estratégia de engajamento e aquisição sem barreira de compra.

---

## Navegação

| Papel | Menu | Link |
|-------|------|------|
| Aluno | Agenda | `/dashboard/agenda` |
| Aluno | Agendamentos (lista 1:1) | `/dashboard/agendamentos` |
| Mentor | Agenda (unificada) | `/mentor/agenda` |
| Mentor | Meus Agendamentos | `/mentor/agendamentos` |
| Mentor | Disponibilidade | `/mentor/disponibilidade` |
| Admin | Gestão de Conteúdo → Agendamentos | `/admin/agendamentos` |

---

## Métricas disponíveis

**No painel do mentor:**
- Total de sessões próximas
- Total de sessões concluídas
- Total de no-shows

**No painel admin:**
- Todas as métricas acima por mentor
- Filtros por status e mentor para análise
- Histórico completo de bookings

---

## Por que isso importa

| Dimensão | Impacto |
|----------|---------|
| **Receita** | Bookings vinculados a serviços pagos — mais sessões = mais conversões |
| **Engajamento** | Alunos que fazem sessões têm maior retenção e conclusão de jornada |
| **Aquisição** | Eventos Abertos gratuitos (hotseats, masterclasses) atraem novos leads |
| **Operação** | Mentores gerenciam a própria agenda — zero gargalo no admin |
| **Qualidade** | Admin acompanha no-shows e toma ações corretivas |
| **Escalabilidade** | Políticas globais + auto-serviço do mentor permitem crescer sem equipe operacional |

---

## Oportunidades futuras

- Inscrição de alunos em Eventos Abertos com controle de vagas
- Cobrança integrada para Eventos Abertos pagos
- Notificações push quando um novo evento aberto é publicado
- Métricas de conversão: eventos abertos → bookings pagos
