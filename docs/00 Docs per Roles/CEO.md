# EUA Na Pratica Hub — Guia do CEO

> Visao estrategica, KPIs e valor de negocio de cada modulo da plataforma.
>
> Ultima atualizacao: 2026-02-26

---

## Sumario

- [Visao Geral da Plataforma](#visao-geral-da-plataforma)
- [Metricas-Chave (KPIs)](#metricas-chave-kpis)
- [Modulos da Plataforma](#modulos-da-plataforma)
  - [Relatorio de Diagnostico (Leads)](#1-relatorio-de-diagnostico-leads)
  - [Leads Dashboard e CRM](#2-leads-dashboard-e-crm)
  - [Assinaturas e Ticto](#3-assinaturas-e-ticto)
  - [Agendamentos e Booking](#4-agendamentos-e-booking)
  - [Cursos](#5-cursos)
  - [Comunidade](#6-comunidade)
  - [Meu Hub](#7-meu-hub)
  - [Prime Jobs](#8-prime-jobs)
  - [ResumePass AI](#9-resumepass-ai)
  - [Title Translator](#10-title-translator)
  - [Content Studio](#11-content-studio)
  - [Lives](#12-lives)
  - [Email System](#13-email-system)
  - [WhatsApp Integration](#14-whatsapp-integration)
  - [Automacoes N8N](#15-automacoes-n8n)
  - [Guided Tour e Primeiros Passos](#16-guided-tour-e-primeiros-passos)
  - [Saude do Sistema](#17-saude-do-sistema)
  - [Custos de API](#18-custos-de-api)
- [Alavancas de Crescimento](#alavancas-de-crescimento)
- [Integracoes Externas](#integracoes-externas)
- [Roadmap e Decisoes Pendentes](#roadmap-e-decisoes-pendentes)
- [Referencias](#referencias)

---

## Visao Geral da Plataforma

O **EUA Na Pratica Hub** e uma plataforma SaaS de carreira voltada para profissionais brasileiros que buscam oportunidades no mercado americano. O publico-alvo sao profissionais de 25-45 anos em transicao de carreira internacional, predominantemente das areas de tecnologia, financas, marketing e engenharia.

A proposta de valor combina **diagnostico de carreira por IA**, **ferramentas de preparacao** (analise de curriculo, traducao de titulos), **mentoria ao vivo** (1:1 e em grupo), **comunidade** entre pares e **curadoria de vagas** (Prime Jobs) — tudo em um unico hub com modelo de assinatura recorrente (Basico gratuito, Pro R$47/mes, VIP R$97/mes).

O motor de aquisicao principal e o **Relatorio de Diagnostico gratuito**: lead preenche formulario de 17 perguntas, recebe relatorio personalizado com score de prontidao, barreiras e recomendacao de produto — convertendo "curiosos" em "compradores informados" em menos de 30 segundos.

---

## Metricas-Chave (KPIs)

| Metrica | Onde Acompanhar | Meta Sugerida |
|---------|----------------|---------------|
| **MRR** (Receita Recorrente Mensal) | `/admin/subscription-health` — card MRR | Crescente MoM |
| **Churn Rate** | `/admin/subscription-health` — card Churn | < 5% mensal |
| **LTV** (Lifetime Value medio) | `/admin/leads-dashboard` — card LTV | > R$500 |
| **Leads/mes** | `/admin/leads-dashboard` — card Total Avaliacoes | > 1.000 |
| **Conversao Lead -> Assinante** | Leads concluidos / novos assinantes | > 5% |
| **Taxa de conclusao de relatorios** | `/admin/leads-dashboard` — Concluidos/Total | > 95% |
| **Custo por relatorio** | `/admin/custos-api` | ~$0.15 USD |
| **Custo total IA/mes** | `/admin/custos-api` — card Este Mes | < $300 USD |
| **Assinantes ativos** | `/admin/subscription-health` — card Ativos | Crescente |
| **Taxa de presenca em sessoes** | `/admin/agendamentos` — concluidas/total | > 50% |
| **Usuarios com servico nao utilizado** | `user_hub_services` com sessions_used=0 | < 20% |
| **D7 Retention** | Analise de logins (Supabase Analytics) | > 40% |
| **NPS** | Pesquisa pos-sessao (a implementar) | > 50 |

---

## Modulos da Plataforma

### 1. Relatorio de Diagnostico (Leads)

**O que e:** Motor de conversao principal. Lead preenche formulario de 17 perguntas, recebe relatorio de 2.500 palavras com score 0-100 em 8 dimensoes (ingles, experiencia, visto, timeline etc.), classificacao na metodologia ROTA (R-O-T-A) e recomendacao personalizada de produto por IA.

**Valor para o negocio:**
- Converte leads frios em prospects qualificados em < 30 segundos
- 92% de acuracia na recomendacao de produto (pos-otimizacao Feb 2026)
- Impacto estimado: +R$6.500/mes de receita por melhor match de produto
- ROI de 13.2x sobre custo operacional (~R$1.400/mes para 1.200 relatorios)
- Versao limitada para leads, completa para assinantes — funciona como funil de upsell

**Onde acompanhar:** `/admin/leads-dashboard`

**KPI:** Taxa de conclusao > 95%, taxa de clique no CTA > 12%, conversao pos-relatorio > 8%

---

### 2. Leads Dashboard e CRM

**O que e:** Painel central de inteligencia sobre leads. Mostra volume, temperatura, barreiras, LTV estimado, produtos sugeridos e tabela de leads com score de prontidao. Integra WhatsApp bidirecional na ficha de cada lead.

**Valor para o negocio:**
- Prioriza abordagem comercial por score e temperatura (quente/morno/frio)
- IA sugere mensagens WhatsApp personalizadas por perfil
- Historico completo de interacoes em um unico lugar
- Dados para decisao de portfolio de produtos

**Onde acompanhar:** `/admin/leads-dashboard`

**KPI:** Leads/mes, LTV medio, tempo de primeiro contato < 1h para leads quentes

---

### 3. Assinaturas e Ticto

**O que e:** Sistema de assinatura em 3 tiers (Basico R$0, Pro R$47/mes, VIP R$97/mes) com ciclos mensal e anual. Pagamentos processados via Ticto (gateway brasileiro). Inclui dunning automatico (3 tentativas + 7 dias de graca), cancelamento self-service com pesquisa de saida e reconciliacao de assinaturas.

**Valor para o negocio:**
- Receita recorrente previsivel (MRR)
- Dunning rettem acesso durante cobranca falha — minimiza churn por atrito
- Pesquisa de cancelamento gera dados para retencao
- Webhook idempotente: nenhum pagamento perdido
- Feature flags por plano permitem diferenciar oferta sem deploy

**Onde acompanhar:** `/admin/subscription-health` (MRR, ativos, dunning, churn), `/admin/planos` (configuracao), `/admin/assinaturas` (lista)

**KPI:** MRR crescente, churn < 5%, assinantes em dunning < 10%

---

### 4. Agendamentos e Booking

**O que e:** Conecta alunos e mentores em 3 formatos: Booking 1:1 (aluno agenda), Sessao em Grupo (mentor cria para Espaco) e Evento Aberto (hotseat, masterclass). Mentores gerenciam propria agenda; admin define politicas globais.

**Valor para o negocio:**
- Bookings vinculados a servicos pagos — mais sessoes = mais conversoes
- Eventos Abertos gratuitos (hotseats) atraem novos leads sem barreira de compra
- Mentores auto-gerenciam agenda — zero gargalo operacional
- 6 emails automaticos (confirmacao, lembretes 24h/1h, reagendamento, cancelamento, no-show)

**Onde acompanhar:** `/admin/agendamentos`

**KPI:** Sessoes concluidas/mes, taxa de no-show < 15%, conversao eventos abertos -> booking pago > 5%

---

### 5. Cursos

**O que e:** Cursos gravados com acompanhamento de progresso, organizados em modulos. Acesso controlado por plano ou compra avulsa. Aparece no Meu Hub com indicador de progresso.

**Valor para o negocio:**
- Conteudo assicrono aumenta valor percebido da assinatura
- Retencao: usuarios com curso em andamento tem menor churn
- Dados de completion rate informam qualidade do conteudo

**Onde acompanhar:** `/admin/cursos`

**KPI:** Completion rate > 40%, cursos iniciados na 1a semana > 30%

---

### 6. Comunidade

**O que e:** Forum social integrado ao Hub. Posts, comentarios, reacoes, gamificacao. Acesso controlado por plano (Pro/VIP ou configuravel).

**Valor para o negocio:**
- Principal hook de retencao — usuarios que postam tem retention 3x maior
- Gera conteudo organico (perguntas reais viram insights para Content Studio)
- Efeito de rede: quanto mais membros, mais valor para cada um

**Onde acompanhar:** Metricas de posts/comentarios via Supabase, aba Comunidade

**KPI:** Posts/semana, usuarios ativos na comunidade, % novos usuarios que postam na 1a semana > 20%

---

### 7. Meu Hub

**O que e:** Centro de acesso unificado (`/dashboard/hub`). Mostra tudo que o usuario possui: servicos comprados, mentorias ativas, cursos em progresso, ferramentas do plano. Organizado em 4 secoes: Acao Necessaria (ambar), Em Andamento (verde), Proximos Eventos (azul), Historico (cinza).

**Valor para o negocio:**
- Reduz "churn passivo" — clientes que esquecem o que compraram
- Card ambar com CTA "Agendar Sessao" reduz intervalo compra->uso de semanas para dias
- Upsell contextual: usuarios que concluiram veem ofertas de proximo produto
- Suporta re-compra do mesmo servico (sessions_total incrementa)

**Onde acompanhar:** Metricas de `user_hub_services` (% utilizado vs comprado)

**KPI:** % servicos utilizados > 80%, tempo medio compra->primeira sessao < 7 dias

---

### 8. Prime Jobs

**O que e:** Curadoria de vagas nos EUA relevantes para o perfil do usuario. VIP recebe 20 vagas curadas/mes. Digest semanal por email toda segunda-feira.

**Valor para o negocio:**
- Diferenciador forte entre Pro e VIP
- Justifica preco premium do VIP
- Engajamento semanal automatico (email digest)

**Onde acompanhar:** Supabase tabela `jobs`

**KPI:** Vagas publicadas/semana, cliques no digest, bookmarks/usuario

---

### 9. ResumePass AI

**O que e:** Analise de curriculo por IA contra job descriptions americanas. Gera score de compatibilidade, sugestoes de melhoria, traducao de titulos e preparacao para entrevista. Modelo de creditos por plano (Basico: 1/mes, Pro: 10/mes, VIP: ilimitado).

**Valor para o negocio:**
- Feature mais popular — principal driver de upgrade Basic->Pro
- Margem > 99% (custo IA ~$0.15/analise vs receita de assinatura)
- Gating server-side impede abuso do free tier
- Relatorios persistentes — valor cumulativo para o usuario

**Onde acompanhar:** `/admin/custos-api` (custo por analise), `usage_logs` (volume)

**KPI:** Analises/mes, conversao free->paid apos hit de limite, custo/analise

---

### 10. Title Translator

**O que e:** Traduz cargos brasileiros para equivalentes americanos com contexto (salario, empresas, descricao). 3 sugestoes ranqueadas com confidence score. Modelo de creditos por plano (Basico: 1/mes, Pro: 10/mes, VIP: ilimitado).

**Valor para o negocio:**
- Resolve dor real (titulo errado = invisivel para recrutadores)
- Custo operacional negligivel (~$0.002/traducao)
- Feature diferenciadora que justifica assinatura
- Fallback multi-provedor (OpenAI + Anthropic) — sem vendor lock-in

**Onde acompanhar:** `/admin/custos-api` (custo)

**KPI:** Traducoes/mes, conversao apos hit de limite

---

### 11. Content Studio

**O que e:** Sistema de geracao de conteudo baseado em IA para redes sociais. Minera dados reais da base (avaliacoes, posts, vagas, cancelamentos) e gera: insights de tendencias, ideias de conteudo com hooks polemicos e roteiros completos para videos verticais (30-60s) e YouTube (8-15min).

**Valor para o negocio:**
- Alimenta marketing de conteudo com dados proprietarios
- Reduz tempo de criacao de conteudo de horas para minutos
- Hooks baseados em dados reais aumentam potencial de viralidade
- Calendario editorial integrado
- Cron semanal automatico (insights toda segunda)

**Onde acompanhar:** `/admin/content-studio`, `/admin/custos-api`

**KPI:** Conteudos publicados/semana, custo LLM por roteiro, engagement nas redes

---

### 12. Lives

**O que e:** Sistema de eventos ao vivo criados por mentores com autonomia total. 5 modelos de acesso: gratuita (topo de funil), paga (receita avulsa via Ticto), assinantes, Pro-only, VIP-only. Landing page com slug customizavel (`/live/minha-live`).

**Valor para o negocio:**
- Lives gratuitas = captacao de leads (login obrigatorio = email capturado)
- Lives pagas = receita avulsa sem comprometer assinatura
- Lives exclusivas por plano = retencao + FOMO para upgrade
- Mentores criam sem depender do admin = escala operacional

**Onde acompanhar:** `/mentor/lives` (mentor), `/admin` + tabela `lives` (admin)

**KPI:** Lives criadas/mes, taxa de inscricao > 30% (gratuitas), taxa de presenca > 50%, conversao pos-live > 5%

---

### 13. Email System

**O que e:** Sistema centralizado de templates de email editaveis via admin (Unlayer WYSIWYG), sem deploy. 12 templates cobrindo onboarding, assinaturas, bookings e convites. Envio via Resend.

**Valor para o negocio:**
- Marketing/CS atualizam emails sem depender de dev
- Cada template pode ser ativado/desativado individualmente
- Triggers automaticos: welcome (onboarding), booking (criacao/lembretes/cancelamento), assinatura (ativacao/falha/cancelamento), convite de espaco
- Lembretes de booking rodam a cada 15 minutos via cron

**Onde acompanhar:** `/admin/email-templates`, `/admin/saude-sistema` (logs)

**KPI:** Taxa de entrega > 95%, emails falhados < 5%

---

### 14. WhatsApp Integration

**O que e:** Canal bidirecional de WhatsApp integrado ao CRM. Admin envia e recebe mensagens na ficha do lead. IA sugere mensagens personalizadas. Status de entrega e leitura rastreados. Evolution API open-source rodando em VPS Hostinger.

**Valor para o negocio:**
- Substitui contato via celular pessoal — historico centralizado para toda equipe
- IA personaliza mensagens por nome, area, barreiras e temperatura
- Status de leitura indica engajamento do lead
- Templates prontos reduzem tempo de resposta

**Onde acompanhar:** Ficha de cada lead em `/admin/leads-dashboard`, tabela `whatsapp_logs`

**KPI:** Mensagens enviadas/semana, taxa de leitura, taxa de resposta, tempo medio de primeiro contato

**Custo:** VPS ~R$80-150/mes + chip dedicado (operadora)

---

### 15. Automacoes N8N

**O que e:** Camada de automacao que recebe webhooks das Edge Functions e orquestra acoes multicanal: alertas Telegram, WhatsApp, emails e tarefas CRM. 5 fluxos configurados: subscription lifecycle, report ready notification, high value lead alert, drip campaigns, lead scoring/routing.

**Valor para o negocio:**
- Automacoes sem codigo (GUI visual)
- Webhook dispatch fire-and-forget (nao bloqueia fluxo principal)
- Admin configura automacoes em `/admin/automacoes` (toggle, webhook URL, logs)
- N8N roda no mesmo VPS da Evolution API (custo zero adicional)

**Onde acompanhar:** `/admin/automacoes`, N8N dashboard (`n8n.euanapratica.com`)

**KPI:** Automacoes ativas, taxa de sucesso de webhooks

---

### 16. Guided Tour e Primeiros Passos

**O que e:** Tour interativo com spotlight no primeiro acesso ao Hub (7 etapas) + checklist "Primeiros Passos" persistente com 4 acoes-chave (perfil, comunidade, curriculo, catalogo). Confetti ao completar 4/4.

**Valor para o negocio:**
- Reduz "time to value" — usuario descobre ResumePass AI em < 2 minutos
- Direciona para features de maior retencao (Comunidade, analise de curriculo)
- Esperado: +30% retencao D7 vs baseline

**Onde acompanhar:** Observacional (metricas de uso do ResumePass e Comunidade na 1a semana)

**KPI:** % usuarios que usam ResumePass na 1a semana > 40%, posts na Comunidade > 20%

---

### 17. Saude do Sistema

**O que e:** Painel centralizado de monitoramento: status geral (verde/amarelo/vermelho), status de cada integracao (Supabase, OpenAI, Anthropic, Resend, Ticto), metricas de email (24h e 7d), webhooks de pagamento e 10 verificacoes detalhadas.

**Valor para o negocio:**
- Visao unica de tudo que esta funcionando — substitui logs, planilhas e ferramentas externas
- Health Check automatico via N8N diariamente
- Identifica problemas antes que clientes reportem

**Onde acompanhar:** `/admin/saude-sistema`

**KPI:** Status geral = Verde, taxa de sucesso de emails > 95%

---

### 18. Custos de API

**O que e:** Rastreamento em tempo real de gastos com IA por funcao, provedor e usuario. Cards de resumo (hoje, 7d, 30d), grafico de tendencia diaria, custo por funcionalidade, custo por provedor (OpenAI, Anthropic, OpenRouter), top 10 consumidores.

**Valor para o negocio:**
- Controle de orcamento: custo exato por funcionalidade e por mes
- Identifica anomalias (picos inesperados = bug ou uso indevido)
- Dados reais para decisao de troca de modelo/provedor
- Tabela de precos editavel sem deploy

**Onde acompanhar:** `/admin/custos-api`

**KPI:** Custo total/mes < $300 USD, custo/relatorio ~$0.15

---

## Alavancas de Crescimento

### 1. Relatorio como Funil de Aquisicao
O relatorio de diagnostico gratuito e o principal canal de entrada. A versao limitada mostra score e forca, mas bloqueia recomendacoes detalhadas, plano de acao 90d/6m e checkpoints. CTA de unlock direciona para `/assinar` e `/consultoria`.

### 2. Upsell por Limites de Credito
ResumePass AI e Title Translator tem limites por plano. Quando o usuario atinge o limite, ve modal de upgrade com comparativo de planos. Cada uso do free tier e uma oportunidade de conversao.

### 3. Lives como Topo de Funil
Lives gratuitas captam emails (login obrigatorio). Pos-live e o momento ideal para upsell de consultoria, mentoria ou plano.

### 4. Drip Campaigns via N8N
Sequencia automatizada: relatorio gerado -> teaser WhatsApp (sem link, pergunta "SIM") -> link do relatorio (apos resposta) -> email com relatorio (fallback 24h) -> follow-up 3d -> follow-up 7d.

### 5. WhatsApp Teasers
Estrategia de engajamento: mensagem teaser que gera curiosidade ("seu relatorio ficou pronto, quer ver?") tem taxa de resposta superior a envio direto de link.

### 6. Eventos Abertos como Conversao
Hotseats e masterclasses gratuitos atraem leads. Alunos que assistem tem maior propensao a agendar consultoria paga — funil natural.

### 7. Comunidade como Retencao
Usuarios que postam na comunidade na primeira semana tem retencao significativamente maior. Checklist "Primeiros Passos" direciona para primeiro post.

### 8. Partner Ecosystem (Planejado)
16 ideias estrategicas no Idea Kanban para monetizacao via parceiros: affiliate (escolas de ingles, advogados de imigracao), B2B lead marketplace, sponsored content, mentor marketplace externo. Potencial: R$78-208K/mes adicional.

---

## Integracoes Externas

| Servico | Proposito | Custo Estimado | Quem Gerencia |
|---------|-----------|---------------|---------------|
| **Supabase** | Banco de dados, auth, storage, edge functions | ~$25 USD/mes (Pro) | Dev |
| **OpenAI** | Analise de curriculo, relatorio de lead, traducao de titulo | ~$180 USD/mes | Dev (chaves em `/admin/configuracoes-apis`) |
| **Anthropic** | Fallback LLM, recomendacao de produto, sugestoes WhatsApp | ~$50 USD/mes | Dev |
| **OpenRouter** | Provedor LLM alternativo (Gemini etc.) | Variavel | Dev |
| **Resend** | Envio de emails transacionais | Free tier (ate 100/dia) ou ~$20/mes | Admin (`api_configs`) |
| **Ticto** | Gateway de pagamentos (assinaturas e compras avulsas) | Taxa por transacao | Admin/Financeiro |
| **Evolution API** | WhatsApp bidirecional (open-source, VPS) | R$80-150/mes (VPS) | Dev |
| **N8N** | Automacoes e workflows (open-source, Docker) | $0 (mesmo VPS) | Dev/Admin |
| **Hostinger VPS** | Hospedagem Evolution API + N8N | ~R$80-150/mes | Dev |

**Custo mensal total de infra:** ~$300-400 USD (R$1.600-2.200)

---

## Roadmap e Decisoes Pendentes

### Decisoes de Curto Prazo

- [ ] **Atribuicao UTM**: Colunas existem no banco mas N8N nao popula. Impacto: nao conseguimos calcular CAC por canal. Esforco: 2-4h de dev.
- [ ] **Reconciliacao automatica de assinaturas**: Hoje e manual. Adicionar cron job diario.
- [ ] **Analytics de Title Translator e ResumePass**: Dashboard de conversao free->paid apos hit de limite.
- [ ] **Numero empresarial de WhatsApp**: Migrar de chip pessoal para numero dedicado da empresa.

### Decisoes de Medio Prazo

- [ ] **A/B test de prompts**: Testar diferentes prompts de recomendacao para otimizar conversao.
- [ ] **Email de nurturing pos-relatorio**: Sequencia automatizada 3d/7d/14d.
- [ ] **Trial period**: 7 dias gratis antes da primeira cobranca.
- [ ] **Upgrade/downgrade mid-cycle**: Troca de plano com pro-rata.
- [ ] **NPS automatizado**: Pesquisa pos-sessao e pos-curso.

### Decisoes de Longo Prazo

- [ ] **Partner Ecosystem**: Pilotar 1 affiliate (escola de ingles ou advogado de imigracao).
- [ ] **Expansao multilingual**: Relatorios em ingles/espanhol para mercado LATAM.
- [ ] **Mentor Marketplace externo**: Abrir infraestrutura para coaches vetados (20-30% comissao).
- [ ] **Churn prediction**: Modelo ML para identificar assinantes em risco.
- [ ] **Migracao N8N -> Edge Functions**: Avaliar quando volume exceder 5.000 relatorios/mes.

### Questoes em Aberto

- [ ] Consentimento LGPD para compartilhamento de dados de leads com parceiros?
- [ ] Foco Brasil ou expansao internacional do ecossistema?
- [ ] Portal self-serve para parceiros ou gestao manual primeiro?
- [ ] Quais verticais buscar com exclusividade (category lock-in)?

---

## Referencias

Documentacao detalhada por modulo:

| Modulo | Documentacao |
|--------|-------------|
| Relatorio de Diagnostico | `docs/02 Report Import and Output/LEAD_REPORT_CEO_EXECUTIVE_SUMMARY.md` |
| Leads Dashboard | `docs/09 Leads Dashboard/LEADS_DASHBOARD_DOCS.md` |
| Assinaturas e Ticto | `docs/06 Subscription and Ticto/SUBSCRIPTION_SYSTEM.md` |
| Agendamentos | `docs/15 Booking System/CEO.md` |
| Meu Hub | `docs/18 Meu Hub/CEO.md` |
| ResumePass AI | `docs/03 Resume Pass/resumepass-ceo.md` |
| Title Translator | `docs/04 Title Translator/title_translator_ceo.md` |
| Content Studio | `docs/20 Content Studio/ADMIN.md` |
| Lives | `docs/21 Lives System/CEO.md` |
| Email System | `docs/08 Email System/ceo.md` |
| WhatsApp | `docs/12 Leads e WhatsApp/CEO.md` |
| Automacoes N8N | `docs/n8n/setup-guide.md` |
| Guided Tour | `docs/14 Guided Tour/CEO - Visao Estrategica.md` |
| Saude do Sistema | `docs/03 System Health Dashboard/CEO.md` |
| Custos de API | `docs/10 API Cost Tracking/CEO.md` |
| Partner Ecosystem | `docs/13 Partner Ecosystem/CEO.md` |
| Idea Kanban | `docs/idea-kanban.md` |

---

*Documento consolidado em 2026-02-26. Plataforma: hub-euanapratica.*
