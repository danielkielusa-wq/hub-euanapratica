# Sistema de Lives — Guia do Mentor

> Este documento explica como criar, gerenciar e acompanhar suas lives na plataforma.

---

## Acesso

- **Menu lateral**: GESTAO → **Lives** (icone de antena)
- **URL direta**: `/mentor/lives`

---

## 1. Criando uma Live

### Passo a Passo

1. Acesse `/mentor/lives` e clique em **"Criar Live"**
2. Preencha o formulario:

| Campo | Obrigatorio | Descricao |
|-------|:-----------:|-----------|
| Titulo | Sim | Nome da live (ex: "Masterclass: Como Montar um Curriculo para os EUA") |
| Slug | Sim | URL amigavel — gerado automaticamente do titulo, editavel (ex: `masterclass-curriculo-eua`) |
| Descricao curta | Nao | Aparece no card da live (max ~150 caracteres recomendado) |
| Descricao longa | Nao | Aparece na landing page — pode ser mais detalhada |
| Data e Hora | Sim | Quando a live acontecera |
| Duracao (min) | Sim | Duracao estimada (default: 60) |
| Link da Reuniao | Nao | Link do Zoom/Google Meet/etc — visivel apenas para inscritos |
| Tipo de Acesso | Sim | Quem pode participar (ver tabela abaixo) |
| Preco (R$) | Condicional | Apenas para lives pagas |
| ID Produto Ticto | Condicional | Apenas para lives pagas — ID do produto no Ticto |
| URL Checkout Ticto | Condicional | Apenas para lives pagas — link de checkout |
| Limite de Vagas | Nao | Maximo de inscritos (vazio = ilimitado) |
| URL da Thumbnail | Nao | Imagem de capa para cards e landing page |
| Status | Sim | `Rascunho` (nao publicada) ou `Agendada` (visivel) |

3. Clique em **"Criar Live"**

### Tipos de Acesso

| Tipo | Quem Pode Participar | Quando Usar |
|------|---------------------|-------------|
| **Gratuita** | Qualquer usuario logado | Captacao de leads, divulgacao, topo de funil |
| **Paga** | Quem comprar pelo Ticto | Workshops premium, masterclasses pagas |
| **Assinantes** | Qualquer assinante ativo | Beneficio para assinantes, fidelizacao |
| **Pro** | Assinantes Pro ou VIP | Conteudo exclusivo para tiers superiores |
| **VIP** | Apenas assinantes VIP | Maximo de exclusividade |

---

## 2. Gerenciando suas Lives

### Pagina de Lives (`/mentor/lives`)

Voce vera uma lista com todas as suas lives. Cada card mostra:
- Titulo e badges de status/acesso
- Data e hora
- Numero de vagas

### Acoes Disponiveis

| Acao | Quando | Como |
|------|--------|------|
| **Go Live** | Status = Agendada | Botao vermelho "Go Live" — muda status para "Ao Vivo" |
| **Encerrar** | Status = Ao Vivo | Botao "Encerrar" — muda status para "Concluida" |
| **Editar** | Qualquer momento | Menu (...) → Editar |
| **Copiar URL** | Qualquer momento | Menu (...) → Copiar URL da landing page |
| **Ver Landing Page** | Qualquer momento | Menu (...) → Abre a landing page em nova aba |
| **Ver Inscritos** | Qualquer momento | Menu (...) → Abre pagina de detalhes com lista de inscritos |
| **Excluir** | Apenas Rascunho | Menu (...) → Excluir (nao pode excluir lives ja publicadas) |

---

## 3. No Dia da Live

### Antes de Comecar
1. Acesse `/mentor/lives`
2. Encontre sua live com status **"Agendada"**
3. Clique em **"Go Live"** — a live agora aparece como **"Ao Vivo"** para todos os inscritos

### O que Muda quando esta "Ao Vivo"
- Card da live no Discovery pulsa com badge vermelho "Ao Vivo"
- No Hub dos inscritos, aparece botao **"Entrar Agora"** com link direto para a reuniao
- A live ganha destaque visual em toda a plataforma
- **Email automatico**: todos os inscritos recebem email "Estamos ao vivo!" com botao para entrar
- **Botoes de compartilhamento**: na pagina de detalhes da live, aparecem botoes para compartilhar via WhatsApp, LinkedIn, Twitter/X e copiar texto

### Apos Encerrar
1. Clique em **"Encerrar"** na pagina de lives ou no detalhe
2. Status muda para **"Concluida"**
3. (Opcional) Edite a live e adicione a **URL de gravacao** para que inscritos possam assistir depois

> **Nota:** Se voce esquecer de encerrar a live, o sistema auto-encerra automaticamente apos a duracao prevista + 60 minutos. Voce recebera um email e WhatsApp avisando.

---

## 4. Acompanhando Inscritos

