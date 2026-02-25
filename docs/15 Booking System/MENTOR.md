# Sistema de Agendamentos — Guia do Mentor

## Visão Geral

Como mentor, você tem três páginas no painel para gerenciar sua agenda:

| Página | URL | Para que serve |
|--------|-----|----------------|
| **Agenda** | `/mentor/agenda` | Visão unificada em calendário — todas as suas sessões e bookings |
| **Meus Agendamentos** | `/mentor/agendamentos` | Lista detalhada de bookings 1:1 |
| **Disponibilidade** | `/mentor/disponibilidade` | Configurar horários, link de reunião e bloqueios |

---

## Agenda — Visão Unificada (`/mentor/agenda`)

A Agenda mostra **tudo num único calendário mensal**: sessões em grupo dos seus Espaços + bookings 1:1 agendados pelos alunos.

### Como identificar cada tipo

| Cor do evento | Tipo |
|---------------|------|
| **Indigo/Roxo** | Sessão em Grupo (vinculada a um Espaço) |
| **Azul** | Booking 1:1 |

### Filtros disponíveis

- **Tipo**: Todos os tipos / Sessões em Grupo / Bookings 1:1
- **Status**: Todos / Agendado / Ao Vivo / Confirmado / Concluído / Cancelado

### Navegando pelo calendário

- Use as setas `<` `>` para navegar entre meses
- Clique em **Hoje** para voltar ao mês atual
- Clique em qualquer dia para abrir o painel de detalhes com todos os eventos daquele dia e ações rápidas (entrar na reunião, ver materiais, ver gravação)

### Criar um novo evento

Clique em **"Novo Evento"** (botão roxo no topo) para criar uma sessão em grupo ou um evento aberto standalone.

---

## Criando Sessões e Eventos (`/mentor/sessao/nova`)

Ao clicar em "Novo Evento", você escolhe entre dois tipos:

### Tipo 1 — Sessão em Espaço

Vinculada a um Espaço existente. Aparece automaticamente na agenda dos alunos inscritos naquele Espaço.

**Campos:**
- Título, Descrição
- **Espaço** (obrigatório)
- Data, Horário, Duração
- Link da Reunião
- Notificar alunos

**Quando usar:** mentoria em grupo regular para inscritos de um Espaço.

---

### Tipo 2 — Evento Aberto

Não vinculado a nenhum Espaço. Ideal para hotseats gratuitos, masterclasses abertas, lives especiais.

**Campos adicionais:**
- **Espaço (opcional)** — vincule a um Espaço para notificar os inscritos, ou deixe em branco para um evento totalmente independente
- **Visível para todos os alunos** (toggle) — aparece na agenda de qualquer aluno logado na plataforma
- **Capacidade** — número máximo de participantes (0 = ilimitado)
- **Preço (R$)** — 0 = gratuito

**Quando usar:** hotseat gratuito, masterclass aberta, live especial, evento de aquisição.

---

## Meus Agendamentos — Bookings 1:1 (`/mentor/agendamentos`)

Lista detalhada de todos os seus bookings 1:1.

### Cards de Resumo

| Card | O que mostra |
|------|-------------|
| **Próximas** | Sessões confirmadas futuras |
| **Concluídas** | Total histórico de sessões concluídas |
| **No-shows** | Total de não comparecimentos registrados |

### Aba "Próximos"

**Cada card mostra:** data, serviço, nome do aluno, horário início–fim, duração, nota do aluno (se enviada ao agendar), status.

**Ações:**

#### Entrar na Reunião
Botão "Entrar" (ícone de câmera) — abre a sala de reunião em nova aba. Aparece para sessões com link configurado.

#### Marcar como Concluída
1. Clique em "Concluir" (ícone de check verde)
2. Adicione notas da sessão (opcional, mas recomendado)
3. Confirme

> Marque logo após cada atendimento para manter o histórico organizado.

### Aba "Anteriores"

Histórico completo: concluídas, canceladas, no-shows, reagendadas.

---

## Configurando sua Disponibilidade (`/mentor/disponibilidade`)

### 1. Link da Reunião

Link enviado automaticamente nos emails de confirmação e lembrete dos bookings 1:1.

1. Localize o serviço que você atende
2. Cole o link do Google Meet, Zoom, etc.
3. Clique em salvar (💾)

> **Dica**: crie uma sala permanente no Google Meet para não precisar atualizar toda semana.

---

### 2. Horários Semanais

Define quando você está disponível para bookings 1:1.

**Adicionar horário:**
1. Clique em **"Adicionar Horário"**
2. Selecione o dia da semana
3. Defina início e fim (ex: 09:00 — 17:00)
4. Salve

**Ativar/desativar:** use o toggle ao lado de cada horário.

**Remover:** clique no ícone de lixeira (🗑️).

> Os slots são divididos automaticamente pela duração configurada. Ex: duração 60min + janela 09:00–17:00 = slots às 09:00, 10:00, 11:00...

---

### 3. Bloqueios de Agenda

Períodos em que você não pode atender, mesmo com horários semanais configurados.

**Casos de uso:** férias, feriados, compromissos pontuais.

**Adicionar bloqueio:**
1. Clique em **"Adicionar Bloqueio"**
2. Defina data/hora de início e fim
3. Adicione motivo (opcional — visível só internamente)
4. Salve

> Sessões já confirmadas **não** são canceladas automaticamente. Contate os alunos se houver conflito.

---

## Fluxo Completo de um Booking 1:1

```
Aluno agenda
     ↓
Sessão CONFIRMADA ──► Aparece na Agenda (pill azul) e em "Próximos"
     ↓
     ←── 24h antes ──── Email lembrete enviado ao aluno
     ←── 1h antes ───── Email lembrete enviado ao aluno
     ↓
Hora da sessão ──────► Botão "Entrar" disponível
     ↓
Sessão realizada ────► Marcar como "Concluída"
     ↓
Status: CONCLUÍDA ──► Aparece em "Anteriores"
```

---

## Perguntas Frequentes

**P: Qual a diferença entre "Agenda" e "Meus Agendamentos"?**
R: A Agenda é o calendário mensal que mostra tudo (sessões em grupo + bookings 1:1). "Meus Agendamentos" é a lista detalhada focada exclusivamente em bookings 1:1, com ações de conclusão, notas e histórico.

**P: Como meus eventos abertos aparecem para os alunos?**
R: Se o toggle "Visível para todos os alunos" estiver ativado, o evento aparece em `/dashboard/agenda` de qualquer aluno logado. Se desativado, só aparece para inscritos do Espaço vinculado (se houver).

**P: O aluno pode cancelar ou reagendar bookings 1:1?**
R: Sim. O aluno pode cancelar ou reagendar por conta própria. A mudança aparece automaticamente na sua Agenda.

**P: Preciso confirmar cada agendamento manualmente?**
R: Não. Bookings são confirmados automaticamente.

**P: E se eu precisar cancelar um booking 1:1?**
R: O cancelamento pelo mentor precisa ser feito pelo admin. Informe o ID ou data/aluno da sessão.

**P: Posso atender vários alunos no mesmo horário (1:1)?**
R: Não. O sistema bloqueia conflitos de horário automaticamente.

**P: Como adiciono horário apenas para uma semana específica?**
R: Os horários são recorrentes. Para bloquear semanas específicas, use o mecanismo de bloqueios. Alternativamente, peça ao admin para criar um slot específico.

**P: Meu link de reunião mudou. Como atualizo?**
R: Disponibilidade → seção "Link da Reunião" → edite → salve. O novo link entra nos lembretes futuros. Agendamentos já confirmados mantêm o link antigo no email de confirmação.
