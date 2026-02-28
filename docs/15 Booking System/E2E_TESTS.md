# Booking System — Manual de Testes E2E

**Última atualização:** 2026-02-27
**Escopo:** Todos os fluxos do sistema de agendamentos — Aluno, Mentor e Admin

---

## Como usar este manual

Cada caso de teste segue este formato:

- **Pré-condição:** o que precisa estar configurado antes de executar
- **Passos:** ações na interface da aplicação, em ordem
- **Resultado esperado:** o que você deve ver/acontecer

> Referências a banco de dados (SQL, tabelas, colunas) foram movidas para a [Seção 17 — Referência Técnica](#17-referência-técnica) ao final. Consulte apenas quando precisar validar dados internos.

---

## Pré-requisitos de Configuração

Antes de iniciar os testes, verifique que o ambiente tem os seguintes dados:

### Usuários necessários

| Papel | Como criar |
|-------|-----------|
| **Aluno** | Registrar em `/register` com email de teste + completar onboarding |
| **Mentor** | Criar via Admin → `/admin/usuarios` → atribuir role `mentor` |
| **Admin** | Usuário com role `admin` (use sua conta de admin) |

### Configuração mínima

**1. Configurar o Mentor**
1. Logar como Admin → ir em `/admin/agendamentos`
2. Na aba **Disponibilidade**, selecionar o mentor
3. Clicar em "Adicionar Serviço" → selecionar um serviço do tipo Consultoria
4. Preencher o **meeting link** (ex: link do Google Meet)
5. Na seção de disponibilidade semanal, adicionar pelo menos 2 dias com horários futuros (ex: Segunda e Quarta, 09:00-17:00)

**2. Liberar acesso para o Aluno**
1. Como Admin → `/admin/matriculas`
2. Vincular o aluno ao mesmo serviço de consultoria

**3. Verificar Política de Agendamentos**
1. Como Admin → `/admin/agendamentos` → aba **Políticas**
2. Confirmar que existe uma política global com os valores:
   - Limite simultâneo: 3
   - Reagendamentos por sessão: 2
   - Aviso mínimo: 48h
   - Janela de cancelamento: 24h

---

## 1. Aluno — Criar Agendamento

**Rota:** `/dashboard/agendar/:serviceId` (acessível pelo botão no Meu Hub)

---

### TC-1.1 — Aluno sem acesso tenta agendar

**Pré-condição:** Logar com um aluno que NÃO tem o serviço liberado.

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Logar como aluno sem acesso ao serviço | — |
| 2 | Navegar diretamente para `/dashboard/agendar/<serviceId>` | Aparece um card em amarelo: **"Você não tem acesso a este serviço"** |
| 3 | Clicar no link "Ver catálogo" | Redireciona para `/catalogo` |
| 4 | Clicar no link "Ir ao Hub" | Redireciona para `/dashboard/hub` |

---

### TC-1.2 — Admin acessa o booking flow

**Pré-condição:** Estar logado como Admin.

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Navegar para `/dashboard/agendar/<serviceId>` | O calendário de agendamento carrega normalmente, **sem** o card de bloqueio de acesso |

---

### TC-1.3 — Aluno atingiu o limite de agendamentos

**Pré-condição:** Aluno já tem 3 agendamentos confirmados ativos (limite padrão).

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Logar como aluno com 3 agendamentos ativos | — |
| 2 | Acessar qualquer página de agendamento | Mensagem de limite exibida: **"Você atingiu o limite de 3 agendamentos simultâneos"** |
| 3 | Verificar o botão de confirmar | Deve estar **desabilitado** |

---

### TC-1.4 — Seleção de horário (Step 1)

**Pré-condição:** Aluno com acesso ao serviço. Mentor com disponibilidade configurada para os próximos dias.

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Logar como aluno e acessar a página de agendamento | Calendário semanal aparece com 7 colunas (um por dia) |
| 2 | Observar os dias da semana | Dias com horários disponíveis mostram um **badge verde** com o número de slots (ex: "3 horários") |
| 3 | Clicar em um dia com badge verde | Uma lista de horários aparece abaixo do calendário |
| 4 | Observar a lista de horários | Horários já passados **não aparecem**; horários dentro das próximas 48h **também não aparecem** |
| 5 | Clicar na seta **→** (próxima semana) | O calendário avança uma semana e novos horários carregam |
| 6 | Clicar na seta **←** (semana anterior) | Retorna para a semana atual; a seta ← fica desabilitada ao chegar na semana atual |
| 7 | Navegar até a semana com mais de 30 dias à frente | A seta → fica **desabilitada** (limite máximo de antecedência) |
| 8 | Clicar em um horário disponível | A tela avança para o **Step 2 — Confirmação** |

---

### TC-1.5 — Confirmação do agendamento (Step 2)

**Pré-condição:** Continuação do TC-1.4 (horário selecionado).

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Observar a tela de confirmação | Exibe: data, horário, duração, nome e foto do mentor |
| 2 | Observar os avisos de política | Aparece: **"Cancelamento com menos de 24h = não comparecimento"** e **"Máximo de 2 reagendamentos"** |
| 3 | Digitar uma nota no campo "Observações" (opcional) | Texto é aceito e persiste |
| 4 | Clicar em **"Voltar"** | Retorna para o Step 1; o horário selecionado **permanece destacado** |
| 5 | Clicar em **"Confirmar Agendamento"** | Botão mostra um spinner de carregamento |

---

### TC-1.6 — Agendamento criado com sucesso (Step 3)

**Pré-condição:** Continuação do TC-1.5 (botão de confirmar clicado).

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Aguardar a resposta | Tela de sucesso aparece com ícone de check verde |
| 2 | Clicar em **"Ver meus agendamentos"** | Redireciona para `/dashboard/agendamentos` |
| 3 | Verificar a lista de agendamentos | O novo agendamento aparece na tab **"Próximos"** com badge **"Confirmado"** (verde) |
| 4 | Verificar o email | Aluno recebe email de confirmação com: data, horário, nome do mentor e link da reunião |

---

### TC-1.7 — Conflito de horário (dois alunos)

**Pré-condição:** Dois alunos diferentes com acesso ao mesmo serviço e mentor. Usar dois browsers/abas diferentes.

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Aluno A e Aluno B acessam a página de agendamento ao mesmo tempo | — |
| 2 | Ambos clicam no **mesmo horário disponível** | Ambos veem o Step 2 — Confirmação |
| 3 | **Aluno A** confirma primeiro | Agendamento criado com sucesso |
| 4 | **Aluno B** confirma logo em seguida | Aparece uma mensagem de erro: **"Este horário não está mais disponível"** |
| 5 | Aluno B tenta selecionar outro horário | Consegue selecionar e confirmar normalmente |

---

### TC-1.8 — Mentor sem disponibilidade configurada

**Pré-condição:** Mentor sem nenhum horário de disponibilidade ativo.

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Aluno acessa a página de agendamento | Calendário aparece, mas todos os dias mostram **"0 horários"** ou nenhum badge |
| 2 | Clicar em qualquer dia | Mensagem de **"Nenhum horário disponível"** ou lista vazia |

---

### TC-1.9 — Mentor com bloqueio de agenda

**Pré-condição:** Mentor tem disponibilidade em Segunda 09:00-12:00 E um bloqueio cobrindo Segunda 10:00-11:00.

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Aluno acessa a página de agendamento | — |
| 2 | Clicar na Segunda bloqueada | Horários de **09:00 e 11:00** aparecem; horários de **10:00** (dentro do bloqueio) **não aparecem** |

---

## 2. Aluno — Meus Agendamentos

**Rota:** `/dashboard/agendamentos`
**Acesso:** Menu lateral → "Agendamentos"

---

### TC-2.1 — Visualização da tab "Próximos"

**Pré-condição:** Aluno com pelo menos 1 agendamento futuro confirmado.

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Logar como aluno e ir para "Agendamentos" | Tab **"Próximos"** aberta por padrão |
| 2 | Observar os cards | Cada card mostra: **caixa de data** (mês/dia/hora), nome do serviço, duração, foto e nome do mentor, badge verde **"Confirmado"** |
| 3 | Observar o painel de estatísticas | 4 contadores visíveis: Próximas / Concluídas / Canceladas / Vagas disponíveis |
| 4 | Verificar o botão "Entrar na Reunião" | Visível nos cards que têm link de reunião configurado |
| 5 | Clicar em "Entrar na Reunião" | Abre o link de reunião em **nova aba** do browser |

---

### TC-2.2 — Visualização da tab "Anteriores"

**Pré-condição:** Aluno com agendamentos passados ou cancelados.

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Clicar na tab **"Anteriores"** | Lista de agendamentos passados e/ou com status diferente de confirmado carrega |
| 2 | Observar os badges de status | Cada agendamento mostra o status correto: **"Concluído"** (azul), **"Cancelado"** (cinza), **"Não compareceu"** (vermelho) |
| 3 | Verificar as opções de ação | O menu de opções (reagendar / cancelar) **não aparece** em agendamentos passados |

---

### TC-2.3 — Alternar entre Lista e Calendário

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Clicar no ícone de **calendário** (canto superior direito) | Visualização muda para calendário mensal |
| 2 | Verificar os agendamentos no calendário | Aparecem nos dias corretos do mês |
| 3 | Clicar no ícone de **lista** | Retorna para a visualização em cards |

---

### TC-2.4 — Aluno sem agendamentos

**Pré-condição:** Aluno sem nenhum agendamento criado.

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Logar como aluno sem agendamentos | — |
| 2 | Ir para "Agendamentos" | Tela de estado vazio com mensagem amigável e botão de CTA (ex: "Agendar sessão") |

---

## 3. Aluno — Reagendar

**Acesso:** Card de agendamento → menu de opções (⋯) → "Reagendar"

---

### TC-3.1 — Reagendamento bem-sucedido

**Pré-condição:** Aluno com agendamento confirmado com mais de 24h de antecedência e menos de 2 reagendamentos.

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Na lista de agendamentos, clicar no menu **⋯** de um agendamento confirmado | Opções: "Reagendar" e "Cancelar" aparecem |
| 2 | Clicar em **"Reagendar"** | Modal abre mostrando as informações atuais da sessão (somente leitura) e um contador: ex. **"1 de 2 reagendamentos disponíveis"** |
| 3 | Selecionar um novo dia no calendário do modal | Horários disponíveis aparecem |
| 4 | Clicar em um horário | Horário fica destacado como selecionado |
| 5 | Clicar em **"Confirmar Reagendamento"** | Modal fecha; toast de sucesso aparece |
| 6 | Verificar o card na lista | Data e horário atualizados para o novo slot |
| 7 | Verificar o email | Email recebido com a **data antiga riscada em vermelho** e a **nova data em destaque** |

---

### TC-3.2 — Limite de reagendamentos atingido

**Pré-condição:** Agendamento já reagendado 2 vezes (o limite padrão).

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Clicar no menu **⋯** do agendamento | — |
| 2 | Observar a opção "Reagendar" | Aparece **desabilitada** (cinza, não clicável) |
| 3 | Verificar a mensagem no card | Texto em itálico: **"Você já reagendou esta sessão 2 vezes (limite máximo)"** |

---

### TC-3.3 — Reagendamento bloqueado por proximidade (< 24h)

**Pré-condição:** Agendamento confirmado com menos de 24h até a sessão.

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Clicar no menu **⋯** do agendamento próximo | — |
| 2 | Observar a opção "Reagendar" | Aparece **desabilitada** |
| 3 | Verificar a mensagem | **"Não é possível reagendar com menos de 24h de antecedência"** |

---

## 4. Aluno — Cancelar

**Acesso:** Card de agendamento → menu de opções (⋯) → "Cancelar"

---

### TC-4.1 — Cancelamento normal (> 24h de antecedência)

**Pré-condição:** Agendamento confirmado com mais de 24h até a sessão.

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Clicar no menu **⋯** → "Cancelar" | Modal de cancelamento abre **sem** aviso de cancelamento tardio |
| 2 | Digitar um motivo (opcional) | Texto aceito |
| 3 | Clicar em **"Confirmar Cancelamento"** | Modal fecha; toast de sucesso |
| 4 | Verificar tab "Próximos" | Agendamento **desapareceu** da lista |
| 5 | Ir para tab "Anteriores" | Agendamento aparece com badge **"Cancelado"** (cinza) |
| 6 | Verificar email | Email de cancelamento recebido (com o motivo, se preenchido) |

---

### TC-4.2 — Cancelamento tardio (< 24h → vira No-show)

**Pré-condição:** Agendamento confirmado com menos de 24h até a sessão.

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Clicar no menu **⋯** → "Cancelar" | Modal abre com um **aviso em destaque** (fundo vermelho ou amarelo): **"Esta sessão será marcada como não comparecimento"** |
| 2 | Observar o botão | Texto: **"Confirmar (será marcado como No-show)"** |
| 3 | Confirmar | Modal fecha; toast informando que foi marcado como no-show |
| 4 | Ir para tab "Anteriores" | Agendamento aparece com badge **"Não compareceu"** (vermelho), não "Cancelado" |

---

### TC-4.3 — Sem opção de cancelar em agendamentos passados

**Pré-condição:** Agendamento cuja data de sessão já passou.

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Ir para tab **"Anteriores"** | — |
| 2 | Clicar no menu **⋯** de um agendamento passado | O menu **não aparece**, ou aparece sem as opções de reagendar/cancelar |

---

## 5. Mentor — Meus Agendamentos

**Rota:** `/mentor/agendamentos`
**Acesso:** Menu lateral → "Agendamentos"

---

### TC-5.1 — Visualização de agendamentos

**Pré-condição:** Mentor com agendamentos de alunos.

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Logar como mentor e ir para "Agendamentos" | Painel de stats: Próximas / Concluídas / No-shows |
| 2 | Tab "Próximos" | Cards com: caixa de data, nome e foto do aluno, serviço, botão "Entrar" |
| 3 | Tab "Anteriores" | Agendamentos passados com badges corretos de status |

---

### TC-5.2 — Entrar na reunião

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | No card de agendamento com link configurado, clicar em **"Entrar"** | Link de reunião abre em nova aba |
| 2 | Agendamento sem link configurado | Botão "Entrar" **não aparece** ou está desabilitado |

---

### TC-5.3 — Concluir uma sessão

**Pré-condição:** Mentor tem agendamento confirmado (futuro ou passado).

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Clicar no menu de opções **⋯** → **"Concluir sessão"** | Dialog abre com campo de **notas do mentor** (opcional) |
| 2 | Digitar notas da sessão | Texto aceito |
| 3 | Clicar em **"Confirmar"** | Dialog fecha; toast de sucesso |
| 4 | Verificar tab "Anteriores" | Agendamento aparece com badge **"Concluído"** (azul) |

---

## 6. Mentor — Disponibilidade

**Rota:** `/mentor/disponibilidade`
**Acesso:** Menu lateral → "Disponibilidade"

---

### TC-6.1 — Configurar link de reunião

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Logar como mentor e ir para "Disponibilidade" | Seção com o(s) serviço(s) ativo(s) e campo de meeting link |
| 2 | Colar uma URL de Google Meet ou Zoom no campo | — |
| 3 | Clicar em **"Salvar"** | Toast de sucesso |
| 4 | Logar como aluno e criar um agendamento neste serviço | — |
| 5 | Ver o email de confirmação ou o card em "Próximos" | O **link da reunião está preenchido** automaticamente |

---

### TC-6.2 — Adicionar disponibilidade semanal

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Na seção de disponibilidade semanal, clicar em **"Adicionar horário"** | Linha nova aparece com: dia da semana, horário início, horário fim |
| 2 | Selecionar **"Segunda-feira"**, início **09:00**, fim **12:00** | — |
| 3 | Salvar | Linha aparece na tabela com toggle **ativo** ligado |
| 4 | Logar como aluno e ir para a página de agendamento | Slots de segunda das 09h às 12h **aparecem** no calendário |

---

### TC-6.3 — Desativar disponibilidade

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Clicar no toggle **ativo/inativo** de um horário | Toggle muda para desligado |
| 2 | Logar como aluno e verificar o calendário | Slots desse período **não aparecem mais** |

---

### TC-6.4 — Adicionar bloqueio de agenda

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Na seção **"Bloqueios"**, clicar em "Adicionar bloqueio" | Formulário com: data/hora início, data/hora fim, motivo |
| 2 | Selecionar um período dentro de um horário com disponibilidade (ex: Segunda 10:00-11:00) | — |
| 3 | Preencher um motivo (opcional) e salvar | Bloqueio aparece na lista |
| 4 | Logar como aluno e verificar segunda-feira | Slots de 10h–11h **não aparecem**; 9h e 11h continuam disponíveis |

---

### TC-6.5 — Remover bloqueio

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Clicar em **deletar** em um bloqueio | Bloqueio removido da lista |
| 2 | Logar como aluno e verificar | Slots do período voltam a aparecer |

---

### TC-6.6 — Validação: horário inválido

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Tentar salvar disponibilidade com horário início **igual ou depois** do fim (ex: 12:00 às 09:00) | Mensagem de **erro de validação**; linha não é criada |

---

## 7. Mentor — Agenda Unificada

**Rota:** `/mentor/agenda`
**Acesso:** Menu lateral → "Agenda"

---

### TC-7.1 — Visualização do calendário mensal

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Logar como mentor e ir para "Agenda" | Calendário mensal com sessões e agendamentos marcados |
| 2 | Observar os dias com eventos | Agendamentos 1:1 mostram badge **"1:1"**; sessões de grupo mostram badge diferente |
| 3 | Clicar no filtro **"Booking"** | Apenas agendamentos 1:1 visíveis |
| 4 | Clicar no filtro **"Sessão"** | Apenas sessões de grupo visíveis |
| 5 | Limpar filtro | Todos os eventos voltam |

---

### TC-7.2 — Botão "Entrar na Reunião" no calendário

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Clicar em um agendamento no calendário | Card de detalhes expande |
| 2 | Horário atual está entre 15min antes e 2h depois do início | Botão **"Acessar Reunião"** visível e clicável |
| 3 | Fora dessa janela de tempo | Botão ausente ou desabilitado |

---

## 8. Admin — Agendamentos

**Rota:** `/admin/agendamentos`
**Acesso:** Menu lateral Admin → "Agendamentos"

---

### TC-8.1 — Listagem e filtros

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Logar como admin e ir para `/admin/agendamentos` | Tabela com **todos** os agendamentos (todos os mentores e alunos) |
| 2 | Usar filtro **"Status: Confirmado"** | Apenas agendamentos confirmados visíveis |
| 3 | Usar filtro **"Mentor"** | Apenas agendamentos do mentor selecionado |
| 4 | Clicar em **"Limpar filtros"** | Todos os agendamentos voltam |

---

### TC-8.2 — Concluir sessão (pelo Admin)

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Clicar no menu **⋯** de um agendamento confirmado → **"Marcar como Concluída"** | Dialog com campo de notas do mentor |
| 2 | Preencher as notas e confirmar | Status muda para **"Concluído"**; toast de sucesso |

---

### TC-8.3 — Cancelar agendamento (pelo Admin)

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Menu **⋯** → **"Cancelar"** | Dialog com campo de motivo |
| 2 | Preencher motivo e confirmar | Status muda para **"Cancelado"** (se > 24h) ou **"No-show"** (se < 24h) |
| 3 | Verificar o email do aluno | Email de cancelamento ou no-show enviado |

---

### TC-8.4 — Marcar No-show (pelo Admin)

**Diferença do cancelamento:** Admin pode forçar no-show independente da janela de tempo.

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Menu **⋯** → **"Marcar No-show"** | Dialog com campo de motivo |
| 2 | Confirmar | Status muda para **"Não compareceu"**, mesmo que a sessão seja distante no futuro |

---

## 9. Admin — Disponibilidade dos Mentores

**Rota:** `/admin/agendamentos` → aba **Disponibilidade**

---

### TC-9.1 — Gerenciar serviços do mentor

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Selecionar um mentor no dropdown | Cards com os serviços ativos do mentor aparecem |
| 2 | Clicar em **"Adicionar Serviço"** | Dialog: mentor (pré-selecionado), serviço, duração, buffer, meeting link |
| 3 | Preencher e salvar | Card do novo serviço aparece na lista |
| 4 | Clicar em **"Editar"** em um serviço | Dialog abre com valores atuais; salvar atualiza |
| 5 | Clicar em **"Remover"** | Confirmar a exclusão; card desaparece |

---

### TC-9.2 — Disponibilidade semanal pelo Admin

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Com mentor selecionado, ver a tabela de disponibilidade | Horários semanais do mentor listados |
| 2 | Adicionar **"Terça, 14:00-18:00"** | Linha adicionada à tabela |
| 3 | Toggle ativo/inativo em uma linha | Estado alterna imediatamente |
| 4 | Logar como aluno e abrir o calendário de agendamento | Slots de terça 14h-18h aparecem (ou desaparecem conforme o toggle) |

---

### TC-9.3 — Bloqueios pelo Admin

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Com mentor selecionado, ir para seção de bloqueios | Lista de bloqueios ativos |
| 2 | Clicar em **"Adicionar bloqueio"** → preencher período e motivo | Bloqueio aparece na lista |
| 3 | Clicar em deletar | Bloqueio removido |
| 4 | Verificar como aluno | Slots do período refletem a mudança |

---

## 10. Admin — Políticas de Agendamento

**Rota:** `/admin/agendamentos` → aba **Políticas**

---

### TC-10.1 — Editar limite de agendamentos simultâneos

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Na aba Políticas, ver o formulário com os valores atuais | 7 campos preenchidos |
| 2 | Mudar **"Limite simultâneo"** de `3` para `1` | — |
| 3 | Clicar em **"Salvar"** | Toast de sucesso |
| 4 | Logar como aluno que já tem 1 agendamento ativo | Ao tentar criar outro, aparece a mensagem de limite atingido |
| 5 | ⚠️ Reverter para `3` após o teste | — |

---

### TC-10.2 — Alterar janela de cancelamento

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Mudar **"Janela de cancelamento"** de `24h` para `12h` | — |
| 2 | Salvar | Toast de sucesso |
| 3 | Como aluno, tentar cancelar agendamento com 18h de antecedência | Cancela **normalmente** (sem virar no-show, pois > 12h) |
| 4 | ⚠️ Reverter para `24h` após o teste | — |

---

### TC-10.3 — Alterar aviso mínimo (min_notice)

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Mudar **"Aviso mínimo"** de `48h` para `24h` | — |
| 2 | Salvar | Toast de sucesso |
| 3 | Como aluno, verificar o calendário de agendamento | Slots com 30h de antecedência agora **aparecem** (antes estavam ocultos) |
| 4 | ⚠️ Reverter para `48h` após o teste | — |

---

## 11. Emails de Agendamento

> Para testar emails sem precisar criar agendamentos reais, acesse `/admin/email-templates`, selecione o template e clique em **"Enviar Teste"** — chegará com prefixo `[TESTE]` no assunto.

---

### TC-11.1 — Email de confirmação

| Momento | Quando chega |
|---------|-------------|
| **Trigger** | Imediatamente após o aluno confirmar o agendamento |
| **Destinatário** | Email do aluno |
| **Deve conter** | Data e horário da sessão, nome do mentor, link da reunião (se configurado) |

---

### TC-11.2 — Email de reagendamento

| Momento | Quando chega |
|---------|-------------|
| **Trigger** | Imediatamente após confirmar o reagendamento |
| **Deve conter** | Data antiga **riscada e em vermelho**, nova data em destaque |

---

### TC-11.3 — Email de cancelamento

| Momento | Quando chega |
|---------|-------------|
| **Trigger** | Imediatamente após confirmar o cancelamento |
| **Template** | Email de "Cancelado" se > 24h; email de "No-show" se < 24h |
| **Deve conter** | Motivo do cancelamento (se informado) |

---

### TC-11.4 — Lembrete 24h antes

| Momento | Quando chega |
|---------|-------------|
| **Trigger** | Automático — sistema verifica a cada 15 minutos e envia se a sessão está em ~24h |
| **Deve conter** | Botão "Entrar na Reunião" (se link configurado) ou aviso "link disponível em breve" |

---

### TC-11.5 — Lembrete 1h antes

| Momento | Quando chega |
|---------|-------------|
| **Trigger** | Automático — sistema verifica a cada 15 minutos e envia se a sessão está em ~1h |
| **Deve conter** | Link de reunião sempre presente (1h antes o link já deve estar configurado) |

---

## 12. Timezone

### TC-12.1 — Exibição em timezone do aluno

**Pré-condição:** Mentor configurou disponibilidade em horário de Brasília (UTC-3). Aluno tem timezone diferente configurada no perfil.

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Aluno com timezone `America/New_York` (UTC-5) acessa o calendário de agendamento | Horários exibidos no **timezone do browser/perfil do aluno** |
| 2 | Aluno agenda uma sessão | — |
| 3 | Email de confirmação recebido | Horários formatados no **timezone do aluno** |

---

## 13. Casos Limite (Edge Cases)

---

### TC-13.1 — Clique duplo no botão de confirmar

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Clicar em "Confirmar Agendamento" **duas vezes rapidamente** | Apenas **1 agendamento** criado; o botão fica desabilitado (com spinner) após o primeiro clique |

---

### TC-13.2 — Slot fica indisponível enquanto aguarda confirmação

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Aluno A seleciona um slot e fica na tela de confirmação por alguns segundos | — |
| 2 | Aluno B agenda o mesmo slot nesse intervalo | — |
| 3 | Aluno A confirma | Mensagem de erro amigável: **"Este horário não está mais disponível"**; agendamento **não** é duplicado |

---

### TC-13.3 — Agendamento passado sem conclusão

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Agendamento confirmado cuja data já passou | Aparece na tab **"Anteriores"** do aluno (sem opções de reagendar/cancelar) |
| 2 | Mentor vê o mesmo agendamento | Botão **"Concluir"** ainda disponível para registrar a conclusão |

---

### TC-13.4 — Mentor removido do sistema

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Admin remove o mentor do sistema | — |
| 2 | Aluno vai ver agendamentos em "Anteriores" | Card exibe a sessão **sem crash**; nome do mentor aparece como placeholder |

---

## 14. Permissões e Navegação por Role

---

### TC-14.1 — Aluno tenta acessar rotas de Mentor

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Logar como aluno | — |
| 2 | Acessar `/mentor/agendamentos` | **Redirecionado** (sem acesso) |
| 3 | Acessar `/mentor/disponibilidade` | **Redirecionado** (sem acesso) |

---

### TC-14.2 — Mentor tenta acessar rotas de Admin

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Logar como mentor | — |
| 2 | Acessar `/admin/agendamentos` | **Redirecionado** (sem acesso) |

---

### TC-14.3 — Admin acessa todas as rotas

| # | Ação na Interface | O que deve acontecer |
|---|---|---|
| 1 | Logar como admin | — |
| 2 | Acessar `/admin/agendamentos` | ✅ Acesso permitido |
| 3 | Acessar `/mentor/agendamentos` | ✅ Acesso permitido |
| 4 | Acessar `/dashboard/agendamentos` | ✅ Acesso permitido |

---

### TC-14.4 — Links do menu lateral por role

| Role | Link "Agendamentos" no menu |
|------|--------------------------|
| **Aluno** | Vai para `/dashboard/agendamentos` |
| **Mentor** | Vai para `/mentor/agendamentos` (+ link separado "Disponibilidade") |
| **Admin** | Vai para `/admin/agendamentos` |

---

## 15. Lembretes Automáticos (Cron Jobs)

> Os lembretes são enviados automaticamente pelo sistema. Para testar manualmente, use os comandos na [Seção 17](#17-referência-técnica).

### TC-15.1 — Verificar se os cron jobs estão ativos

1. Logar como Admin → `/admin/saude-sistema` (ou equivalente)
2. Verificar se os jobs `send-booking-reminder-24h` e `send-booking-reminder-1h` estão **ativos**

### TC-15.2 — Testar lembrete manualmente

1. Criar um agendamento para daqui a 24h (ou 1h)
2. Aguardar a próxima execução do cron (a cada 15 min) **ou** disparar manualmente via curl (ver Seção 17)
3. Verificar o email: lembrete chegou com data, horário e link da reunião

---

## 16. Checklist de Regressão Rápida (Smoke Test)

Execute estes itens após cada deploy para validar o sistema:

- [ ] Aluno acessa a página de agendamento de um serviço e **vê slots disponíveis**
- [ ] Aluno cria agendamento → card aparece em "Próximos" com status **"Confirmado"**
- [ ] **Email de confirmação** chega com link da reunião
- [ ] Aluno reagenda → novo horário aparece no card; **email de reagendamento** chega com data antiga riscada
- [ ] Aluno cancela com > 24h → status **"Cancelado"**; email de cancelamento chega
- [ ] Aluno cancela com < 24h → status **"Não compareceu"**; email de no-show chega
- [ ] Mentor vê os agendamentos em `/mentor/agendamentos`
- [ ] Mentor conclui sessão → status **"Concluído"**
- [ ] Mentor configura disponibilidade → aluno vê os slots no calendário
- [ ] Admin vê **todos** os agendamentos em `/admin/agendamentos`
- [ ] Admin cancela agendamento e marca no-show
- [ ] Admin edita política → mudança reflete na interface do aluno

---

## 17. Referência Técnica

> Esta seção é para desenvolvedores e QA avançado. Não é necessária para executar os testes de UI acima.

### Queries SQL úteis

```sql
-- Verificar agendamentos de um aluno
SELECT b.id, b.status, b.scheduled_start, b.reschedule_count,
       hs.name as servico, p.full_name as mentor
FROM bookings b
LEFT JOIN hub_services hs ON hs.id = b.service_id
LEFT JOIN profiles p ON p.id = b.mentor_id
WHERE b.student_id = '<student_id>'
ORDER BY b.scheduled_start DESC;

-- Verificar histórico de um agendamento
SELECT action, old_datetime, new_datetime, created_at
FROM booking_history
WHERE booking_id = '<booking_id>'
ORDER BY created_at;

-- Verificar slots disponíveis (RPC)
SELECT * FROM get_available_slots(
  '<service_id>', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days'
);

-- Stats do aluno (RPC)
SELECT * FROM get_student_booking_stats('<student_id>');

-- Verificar cron jobs de lembrete
SELECT jobname, schedule, active
FROM cron.job
WHERE jobname LIKE 'send-booking-reminder%';

-- Verificar última execução dos cron jobs
SELECT job_id, status, start_time, return_message
FROM cron.job_run_details
ORDER BY start_time DESC LIMIT 5;
```

### Testar lembrete manualmente (curl)

```bash
curl -X POST https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/send-booking-reminder \
  -H "Content-Type: application/json" \
  -H "x-internal-secret: <secret>" \
  -d '{"hours_before": 24}'
```

### Verificar email via admin

1. `/admin/email-templates`
2. Selecionar o template (ex: `booking_confirmation`)
3. Clicar em **"Enviar Teste"** — chega com prefixo `[TESTE]` no assunto

### Verificar logs de envio

- **Supabase Dashboard** → Edge Functions → Logs → filtrar por `send-booking-*`
- **Resend** → `app.resend.com` → Logs de envio

### Tabelas envolvidas

| Tabela | O que armazena |
|--------|---------------|
| `bookings` | Cada agendamento |
| `booking_history` | Histórico de ações (criação, reagendamento, cancelamento) |
| `booking_policies` | Regras de limite, janelas de tempo |
| `mentor_services` | Vínculo mentor-serviço (com meeting link e duração) |
| `mentor_availability` | Horários semanais recorrentes do mentor |
| `mentor_blocked_times` | Bloqueios específicos na agenda do mentor |
| `user_hub_services` | Quais serviços o aluno tem acesso |

### Referência de arquivos

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/booking/BookingFlow.tsx` | Fluxo de agendamento (3 steps) |
| `src/pages/booking/StudentBookings.tsx` | Meus agendamentos (aluno) |
| `src/pages/mentor/MentorAgendamentos.tsx` | Agendamentos do mentor |
| `src/pages/mentor/MentorDisponibilidade.tsx` | Configurar disponibilidade |
| `src/pages/mentor/MentorAgenda.tsx` | Calendário unificado |
| `src/pages/admin/AdminAgendamentos.tsx` | Gestão admin (3 tabs) |
| `supabase/functions/send-booking-confirmation/` | Email de confirmação |
| `supabase/functions/send-booking-reminder/` | Lembretes 24h/1h |
| `supabase/functions/send-booking-cancelled/` | Email cancelamento/no-show |
| `supabase/functions/send-booking-rescheduled/` | Email reagendamento |
