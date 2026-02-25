# Sistema de Agendamentos — Guia de Atendimento ao Cliente

## Visão Geral

O sistema de agendamentos permite que alunos marquem sessões 1:1 com mentores. Este guia cobre os cenários mais comuns de suporte.

---

## Fluxo Normal do Aluno

1. Aluno acessa o Hub → clica em um serviço de mentoria → botão "Agendar Sessão"
2. Escolhe o mentor disponível
3. Escolhe data e horário (baseados na disponibilidade do mentor)
4. Confirma o agendamento (pode adicionar notas)
5. Recebe email de confirmação imediatamente
6. Recebe lembrete 24h antes
7. Recebe lembrete 1h antes com link da reunião
8. Participa da sessão
9. Mentor marca como concluída

O aluno pode ver todas as suas sessões em **Meus Agendamentos** (menu lateral → Agendamentos).

---

## Problemas Comuns e Como Resolver

### "Não consigo agendar uma sessão"

Siga este checklist na ordem:

#### 1. O aluno tem acesso ao serviço?
O agendamento só está disponível para quem **comprou ou assinou** o serviço. Se o aluno não tem acesso, ele verá a mensagem:

> "Você precisa adquirir este serviço para agendar sessões"

**Solução**: Direcione o aluno para a página de planos (`/pricing`) ou catálogo (`/catalogo`) para adquirir o serviço.

#### 2. Existem mentores disponíveis?
Se nenhum mentor aparece na lista:
- Pode ser que nenhum mentor foi atribuído ao serviço (problema admin)
- Escale para o admin verificar em **Admin → Agendamentos → aba Disponibilidade**

#### 3. Não aparecem horários disponíveis?
Se o mentor aparece mas nenhum horário está disponível:
- O mentor pode não ter configurado disponibilidade para aquele dia
- O mentor pode ter bloqueado o período (férias, feriado)
- Todos os slots já estão ocupados
- **Sugestão ao aluno**: tentar outro dia ou outro mentor

#### 4. Mensagem "Você atingiu o limite de agendamentos"?
O sistema tem um limite de agendamentos simultâneos (definido pelo admin). O aluno precisa esperar que uma sessão existente seja concluída ou cancelada antes de agendar nova.

---

### "Não recebi o email de confirmação/lembrete"

#### 1. Checar spam/lixo eletrônico
Pedir ao aluno para buscar por emails de `noreply@euanapratica.com` na pasta de spam.

#### 2. Confirmar email correto
Verificar se o email no perfil do aluno está correto. Alunos às vezes cadastram com email do trabalho e checam o pessoal.

#### 3. Verificar template habilitado
Ir em **Admin → Templates de Email** e confirmar que os templates de booking estão com toggle **habilitado** (verde):
- `booking_confirmation` — Confirmação
- `booking_reminder` — Lembrete 24h
- `booking_reminder_1h` — Lembrete 1h

#### 4. Verificar se a booking existe
Ir em **Admin → Agendamentos** e buscar pela sessão. Se a sessão aparece com status "Confirmado", o trigger deveria ter disparado.

#### 5. Escalar para o dev
Se tudo acima está correto, escale com:
- ID do usuário
- Email do usuário
- Nome do template (ex: `booking_confirmation`)
- Data/hora aproximada do agendamento
- ID da booking (se disponível na tela admin)

---

### "Quero cancelar minha sessão"

O aluno pode cancelar diretamente pela plataforma:

1. Acessar **Agendamentos** no menu lateral
2. Encontrar a sessão na lista de "Próximos"
3. Clicar em "Cancelar"
4. Confirmar o cancelamento (pode adicionar motivo)

**Restrições:**
- Existe uma **janela de cancelamento** (configurada pelo admin). Se o aluno tentar cancelar muito próximo da sessão, pode ser bloqueado
- Se o aluno não conseguir cancelar pela plataforma, um admin pode cancelar em **Admin → Agendamentos → ação "Cancelar"**

O aluno receberá um email confirmando o cancelamento.

---

### "Quero reagendar minha sessão"

O aluno pode reagendar pela plataforma:

1. Acessar **Agendamentos** no menu lateral
2. Encontrar a sessão
3. Clicar em "Reagendar"
4. Escolher nova data e horário

