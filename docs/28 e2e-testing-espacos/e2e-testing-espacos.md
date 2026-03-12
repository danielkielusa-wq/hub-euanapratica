# E2E Testing - Sistema de Espacos (Mentor & Aluno)

> Documento de testes ponta a ponta organizado por cenarios modulares.
> Cada cenario pode ser gravado como um video independente para compor o manual do mentor e do aluno.

---

## Pre-requisitos

| Item | Detalhes |
|------|----------|
| Usuario mentor | Conta com role `mentor` (ou `admin`) |
| Usuario aluno | Conta com role `student` (pode ser a mesma conta admin em outra aba) |
| Espaco ativo | Criar durante o Cenario M1 |
| Sessao agendada | Criar durante o Cenario M3 |
| Tarefa publicada | Criar durante o Cenario M4 |
| API de IA configurada | `app_configs` key `ai_mentor_api_config_key` apontando para provider valido (OpenAI/Anthropic) |

**Dica para gravacao:** Use dois navegadores (ou perfis) lado a lado — um logado como mentor, outro como aluno — para mostrar o efeito das acoes em tempo real.

---

## Indice de Cenarios

### Manual do Mentor
| # | Cenario | Duracao estimada |
|---|---------|-----------------|
| M1 | [Criar e configurar um espaco](#m1-criar-e-configurar-um-espaco) | 3-5 min |
| M2 | [Gerenciar lista de espacos](#m2-gerenciar-lista-de-espacos) | 2-3 min |
| M3 | [Criar e gerenciar sessoes](#m3-criar-e-gerenciar-sessoes) | 3-5 min |
| M4 | [Criar e publicar tarefas](#m4-criar-e-publicar-tarefas) | 3-5 min |
| M5 | [Convidar e gerenciar alunos](#m5-convidar-e-gerenciar-alunos) | 3-5 min |
| M6 | [Corrigir entregas (Kanban)](#m6-corrigir-entregas-kanban-do-mentor) | 3-5 min |
| M7 | [Biblioteca de materiais](#m7-biblioteca-de-materiais) | 2-3 min |
| M8 | [IA - Briefing pre-sessao](#m8-ia---briefing-pre-sessao) | 2-3 min |
| M9 | [IA - Resumo pos-sessao](#m9-ia---resumo-pos-sessao) | 2-3 min |
| M10 | [IA - Sugestao de engajamento](#m10-ia---sugestao-de-engajamento-do-aluno) | 2-3 min |
| M11 | [Painel de engajamento e churn score](#m11-painel-de-engajamento-e-churn-score) | 3-5 min |
| M12 | [Overview e metricas](#m12-overview-e-metricas) | 2-3 min |
| M13 | [Arquivar e restaurar espaco](#m13-arquivar-e-restaurar-espaco) | 1-2 min |

### Manual do Aluno
| # | Cenario | Duracao estimada |
|---|---------|-----------------|
| A1 | [Visualizar espacos matriculados](#a1-visualizar-espacos-matriculados) | 1-2 min |
| A2 | [Navegar pelo espaco](#a2-navegar-pelo-espaco) | 2-3 min |
| A3 | [Ver sessoes e agenda](#a3-ver-sessoes-e-agenda) | 2-3 min |
| A4 | [Realizar e entregar tarefas](#a4-realizar-e-entregar-tarefas) | 3-5 min |
| A5 | [Kanban de tarefas do aluno](#a5-kanban-de-tarefas-do-aluno) | 2-3 min |
| A6 | [Biblioteca e meus arquivos](#a6-biblioteca-e-meus-arquivos) | 2-3 min |
| A7 | [Notificacoes do aluno](#a7-notificacoes-do-aluno) | 2-3 min |

### Cenarios Integrados (Mentor + Aluno)
| # | Cenario | Duracao estimada |
|---|---------|-----------------|
| I1 | [Fluxo completo: tarefa ate correcao](#i1-fluxo-completo-tarefa-ate-correcao) | 5-8 min |
| I2 | [Fluxo completo: sessao ate resumo IA](#i2-fluxo-completo-sessao-ate-resumo-ia) | 5-8 min |
| I3 | [Notificacoes cross-role](#i3-notificacoes-cross-role) | 3-5 min |

---

## Cenarios do Mentor

### M1: Criar e configurar um espaco

**Rota:** `/mentor/espacos/novo`

**Objetivo:** Demonstrar a criacao de um novo espaco de mentoria do zero.

**Passos:**

1. Acessar `/mentor/espacos` e clicar em **"Criar Espaco"**
2. Preencher o formulario:
   - Nome: `Turma Teste Q2 2026` (minimo 3 caracteres)
   - Descricao: texto livre
   - Categoria: selecionar `Mentoria em Grupo`
   - Visibilidade: `Privado`
   - Maximo de alunos: `20`
   - Data de inicio e fim (opcionais)
3. Clicar em **"Criar"**
4. Verificar redirecionamento para a pagina de detalhe do espaco

**Validacoes:**
- [ ] Formulario nao permite salvar sem nome (< 3 chars)
- [ ] Formulario nao permite salvar sem categoria
- [ ] Espaco aparece na lista com status "Ativo"
- [ ] Metricas iniciais mostram 0 sessoes, 0 tarefas, 0 materiais, 0 alunos

**Editar espaco (bonus):**
5. Clicar em **"Editar"** no header ou aba Settings
6. Alterar nome e descricao
7. Salvar e verificar atualizacao

---

### M2: Gerenciar lista de espacos

**Rota:** `/mentor/espacos`

**Objetivo:** Demonstrar filtros, busca e navegacao na lista de espacos.

**Passos:**

1. Acessar `/mentor/espacos`
2. Verificar que os espacos aparecem em cards (estilo Netflix)
3. Usar o campo de **busca** para filtrar por nome
4. Expandir painel de filtros:
   - Filtrar por **status**: Em Andamento, Inativo, Concluido, Arquivado
   - Filtrar por **categoria**: Imersao, Mentoria em Grupo, Workshop, Bootcamp, Curso
5. Clicar em um card para abrir o detalhe

**Validacoes:**
- [ ] Busca filtra em tempo real
- [ ] Filtro de status funciona corretamente
- [ ] Filtro de categoria funciona corretamente
- [ ] Cards mostram nome, categoria, contagem de alunos
- [ ] Estado vazio aparece quando nenhum espaco corresponde aos filtros

---

### M3: Criar e gerenciar sessoes

**Rota:** `/mentor/espacos/:id` > aba **Sessoes**

**Objetivo:** Criar sessoes vinculadas ao espaco e gerenciar a timeline.

**Passos:**

1. Abrir o espaco criado em M1
2. Ir para a aba **Sessoes**
3. Clicar em **"Nova Sessao"**
4. Preencher:
   - Titulo: `Sessao 1 - Introducao`
   - Data: amanha
   - Horario: 14:00
   - Duracao: 60 min
   - Link da reuniao (opcional): URL do Zoom/Meet
   - Espaco: ja deve estar pre-selecionado
5. Salvar
6. Verificar que a sessao aparece na timeline
7. Criar uma segunda sessao para daqui a 3 dias

**Validacoes:**
- [ ] Sessao aparece na timeline em ordem cronologica
- [ ] Botao "Copiar link" funciona (se link preenchido)
- [ ] Botao "Entrar" aparece proximo ao horario da sessao
- [ ] Contador de sessoes no header atualiza
- [ ] Sessao com data passada mostra status "Concluida"

---

### M4: Criar e publicar tarefas

**Rota:** `/mentor/tarefas/nova` (vinculada ao espaco)

**Objetivo:** Demonstrar criacao de tarefa como rascunho e publicacao.

**Passos:**

1. Na aba **Tarefas** do espaco, clicar em **"Nova Tarefa"**
2. Preencher:
   - Titulo: `Tarefa 1 - Analise de caso`
   - Descricao e instrucoes
   - Espaco: ja pre-selecionado
   - Data de entrega: daqui a 7 dias
   - Tipo de entrega: `Arquivo e texto`
   - Tamanho maximo: 10 MB
   - Tipos permitidos: PDF, DOCX
   - Permitir entrega atrasada: Sim
3. Clicar em **"Salvar como Rascunho"**
4. Verificar que a tarefa aparece com badge "Rascunho"
5. Editar a tarefa e clicar em **"Publicar"**
6. Verificar mudanca de status para "Publicada"

**Validacoes:**
- [ ] Rascunho nao e visivel para alunos (testar na visao do aluno)
- [ ] Publicacao muda o badge para "Publicada"
- [ ] Notificacao `espaco_new_assignment` e enviada aos alunos matriculados (verificar sino)
- [ ] Tarefa aparece na aba Tarefas do espaco (visao mentor e aluno)
- [ ] Contagem de tarefas atualiza nas metricas

---

### M5: Convidar e gerenciar alunos

**Rota:** `/mentor/espacos/:id` > aba **Alunos**

**Objetivo:** Demonstrar o fluxo de convite e a tabela de alunos.

**Passos:**

1. Ir para a aba **Alunos** do espaco
2. Clicar em **"Convidar Aluno"** (header ou botao na tabela)
3. **Opcao A — Aluno existente:**
   - Digitar email/nome do aluno ja cadastrado no sistema
   - Selecionar da lista de resultados
   - Confirmar matricula
4. **Opcao B — Novo aluno:**
   - Digitar email de alguem nao cadastrado
   - Preencher nome (opcional)
   - Enviar convite por email
5. Verificar que o aluno aparece na tabela com status ativo
6. Testar busca na tabela de alunos
7. Selecionar multiplos alunos com checkboxes
8. Testar **acoes em lote**:
   - "Enviar email" (abre cliente de email com destinatarios)
   - "Exportar CSV" (baixa planilha)

**Validacoes:**
- [ ] Convite de aluno existente cria matricula imediatamente
- [ ] Convite de novo aluno envia email de convite
- [ ] Notificacao `espaco_student_enrolled` e enviada ao mentor
- [ ] Busca filtra alunos por nome/email
- [ ] Selecao em lote funciona (checkboxes)
- [ ] Exportacao CSV contem nome, email, progresso
- [ ] Contagem de alunos atualiza nas metricas

---

### M6: Corrigir entregas (Kanban do mentor)

**Rota:** `/mentor/espacos/:id` > aba **Tarefas** > modo Kanban

**Objetivo:** Demonstrar o kanban de correcoes e o fluxo de review.

**Pre-requisito:** Pelo menos 1 aluno deve ter enviado uma entrega (ver cenario A4).

**Passos:**

1. Na aba **Tarefas**, alternar para **modo Kanban** (icone de grid)
2. Visualizar as 3 colunas:
   - **Aguardando Correcao** (azul) — entregas pendentes
   - **Revisao Necessaria** (amarelo) — devolvidas para ajuste
   - **Aprovadas** (verde) — entregas aprovadas
3. Usar o **filtro por tarefa** (dropdown) para filtrar entregas
4. Usar a **busca** para encontrar por nome do aluno
5. Clicar em um card de entrega para abrir detalhes
6. Avaliar a entrega:
   - Escrever feedback
   - Aprovar ou devolver para revisao
7. Verificar que o card se move para a coluna correta

**Validacoes:**
- [ ] Kanban mostra contagem por coluna
- [ ] Filtro por tarefa funciona
- [ ] Busca por nome do aluno funciona
- [ ] Cards mostram: avatar, nome, tarefa, badge de atraso (se aplicavel), tempo desde envio
- [ ] Aprovacao move card para coluna "Aprovadas"
- [ ] Devolucao move card para coluna "Revisao Necessaria"
- [ ] Notificacao `espaco_assignment_reviewed` e enviada ao aluno
- [ ] Alternancia Kanban/Lista funciona sem perda de dados

---

### M7: Biblioteca de materiais

**Rota:** `/mentor/espacos/:id` > aba **Biblioteca**

**Objetivo:** Demonstrar upload de materiais e organizacao em pastas.

**Passos:**

1. Ir para a aba **Biblioteca**
2. Criar uma **nova pasta** (se funcionalidade disponivel)
3. Clicar em **"Adicionar Material"**
4. Upload de arquivo:
   - Titulo: `Slide Aula 1`
   - Descricao: breve
   - Selecionar arquivo PDF
   - Escolher pasta (se aplicavel)
5. Adicionar um **link externo**:
   - Titulo: `Video complementar`
   - URL do video
6. Verificar que ambos materiais aparecem na biblioteca

**Validacoes:**
- [ ] Upload de arquivo funciona (PDF, DOCX, etc.)
- [ ] Link externo e salvo corretamente
- [ ] Materiais aparecem com titulo e descricao
- [ ] Alunos conseguem ver os materiais (testar na visao do aluno)
- [ ] Contagem de materiais atualiza nas metricas
- [ ] Notificacao `espaco_new_material` e enviada aos alunos (se implementada no trigger)

---

### M8: IA - Briefing pre-sessao

**Rota:** `/mentor/espacos/:id` > aba **Overview** > card lateral

**Objetivo:** Demonstrar a geracao de briefing automatico antes de uma sessao.

**Pre-requisito:** Sessao agendada para as proximas horas/dias. Alunos matriculados com algum historico.

**Passos:**

1. Abrir o espaco e ir para a aba **Overview**
2. Localizar o card **"Preparacao IA"** na barra lateral (gradiente violeta)
3. Verificar que mostra a proxima sessao agendada
4. Clicar em **"Gerar Briefing"**
5. Aguardar geracao (loading state)
6. Ler o briefing gerado (contem: contexto dos alunos, presenca, entregas pendentes, notas)
7. Clicar em **"Copiar"** para copiar o texto
8. Clicar em **"Regenerar"** para gerar nova versao

**Validacoes:**
- [ ] Card so aparece se existe sessao futura
- [ ] Loading state aparece durante geracao
- [ ] Briefing e gerado com conteudo relevante (nao generico)
- [ ] Botao "Copiar" copia para clipboard
- [ ] Botao "Regenerar" gera conteudo diferente
- [ ] Tooltip de ajuda explica a funcionalidade
- [ ] Erro amigavel se API de IA nao estiver configurada

---

### M9: IA - Resumo pos-sessao

**Rota:** `/mentor/espacos/:id` > aba **Sessoes**

**Objetivo:** Demonstrar a geracao de resumo automatico apos uma sessao concluida.

**Pre-requisito:** Sessao com status "Concluida" e presenca registrada.

**Passos:**

1. Ir para a aba **Sessoes**
2. Localizar uma sessao com status **"Concluida"**
3. Clicar no botao **"Resumo IA"** (icone de sparkles)
4. No dialog que abre:
   - Opcionalmente, digitar **notas do mentor** (observacoes pessoais sobre a sessao)
   - Clicar em **"Gerar Resumo"**
5. Aguardar geracao
6. Ler o resumo (contem: estatisticas de presenca, destaques, proximos passos)
7. Ver as estatisticas: total matriculados, presentes, ausentes, taxa de presenca
8. Clicar em **"Copiar"**

**Validacoes:**
- [ ] Botao "Resumo IA" so aparece para sessoes concluidas
- [ ] Campo de notas do mentor e opcional
- [ ] Resumo inclui dados reais de presenca
- [ ] Estatisticas (presentes/ausentes/taxa) sao corretas
- [ ] Botao "Copiar" funciona
- [ ] Dialog fecha corretamente

---

### M10: IA - Sugestao de engajamento do aluno

**Rota:** `/mentor/espacos/:id` > aba **Alunos** > drawer do aluno

**Objetivo:** Demonstrar a geracao de sugestoes personalizadas para engajar um aluno.

**Pre-requisito:** Aluno matriculado com algum historico de presenca/entregas.

**Passos:**

1. Ir para a aba **Alunos**
2. Clicar em um aluno para abrir o **drawer lateral**
3. Verificar informacoes exibidas:
   - Avatar e nome
   - Barra de progresso (presenca)
   - Score de engajamento (0-100)
   - Nivel de risco (baixo/medio/alto)
   - Ultimo acesso
   - Contagem de entregas
4. Clicar em **"Gerar Sugestao de Engajamento"**
5. Aguardar geracao
6. Ler a sugestao personalizada

**Validacoes:**
- [ ] Drawer mostra dados corretos do aluno
- [ ] Score de engajamento e calculado (nao zero para aluno com historico)
- [ ] Sugestao e personalizada (menciona dados do aluno)
- [ ] Loading state durante geracao
- [ ] Sugestao e legivel e acionavel

---

### M11: Painel de engajamento e churn score

**Rota:** `/mentor/espacos/:id` > aba **Alunos**

**Objetivo:** Demonstrar o sistema de monitoramento de engajamento e risco de abandono.

**Pre-requisito:** Multiplos alunos com diferentes niveis de atividade.

**Passos:**

1. Ir para a aba **Alunos**
2. Observar a coluna **"Engajamento"** na tabela:
   - Badges coloridos: verde (baixo risco), laranja (medio), vermelho (alto risco)
   - Score numerico (0-100)
3. Clicar em um aluno de **alto risco** (badge vermelho)
4. No drawer, verificar o breakdown do score:
   - Score de presenca (peso 40%)
   - Score de entregas (peso 30%)
   - Score de recencia (peso 30%)
5. Comparar com um aluno de **baixo risco** (badge verde)
6. Usar as **notas privadas** do mentor:
   - Escrever uma observacao sobre o aluno
   - Salvar
   - Reabrir o drawer e verificar que a nota persistiu

**Validacoes:**
- [ ] Badges de risco tem cores corretas (verde >= 60, laranja >= 30, vermelho < 30)
- [ ] Score reflete atividade real (aluno ativo = score alto)
- [ ] Breakdown mostra 3 componentes separados
- [ ] Notas privadas salvam e persistem
- [ ] Aluno sem nenhuma atividade tem score proximo de 0
- [ ] Pesos sao configuaveis pelo admin em `app_configs`

---

### M12: Overview e metricas

**Rota:** `/mentor/espacos/:id` > aba **Overview**

**Objetivo:** Demonstrar o painel geral do espaco com metricas, acoes rapidas e feed de atividade.

**Passos:**

1. Abrir o espaco e verificar a aba **Overview** (padrao)
2. Conferir as **metricas no header**:
   - Total de sessoes
   - Total de tarefas
   - Total de materiais
   - Total de alunos
3. Verificar a secao **Proximas Sessoes** (agenda)
4. Verificar a secao **Tarefas Pendentes** (entregas aguardando correcao)
5. Verificar o **Circulo de Engajamento** (percentual geral)
6. Verificar as **Acoes Rapidas** (grid 2 colunas):
   - Agendar Sessao
   - Criar Tarefa
   - Convidar Aluno
   - Ver Engajamento
7. Verificar o **Feed de Atividade** (entregas recentes, matriculas, presenca)

**Validacoes:**
- [ ] Metricas refletem dados reais
- [ ] Proximas sessoes mostra apenas futuras, em ordem
- [ ] Circulo de engajamento tem cor correta (verde/laranja/vermelho)
- [ ] Acoes rapidas navegam para as telas corretas
- [ ] Feed de atividade mostra eventos recentes
- [ ] Card de IA (briefing) aparece se houver sessao proxima

---

### M13: Arquivar e restaurar espaco

**Rota:** `/mentor/espacos/:id` > aba **Settings**

**Objetivo:** Demonstrar o ciclo de vida do espaco (arquivar e restaurar).

**Passos:**

1. Abrir o espaco e ir para **Settings** (ou usar botao no header)
2. Clicar em **"Arquivar Espaco"**
3. Confirmar a acao
4. Verificar que o espaco muda para status "Arquivado"
5. Voltar para a lista `/mentor/espacos`
6. Filtrar por status **"Arquivado"** — espaco deve aparecer
7. Abrir o espaco arquivado
8. Clicar em **"Restaurar Espaco"**
9. Verificar que volta para status "Ativo"

**Validacoes:**
- [ ] Arquivamento muda status e visual do card
- [ ] Espaco arquivado aparece no filtro correto
- [ ] Restauracao retorna ao status ativo
- [ ] Alunos nao perdem matricula ao arquivar/restaurar

---

## Cenarios do Aluno

### A1: Visualizar espacos matriculados

**Rota:** `/dashboard/espacos`

**Objetivo:** Demonstrar a lista de espacos do aluno.

**Passos:**

1. Logar como aluno
2. Acessar `/dashboard/espacos`
3. Verificar as abas:
   - **Em andamento** — espacos ativos
   - **Concluidos** — espacos finalizados
   - **Todos** — todos os espacos
4. Clicar em um espaco para abrir o detalhe

**Validacoes:**
- [ ] Apenas espacos em que o aluno esta matriculado aparecem
- [ ] Filtro por aba funciona
- [ ] Cards mostram nome, progresso, informacoes basicas
- [ ] Estado vazio mostra botao "Explorar" (se nenhum espaco)

---

### A2: Navegar pelo espaco

**Rota:** `/dashboard/espacos/:id`

**Objetivo:** Demonstrar a navegacao do aluno dentro de um espaco.

**Passos:**

1. Abrir um espaco matriculado
2. Verificar o **header** com imagem de capa, nome, metricas
3. Navegar pelas abas:
   - Overview
   - Sessoes
   - Tarefas
   - Biblioteca
   - Meus Arquivos
   - Discussao
4. Verificar que **nao existem** abas de Alunos nem Settings

**Validacoes:**
- [ ] Todas as 6 abas do aluno estao presentes
- [ ] Nao ha abas de gestao (Alunos, Settings)
- [ ] Header mostra metricas corretas
- [ ] Navegacao entre abas e fluida (sem recarregar pagina)

---

### A3: Ver sessoes e agenda

**Rota:** `/dashboard/espacos/:id` > aba **Sessoes**

**Objetivo:** Demonstrar a visualizacao de sessoes pelo aluno.

**Passos:**

1. Ir para a aba **Sessoes**
2. Verificar a timeline de sessoes:
   - Sessoes futuras: com data, horario, botao "Entrar" (se link disponivel)
   - Sessoes passadas: com status "Concluida"
3. Clicar em **"Copiar link"** de uma sessao com link de reuniao
4. Clicar em **"Entrar"** para abrir o link da reuniao

**Validacoes:**
- [ ] Sessoes aparecem em ordem cronologica
- [ ] Botao "Entrar" abre o link em nova aba
- [ ] Botao "Copiar link" copia para clipboard
- [ ] Aluno NAO ve botao de criar/editar sessao
- [ ] Sessoes de outros espacos nao aparecem

---

### A4: Realizar e entregar tarefas

**Rota:** `/dashboard/espacos/:id` > aba **Tarefas**

**Objetivo:** Demonstrar o fluxo completo de entrega de tarefa pelo aluno.

**Passos:**

1. Ir para a aba **Tarefas**
2. Verificar que apenas tarefas **publicadas** aparecem (rascunhos nao)
3. Clicar em uma tarefa para abrir detalhes
4. Verificar informacoes:
   - Titulo, descricao, instrucoes
   - Data de entrega
   - Tipo de entrega aceito (arquivo, texto, ambos)
   - Formatos e tamanho maximo
5. Fazer a entrega:
   - **Se arquivo:** fazer upload de um PDF/DOCX
   - **Se texto:** escrever no campo de texto
   - **Se ambos:** preencher os dois
6. Clicar em **"Enviar"**
7. Verificar que o status muda para "Enviada" / "Em Avaliacao"

**Validacoes:**
- [ ] Tarefas em rascunho NAO aparecem para o aluno
- [ ] Instrucoes e restricoes sao exibidas claramente
- [ ] Upload respeita tipo e tamanho maximo
- [ ] Entrega muda status para "Enviada"
- [ ] Notificacao `espaco_new_submission` e enviada ao mentor
- [ ] Entrega atrasada mostra badge "Atrasada" (se permitida)
- [ ] Tarefa ja entregue mostra status e historico

---

### A5: Kanban de tarefas do aluno

**Rota:** `/dashboard/espacos/:id` > aba **Tarefas** > modo Kanban

**Objetivo:** Demonstrar a visao kanban das tarefas pelo aluno.

**Passos:**

1. Na aba **Tarefas**, alternar para **modo Kanban** (icone de grid)
2. Verificar as 3 colunas:
   - **A Fazer** — tarefas pendentes, atrasadas e devolvidas para revisao
   - **Em Avaliacao** — tarefas enviadas aguardando correcao
   - **Concluidas** — tarefas aprovadas
3. Verificar os cards:
   - Titulo da tarefa
   - Data de entrega
   - Badge de status (atrasada, revisao, etc.)
4. Alternar para **modo Lista** e comparar

**Validacoes:**
- [ ] Kanban mostra contagem por coluna
- [ ] Cards "A Fazer" incluem tarefas com revisao solicitada
- [ ] Cards mostram data de entrega e badges corretos
- [ ] Tarefas atrasadas tem indicador visual (vermelho)
- [ ] Alternancia Kanban/Lista preserva dados

---

### A6: Biblioteca e meus arquivos

**Rota:** `/dashboard/espacos/:id` > abas **Biblioteca** e **Meus Arquivos**

**Objetivo:** Demonstrar acesso a materiais e upload de arquivos pessoais.

**Passos:**

1. Ir para a aba **Biblioteca**
2. Verificar materiais disponibilizados pelo mentor
3. Fazer download de um material
4. Ir para a aba **Meus Arquivos**
5. Fazer upload de um arquivo pessoal
6. Verificar que o arquivo aparece na lista

**Validacoes:**
- [ ] Materiais do mentor sao visiveis e baixaveis
- [ ] Aluno NAO consegue fazer upload na Biblioteca (somente mentor)
- [ ] Aba "Meus Arquivos" aceita upload do aluno
- [ ] Arquivos do aluno sao privados (outros alunos nao veem)

---

### A7: Notificacoes do aluno

**Rota:** Icone de sino (header global)

**Objetivo:** Demonstrar as notificacoes recebidas pelo aluno.

**Passos:**

1. Clicar no icone de **sino** no header
2. Verificar notificacoes recebidas:
   - Nova tarefa publicada (`espaco_new_assignment`)
   - Tarefa corrigida (`espaco_assignment_reviewed`)
   - Novo material (`espaco_new_material`)
   - Lembrete de sessao (`espaco_session_reminder`)
   - Prazo proximo (`espaco_assignment_deadline` — gerado pelo cron)
3. Clicar em uma notificacao para ser redirecionado

**Validacoes:**
- [ ] Notificacoes aparecem em ordem cronologica
- [ ] Cada tipo tem icone e texto corretos
- [ ] Clicar redireciona para a pagina correta
- [ ] Badge de contagem (nao lidas) funciona
- [ ] Marcar como lida funciona

---

## Cenarios Integrados

### I1: Fluxo completo: tarefa ate correcao

**Objetivo:** Demonstrar o ciclo de vida completo de uma tarefa, do mentor ao aluno e de volta.

**Atores:** Mentor (tela esquerda) + Aluno (tela direita)

**Passos:**

| # | Ator | Acao | Verificacao |
|---|------|------|-------------|
| 1 | Mentor | Cria tarefa como rascunho | Tarefa nao visivel para aluno |
| 2 | Mentor | Publica a tarefa | Aluno recebe notificacao `espaco_new_assignment` |
| 3 | Aluno | Ve notificacao e abre a tarefa | Detalhes da tarefa visiveis |
| 4 | Aluno | Faz upload e envia entrega | Status muda para "Em Avaliacao" |
| 5 | Mentor | Recebe notificacao `espaco_new_submission` | Card aparece no Kanban "Aguardando Correcao" |
| 6 | Mentor | Abre a entrega e devolve para revisao | Card move para "Revisao Necessaria" |
| 7 | Aluno | Recebe notificacao `espaco_assignment_reviewed` | Tarefa volta para "A Fazer" no kanban do aluno |
| 8 | Aluno | Corrige e reenvia | Status volta para "Em Avaliacao" |
| 9 | Mentor | Aprova a entrega | Card move para "Aprovadas" |
| 10 | Aluno | Recebe notificacao de aprovacao | Tarefa move para "Concluidas" no kanban |

**Validacoes finais:**
- [ ] Ciclo completo funciona sem erros
- [ ] Todas as 4 notificacoes foram recebidas corretamente
- [ ] Kanban do mentor e do aluno refletem estados corretos
- [ ] Metricas do espaco atualizaram (entregas, progresso)

---

### I2: Fluxo completo: sessao ate resumo IA

**Objetivo:** Demonstrar o ciclo de uma sessao: criacao, briefing IA, presenca, resumo IA.

**Atores:** Mentor (principal) + Aluno (secundario)

**Passos:**

| # | Ator | Acao | Verificacao |
|---|------|------|-------------|
| 1 | Mentor | Cria sessao para hoje/amanha | Sessao aparece na timeline |
| 2 | Aluno | Ve sessao na aba Sessoes | Data e link corretos |
| 3 | Mentor | Gera briefing IA (card Overview) | Briefing menciona dados dos alunos |
| 4 | Mentor | Registra presenca dos alunos | Check-in marcado |
| 5 | Mentor | Marca sessao como concluida | Status muda para "Concluida" |
| 6 | Mentor | Gera resumo IA com notas | Resumo inclui stats de presenca |
| 7 | Mentor | Copia resumo | Texto no clipboard |

**Validacoes finais:**
- [ ] Briefing e relevante ao contexto da turma
- [ ] Resumo inclui: presentes, ausentes, taxa de presenca
- [ ] Notas do mentor sao incorporadas no resumo
- [ ] Ambas funcoes de IA funcionam sem erro

---

### I3: Notificacoes cross-role

**Objetivo:** Validar que todas as notificacoes chegam aos destinatarios corretos.

**Atores:** Mentor + Aluno

| Evento | Notificacao | Destinatario | Trigger |
|--------|------------|-------------|---------|
| Tarefa publicada | `espaco_new_assignment` | Todos os alunos | Mentor publica tarefa |
| Entrega enviada | `espaco_new_submission` | Mentor | Aluno envia entrega |
| Tarefa corrigida | `espaco_assignment_reviewed` | Aluno especifico | Mentor avalia entrega |
| Aluno matriculado | `espaco_student_enrolled` | Mentor | Aluno e convidado/matriculado |
| Novo material | `espaco_new_material` | Todos os alunos | Mentor adiciona material |
| Prazo proximo | `espaco_assignment_deadline` | Alunos sem entrega | Cron (24h antes do prazo) |
| Baixo engajamento | `espaco_low_engagement` | Mentor | Cron (segundas-feiras, alunos inativos 14+ dias) |

**Como testar o cron (deadline):**
1. Criar tarefa com prazo para daqui a ~23 horas
2. Garantir que aluno NAO enviou entrega
3. Aguardar o proximo ciclo do cron (a cada 30 min)
4. Verificar que aluno recebe notificacao de prazo

**Como testar o cron (engajamento):**
1. Ter aluno matriculado sem acesso ha 14+ dias
2. Aguardar segunda-feira (cron roda entre 00:00-01:00 UTC)
3. Verificar que mentor recebe notificacao de alunos inativos

---

## Checklist de Regressao Rapida

Para validacao pos-deploy, executar estes testes minimos:

| # | Teste | Resultado |
|---|-------|-----------|
| 1 | Criar espaco | [ ] OK |
| 2 | Editar espaco | [ ] OK |
| 3 | Convidar aluno existente | [ ] OK |
| 4 | Criar sessao | [ ] OK |
| 5 | Criar e publicar tarefa | [ ] OK |
| 6 | (Aluno) Ver tarefa publicada | [ ] OK |
| 7 | (Aluno) Enviar entrega | [ ] OK |
| 8 | (Mentor) Corrigir entrega | [ ] OK |
| 9 | Upload de material na biblioteca | [ ] OK |
| 10 | Gerar briefing IA | [ ] OK |
| 11 | Gerar resumo IA | [ ] OK |
| 12 | Gerar sugestao de engajamento | [ ] OK |
| 13 | Notificacao de nova tarefa (aluno) | [ ] OK |
| 14 | Notificacao de entrega (mentor) | [ ] OK |
| 15 | Kanban do mentor funciona | [ ] OK |
| 16 | Kanban do aluno funciona | [ ] OK |
| 17 | Arquivar e restaurar espaco | [ ] OK |
| 18 | Churn score visivel na tabela de alunos | [ ] OK |

---

## Estrutura sugerida para videos

```
videos/
  mentor/
    M01-criar-espaco.mp4
    M02-lista-espacos.mp4
    M03-sessoes.mp4
    M04-tarefas.mp4
    M05-convidar-alunos.mp4
    M06-kanban-correcoes.mp4
    M07-biblioteca.mp4
    M08-ia-briefing.mp4
    M09-ia-resumo.mp4
    M10-ia-sugestao.mp4
    M11-engajamento-churn.mp4
    M12-overview-metricas.mp4
    M13-arquivar-restaurar.mp4
  aluno/
    A01-espacos-matriculados.mp4
    A02-navegar-espaco.mp4
    A03-sessoes-agenda.mp4
    A04-entregar-tarefa.mp4
    A05-kanban-tarefas.mp4
    A06-biblioteca-arquivos.mp4
    A07-notificacoes.mp4
  integrado/
    I01-ciclo-tarefa-completo.mp4
    I02-ciclo-sessao-ia.mp4
    I03-notificacoes-cross-role.mp4
```
