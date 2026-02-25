# Sistema de Agendamentos — Guia do Administrador

## Onde acessar

**Menu lateral → Gestão de Conteúdo → Agendamentos**
URL: `/admin/agendamentos`

Acesso restrito a administradores. Como admin, você tem acesso total a todos os agendamentos, disponibilidades e configurações da plataforma.

---

## O que mudou — Calendário Unificado

A plataforma agora tem um **sistema de agenda unificado**:

- **`/mentor/agenda`** mostra sessões em grupo (Espaços) + bookings 1:1 no mesmo calendário
- **`/dashboard/agenda`** mostra sessões em grupo dos Espaços inscritos + bookings 1:1 do aluno
- O mentor pode criar **Eventos Abertos** (standalone): hotseats, masterclasses, lives — sem precisar de um Espaço vinculado
- Eventos Abertos têm campos extras: `is_public` (visível para todos os alunos), `capacity` (vagas), `price` (preço em R$)

---

## Visão Geral das 3 Abas em `/admin/agendamentos`

### Aba 1 — Agendamentos
Todos os bookings 1:1 da plataforma com filtros e ações de gestão.

### Aba 2 — Disponibilidade
Atribuição de mentores a serviços, horários semanais e bloqueios de agenda.

### Aba 3 — Políticas
Regras globais do sistema de agendamentos 1:1.

---

## Aba 1: Agendamentos (Bookings 1:1)

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
1. Clique no menu de ações (⋮)
2. Selecione "Marcar Concluída"
3. Adicione notas da sessão (opcional)
4. Confirme — email de conclusão **não** é enviado por esta ação

#### Cancelar
1. Clique no menu de ações (⋮)
2. Selecione "Cancelar"
3. Informe o motivo do cancelamento
4. Confirme — email de cancelamento é enviado ao aluno

#### Marcar No-show
1. Clique no menu de ações (⋮)
2. Selecione "Marcar No-show"
3. Confirme — email de no-show é enviado ao aluno

---

## Aba 2: Disponibilidade (Bookings 1:1)

### Seção: Atribuição de Mentores a Serviços

Define qual mentor atende qual serviço e os parâmetros do slot.

#### Criar nova atribuição
1. Clique em **"Atribuir Mentor"**
2. Preencha:
   - **Mentor**: selecione o mentor (role `mentor` ou `admin`)
   - **Serviço**: selecione o serviço do tipo `live_mentoring`
   - **Duração do slot** (minutos): duração padrão de cada sessão
   - **Buffer** (minutos): tempo livre entre sessões
   - **Link da reunião**: URL do Google Meet, Zoom, etc.
3. Salve

> Um serviço só aparece para agendamento se tiver pelo menos um mentor ativo atribuído.

#### Editar / Remover atribuição
- **Editar**: clique no botão de editar (✏️) no card da atribuição
- **Remover**: clique no botão de excluir (🗑️) — o mentor deixa de aparecer para aquele serviço

---

### Seção: Horários Semanais (por mentor)

#### Adicionar horário
1. Selecione o mentor no dropdown
2. Clique em **"Adicionar Horário"**
3. Escolha o dia da semana e defina início/fim
4. Salve

O sistema divide o período em slots baseados na duração configurada na atribuição.

#### Ativar/desativar / Remover
- **Toggle** na coluna "Ativo" para ativar/desativar sem excluir
- **Lixeira** (🗑️) para remover

---

### Seção: Bloqueios de Agenda (por mentor)

Períodos em que o mentor não pode atender (férias, feriados, compromissos).

#### Adicionar bloqueio
1. Selecione o mentor
2. Clique em **"Adicionar Bloqueio"**
3. Defina data/hora de início e fim + motivo (opcional)
4. Salve

Bloqueios sobrepõem os horários semanais. Sessões já confirmadas **não** são canceladas automaticamente.

---

## Aba 3: Políticas

Configurações globais que afetam todos os bookings 1:1 da plataforma.

| Campo | Descrição | Impacto |
|-------|-----------|---------|
| **Max agendamentos simultâneos** | Sessões ativas que um aluno pode ter ao mesmo tempo | Bloqueia novos agendamentos ao atingir o limite |
| **Max reagendamentos** | Vezes que pode reagendar a mesma sessão | Após o limite, precisa cancelar e criar nova |
| **Antecedência mínima (horas)** | Com quantas horas de antecedência pode agendar | Ex: 24h → só agendamentos a partir de amanhã |
| **Antecedência máxima (dias)** | Até quando no futuro pode agendar | Datas além do limite não aparecem |
| **Janela de cancelamento (horas)** | Até quando antes da sessão pode cancelar | Ex: 12h → cancelamento bloqueado nas últimas 12h |
| **Duração padrão (minutos)** | Fallback quando não configurado individualmente | — |
| **Intervalo entre slots (minutos)** | Espaço entre slots disponíveis | Ex: 30 → slots às 09:00, 09:30, 10:00... |

Clique em **Salvar Políticas** após qualquer alteração.

---

## Sessões em Grupo e Eventos Abertos

As sessões em grupo (tabela `sessions`) são criadas diretamente pelo mentor em `/mentor/sessao/nova`. O admin não tem uma página dedicada para gerenciá-las, mas pode visualizá-las no banco.

### Campos novos em `sessions` (Eventos Abertos)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `espaco_id` | UUID \| null | Nulo = evento standalone (sem Espaço vinculado) |
| `is_public` | boolean | Se `true`, visível para todos os alunos na agenda |
| `capacity` | int \| null | Vagas disponíveis (null/0 = ilimitado) |
| `price` | numeric | Preço em R$ (0 = gratuito) |

---

## Emails Automáticos Relacionados a Bookings 1:1

Todos editáveis em **Admin → Templates de Email**.

| Evento | Template | Quem recebe |
|--------|----------|------------|
| Novo agendamento | `booking_confirmation` | Aluno |
| 24h antes | `booking_reminder` | Aluno |
| 1h antes | `booking_reminder_1h` | Aluno |
| Reagendamento | `booking_rescheduled` | Aluno |
| Cancelamento | `booking_cancelled` | Aluno |
| No-show | `booking_no_show` | Aluno |

Os lembretes são enviados automaticamente por um job agendado a cada 15 minutos.

---

## Fluxo de Status dos Bookings 1:1

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

    REAGENDADO = nova booking CONFIRMADA + booking antiga marcada REAGENDADA
```

---

## Perguntas Frequentes

**P: Como habilito agendamento para um novo serviço?**
R: O serviço precisa ser do tipo `live_mentoring`. Depois, atribua um mentor na aba Disponibilidade.

**P: Como adiciono um novo mentor ao sistema?**
R: Altere o role do usuário para `mentor` em **Admin → Usuários**. Depois, atribua o mentor a um serviço na aba Disponibilidade.

**P: O link da reunião aparece nos emails?**
R: Sim, desde que esteja configurado no campo "Link da reunião" da atribuição mentor↔serviço.

**P: Um admin pode agendar uma sessão por um aluno?**
R: Não existe fluxo admin para isso na UI. O aluno deve fazer o agendamento pela própria conta, ou o dev pode inserir diretamente no banco.

**P: Como diferencio uma sessão de Espaço de um Evento Aberto no banco?**
R: `sessions.espaco_id IS NULL` = Evento Aberto standalone. `sessions.espaco_id IS NOT NULL` = sessão vinculada a um Espaço.
