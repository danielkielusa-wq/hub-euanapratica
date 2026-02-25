# Sistema de Agendamentos — Guia do Mentor

## Visão Geral

Como mentor, você tem duas páginas dedicadas no painel:

| Página | Onde | Para que serve |
|--------|------|---------------|
| **Minha Disponibilidade** | Menu → Disponibilidade | Configurar horários, link de reunião e bloqueios |
| **Meus Agendamentos** | Menu → Agendamentos | Ver sessões, entrar na reunião, marcar como concluída |

---

## Configurando sua Disponibilidade

### Acesse: Menu lateral → Disponibilidade
URL: `/mentor/disponibilidade`

---

### 1. Link da Reunião

O link da reunião é o URL que será enviado automaticamente aos alunos nos emails de confirmação e lembrete.

**Como configurar:**
1. Na seção "Link da Reunião", localize o serviço que você atende
2. Cole o link do Google Meet, Zoom, ou qualquer outra plataforma
3. Clique no botão salvar (💾) ao lado do campo

> **Importante**: configure o link antes de aceitar agendamentos. Se o link estiver vazio, os alunos não receberão o acesso à reunião nos emails.

**Dica**: crie uma sala de reunião permanente (Google Meet permite isso) para não precisar atualizar toda semana.

---

### 2. Horários Semanais

Define em quais dias e horários você está disponível para atendimento. O sistema usa essa informação para mostrar os slots disponíveis aos alunos.

**Como adicionar um horário:**
1. Clique em **"Adicionar Horário"**
2. Selecione o dia da semana
3. Defina o horário de início e fim (ex: 09:00 — 17:00)
4. Salve

**Como ativar/desativar temporariamente:**
Use o toggle (chave) ao lado de cada horário. Desativar é útil para pausar um dia específico sem precisar excluir o horário.

**Como remover:**
Clique no ícone de lixeira (🗑️) ao lado do horário.

> **Atenção**: os slots de horário são divididos automaticamente com base na duração das sessões (configurada pelo admin). Por exemplo, se a duração for 60min e você colocar 09:00–17:00, os alunos verão os horários: 09:00, 10:00, 11:00, etc.

---

### 3. Bloqueios de Agenda

Use bloqueios para períodos em que você **não pode atender**, mesmo que tenha horários semanais configurados.

**Exemplos de uso:**
- Férias
- Feriados
- Compromissos pontuais (reunião, viagem)

**Como adicionar um bloqueio:**
1. Clique em **"Adicionar Bloqueio"**
2. Defina data e horário de início
3. Defina data e horário de fim
4. Adicione um motivo (opcional — só visível internamente)
5. Salve

O bloqueio impede novos agendamentos no período. **Sessões já confirmadas não são canceladas automaticamente** — você precisará contatar os alunos manualmente se o bloqueio conflitar com sessões existentes.

**Como remover um bloqueio:**
Clique no ícone de lixeira (🗑️) ao lado do bloqueio.

---

## Gerenciando suas Sessões

### Acesse: Menu lateral → Agendamentos
URL: `/mentor/agendamentos`

---

### Cards de Resumo

No topo da página, você vê:
- **Próximas**: sessões confirmadas futuras
- **Concluídas**: total histórico de sessões concluídas
- **No-shows**: total de não comparecimentos registrados

---

### Aba "Próximos"

Lista todas as suas sessões confirmadas e futuras.

**Cada card mostra:**
- Data (dia da semana, dia e mês em destaque)
- Nome do serviço
- Nome do aluno
- Horário de início e fim
- Duração em minutos
- Nota do aluno (se ele enviou alguma nota ao agendar)
- Status atual

**Ações disponíveis:**

#### Entrar na Reunião
O botão **"Entrar"** (ícone de câmera) aparece para sessões confirmadas que têm link de reunião configurado. Clique para abrir a reunião em nova aba.

#### Marcar como Concluída
O botão **"Concluir"** (ícone de check verde) aparece para sessões confirmadas.

1. Clique em "Concluir"
2. Adicione notas da sessão (opcional — mas recomendado para acompanhamento)
   - Resumo do que foi discutido
   - Próximos passos para o aluno
   - Observações relevantes
3. Confirme

> **Lembre-se**: marque as sessões como concluídas logo após cada atendimento. Isso mantém seu histórico organizado e confirma para o sistema que a sessão aconteceu.

---

### Aba "Anteriores"

Histórico de todas as suas sessões passadas (concluídas, canceladas, no-shows, reagendadas).

Útil para:
- Consultar notas de sessões anteriores
- Ver o histórico de um aluno específico

---

## Fluxo Completo de uma Sessão

```
Aluno agenda                    Você recebe notificação
     ↓                               (email — em breve)
Sessão CONFIRMADA               Aparece em "Próximos"
     ↓                               ↓
     ←── 24h antes ──────── Email lembrete enviado ao aluno
     ←── 1h antes ───────── Email lembrete enviado ao aluno
     ↓                               ↓
Hora da sessão              Botão "Entrar" disponível
     ↓                               ↓
Sessão realizada            Marcar como "Concluída"
     ↓                               ↓
Status: CONCLUÍDA           Aparece em "Anteriores"
```

---

## Perguntas Frequentes

**P: O aluno pode cancelar ou reagendar?**
R: Sim. O aluno pode cancelar ou reagendar pela página de Agendamentos dele. Você verá a mudança refletida na sua lista. O sistema respeita as políticas de antecedência configuradas pelo admin.

**P: Preciso confirmar cada agendamento manualmente?**
R: Não. As sessões são confirmadas automaticamente quando o aluno agenda. Você não precisa aprovar cada uma.

**P: E se eu precisar cancelar uma sessão?**
R: Atualmente, o cancelamento pelo mentor precisa ser feito pelo admin. Entre em contato com a equipe administrativa informando o ID ou data/aluno da sessão.

**P: Posso atender vários alunos no mesmo horário?**
R: Não. O sistema bloqueia conflitos de horário automaticamente — se você já tem uma sessão das 10:00 às 11:00, nenhum outro aluno conseguirá agendar nesse período.

**P: O aluno não apareceu na sessão. O que faço?**
R: Não precisa fazer nada imediatamente. O admin pode marcar como "no-show" no painel deles. Se quiser reportar, contate a equipe administrativa com o nome do aluno e a data/hora da sessão.

**P: Como adiciono um novo horário apenas para uma semana específica?**
R: Os horários semanais são recorrentes. Para liberar um horário específico, você pode usar o mecanismo inverso: adicionar um bloqueio para todos os outros dias daquela semana. Alternativamente, peça ao admin para criar um slot específico.

**P: Meu link de reunião mudou. Como atualizo?**
R: Acesse Disponibilidade → seção "Link da Reunião" → edite o campo → salve. O novo link será usado em todos os agendamentos futuros. Agendamentos já confirmados mantêm o link antigo no email de confirmação (mas os lembretes usarão o novo link).
