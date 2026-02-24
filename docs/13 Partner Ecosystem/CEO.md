# Partner Ecosystem & Idea Kanban — Visao Executiva

**Data:** 2026-02-23
**Status:** Implementado (Kanban + 16 ideias seed do ecossistema de parceiros)

---

## O que e

O **Idea Kanban** e a ferramenta de gestao do pipeline de ideias de negocio da plataforma, agora conectada ao banco de dados Supabase. Ele foi populado com **16 ideias estrategicas** extraidas do documento de Estrategia de Ecossistema de Parceiros, organizadas em 5 canais de receita.

> Tese central: nao somos apenas uma plataforma de carreira — somos um **motor de leads qualificados** para todo o ecossistema de servicos profissionais Brasil-EUA.

---

## Acesso

- **Menu:** Admin > GESTAO DO NEGOCIO > Idea Kanban
- **URL:** `/admin/idea-kanban`
- **Permissao:** Apenas admins

---

## O que mudou

| Antes | Agora |
|---|---|
| Dados no navegador (localStorage) | Dados no Supabase (persistente, multi-dispositivo) |
| 6 ideias de exemplo genericas | 16 ideias estrategicas do Partner Ecosystem |
| Tags genericas (Hardware, Mobile) | Tags de negocios (Affiliate, LeadGen, Data, Ads) |
| Perdia dados ao limpar cache | Dados seguros no banco de dados |

---

## Canais de Receita — 16 Ideias no Kanban

### Canal 1: Affiliate & Referral (6 ideias)

| Ideia | Parceiros-alvo | Barreira | Modelo | Est. Mensal |
|---|---|---|---|---|
| **Escolas de Ingles** | Cambly, EF, Open English, Wise Up | Ingles | CPA R$50-150 ou 15-25% rev-share | R$5-15K |
| **Advogados de Imigracao** | Escritorios O1/EB/L1 | Visto | CPA R$300-800/consulta | R$8-20K |
| **Servicos de Curriculo** | TopResume, ZipJob | Gap do curriculo | CPA R$100-200 ou 20% rev-share | R$3-8K |
| **Credenciamento US** | WES, ECE | Credenciais | CPA R$50-100/aplicacao | R$2-5K |
| **Servicos de Relocacao** | Housing, banking, SIM | ROTA A (pronto p/ mudar) | CPA R$100-300 | R$4-10K |
| **LinkedIn Coaching** | Coaches independentes | Perfil profissional | CPA ou 20% rev-share | R$3-8K |

**Subtotal estimado: R$25-66K/mes**

### Canal 2: B2B Lead Marketplace (1 ideia)

Venda de leads qualificados com 80+ campos de profiling — 5-10x mais valiosos que um form fill.

| Segmento comprador | Preco/Lead | Volume mensal |
|---|---|---|
| Escritorios de imigracao | R$300-600 | 50-150 leads |
| Escolas de ingles | R$50-120 | 200-500 leads |
| Agencias de recrutamento US | R$200-500 | 30-80 leads |
| Consultores financeiros | R$150-300 | 40-100 leads |
| Programas MBA/universidades | R$200-400 | 20-50 leads |

**Subtotal estimado: R$20-60K/mes**

### Canal 3: Advertising & Sponsored Content (3 ideias)

| Ideia | Oportunidade | Modelo |
|---|---|---|
| **Native Ads nos Touchpoints de IA** | Recomendacoes de parceiros nos resultados de analise de curriculo, traducao de titulo, relatorio de carreira | CPA/CPC/CPM |
| **Sponsored Learning Spaces** | Parceiros criam espacos branded (ex: "Financial Planning for Immigrants") | Sponsorship R$2-8K/mes + leads |
| **Sponsored Prime Jobs** | Vagas patrocinadas/destacadas | CPC/CPL |

**Subtotal estimado: R$5-15K/mes**

### Canal 4: Lead Generation as a Service (2 ideias)

| Ideia | Como funciona | Receita |
|---|---|---|
| **Co-Branded Evaluation Funnels** | Parceiro promove funil co-branded, nos capturamos dados, leads matching vao para ambos | Setup R$3-8K + R$50-300/lead |
| **API Access & Partner Dashboards** | Acesso API ao scoring de leads, webhooks, dashboards white-label | Subscription mensal |

**Subtotal estimado: R$15-40K/mes at scale**

### Canal 5: External Mentor Marketplace (1 ideia)

Abrir a infraestrutura de mentoria para coaches externos vetados. Plataforma cobra 20-30% de comissao.

| Tier | Fee | Comissao |
|---|---|---|
| Basic Mentor | So comissao | 25% |
| Featured Mentor | R$300/mes | 20% |
| Partner Mentor | R$600/mes | 15% |

