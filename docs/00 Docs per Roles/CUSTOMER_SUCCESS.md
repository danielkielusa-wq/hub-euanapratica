# EUA Na Pratica Hub — Guia do Customer Success

> Lifecycle do usuario, metricas de engajamento e playbooks de retencao.
>
> Ultima atualizacao: 2026-02-26

---

## Sumario

- [Visao Geral da Plataforma](#visao-geral-da-plataforma)
- [Jornada do Usuario](#jornada-do-usuario)
- [Onboarding](#onboarding)
- [Assinaturas e Planos](#assinaturas-e-planos)
- [Metricas de Engajamento](#metricas-de-engajamento)
- [Playbooks](#playbooks)
  - [Usuario Inativo](#1-usuario-inativo)
  - [Prevencao de Churn](#2-prevencao-de-churn)
  - [Upgrade de Plano](#3-upgrade-de-plano)
  - [Reativacao](#4-reativacao)
  - [Servico Comprado Nao Utilizado](#5-servico-comprado-nao-utilizado)
  - [Pos-Sessao de Consultoria](#6-pos-sessao-de-consultoria)
- [Ferramentas Admin](#ferramentas-admin)
- [Emails Automaticos](#emails-automaticos)
- [WhatsApp — Guia de Uso](#whatsapp--guia-de-uso)
- [Guided Tour e Primeiros Passos](#guided-tour-e-primeiros-passos)
- [Meu Hub — Acompanhamento de Servicos](#meu-hub--acompanhamento-de-servicos)
- [Agendamentos — Resolucao de Problemas](#agendamentos--resolucao-de-problemas)
- [Cenarios Comuns e Como Resolver](#cenarios-comuns-e-como-resolver)
- [Referencias](#referencias)

---

## Visao Geral da Plataforma

O **EUA Na Pratica Hub** e uma plataforma de carreira para brasileiros que buscam oportunidades no mercado americano. Combina diagnostico de carreira por IA, ferramentas de preparacao (analise de curriculo, traducao de titulos), mentoria ao vivo, comunidade entre pares e curadoria de vagas — tudo em modelo de assinatura recorrente.

O papel do CS e garantir que cada usuario extraia valor da plataforma ao longo de toda a jornada: desde o primeiro acesso ate a renovacao da assinatura e possivel upgrade.

---

## Jornada do Usuario

```
Lead (formulario)
  |
  v
Relatorio de Diagnostico (gratuito, versao limitada)
  |
  v
Cadastro no Hub (email + senha)
  |
  v
Onboarding (6 etapas: dados pessoais, area, experiencia, objetivos)
  |
  v
Tour Guiado (1a vez no Hub — apresenta Comunidade, ResumePass, Catalogo)
  |
  v
Checklist "Primeiros Passos" (4 acoes: perfil, comunidade, curriculo, catalogo)
  |
  v
Usuario Free (Basico) — acesso limitado (1 analise/mes, comunidade, browse de vagas)
  |
  v
Assinante (Pro/VIP) — acesso completo (10-999 analises, biblioteca, hotseats, prime jobs)
  |
  v
Power User — compra servicos avulsos (Rota60, LinkedIn Review), faz mentorias, participa de lives
  |
  v
Renovacao / Upgrade / Referral
```

**Pontos criticos para CS:**
- **Cadastro -> Onboarding**: Se nao completar onboarding, nao recebe welcome email e fica perdido
- **Basico -> Pro/VIP**: Conversao de free para pago — gatilho quando atinge limite de creditos
- **1a semana**: Periodo mais critico — tour + checklist devem gerar engajamento
- **Servico comprado -> Servico utilizado**: Cards "Acao Necessaria" no Meu Hub indicam clientes que compraram mas nao iniciaram

---

## Onboarding

### Etapas do Onboarding (6 passos)

1. Dados pessoais (nome, telefone, LinkedIn)
2. Area de atuacao e nivel de experiencia
3. Experiencia internacional e ingles
4. Objetivo nos EUA e timeline
5. Situacao financeira e de visto
6. Resumo e confirmacao

### O que acontece ao completar

1. Flag `has_completed_onboarding = true` no perfil
2. **Welcome email** enviado automaticamente (template `onboarding_welcome`)
3. Redirect para `/dashboard/hub`
4. **Tour Guiado** aparece apos 1 segundo (spotlight na sidebar)
5. **Checklist "Primeiros Passos"** aparece no topo do Hub

### Problemas comuns

- **"Nao recebi email de boas-vindas"**: Verificar se `has_completed_onboarding = true`. Se false, usuario abandonou o onboarding antes de terminar.
- **"Nao vi o tour"**: O tour aparece UMA vez, no primeiro acesso apos onboarding. Se pulou, nao volta. Oriente manualmente.
- **"Quero refazer o onboarding"**: Nao e possivel pela UI. Dados podem ser editados em `/perfil`.

---

## Assinaturas e Planos

### Tabela de Features por Plano

| Feature | Basico (R$0) | Pro (R$47/mes) | VIP (R$97/mes) |
|---------|:------------:|:--------------:|:---------------:|
| Analises de curriculo (ResumePass) | 1/mes | 10/mes | Ilimitado |
| Traducoes de titulo (Title Translator) | 1/mes | 10/mes | Ilimitado |
| Comunidade | Sim | Sim | Sim |
| Browse de vagas | Sim | Sim | Sim |
| Export PDF de analise | Nao | Sim | Sim |
| Sugestoes de melhoria (ResumePass) | Nao | Sim | Sim |
| Power Verbs | Nao | Sim | Sim |
| Biblioteca e Masterclass | Nao | Sim | Sim |
| Hotseats mensais | Nao | Sim | Sim (prioridade) |
| Prime Jobs (vagas curadas) | Nao | Bookmark | 20 vagas/mes |
| Desconto em servicos | Nao | 10% | 20% |
| Relatorio completo (diagnostico) | Limitado | Completo | Completo |

### Ciclos de Cobranca

- **Mensal**: Cobrado no mesmo dia a cada mes
- **Anual**: 10 meses (2 meses gratis). Pro: R$470/ano. VIP: R$970/ano.

### Status de Assinatura

| Status | Acesso | O que o usuario ve |
|--------|--------|-------------------|
| `active` | Total | Nada especial — uso normal |
| `past_due` (dunning 1-2) | **Total** (mantido) | Banner amarelo/laranja: "Problema com pagamento" + link "Atualizar Cartao" |
| `grace_period` (dunning 3) | **Total** (mantido por 7 dias) | Banner vermelho: "Ultimo aviso: acesso sera suspenso em X dias" |
| `cancelled` | Basico apenas | Downgrade para plano gratuito |
| `cancel_at_period_end` | Total ate `expires_at` | Badge "Cancelamento agendado" — acesso continua ate fim do periodo |

**Ponto importante**: Usuarios em `past_due` e `grace_period` mantem acesso total. Isso e intencional para minimizar churn por atrito.

### Cancelamento

O cancelamento e self-service em 3 etapas:
1. Confirmacao (mostra features que vai perder)
2. Pesquisa de saida (motivo + feedback)
3. Sucesso (mostra data de acesso final + CTA de reativacao)

O usuario mantem acesso ate `expires_at`. Pode reativar a qualquer momento antes dessa data.

---

## Metricas de Engajamento

| Metrica | Onde Ver | O que Indica |
|---------|---------|-------------|
| Logins nos ultimos 7 dias | Supabase Analytics (`auth.users.last_sign_in_at`) | Engajamento ativo |
| Analises de curriculo | `usage_logs` filtrado por `action = 'resume_analysis'` | Uso de ferramenta principal |
| Posts na Comunidade | `community_posts` count por usuario | Engajamento social |
| Sessoes agendadas | `/admin/agendamentos` — filtro por aluno | Uso de mentoria |
| Cursos em progresso | `course_progress` por usuario | Consumo de conteudo |
| Servicos comprados vs usados | `user_hub_services` — `sessions_used / sessions_total` | Ativacao pos-compra |
| Cards "Acao Necessaria" | `user_hub_services` com `started_at IS NULL` | Clientes parados |
| Temperatura do lead | `/admin/leads-dashboard` — coluna Temperatura | Intencao de compra |
| Status de assinatura | `/admin/subscription-health` | Saude da base |
| Checklist completado | `profiles.onboarding_checklist_completed` | Onboarding efetivo |

---

## Playbooks

### 1. Usuario Inativo

**Definicao:** Usuario que nao logou na plataforma.

| Periodo | Acao | Canal | Template/Mensagem |
|---------|------|-------|-------------------|
| **7 dias sem login** | Lembrete gentil | Email ou WhatsApp | "Sentimos sua falta! Sua analise de curriculo esta disponivel — ja conferiu as novas vagas?" |
| **14 dias sem login** | Contato pessoal | WhatsApp (IA sugerir mensagem) | Usar botao "Sugerir WhatsApp" na ficha — IA personaliza por perfil e barreiras |
| **30 dias sem login** | Ultimo contato + oferta | WhatsApp + Email | "Voce tem acesso a [features do plano]. Quer agendar 10 min para te mostrar como aproveitar?" |
| **45+ dias sem login** | Marcar como inativo no CRM | — | Mover para fluxo de reativacao |

**Sinais de alerta antecipados:**
- Completou onboarding mas nunca usou ResumePass
- Nenhum post na comunidade
- Nenhuma sessao agendada
- Checklist "Primeiros Passos" nao completado

---

### 2. Prevencao de Churn

**Sinais de risco:**

| Sinal | Nivel de Risco | Acao |
|-------|---------------|------|
| Dunning stage 1 (pagamento falhou) | Medio | O sistema envia email automatico. CS: acompanhar se usuario atualizou cartao |
| Dunning stage 2 | Alto | Contato via WhatsApp: "Vi que houve um problema com seu pagamento. Posso ajudar?" |
| Dunning stage 3 (grace period) | Critico | Ligar para o cliente. 7 dias para perder acesso. Link "Atualizar Cartao": `ticto_change_card_url` |
| Pesquisa de cancelamento enviada | Alto | Analisar motivo. Se "too_expensive": oferecer plano anual (economia de 2 meses). Se "not_using": agendar call de onboarding |
| Nao usou servico comprado em 7 dias | Alto | Ver secao "Servico Comprado Nao Utilizado" abaixo |
| Assistiu live gratuita mas nao converteu | Medio | Follow-up 24-48h: "Gostou da live? Temos [servico relacionado]" |

**Motivos de cancelamento mais comuns** (pesquisa de saida):
- `too_expensive` — Muito caro
- `not_using` — Nao estou usando o suficiente
- `found_alternative` — Encontrei outra solucao
- `missing_features` — Faltam funcionalidades
- `technical_issues` — Problemas tecnicos
- `temporary_pause` — Quero pausar temporariamente

---

### 3. Upgrade de Plano

**Triggers de upgrade Basico -> Pro:**

| Trigger | Acao |
|---------|------|
| Hit de limite de ResumePass (1/mes) | Sistema mostra modal de upgrade. CS: follow-up 24h se nao converteu |
| Hit de limite de Title Translator (1/mes) | Mesmo fluxo |
| Lead com relatorio limitado (versao free) | "Seu relatorio tem mais detalhes — veja as recomendacoes completas com o plano Pro" |
| Interesse em Biblioteca/Masterclass | "Esse conteudo e exclusivo Pro — quer desbloquear?" |

**Triggers de upgrade Pro -> VIP:**

| Trigger | Acao |
|---------|------|
| Hit de limite de ResumePass (10/mes) | "Voce esta usando bastante! No VIP e ilimitado" |
| Interesse em Prime Jobs curadas | "No VIP voce recebe 20 vagas selecionadas por mes" |
| Live exclusiva VIP anunciada | "Essa live e exclusiva VIP — faca upgrade e participe" |
| Desconto de 20% vs 10% | "No VIP seus descontos em servicos sao de 20%" |

---

### 4. Reativacao

**Publico:** Usuarios que cancelaram ou assinatura expirou.

| Tempo desde cancelamento | Acao | Mensagem |
|--------------------------|------|----------|
| 1-7 dias | WhatsApp pessoal | "Vi que voce cancelou. Tem algo que possamos melhorar? Posso oferecer [beneficio]" |
| 8-30 dias | Email de reativacao | "Sentimos sua falta — voltamos com novidades: [feature nova]. Reative com [desconto/oferta]" |
| 31-90 dias | Email + WhatsApp (campanha) | "Novidades desde sua saida: [lista]. Volte com [oferta especial]" |
| 90+ dias | Apenas campanhas sazonais | Incluir em blasts de Black Friday, aniversario etc. |

**Ofertas possiveis:**
- 1 mes gratis
- Desconto no plano anual
- Sessao de consultoria bonus
- Acesso temporario a feature VIP

---

### 5. Servico Comprado Nao Utilizado

**Identificacao:** Cards na secao "Acao Necessaria" (ambar) do Meu Hub, ou `user_hub_services` com `sessions_used = 0`.

```
Compra confirmada (webhook Ticto)
    |
    v
D+1: Verificar se card saiu de "Acao Necessaria"
    |
    v (Nao saiu)
D+3: Contato proativo via WhatsApp
    "Ola [nome]! Vi que voce comprou a [servico]. Posso te ajudar a agendar sua sessao?"
    |
    v (Ainda sem acao)
D+7: Escalada — ligar para o cliente
    |
    v (Agendou)
Acompanhar em "Em Andamento" ate sessao acontecer
    |
    v (Sessao realizada)
D+1 pos-sessao: Coletar NPS
    |
    v
Oferta de proximo produto / depoimento
```

**Meta:** > 80% dos servicos comprados devem ser utilizados. Tempo medio compra->primeira sessao: < 7 dias.

---

### 6. Pos-Sessao de Consultoria

1. **D+1**: Enviar pesquisa de satisfacao (NPS 0-10)
2. **D+3**: Se NPS >= 9: pedir depoimento/review
3. **D+3**: Se NPS <= 6: ligar para entender insatisfacao, oferecer recompensacao se cabivel
4. **D+7**: Oferta de proximo produto relevante (ex: se fez Rota60, oferecer LinkedIn Review)
5. **D+14**: Se nao comprou nada: email com conteudo gratuito relacionado ao tema da sessao

---

## Ferramentas Admin

### Paginas que voce vai usar diariamente

| Pagina | URL | Para que serve |
|--------|-----|---------------|
| **Usuarios** | `/admin/usuarios` | Buscar usuario, ver perfil, verificar dados |
| **Assinaturas** | `/admin/assinaturas` | Lista de assinantes, status, plano atual |
| **Saude Assinaturas** | `/admin/subscription-health` | MRR, ativos, dunning, churn, reconciliacao |
| **Leads Dashboard** | `/admin/leads-dashboard` | Leads, temperatura, WhatsApp, CRM completo |
| **Agendamentos** | `/admin/agendamentos` | Bookings, disponibilidade, politicas |
| **Templates Email** | `/admin/email-templates` | Editar conteudo dos emails automaticos |
| **Templates WhatsApp** | `/admin/whatsapp-templates` | Templates de mensagem WhatsApp |
| **Saude do Sistema** | `/admin/saude-sistema` | Status geral, logs de email, status de integracoes |
| **Feedback** | `/admin/feedback` | Feedback dos usuarios |

### Paginas uteis semanalmente

| Pagina | URL | Para que serve |
|--------|-----|---------------|
| **Planos** | `/admin/planos` | Configurar features por plano, limites, precos |
| **Leads** | `/admin/leads` | Lista de leads com filtros avancados |
| **Atividades** | `/admin/atividades` | Log de atividades da plataforma |
| **Pedidos** | `/admin/pedidos` | Historico de compras e pedidos |

---

## Emails Automaticos

### Tabela Completa de Emails

| Trigger | Template | Timing | Conteudo Principal |
|---------|----------|--------|-------------------|
| Usuario completa onboarding | `onboarding_welcome` | Imediato | Boas-vindas, features da plataforma, link para o Hub |
| Assinatura ativada | `subscription_confirmation` | Imediato (via webhook Ticto) | Plano, boas-vindas, CTA "Acessar Meu Hub" |
| Lembrete de renovacao | `subscription_renewal_reminder` | 3 dias antes da cobranca | Data de renovacao, link para gerenciar |
| Pagamento falhou | `subscription_payment_failure` | Imediato (via webhook Ticto) | Explicacao, CTA "Atualizar Cartao" |
| Cancelamento confirmado | `subscription_cancellation` | Imediato | Data de acesso final, CTA "Reativar" |
| Booking criado | `booking_confirmation` | Imediato | Data, hora, mentor, duracao, link |
| 24h antes de sessao | `booking_reminder` | Cron a cada 15 min | Detalhes da sessao, link da reuniao |
| 1h antes de sessao | `booking_reminder_1h` | Cron a cada 15 min | Detalhes da sessao, link da reuniao |
| Booking reagendado | `booking_rescheduled` | Imediato | Data antiga (riscada) + data nova |
| Booking cancelado | `booking_cancelled` | Imediato | Detalhes, motivo (se informado) |
| No-show | `booking_no_show` | Ao marcar no-show | Aviso, lembrete de politica |
| Convite para Espaco | `espaco_invitation` | Ao mentor convidar | Nome do mentor, Espaco, link unico (expira 7 dias) |
| Prime Jobs digest | Automatico | Toda segunda 12h UTC | Vagas curadas da semana |

### Quando um cliente diz que nao recebeu email

Siga esta checklist em ordem:

1. **Spam/lixo eletronico**: Pedir para buscar `noreply@euanapratica.com`
2. **Email correto**: Verificar se o email no perfil e o que o cliente espera
3. **Template habilitado**: `/admin/email-templates` — toggle verde?
4. **Log de envio**: `/admin/saude-sistema` — secao de emails. Aparece como `sent`, `failed` ou `skipped`?
5. **Trigger disparou**: Verificar se o evento que dispara o email realmente ocorreu (booking existe? onboarding completo? assinatura ativa?)
6. **Escalar para dev**: Com user_id, email, template, data/hora aproximada, ID do booking/assinatura

### Editar conteudo de email

Qualquer pessoa com acesso admin pode editar em `/admin/email-templates`:
1. Selecionar o template
2. Editar no editor visual (Unlayer)
3. Salvar — alteracao entra em vigor no proximo envio

Nao precisa de dev nem deploy.

---

## WhatsApp — Guia de Uso

### Como enviar uma mensagem

1. Abrir lead em `/admin/leads-dashboard` e clicar no nome
2. Aba **WhatsApp**
3. Botao verde **"Enviar Mensagem"**
4. Escolher modo:
   - **Texto livre**: digitar a mensagem
   - **Template**: selecionar template, variaveis preenchidas automaticamente, editar se necessario
5. Clicar **Enviar**

### Sugestao por IA

1. Na aba WhatsApp, clicar **"Sugerir WhatsApp"**
2. Aguardar 5-10 segundos
3. IA retorna 2-4 opcoes personalizadas (welcome, follow-up, oferta, reengajamento)
4. Clicar na opcao desejada para copiar para o campo de envio
5. Editar se necessario e enviar

A IA leva em conta mensagens ja enviadas e nunca sugere repeticao.

### Icones de status

| Icone | Significado |
|-------|-------------|
| Um check cinza | Enviado |
| Dois checks cinza | Entregue no celular |
| Dois checks azuis | **Lido** |

### Rotina diaria recomendada

**Manha:**
1. `/admin/leads-dashboard` -> filtrar "quente" e "muito-quente"
2. Verificar respostas da madrugada/manha
3. Responder mensagens pendentes

**Ao receber lead novo:**
1. Abrir ficha -> verificar temperatura, barreiras, produto recomendado
2. "Sugerir WhatsApp" para mensagem ideal
3. Enviar template `lead_welcome` ou sugestao da IA

**Follow-ups:**
- 3 dias sem resposta: template `lead_followup_3d`
- 7 dias sem resposta: template `lead_followup_7d` (inclui link do relatorio)
- Sem resposta apos isso: marcar para automacao ou fluxo frio

### WhatsApp desconectou

Sintomas: mensagens paradas em check cinza, erros ao enviar.

Solucao: avisar o time de Dev. Eles reconectam via QR code em ~5 minutos. **Nao tente resolver sozinho.**

---

## Guided Tour e Primeiros Passos

### O que o usuario novo ve

**Tour Guiado (primeira vez no Hub):**
1. Overlay: "Bem-vindo ao seu Hub!"
2. Spotlight na Comunidade
3. Spotlight no ResumePass AI
4. Spotlight no Title Translator
5. Spotlight no Catalogo
6. Spotlight no Meu Hub
7. "Por onde quer comecar?" com 3 botoes

O usuario pode pular com X. Uma vez visto, nunca mais aparece. No mobile: versao simplificada de 3 telas.

**Checklist "Primeiros Passos" (dias seguintes):**
4 tarefas clicaveis no topo do Hub:
1. Complete seu perfil -> `/perfil`
2. Faca seu primeiro post -> `/comunidade`
3. Analise seu curriculo com IA -> `/curriculo`
4. Explore o catalogo -> `/catalogo`

Cada clique marca como concluido e navega. 4/4 = confetti + card desaparece. Pode fechar com X.

### FAQ para atendimento

- **"Nao vi o tour"**: Aparece UMA vez. Orientar manualmente sobre os menus.
- **"Checklist sumiu"**: Fechou com X ou completou 4/4. Orientar diretamente.
- **"Usuario antigo viu o tour"**: Nao deveria acontecer. Reportar ao dev com email do usuario.
- **"Usuario perdido"**: Verificar se checklist esta visivel. Se sim, direcionar. Se nao, orientar: "Comece pelo ResumePass AI no menu da esquerda".

---

## Meu Hub — Acompanhamento de Servicos

### Secoes do Meu Hub

| Secao | Cor | Quem aparece | Acao do CS |
|-------|-----|-------------|-----------|
| **Acao Necessaria** | Ambar | Comprou mas nao iniciou (sessao nao agendada, curso nao acessado) | Contato proativo — alvo principal de CS |
| **Em Andamento** | Verde | Mentoria ativa, curso em progresso, sessao confirmada | Checar periodicamente, garantir experiencia positiva |
| **Proximos Eventos** | Azul | Eventos futuros, servicos com data programada | Lembrete se nao houver comunicacao automatica |
| **Historico** | Cinza | Sessoes concluidas, cursos finalizados | NPS, oferta de proximo produto, depoimento |
| **Ferramentas do Plano** | Azul | ResumePass, Title Translator (conforme plano) | Mostrar valor do plano |

### Badges de origem

| Badge | Cor | Significado |
|-------|-----|-------------|
| **Comprado** | Roxo | Pagou via Ticto |
| **Incluso no plano** | Azul | Ferramenta da assinatura |

### Cenarios frequentes

- **"Comprei mas nao sei como agendar"**: Direcionar para `/dashboard/hub` -> card ambar -> botao "Agendar Sessao"
- **"Nao vejo meu curso"**: Verificar `user_hub_services` (existe? status ativo?) e `hub_services.is_visible_in_hub`
- **"Comprei dois servicos, so vejo um"**: Verificar se ambos tem `ticto_product_id` e checar `payment_logs`
- **"Meu credito de ResumePass nao aparece"**: Verificar se plano tem feature `resume_pass` habilitada
- **"Quero usar o servico novamente"**: Se re-comprou, `sessions_total` incrementa automaticamente. Se nao, direcionar para nova compra.

---

## Agendamentos — Resolucao de Problemas

### "Nao consigo agendar"

1. Tem acesso ao servico? Se nao, direcionar para `/pricing` ou `/catalogo`
2. Existem mentores atribuidos? Escalar para admin verificar em `/admin/agendamentos` -> Disponibilidade
3. Sem horarios? Mentor pode nao ter configurado, ter bloqueio, ou slots esgotados. Sugerir outro dia/mentor
4. "Limite de agendamentos"? Precisa esperar uma sessao ser concluida/cancelada

### "Nao recebi email de confirmacao/lembrete"

1. Spam/lixo eletronico (`noreply@euanapratica.com`)
2. Email correto no perfil?
3. Template habilitado? (`booking_confirmation`, `booking_reminder`, `booking_reminder_1h`)
4. Booking existe com status correto em `/admin/agendamentos`?
5. Escalar para dev com user_id, email, template, data/hora, booking ID

### "Quero cancelar/reagendar"

- **Cancelar**: Agendamentos -> Proximos -> Cancelar. Se dentro da janela de restricao, admin cancela em `/admin/agendamentos`
- **Reagendar**: Agendamentos -> Proximos -> Reagendar. Limite de reagendamentos por sessao. Se atingiu, cancelar e criar novo.

### "Link da reuniao nao apareceu"

Mentor precisa configurar em Mentor -> Disponibilidade -> Link da Reuniao. Se nao configurou, contatar mentor ou admin configura em `/admin/agendamentos` -> Disponibilidade.

### "Fui marcado como no-show mas participei"

Admin corrige em `/admin/agendamentos` (alterar status).

### "O mentor nao apareceu"

Verificar status em `/admin/agendamentos`. Contatar mentor. Se necessario, admin cancela. Oferecer reagendamento ao aluno.

### Significado dos status

| Status | Significado |
|--------|------------|
| **Confirmado** | Booking 1:1 ativo — aluno e mentor confirmados |
| **Concluida** | Sessao realizada com sucesso |
| **Cancelada** | Cancelada por aluno, mentor ou admin |
| **No-show** | Aluno nao compareceu |
| **Reagendada** | Movida para outra data |

---

## Cenarios Comuns e Como Resolver

### "A plataforma esta fora do ar"

1. Verificar `/admin/saude-sistema` — Status Geral
2. Se vermelho: acionar dev imediatamente
3. Se amarelo: acompanhar, acionar se persistir 24h

### "Meu pagamento foi cobrado mas nao ativou"

1. Verificar `/admin/assinaturas` — status da assinatura
2. Verificar `/admin/subscription-health` — clicar "Reconciliar"
3. Se nao resolver: escalar para dev com email, data da transacao e comprovante

### "Quero trocar de plano"

Atualmente nao ha upgrade/downgrade mid-cycle na UI. Opcoes:
- Cancelar plano atual (mantem acesso ate fim do periodo) e assinar novo plano
- Admin pode ajustar manualmente no banco (escalar para dev)

### "Meu desconto de assinante nao aparece"

Verificar se plano do usuario tem `features.discounts` configurado em `/admin/planos`. Verificar se assinatura esta `active`.

### "Convite de Espaco expirou"

Link expira em 7 dias. Ir ao Espaco no admin -> Membros -> reenviar convite (gera novo link com timer resetado).

### "Nao consigo acessar a Comunidade"

Verificar se o plano tem acesso a comunidade. Se Basico sem acesso: oportunidade de upgrade. Se Pro/VIP: verificar configuracao do servico.

---

## Referencias

Documentacao detalhada por area:

| Area | Documento |
|------|-----------|
| WhatsApp (CS) | `docs/12 Leads e WhatsApp/CUSTOMER_SUCCESS.md` |
| Email (CS) | `docs/08 Email System/customer-success.md` |
| Guided Tour (CS) | `docs/14 Guided Tour/CS - Customer Success.md` |
| Meu Hub (CS) | `docs/18 Meu Hub/CUSTOMER-SUCCESS.md` |
| Agendamentos (Atendimento) | `docs/15 Booking System/CUSTOMER-SERVICE.md` |
| Assinaturas (Tecnico) | `docs/06 Subscription and Ticto/SUBSCRIPTION_SYSTEM.md` |
| Leads Dashboard | `docs/09 Leads Dashboard/LEADS_DASHBOARD_DOCS.md` |
| Email System (CEO) | `docs/08 Email System/ceo.md` |

---

*Documento consolidado em 2026-02-26. Plataforma: hub-euanapratica.*
