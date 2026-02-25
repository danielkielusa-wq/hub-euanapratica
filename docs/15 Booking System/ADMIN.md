# Sistema de Agendamentos — Guia do Administrador

## Onde acessar

**Menu lateral → Gestão de Conteúdo → Agendamentos**
URL: `/admin/agendamentos`

Acesso restrito a administradores. Como admin, você tem acesso total a todos os agendamentos, disponibilidades e configurações da plataforma.

---

## Visão Geral das 3 Abas

### Aba 1 — Agendamentos
Todas as sessões da plataforma com filtros e ações de gestão.

### Aba 2 — Disponibilidade
Atribuição de mentores a serviços, horários semanais e bloqueios de agenda.

### Aba 3 — Políticas
Regras globais do sistema de agendamentos.

---

## Aba 1: Agendamentos

### Filtros disponíveis
- **Status**: Todos / Confirmado / Concluído / Cancelado / No-show / Reagendado
- **Mentor**: Filtrar por mentor específico

### O que aparece na tabela
| Coluna | Descrição |
|--------|-----------|
| Aluno | Nome do aluno |
| Serviço | Nome do serviço contratado |
| Mentor | Nome do mentor |
| Data/Hora | Data e horário da sessão |
| Duração | Duração em minutos |
| Status | Badge colorido com o status atual |
| Ações | Menu dropdown |

### Ações por agendamento

#### Marcar como Concluída
Usar quando: o mentor esqueceu de marcar, ou a sessão precisa ser encerrada manualmente.
1. Clique no menu de ações (⋮) da sessão
2. Selecione "Marcar Concluída"
3. Adicione notas da sessão (opcional)
4. Confirme — email de conclusão **não** é enviado automaticamente por esta ação

#### Cancelar
Usar quando: sessão precisa ser cancelada por qualquer motivo.
1. Clique no menu de ações (⋮)
2. Selecione "Cancelar"
3. Informe o motivo do cancelamento
4. Confirme — email de cancelamento é enviado ao aluno

#### Marcar No-show
Usar quando: aluno não compareceu à sessão.
1. Clique no menu de ações (⋮)
2. Selecione "Marcar No-show"
3. Confirme — email de no-show é enviado ao aluno

---

## Aba 2: Disponibilidade

### Seção: Atribuição de Mentores a Serviços

Aqui você define **qual mentor atende qual serviço** e configura os parâmetros da sessão.

#### Criar nova atribuição
1. Clique em **"Atribuir Mentor"**
2. Preencha:
   - **Mentor**: selecione o mentor (usuários com role mentor ou admin)
   - **Serviço**: selecione o serviço do tipo `live_mentoring`
   - **Duração do slot** (minutos): duração padrão de cada sessão (ex: 60)
   - **Buffer** (minutos): tempo livre entre sessões (ex: 15)
   - **Link da reunião**: URL do Google Meet, Zoom, etc.
3. Salve — o link é automaticamente incluído nos emails de confirmação e lembretes

#### Editar atribuição existente
Clique no botão de editar (✏️) no card da atribuição para alterar qualquer configuração.

#### Remover atribuição
Clique no botão de excluir (🗑️) no card — o mentor deixa de aparecer como opção para o serviço.

> **Importante**: um serviço só aparece para agendamento se tiver pelo menos um mentor ativo atribuído a ele.

---

### Seção: Horários Semanais (por mentor)

Selecione um mentor no dropdown para ver e editar sua disponibilidade semanal.

#### Adicionar horário
1. Selecione o mentor
2. Clique em **"Adicionar Horário"**
3. Escolha o dia da semana
4. Defina início e fim (ex: 09:00 — 17:00)
5. Salve

O sistema divide o período automaticamente em slots baseados na duração configurada na atribuição.

#### Ativar/desativar horário
Use o toggle (chave) na coluna "Ativo" para ativar ou desativar um horário sem precisar excluir.

#### Remover horário
Clique no botão de lixeira (🗑️) ao lado do horário.

---

### Seção: Bloqueios de Agenda (por mentor)

Períodos específicos em que o mentor não pode atender (férias, feriados, compromissos).