**Subtotal estimado: R$8-12K/mes (100 bookings/mes)**

### Estrutura: Partner Program Tiers (1 ideia)

| Tier | Fee Mensal | Beneficios |
|---|---|---|
| Referral Partner | Gratis (rev-share) | Listado no hub_services, AI recommendations, analytics basico |
| Growth Partner | R$500/mes + rev-share | Conteudo co-branded, community, lead notifications, reports |
| Strategic Partner | R$2K/mes + rev-share | Espaco branded, API, featured placement, lead funnel |
| Enterprise | Custom | White-label, bulk leads, exclusividade por categoria |

### Long-Term: Data & Intelligence (1 ideia)

Monetizar dataset proprietario de career evaluations: relatorios de tendencias, salary benchmarking, skill gap analysis.

**Subtotal estimado: R$5-15K/mes (Q3/Q4 2026)**

---

## Receita Total Potencial

```
Affiliate Referrals .......... R$25-66K/mes
B2B Lead Marketplace ......... R$20-60K/mes
Advertising & Sponsored ...... R$5-15K/mes
Lead Gen as a Service ........ R$15-40K/mes
Mentor Marketplace ........... R$8-12K/mes
Data & Intelligence .......... R$5-15K/mes
                               ─────────────
TOTAL ........................ R$78-208K/mes
```

> Este valor e **adicional** as receitas atuais de subscricoes e servicos do Hub.

---

## Quick Wins — Por Onde Comecar

| Prioridade | Iniciativa | Esforco | Impacto | Acao Imediata |
|---|---|---|---|---|
| 1 | Affiliate Escolas de Ingles | Baixo | Alto | Contatar 2-3 escolas esta semana |
| 2 | Affiliate Advogados de Imigracao | Baixo | Muito Alto | 1 firma, testar conversao |
| 3 | Sponsored Prime Jobs | Baixo | Medio | Outreach 5 empresas US |
| 4 | External Mentor Marketplace | Medio | Alto | Convidar 5 coaches vetados |
| 5 | Co-Branded Evaluation Funnels | Medio | Muito Alto | 1 parceiro piloto |
| 6 | B2B Lead Sale Pilot | Medio | Muito Alto | 1 escritorio de imigracao |

---

## Vantagem Competitiva (Moat)

- **AI Lead Scoring** — 80+ campos de avaliacao + profiling IA que parceiros nao replicam
- **Infraestrutura de nurturing** — WhatsApp + Email aquecem leads antes de passar ao parceiro
- **Community stickiness** — gamificacao mantem usuarios engajados, aumentando exposicao de parceiros
- **AI cost-optimized** — sistema de fallback + cost tracking habilitam margens competitivas
- **First-party data** — sem dependencia de cookies de terceiros ou plataformas de ads

---

## Questoes em Aberto para Decisao

- [ ] Temos consentimento explicito para compartilhar dados de leads com terceiros? (LGPD)
- [ ] Qual nosso volume mensal de leads? (Viabilidade do B2B lead sales)
- [ ] Foco Brasil ou expandir ecossistema internacionalmente?
- [ ] Qual split de comissao ideal para o mentor marketplace?
- [ ] Portal self-serve para parceiros ou gestao manual primeiro?
- [ ] Quais verticais buscar com exclusividade (category lock-in)?
- [ ] Conflitos competitivos entre parceiros (ex: 2 escolas de ingles)?

---

## Proximos Passos

1. **Validar demanda** — conversar com 3-5 parceiros potenciais antes de construir qualquer coisa
2. **Mapear linguagem de consentimento** — revisar formulario de career evaluation para opt-in de compartilhamento
3. **Definir pitch deck** — volume de leads, metricas de qualidade, metodologia de scoring
4. **Escolher 1 Quick Win** — pilotar 30 dias com 1 parceiro
5. **Configurar tracking** — definir KPIs: leads referidos, taxa de conversao, receita por parceiro

---

## Como Usar o Kanban

1. Acesse `/admin/idea-kanban`
2. As 16 ideias estao na coluna **Raw Spark** (ideias brutas)
3. Clique em qualquer card para ver detalhes completos (one-liner, problema, persona, modelo de receita, assets existentes, notas)
4. Arraste cards entre colunas conforme progridem: Spark > Qualified > Validated > Designed > Active
5. Use o filtro **Most Promising** para ver as ideias com score >= 4 estrelas
6. Cards com ponto verde = bem preenchidos; amarelo = parciais; vermelho = precisam de mais informacao

---

*Documentacao gerada em 2026-02-23. Plataforma: hub-euanapratica.*
