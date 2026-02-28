# EUA Na Pratica Hub -- Guia do Mentor

> Como criar conteudo, gerenciar sessoes e acompanhar alunos

---

## Sumario

1. [Visao Geral](#visao-geral)
2. [Seu Painel](#seu-painel)
3. [Criando um Espaco](#criando-um-espaco)
4. [Gerenciando Sessoes](#gerenciando-sessoes)
5. [Cursos](#cursos)
6. [Lives](#lives)
7. [Tarefas e Submissoes](#tarefas-e-submissoes)
8. [Biblioteca](#biblioteca)
9. [Comunidade](#comunidade)
10. [Dicas e Boas Praticas](#dicas-e-boas-praticas)
11. [Referencias](#referencias)

---

## Visao Geral

Como mentor na plataforma EUA Na Pratica, voce e responsavel por guiar alunos brasileiros na sua jornada de transicao de carreira para os Estados Unidos. Suas atividades incluem:

- **Criar e gerenciar Espacos** (mentorias, imersoes, programas)
- **Agendar e conduzir sessoes** em grupo e individuais (bookings 1:1)
- **Produzir conteudo educacional** (cursos com modulos e aulas em video)
- **Organizar lives** (masterclasses, hotseats, workshops)
- **Atribuir e revisar tarefas** dos alunos
- **Compartilhar materiais** na biblioteca
- **Participar da comunidade** e moderar discussoes dentro dos seus Espacos

O painel do mentor foi projetado para ser autonomo: voce cria, publica e gerencia tudo diretamente, sem depender de um administrador para operacoes do dia a dia.

---

## Seu Painel

Ao fazer login como mentor, o menu lateral exibe as seguintes secoes:

### GESTAO

| Item | URL | Descricao |
|------|-----|-----------|
| **Dashboard** | `/mentor/dashboard` | Visao geral com metricas e atividade recente |
| **Meus Espacos** | `/mentor/espacos` | Lista de todas as suas mentorias, imersoes e programas |
| **Agendamentos** | `/mentor/agendamentos` | Lista detalhada de bookings 1:1 |
| **Disponibilidade** | `/mentor/disponibilidade` | Configurar horarios, link de reuniao e bloqueios |
| **Lives** | `/mentor/lives` | Criar e gerenciar eventos ao vivo |
| **Agenda** | `/mentor/agenda` | Calendario mensal unificado (sessoes + bookings) |
| **Tarefas** | `/mentor/tarefas` | Gestao de tarefas e revisao de entregas |

### CONTEUDO

| Item | URL | Descricao |
|------|-----|-----------|
| **Biblioteca** | `/biblioteca` | Acessar materiais compartilhados |
| **Upload Materiais** | `/admin/biblioteca/upload` | Enviar PDFs, documentos e arquivos para a biblioteca |

### MINHA CONTA

| Item | URL | Descricao |
|------|-----|-----------|
| **Perfil** | `/perfil` | Editar dados pessoais, foto e senha |
| **Suporte** | `/dashboard/suporte` | Canal de ajuda |

> **Nota:** A visibilidade dos itens do menu e controlada pelo administrador. Se algum item nao aparece para voce, entre em contato com o admin.

---

## Criando um Espaco

Espacos sao o container principal para organizar sua mentoria. Um Espaco pode representar uma turma, um programa de imersao, um grupo de coaching, ou qualquer formato de acompanhamento.

### Passo a Passo

1. Acesse **Meus Espacos** (`/mentor/espacos`)
2. Clique em **"Criar Espaco"** (botao no canto superior direito)
3. Voce sera redirecionado para o formulario de criacao (`/mentor/espacos/novo`)

### Campos do Formulario

| Campo | Obrigatorio | Descricao |
|-------|:-----------:|-----------|
| Nome | Sim | Nome do Espaco (ex: "Mentoria Grupo Q1 2026") |
| Descricao | Nao | Descricao que aparece para os alunos |
| Categoria | Sim | Tipo do Espaco (mentoria, imersao, curso, etc.) |
| Status | Sim | `Ativo` (visivel) ou `Rascunho` (oculto) |
| Imagem de Capa | Nao | Thumbnail exibida no card do Espaco |

4. Clique em **"Criar"**
5. O Espaco aparecera na lista em `/mentor/espacos`

### Gerenciando o Espaco

Ao clicar em um Espaco, voce acessa a pagina de detalhes (`/mentor/espacos/:id`) com abas:

| Aba | Conteudo |
|-----|---------|
| **Overview** | Resumo geral, metricas, proximas sessoes, tarefas pendentes |
| **Sessoes** | Timeline de sessoes passadas e futuras |
| **Tarefas** | Lista de tarefas atribuidas ao Espaco |
| **Biblioteca** | Materiais especificos do Espaco |
| **Discussoes** | Forum de discussao entre alunos e mentor |
| **Alunos** | Lista de alunos inscritos com acoes (convidar, remover) |

### Convidar Alunos

Na aba **Alunos**, clique em **"Convidar Aluno"** para enviar um convite por email. O aluno recebe um email com link para aceitar o convite e ser matriculado automaticamente.

### Arquivar / Reativar

No menu de opcoes (tres pontos), voce pode **Arquivar** um Espaco encerrado ou **Reativar** um Espaco arquivado. Espacos arquivados nao aparecem na lista principal, mas os dados sao preservados.

---

## Gerenciando Sessoes

### Tipos de Sessao

| Tipo | Descricao | Quem participa |
|------|-----------|---------------|
| **Sessao em Espaco** | Vinculada a um Espaco especifico | Alunos inscritos naquele Espaco |
| **Evento Aberto** | Nao vinculada a nenhum Espaco (ou opcionalmente vinculada) | Qualquer aluno logado (se toggle ativado) |
| **Booking 1:1** | Sessao individual agendada pelo aluno | Um aluno + voce |

### Criar Sessao em Grupo

1. Acesse a **Agenda** (`/mentor/agenda`)
2. Clique em **"Novo Evento"**
3. Escolha **Sessao em Espaco**
4. Preencha: Titulo, Descricao, Espaco, Data, Horario, Duracao, Link da Reuniao
5. Ative **"Notificar alunos"** se quiser que recebam email
6. Clique em **"Criar"**

A sessao aparecera automaticamente na agenda dos alunos inscritos (pill indigo/roxo no calendario).

### Criar Evento Aberto

1. Na **Agenda**, clique em **"Novo Evento"**
2. Escolha **Evento Aberto**
3. Campos adicionais disponiveis:
   - **Visivel para todos os alunos** -- toggle para aparecer na agenda de qualquer aluno
   - **Capacidade** -- limite de participantes (0 = ilimitado)
   - **Preco (R$)** -- 0 = gratuito
4. Use para: hotseats, masterclasses abertas, lives especiais

### Configurar Disponibilidade para 1:1

Acesse **Disponibilidade** (`/mentor/disponibilidade`):

#### Link da Reuniao

1. Localize o servico que voce atende
2. Cole o link permanente do Google Meet, Zoom, etc.
3. Clique em salvar

> **Dica:** Crie uma sala permanente no Google Meet para nao precisar atualizar toda semana.

#### Horarios Semanais

1. Clique em **"Adicionar Horario"**
2. Selecione o dia da semana
3. Defina inicio e fim (ex: 09:00 -- 17:00)
4. Salve

Os slots sao divididos automaticamente pela duracao configurada do servico. Exemplo: duracao 60min + janela 09:00-17:00 = slots as 09:00, 10:00, 11:00, etc.

Use o toggle ao lado de cada horario para ativar/desativar rapidamente.

#### Bloqueios de Agenda

Para ferias, feriados ou compromissos pontuais:

1. Clique em **"Adicionar Bloqueio"**
2. Defina data/hora de inicio e fim
3. Adicione motivo (opcional -- visivel so internamente)
4. Salve

> **Importante:** Sessoes ja confirmadas **nao** sao canceladas automaticamente ao criar um bloqueio. Contate os alunos se houver conflito.

### Marcar Presenca / Concluir Sessao

Em **Meus Agendamentos** (`/mentor/agendamentos`), aba "Proximos":

1. **Entrar na Reuniao**: Botao com icone de camera -- abre a sala em nova aba
2. **Marcar como Concluida**: Botao "Concluir" (check verde) apos a sessao
   - Adicione notas da sessao (opcional, recomendado)
   - Confirme

> Marque logo apos cada atendimento para manter o historico organizado.

### Cancelar / Reagendar

- **Cancelar booking 1:1**: O cancelamento pelo mentor precisa ser feito pelo admin. Informe o ID ou data/aluno da sessao.
- **O aluno pode** cancelar ou reagendar por conta propria. A mudanca aparece automaticamente na sua Agenda.

### Fluxo Completo de um Booking 1:1

```
Aluno agenda
     |
Sessao CONFIRMADA --> Aparece na Agenda (pill azul) e em "Proximos"
     |
     <-- 24h antes -- Email lembrete enviado ao aluno
     <-- 1h antes --- Email lembrete enviado ao aluno
     |
Hora da sessao --> Botao "Entrar" disponivel
     |
Sessao realizada --> Marcar como "Concluida"
     |
Status: CONCLUIDA --> Aparece em "Anteriores"
```

---

## Cursos

Cursos sao criados dentro de Espacos que possuem conteudo gravado (tipo `recorded_course` ou similar).

### Estrutura de um Curso

```
Espaco (Curso)
  |-- Modulo 1
  |     |-- Aula 1.1 (video + descricao + materiais)
  |     |-- Aula 1.2
  |     |-- Quiz 1 (opcional)
  |-- Modulo 2
  |     |-- Aula 2.1
  |     |-- ...
```

### Criar Modulo e Adicionar Aulas

1. Acesse o **Course Builder** do seu curso (via admin ou link direto)
2. Na aba **Conteudo**, clique em **"Novo Modulo"**
3. De um titulo e descricao ao modulo
4. Dentro do modulo, clique em **"Nova Aula"**
5. Preencha:
   - Titulo da aula
   - Descricao / notas da aula
   - Video (upload via Bunny CDN)
   - Duracao
   - Materiais complementares (PDFs, links)

### Upload de Video (Bunny CDN)

Os videos sao hospedados no Bunny CDN para streaming otimizado. O upload e feito diretamente pelo formulario de aula no Course Builder:

1. Clique em **"Upload Video"**
2. Selecione o arquivo de video
3. Aguarde o processamento (encoding e distribuicao CDN)
4. O player de video aparecera automaticamente na aula

### Quizzes

Quizzes podem ser adicionados a aulas individuais para verificar a compreensao do aluno:

1. Na aula, acesse a secao de Quiz
2. Adicione perguntas de multipla escolha
3. Defina a resposta correta
4. O aluno ve o quiz apos assistir o video

### Importar Estrutura (Template Excel)

Para cursos com muitas aulas, voce pode importar a estrutura completa via template:

1. No Course Builder, clique em **"Importar Curriculo"** (dialogo `CurriculumImportDialog`)
2. Baixe o template Excel
3. Preencha com modulos, aulas, descricoes e ordem
4. Faca o upload do arquivo preenchido
5. O sistema cria toda a estrutura automaticamente

### Analytics do Curso

Na aba **Analytics** do Course Builder, voce acompanha:

- Total de alunos matriculados
- Progresso medio da turma
- Aulas mais assistidas
- Taxa de conclusao por modulo

---

## Lives

Lives sao eventos ao vivo independentes de Espacos. Acesse via **Lives** (`/mentor/lives`).

### Criar uma Live

1. Clique em **"Criar Live"**
2. Preencha o formulario:

| Campo | Obrigatorio | Descricao |
|-------|:-----------:|-----------|
| Titulo | Sim | Nome da live |
| Slug | Sim | URL amigavel (gerado automaticamente, editavel) |
| Descricao curta | Nao | Aparece no card (max ~150 caracteres) |
| Descricao longa | Nao | Aparece na landing page |
| Data e Hora | Sim | Quando a live acontecera |
| Duracao (min) | Sim | Duracao estimada (default: 60) |
| Link da Reuniao | Nao | Link do Zoom/Meet (visivel apenas para inscritos) |
| Tipo de Acesso | Sim | Gratuita, Paga, Assinantes, Pro, VIP |
| Preco (R$) | Condicional | Apenas para lives pagas |
| ID Produto Ticto | Condicional | Apenas para lives pagas |
| URL Checkout Ticto | Condicional | Apenas para lives pagas |
| Limite de Vagas | Nao | Maximo de inscritos (vazio = ilimitado) |
| Thumbnail | Nao | Imagem de capa |
| Status | Sim | `Rascunho` ou `Agendada` |

3. Clique em **"Criar Live"**

### Tipos de Acesso

| Tipo | Quem Pode Participar | Quando Usar |
|------|---------------------|-------------|
| **Gratuita** | Qualquer usuario logado | Captacao de leads, divulgacao |
| **Paga** | Quem comprar pelo Ticto | Workshops premium |
| **Assinantes** | Qualquer assinante ativo | Beneficio para assinantes |
| **Pro** | Assinantes Pro ou VIP | Conteudo exclusivo |
| **VIP** | Apenas assinantes VIP | Maximo de exclusividade |

### No Dia da Live

1. Acesse `/mentor/lives`
2. Encontre sua live com status **"Agendada"**
3. Clique em **"Go Live"** -- status muda para **"Ao Vivo"**
4. Card da live pulsa com badge vermelho "Ao Vivo" em toda a plataforma
5. Inscritos veem botao **"Entrar Agora"** com link direto

### Apos Encerrar

1. Clique em **"Encerrar"**
2. Status muda para **"Concluida"**
3. (Opcional) Edite a live e adicione a **URL de gravacao** para replay

### Controle de Presenca

Na pagina de detalhes da live (`/mentor/lives/:id`):

- Veja a lista completa de inscritos
- Marque o checkbox de presenca para cada participante
- Acompanhe a taxa de presenca

### Landing Page

Cada live tem uma landing page publica em `/live/:slug` com:

- Imagem de capa, titulo, badges
- Descricao longa
- Seu nome e foto como mentor
- CTA dinamico (inscrever, comprar, entrar, etc.)

Use o botao **"Copiar URL"** para compartilhar nas redes sociais e WhatsApp.

### Lives Pagas -- Integracao com Ticto

Para lives pagas, voce precisa:

1. Criar o produto no painel Ticto
2. Copiar o `product_id` e a `checkout_url`
3. Preencher esses campos no formulario de criacao da live
4. O pagamento e processado automaticamente via webhook

---

## Tarefas e Submissoes

### Criar Tarefa

1. Acesse **Tarefas** (`/mentor/tarefas`)
2. Clique em **"Nova Tarefa"** (redirecionado para `/mentor/tarefas/nova`)
3. Preencha:
   - Titulo e descricao da tarefa
   - Espaco vinculado (para qual turma e a tarefa)
   - Data de entrega (deadline)
   - Tipo de entrega esperada (texto, arquivo, link)
   - Status: Rascunho ou Publicada

4. Ao publicar, a tarefa aparece automaticamente para todos os alunos do Espaco na aba **Tarefas**

### Revisar Entregas

1. Na lista de tarefas, clique em **"Ver Submissoes"** (redirecionado para `/mentor/tarefas/:id/submissoes`)
2. Voce vera:
   - **Cards de resumo**: total de submissoes, pendentes de revisao, aprovadas, rejeitadas
   - **Lista de entregas**: cada submissao com nome do aluno, data, status
3. Clique em uma submissao para abrir o painel de revisao (`SubmissionReview`)
4. Avalie a entrega:
   - **Aprovar**: marcar como concluida
   - **Solicitar revisao**: pedir ajustes (o aluno pode reenviar)
   - **Feedback**: adicionar comentarios e notas
5. O aluno recebe notificacao sobre a revisao

---

## Biblioteca

### Upload de Materiais

Acesse **Upload Materiais** (`/admin/biblioteca/upload`) para enviar:

- PDFs, documentos, planilhas
- Templates e modelos
- Qualquer arquivo que seus alunos possam precisar

### Organizacao

Os materiais podem ser organizados por:

- **Espaco**: materiais exclusivos de uma turma/programa
- **Pastas**: estrutura hierarquica dentro de cada Espaco
- **Geral**: materiais disponiveis na biblioteca compartilhada (`/biblioteca`)

Na pagina de detalhes do Espaco, a aba **Biblioteca** mostra apenas os materiais vinculados aquele Espaco, facilitando o acesso dos alunos.

---

## Comunidade

### Como Participar

A comunidade esta disponivel em `/comunidade` para usuarios com acesso (depende do plano do aluno). Como mentor, voce tem acesso automatico.

A comunidade funciona como um feed social com:

- **Categorias**: temas organizados (carreira, duvidas, conquistas, etc.)
- **Postagens**: texto, com opcao de filtrar por Top, Recentes ou Sem Resposta
- **Curtidas e comentarios**

### Moderar Conteudo

Dentro dos seus Espacos, a aba **Discussoes** permite moderar as conversas dos alunos:

- Acompanhar topicos criados pelos alunos
- Responder duvidas
- Manter o foco e a qualidade das discussoes

> A moderacao global da comunidade e feita pelo admin. Se voce identificar conteudo inadequado, reporte ao admin.

---

## Dicas e Boas Praticas

### Organizacao

- **Nomeie seus Espacos de forma clara** (ex: "Mentoria Grupo -- Devs Backend Q1/2026")
- **Mantenha a agenda atualizada** -- bloqueie periodos de ferias e feriados com antecedencia
- **Use o campo de notas** ao concluir sessoes para manter historico do que foi discutido

### Engajamento dos Alunos

- **Crie tarefas praticas** com deadlines claros
- **Responda as submissoes rapidamente** -- alunos engajam mais quando recebem feedback rapido
- **Participe das discussoes** do Espaco -- sua presenca motiva os alunos
- **Divulgue suas lives** compartilhando o link da landing page

### Sessoes 1:1

- **Crie uma sala permanente** no Google Meet para nao precisar atualizar o link
- **Prepare-se antes**: revise as notas que o aluno enviou ao agendar
- **Marque como concluida** logo apos a sessao para manter o historico limpo
- **Nao e possivel atender** dois alunos no mesmo horario -- o sistema bloqueia conflitos

### Lives

- **Use titulo atrativo** e descricao detalhada com topicos
- **Adicione thumbnail profissional**
- **Clique "Go Live"** antes de iniciar -- sem isso, inscritos nao veem o botao "Entrar"
- **Adicione gravacao** apos encerrar para que inscritos possam assistir depois

### Cursos

- **Divida em modulos curtos** (5-15 min por aula) -- melhor retencao
- **Adicione quizzes** apos modulos importantes
- **Use o import via Excel** para estruturar cursos grandes de uma vez
- **Acompanhe analytics** para identificar aulas com alta evasao

---

## Referencias

### Paginas do Mentor

| Pagina | URL | Arquivo |
|--------|-----|---------|
| Dashboard | `/mentor/dashboard` | `src/pages/mentor/MentorDashboard.tsx` |
| Meus Espacos | `/mentor/espacos` | `src/pages/mentor/MentorEspacos.tsx` |
| Criar Espaco | `/mentor/espacos/novo` | `src/pages/mentor/MentorCreateEspaco.tsx` |
| Detalhe Espaco | `/mentor/espacos/:id` | `src/pages/mentor/MentorEspacoDetail.tsx` |
| Agendamentos | `/mentor/agendamentos` | `src/pages/mentor/MentorAgendamentos.tsx` |
| Disponibilidade | `/mentor/disponibilidade` | `src/pages/mentor/MentorDisponibilidade.tsx` |
| Agenda | `/mentor/agenda` | `src/pages/mentor/MentorAgenda.tsx` |
| Lives | `/mentor/lives` | `src/pages/mentor/MentorLives.tsx` |
| Detalhe Live | `/mentor/lives/:id` | `src/pages/mentor/MentorLiveDetail.tsx` |
| Criar Live | `/mentor/lives/nova` | `src/pages/mentor/MentorCreateLive.tsx` |
| Tarefas | `/mentor/tarefas` | `src/pages/mentor/MentorAssignments.tsx` |
| Criar Tarefa | `/mentor/tarefas/nova` | `src/pages/mentor/CreateAssignment.tsx` |
| Editar Tarefa | `/mentor/tarefas/:id/editar` | `src/pages/mentor/EditAssignment.tsx` |
| Submissoes | `/mentor/tarefas/:id/submissoes` | `src/pages/mentor/ReviewSubmissions.tsx` |
| Criar Sessao | `/mentor/sessao/nova` | `src/pages/mentor/CreateSession.tsx` |
| Editar Sessao | `/mentor/sessao/:id/editar` | `src/pages/mentor/EditSession.tsx` |
| Presenca | `/mentor/sessao/:id/presenca` | `src/pages/mentor/SessionAttendance.tsx` |
| Perfil | `/perfil` | `src/pages/account/ProfilePage.tsx` |

### Documentacao Relacionada

| Documento | Caminho |
|-----------|---------|
| Booking System -- Mentor | `docs/15 Booking System/MENTOR.md` |
| Lives System -- Mentor | `docs/21 Lives System/MENTOR.md` |
| Content Studio | `docs/20 Content Studio/ADMIN.md` |
| Meu Hub -- Usuario | `docs/18 Meu Hub/USUARIO.md` |
| Sistema de Assinaturas | `docs/06 Subscription and Ticto/SUBSCRIPTION_SYSTEM.md` |

---

**Ultima atualizacao:** 2026-02-26
**Versao:** 1.0