#### Adicionar bloqueio
1. Selecione o mentor
2. Clique em **"Adicionar Bloqueio"**
3. Defina data/hora de início e fim
4. Adicione motivo (opcional, para referência interna)
5. Salve

Bloqueios sobrepõem os horários semanais — nenhum aluno conseguirá agendar no período bloqueado.

#### Remover bloqueio
Clique no botão de lixeira (🗑️) ao lado do bloqueio.

---

## Aba 3: Políticas

Configurações globais que afetam todos os agendamentos da plataforma.

| Campo | Descrição | Impacto |
|-------|-----------|---------|
| **Max agendamentos simultâneos** | Quantas sessões ativas um aluno pode ter ao mesmo tempo | Aluno com X sessões não consegue criar mais até concluir/cancelar uma |
| **Max reagendamentos** | Quantas vezes pode reagendar a mesma sessão | Após o limite, aluno precisa cancelar e criar nova sessão |
| **Antecedência mínima (horas)** | Com quantas horas de antecedência precisa agendar | Ex: 24h → só pode agendar sessões a partir de amanhã |
| **Antecedência máxima (dias)** | Até quando no futuro pode agendar | Ex: 30 dias → datas além de 30 dias não aparecem no calendário |
| **Janela de cancelamento (horas)** | Até quando antes da sessão pode cancelar | Ex: 12h → não pode cancelar nas 12h que antecedem a sessão |
| **Duração padrão (minutos)** | Duração padrão de um slot quando não configurado individualmente | Usado como fallback |
| **Intervalo entre slots (minutos)** | Espaço entre slots disponíveis | Ex: 30 → slots às 09:00, 09:30, 10:00... |

Clique em **Salvar Políticas** após qualquer alteração.

---

## Emails Automáticos Relacionados

Todos editáveis em **Admin → Templates de Email**.

| Evento | Template | Quem recebe |
|--------|----------|------------|
| Novo agendamento | `booking_confirmation` | Aluno |
| 24h antes da sessão | `booking_reminder` | Aluno |
| 1h antes da sessão | `booking_reminder_1h` | Aluno |
| Reagendamento | `booking_rescheduled` | Aluno |
| Cancelamento | `booking_cancelled` | Aluno |
| No-show | `booking_no_show` | Aluno |

Os lembretes de 24h e 1h são enviados automaticamente por um job agendado (a cada 15 minutos). Não requerem ação manual.

---

## Fluxo de Status das Sessões

```
                    ┌─────────────────┐
                    │   CONFIRMADO    │  ← estado inicial ao criar
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           ▼                 ▼                 ▼
    ┌──────────┐      ┌──────────┐      ┌──────────┐
    │CONCLUÍDA │      │CANCELADA │      │ NO-SHOW  │
    └──────────┘      └──────────┘      └──────────┘

    REAGENDADO = nova booking CONFIRMADA + booking antiga marcada como REAGENDADA
```

---

## Perguntas Frequentes de Admins

**P: Posso editar o horário de uma sessão já confirmada?**
R: Não diretamente. Cancele a sessão atual e oriente o aluno a reagendar, ou use a ação de reagendamento (se disponível via dev).

**P: Como adiciono um novo mentor ao sistema?**
R: Altere o role do usuário para `mentor` em **Admin → Usuários**. Depois, atribua o mentor a um serviço na aba Disponibilidade.

**P: Como habilito o agendamento para um novo serviço?**
R: O serviço precisa ser do tipo `live_mentoring`. Crie o serviço em **Admin → Espaços** (ou peça ao dev para configurar o tipo). Depois, atribua um mentor na aba Disponibilidade.

**P: O link da reunião aparece nos emails?**
R: Sim, desde que esteja configurado no campo "Link da reunião" da atribuição mentor↔serviço. O link é incluído nos emails de confirmação e nos lembretes.

**P: Um admin pode agendar uma sessão por um aluno?**
R: Não existe um fluxo admin para isso na UI. O aluno deve fazer o agendamento pela própria conta, ou o dev pode inserir diretamente no banco.
