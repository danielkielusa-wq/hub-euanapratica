# Sistema de Agendamentos — Guia de Atendimento ao Cliente

## Visão Geral

A plataforma tem dois tipos de encontros com mentores:

| Tipo | Quem cria | Onde o aluno vê |
|------|-----------|-----------------|
| **Sessão em Grupo** | Mentor (para inscritos de um Espaço) | Agenda → calendário mensal |
| **Booking 1:1** | Aluno (agendamento individual com mentor) | Agendamentos + Agenda |
| **Evento Aberto** | Mentor (hotseat, masterclass, live) | Agenda → calendário mensal |

O aluno vê tudo numa única **Agenda** em `/dashboard/agenda` — calendário mensal com filtros por tipo e status.

---

## Fluxo Normal do Aluno (Booking 1:1)

1. Aluno acessa o Hub → clica em um serviço de mentoria → botão "Agendar Sessão"
2. Escolhe o mentor disponível
3. Escolhe data e horário
4. Confirma (pode adicionar notas)
5. Recebe email de confirmação imediatamente
6. Recebe lembrete 24h antes
7. Recebe lembrete 1h antes com link da reunião
8. Participa da sessão
9. Mentor marca como concluída

O aluno pode ver todos os seus bookings 1:1 em **Meus Agendamentos** (`/dashboard/agendamentos`).

---

## Problemas Comuns e Como Resolver

### "Não consigo agendar uma sessão"

#### 1. O aluno tem acesso ao serviço?
O agendamento 1:1 só está disponível para quem **comprou ou assinou** o serviço. Se não tem acesso, verá:

> "Você precisa adquirir este serviço para agendar sessões"

**Solução**: direcione para `/pricing` ou `/catalogo` para adquirir.

#### 2. Existem mentores disponíveis?
Se nenhum mentor aparece na lista, pode ser que nenhum mentor foi atribuído ao serviço. Escale para o admin verificar em **Admin → Agendamentos → aba Disponibilidade**.

#### 3. Não aparecem horários disponíveis?
- O mentor pode não ter configurado disponibilidade para aquele dia
- O mentor pode ter um bloqueio no período (férias, feriado)
- Todos os slots já estão ocupados

**Sugestão ao aluno**: tentar outro dia ou outro mentor.

#### 4. "Você atingiu o limite de agendamentos"?
O sistema tem um limite de sessões ativas simultâneas (definido pelo admin). O aluno precisa esperar uma sessão ser concluída ou cancelada antes de agendar nova.

---

### "Não recebi o email de confirmação/lembrete"

#### 1. Checar spam/lixo eletrônico
Buscar por emails de `noreply@euanapratica.com` na pasta de spam.

#### 2. Confirmar email correto
Verificar se o email no perfil do aluno está correto.

#### 3. Verificar template habilitado
Ir em **Admin → Templates de Email** e confirmar que os templates estão habilitados:
- `booking_confirmation` — Confirmação
- `booking_reminder` — Lembrete 24h
- `booking_reminder_1h` — Lembrete 1h

#### 4. Verificar se o booking existe
Ir em **Admin → Agendamentos** e buscar pela sessão. Status "Confirmado" = trigger deveria ter disparado.

#### 5. Escalar para o dev
Com: ID do usuário, email, nome do template, data/hora do agendamento, ID do booking.

---

### "Quero cancelar minha sessão"

O aluno cancela diretamente pela plataforma:

1. **Agendamentos** no menu lateral
2. Sessão na aba "Próximos"
3. Clicar em "Cancelar" → confirmar

**Restrições:**
- Existe uma **janela de cancelamento** (configurada pelo admin). Muito próximo da sessão = bloqueado
- Se bloqueado, um admin pode cancelar em **Admin → Agendamentos → ação "Cancelar"**

O aluno receberá email de cancelamento.

---

### "Quero reagendar minha sessão"

O aluno reagenda diretamente pela plataforma:

1. **Agendamentos** no menu lateral
2. Sessão na aba "Próximos"
3. Clicar em "Reagendar" → escolher nova data/horário

**Restrições:**
- Existe um **limite de reagendamentos** por sessão
- A mesma janela de antecedência se aplica
- Se o limite foi atingido, o aluno precisa cancelar e criar novo agendamento

O aluno receberá email com a nova data (e data antiga riscada).

---

### "O link da reunião não apareceu"

O link da reunião é configurado pelo mentor e aparece:
- No email de confirmação
- Nos lembretes (24h e 1h)
- No card da sessão em **Agendamentos**
- Na Agenda ao clicar no dia