**Restrições:**
- Existe um **limite de reagendamentos** por sessão (configurado pelo admin)
- A mesma janela de antecedência se aplica
- Se o limite foi atingido, o aluno precisa cancelar e criar um novo agendamento

O aluno receberá email com a nova data (e a data antiga riscada).

---

### "O link da reunião não apareceu"

O link da reunião (Google Meet, Zoom, etc.) é configurado pelo mentor e aparece:
- No email de confirmação
- Nos lembretes (24h e 1h)
- No card da sessão em **Agendamentos**

Se o link não aparece:
1. Verificar se o mentor configurou o link em **Mentor → Disponibilidade → Link da Reunião**
2. Se não configurou, contate o mentor para que ele preencha
3. Alternativamente, um admin pode configurar em **Admin → Agendamentos → aba Disponibilidade → card do mentor**

---

### "Fui marcado como no-show mas eu participei"

O mentor ou admin marcou a sessão como "não comparecimento". Para corrigir:
1. Contate o mentor para verificar o que aconteceu
2. Se foi um erro, um admin pode alterar o status em **Admin → Agendamentos**
3. Não existe botão de "desfazer no-show" direto — precisa ser feito pelo admin

---

### "O mentor não apareceu na sessão"

1. Verificar se a sessão está com status "Confirmado" em **Admin → Agendamentos**
2. Contatar o mentor
3. Se necessário, o admin pode cancelar a sessão sem penalidade para o aluno
4. Oferecer ao aluno a opção de reagendar com o mesmo ou outro mentor

---

## O que cada status significa

| Status | Significado | O que o aluno vê |
|--------|-------------|-----------------|
| **Confirmado** | Sessão agendada e ativa | Card com data, hora e botão de link da reunião |
| **Concluída** | Sessão realizada com sucesso | Card na aba "Anteriores" com badge verde |
| **Cancelada** | Sessão cancelada por aluno, mentor ou admin | Card com badge vermelha e motivo |
| **No-show** | Aluno não compareceu | Card com badge vermelha |
| **Reagendada** | Sessão foi movida para outra data | Novo card com a data atualizada |

---

## Ações do Admin

O admin pode gerenciar qualquer agendamento em **Admin → Agendamentos**:

| Ação | Quando usar |
|------|-------------|
| **Marcar Concluída** | Mentor esqueceu de marcar, ou sessão precisa ser concluída manualmente |
| **Cancelar** | Sessão precisa ser cancelada (pede motivo) — email de cancelamento é enviado |
| **Marcar No-show** | Aluno não compareceu — email de no-show é enviado |

---

## Configurações Importantes (Admin)

Em **Admin → Agendamentos → aba Políticas**:

| Configuração | O que faz | Impacto no aluno |
|-------------|-----------|-----------------|
| Max agendamentos simultâneos | Quantas sessões ativas o aluno pode ter ao mesmo tempo | "Você atingiu o limite" |
| Max reagendamentos | Quantas vezes pode reagendar a mesma sessão | "Limite de reagendamentos atingido" |
| Antecedência mínima (horas) | Quanto antes da sessão pode agendar/cancelar | "Muito próximo da sessão" |
| Antecedência máxima (dias) | Até quando no futuro pode agendar | Datas futuras além do limite não aparecem |
| Janela de cancelamento (horas) | Até quando antes da sessão pode cancelar | Botão de cancelar desaparece |

---

## Emails Relacionados a Agendamentos

| Template | Quando é enviado | Editável em |
|----------|-----------------|-------------|
| `booking_confirmation` | Ao criar agendamento | Admin → Templates de Email |
| `booking_reminder` | ~24h antes da sessão | Admin → Templates de Email |
| `booking_reminder_1h` | ~1h antes da sessão | Admin → Templates de Email |
| `booking_rescheduled` | Ao reagendar | Admin → Templates de Email |
| `booking_cancelled` | Ao cancelar | Admin → Templates de Email |
| `booking_no_show` | Ao marcar no-show | Admin → Templates de Email |

Todos os emails vêm de: **EUA na Prática** `<noreply@euanapratica.com>`

Este endereço **não recebe respostas**. Se o aluno responder ao email, a mensagem não será recebida. Direcione-o para o canal de suporte.

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
| Erro técnico no agendamento | Coletar dados e escalar | Dev |