### Pagina de Detalhes (`/mentor/lives/:id`)

Acessivel clicando no titulo da live ou via menu "Ver Inscritos". Mostra:

- **Informacoes da live**: titulo, status, data, duracao, inscritos, link
- **Lista de inscritos**: nome, email, data de inscricao, status de presenca
- **Checkbox de presenca**: marque/desmarque para registrar quem compareceu

### Controle de Presenca

Para cada inscrito, voce pode marcar o checkbox de presenca. Isso ajuda a:
- Saber quem realmente participou
- Ter metricas de taxa de presenca
- Diferenciar inscritos de participantes efetivos

---

## 5. Landing Page

Cada live tem uma landing page publica em `/live/:slug`. Ela inclui:

- Imagem de capa (se configurada)
- Titulo e badges (status + tipo de acesso)
- Data, hora e duracao
- Descricao longa
- Seu nome e foto como mentor
- **CTA dinamico** que muda conforme o perfil do visitante

### O que o Visitante Ve

| Situacao | CTA |
|----------|-----|
| Live gratuita, nao inscrito | "Inscreva-se Gratuitamente" |
| Ja inscrito | "Voce esta inscrito!" + data/hora |
| Live ao vivo + inscrito | "Entrar na Live" (abre link da reuniao) |
| Live paga, nao comprou | "Comprar Acesso (R$ X)" → checkout Ticto |
| Live para assinantes, sem plano | "Assine para Participar" → pagina de planos |
| Live Pro/VIP, plano insuficiente | "Faca Upgrade para Pro/VIP" → pagina de planos |
| Vagas esgotadas | "Vagas Esgotadas" (desabilitado) |

### Compartilhando sua Live

**Antes de comecar (live agendada):**
- Use o botao **"Copiar URL"** na pagina de lives para copiar o link da landing page
- Compartilhe o link nas redes sociais, WhatsApp, email, etc.

**Durante a live (ao vivo):**
- Na pagina de detalhes da live, um card de compartilhamento aparece automaticamente
- **WhatsApp**: abre conversa com mensagem pre-preenchida incluindo o link da live
- **LinkedIn**: abre janela de compartilhamento do LinkedIn
- **Twitter/X**: abre tweet pre-preenchido com titulo e link
- **Copiar Texto**: copia a mensagem para colar em qualquer lugar

---

## 6. Dicas Praticas

### Para Maximizar Inscricoes
- Use um titulo claro e atrativo
- Preencha a descricao longa com topicos que serao abordados
- Adicione uma imagem de capa profissional
- Compartilhe o link da landing page nas redes sociais

### Para Lives Pagas
- Crie o produto no Ticto antes de criar a live
- Copie o `product_id` e a `checkout_url` exatos do Ticto
- Teste o fluxo: acesse a landing page com outro usuario e verifique se o botao de compra funciona

### Para Lives de Plano (Pro/VIP)
- Nao precisa configurar Ticto — o acesso e verificado automaticamente pelo plano do usuario
- Usuarios sem plano verao CTA para assinar
- Usuarios com plano inferior verao CTA para fazer upgrade

---

## 7. FAQ

**P: Posso editar uma live depois de publicada?**
R: Sim, a qualquer momento. Acesse a live e clique em "Editar".

**P: Posso excluir uma live com inscritos?**
R: Nao. Apenas lives com status "Rascunho" podem ser excluidas. Para cancelar uma live publicada, mude o status.

**P: O que acontece se eu esquecer de clicar "Go Live"?**
R: A live continua com status "Agendada". Os inscritos verao os detalhes mas nao o botao "Entrar Agora". Voce pode clicar "Go Live" a qualquer momento.

**P: O que acontece se eu esquecer de encerrar a live?**
R: O sistema auto-encerra a live apos a duracao prevista + 60 minutos. Voce recebera um email e WhatsApp avisando que a live foi encerrada automaticamente.

**P: Posso ter varias lives ao mesmo tempo?**
R: Sim, nao ha limite de lives simultaneas.

**P: Os inscritos recebem email quando eu clicar "Go Live"?**
R: Sim! Todos os inscritos recebem automaticamente um email "Estamos ao vivo!" com botao para entrar na reuniao.

**P: Os inscritos recebem email ao se inscrever?**
R: Sim! Ao se inscrever, o participante recebe um email de confirmacao com detalhes da live, botao para adicionar ao Google Calendar, e um arquivo `.ics` para adicionar ao calendario (Outlook, Apple Calendar, etc.).

**P: Posso compartilhar a live nas redes sociais?**
R: Sim! Quando a live esta "Ao Vivo", botoes de compartilhamento aparecem na pagina de detalhes (WhatsApp, LinkedIn, Twitter/X, Copiar Texto). Antes de comecar, use "Copiar URL" para compartilhar o link da landing page.