Se o link não aparece:
1. Verificar se o mentor configurou em **Mentor → Disponibilidade → Link da Reunião**
2. Se não configurou, contate o mentor para preencher
3. Um admin pode configurar em **Admin → Agendamentos → aba Disponibilidade → card do mentor**

---

### "Fui marcado como no-show mas eu participei"

O mentor ou admin marcou incorretamente. Para corrigir:
1. Contate o mentor para verificar o que aconteceu
2. Se foi erro, um admin pode alterar o status em **Admin → Agendamentos**
3. Não existe "desfazer no-show" direto na UI — o admin precisa fazer a correção

---

### "O mentor não apareceu na sessão"

1. Verificar se a sessão está como "Confirmado" em **Admin → Agendamentos**
2. Contatar o mentor
3. Se necessário, o admin pode cancelar a sessão
4. Oferecer ao aluno opção de reagendar com o mesmo ou outro mentor

---

### "Não sei o que é um evento no meu calendário"

A Agenda unificada (`/dashboard/agenda`) mostra três tipos de eventos:

| Cor | Tipo | O que significa |
|-----|------|----------------|
| Indigo/Roxo | Sessão em Grupo | Sessão agendada pelo mentor para o Espaço em que você está inscrito |
| Azul | Booking 1:1 | Sessão individual que você agendou com o mentor |
| (qualquer) | Evento Aberto | Hotseat, masterclass ou live criada pelo mentor — aberta para participação |

Eventos Abertos com `is_public = true` aparecem para todos os alunos, não apenas para os inscritos de um Espaço. São oportunidades adicionais de aprendizado, geralmente gratuitas.

---

## O que cada status significa

| Status | Significado | O que o aluno vê |
|--------|-------------|-----------------|
| **Agendado** | Sessão em grupo criada pelo mentor | Pill colorida no calendário |
| **Confirmado** | Booking 1:1 ativo | Card com data, hora e link da reunião |
| **Concluída** | Sessão realizada com sucesso | Card na aba "Anteriores" com badge verde |
| **Cancelada** | Sessão cancelada | Card com badge vermelha e motivo |
| **No-show** | Aluno não compareceu | Card com badge vermelha |
| **Reagendada** | Sessão foi movida para outra data | Novo card com a data atualizada |

---

## Ações do Admin

O admin gerencia bookings 1:1 em **Admin → Agendamentos**:

| Ação | Quando usar |
|------|-------------|
| **Marcar Concluída** | Mentor esqueceu de marcar, ou sessão precisa ser encerrada manualmente |
| **Cancelar** | Sessão precisa ser cancelada (pede motivo) — email de cancelamento enviado |
| **Marcar No-show** | Aluno não compareceu — email de no-show enviado |

---

## Configurações Importantes (Admin → Políticas)

| Configuração | O que faz | Quando o aluno sente |
|-------------|-----------|---------------------|
| Max agendamentos simultâneos | Sessões ativas ao mesmo tempo | "Você atingiu o limite" |
| Max reagendamentos | Vezes que pode reagendar a mesma sessão | "Limite de reagendamentos atingido" |
| Antecedência mínima (horas) | Quanto antes da sessão pode agendar | Slots muito próximos não aparecem |
| Antecedência máxima (dias) | Até quando no futuro pode agendar | Datas futuras além do limite não aparecem |
| Janela de cancelamento (horas) | Até quando antes da sessão pode cancelar | Botão "Cancelar" desaparece |

---

## Templates de Email de Agendamento

| Template | Quando é enviado |
|----------|-----------------|
| `booking_confirmation` | Ao criar agendamento |
| `booking_reminder` | ~24h antes da sessão |
| `booking_reminder_1h` | ~1h antes da sessão |
| `booking_rescheduled` | Ao reagendar |
| `booking_cancelled` | Ao cancelar |
| `booking_no_show` | Ao marcar no-show |

Todos os emails vêm de: **EUA na Prática** `<noreply@euanapratica.com>` — este endereço **não recebe respostas**. Direcione o aluno para o canal de suporte.

---

## Resumo de Escalonamento

| Problema | Resolução | Escalar para |
|----------|-----------|-------------|
| Aluno sem acesso ao serviço | Direcionar para compra | — |
| Sem horários disponíveis | Sugerir outro dia/mentor | Mentor (para add horários) |
| Link de reunião ausente | Mentor precisa configurar | Mentor ou Admin |
| Email não recebido (template ok) | Verificar spam e email | Dev (se persistir) |
| No-show incorreto | Admin corrige status | Admin |
| Mentor não compareceu | Contatar mentor, cancelar se necessário | Admin |
| Dúvida sobre evento na Agenda | Explicar tipos (tabela de cores acima) | — |
| Erro técnico no agendamento | Coletar dados e escalar | Dev |
