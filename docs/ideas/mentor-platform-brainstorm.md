# Mentor Platform — Brainstorm Completo

## Visao Geral

Plataforma separada do ENP Hub, focada exclusivamente em mentores como clientes (B2B SaaS global).
O mentor paga para ter ferramentas de captura, gestao e acompanhamento de alunos.
Nao e uma plataforma de cursos. E um ecossistema onde mentoria acontece.

---

## Problema que Resolve

Mentores independentes montam um Frankenstein: Calendly + Notion + Google Drive + Zoom + Typeform + WhatsApp + planilha.
Nenhuma plataforma resolve mentoria de verdade — todas sao "community + content".
Mentoria 1:1 e grupo com acompanhamento real de progresso? Ninguem faz bem.

---

## Diferencial Competitivo (o que ninguem oferece)

| Feature                              | Concorrentes        | Nossa plataforma |
|--------------------------------------|---------------------|------------------|
| Comunidade + conteudo                | Mighty, Circle, Skool | Igual           |
| Booking 1:1                          | Calendly, Cal.com   | Integrado        |
| AI Coach entre sessoes               | Ninguem             | Diferencial      |
| Resumo pos-sessao personalizado      | Ninguem             | Diferencial      |
| Predicao de churn de aluno           | Ninguem             | Diferencial      |
| AI cria estrutura do espaco          | Ninguem             | Diferencial      |
| WhatsApp nativo como canal           | Ninguem             | Diferencial      |
| Matching mentoria -> vagas           | Ninguem             | Diferencial      |
| Formulario de captura AI + diagnostico | Ninguem           | Killer Feature   |
| Comunidade de mentores (meta-network)| Ninguem             | Moat             |

---

## Analise de Mercado

| Plataforma    | O que faz                     | Comunidade de mentores? | Faturamento est. |
|---------------|-------------------------------|-------------------------|------------------|
| MentorCruise  | Marketplace 1:1 (tech)        | Nao — concorrentes      | ~$5M ARR         |
| Clarity.fm    | Chamadas pagas com experts    | Nao — transacional      | Estagnado        |
| GrowthMentor  | Mentoria para startups        | Slack basico            | ~$2M ARR         |
| ADPList       | Mentoria gratuita (design)    | Mentees, nao mentores   | ~$10M funding    |
| PushFar       | Mentoria corporativa B2B      | Nao — software de RH    | ~$3M ARR         |
| Skool         | Comunidade + gamificacao      | Sem mentoria real       | $100M+ ARR       |
| Circle        | Community white-label         | Sem booking/AI          | ~$20M ARR        |
| Mighty Networks | Comunidade + cursos         | Pesado, sem AI          | ~$50M ARR        |
| Kajabi        | Cursos + funil de vendas      | Infoprodutores          | $100M+ ARR       |

**Gap**: Ninguem combina ferramenta + AI + comunidade de mentores.

---

## Modelo de Negocio

```
Free       -> 1 espaco, 5 alunos, booking basico
Pro ($49)  -> espacos ilimitados, AI coach, WhatsApp flows, analytics, formulario captura (50 leads/mes)
Scale($149)-> multi-mentor, paywall, white-label, API, formulario avancado (500 leads/mes)
```

---

## Features MVP (para Founding Mentors)

### Sprint 1 — Fundacao (semana 1-2)
- Auth (login, registro, roles: mentor/student/admin)
- Dashboard layout + navegacao
- Perfil do mentor

### Sprint 2 — Espacos (semana 2-3)
- Criar espaco (nome, descricao, categoria, cover)
- Convidar alunos por email (token flow)
- Aluno aceita convite e entra no espaco
- Lista de membros do espaco

### Sprint 3 — Conteudo (semana 3-4)
- Criar modulos dentro do espaco
- Adicionar licoes (texto, link, arquivo)
- Aluno marca como concluido
- Progress bar por modulo

### Sprint 4 — Sessoes + Booking (semana 4-5)
- Disponibilidade do mentor (horarios semanais)
- Aluno agenda 1:1
- Sessao ao vivo no espaco (link externo Zoom/Meet)
- Emails de confirmacao e lembrete

### Sprint 5 — Polish para Beta (semana 5-6)
- Dashboard do mentor (membros ativos, progresso, proximas sessoes)
- Dashboard do aluno (meus espacos, proximas sessoes, progresso)
- Mobile responsive
- Onboarding wizard do mentor

### Sprint 6 — Form Builder + AI Diagnostico (semana 6-8)
- Mentor configura formulario (drag & drop ou template pronto)
- Define perguntas + pesos para scoring
- AI gera mini-relatorio baseado nas respostas
- Lead recebe relatorio + CTA de booking
- Mentor ve leads no dashboard com score + respostas
- Link publico compartilhavel

---

## Features Futuras (pos-MVP)

### AI Coach Assistente do Mentor
- AI que conhece cada aluno (cruza diagnostico + atividade + presenca)
- Resumo inteligente pos-sessao (transcreve, extrai action items)
- "Mentor AI" entre sessoes (chatbot treinado com conteudo do mentor)
- Insights de engajamento preditivo (alerta risco de abandono)

### Learning Paths
- Modulos sequenciais com pre-requisitos
- Certificado automatico (PDF com QR code verificavel)
- Progress tracking visual estilo Duolingo

### Accountability & Gamificacao
- Check-ins semanais automaticos via WhatsApp
- Streak de engajamento
- Ranking de progresso (opt-in)
- Metas e OKRs por aluno

### Monetizacao para o Mentor
- Paywall por espaco (mensal ou unico, plataforma fica com %)
- Upsell automatico (workshop gratuito -> mentoria grupo -> 1:1)
- Pacotes de sessoes com desconto
- Produtos digitais dentro do espaco

### Comunidade dentro do Espaco
- Feed de discussao (posts + comentarios por espaco)
- Q&A com upvote (AI sugere respostas)
- Peer review de tarefas
- Eventos ao vivo integrados (Zoom/Meet)

### Multi-Mentor / Co-Mentoria
- Espaco com multiplos mentores (lead, guest, assistant)
- Sessoes com convidados
- Handoff entre mentores

### Integracao com Mercado de Trabalho
- Matching AI (perfil do aluno -> vagas compativeis)
- Portfolio automatico (compila entregas do aluno)
- Carta de recomendacao AI-assisted

---

## Oportunidades Estrategicas

### 1. Aluno como Canal de Aquisicao
- Aluno termina mentoria -> vira mentor -> cria espacos na plataforma
- Diagnostico AI compartilhavel (modelo Spotify Wrapped)
- Resultado "instagramavel" gera leads organicos

### 2. Marketplace de Mentores (longo prazo)
- Plataforma traz alunos para o mentor (modelo Airbnb)
- Paginas publicas de mentores indexaveis (SEO)
- Comissao 10-15% sobre conversoes do marketplace

### 3. Dados Agregados como Produto
- Maior dataset de diagnosticos profissionais do mercado
- Relatorios anuais "State of Mentoring"
- Empresas de RH e consultorias pagariam por insights

### 4. Certificacoes e Credenciais
- Mentor recebe certificacao verificavel na plataforma
- Aluno recebe certificado LinkedIn-ready com QR code
- Organizacoes criam programas de certificacao

### 5. B2B / Enterprise ($5k-50k/ano)
- Programas de mentoring corporativo (senior -> junior)
- SSO, dashboard de RH, matching AI, relatorios de ROI
- Multi-tenant desde o inicio (campo tenant_id)

### 6. API / Embed (plataforma)
- Embed do formulario no site do mentor
- Embed do booking widget
- Zapier/Make integration

### 7. Comunidade de Mentores (meta-network — o moat)
- Forum entre mentores (nao alunos)
- Templates compartilhaveis de espacos
- Marketplace de templates
- Eventos da comunidade (webinars, masterclasses)

---

## Network Effects (3 camadas)

```
Camada 1: Mentor -> Aluno
  Mentor usa plataforma -> aluno indica -> mais alunos

Camada 2: Mentor -> Mentor
  Mentor compartilha template -> outros usam -> plataforma melhora

Camada 3: Ecossistema -> Mercado
  Mais mentores -> mais dados -> mais credibilidade -> mais empresas
```

---

## Fases de Crescimento

| Fase | Foco                  | Receita                    |
|------|-----------------------|----------------------------|
| 1    | Ferramenta            | SaaS $49-149/mes           |
| 2    | Aquisicao (form AI)   | Upgrade driver             |
| 3    | Marketplace           | Comissao 10-15%            |
| 4    | Dados                 | Relatorios B2B             |
| 5    | Enterprise            | Contratos $5k-50k/ano      |
| 6    | Plataforma (API)      | Revenue share              |

---

## Formulario de Captura AI (Killer Feature)

### O que o mentor configura:
- Perguntas do formulario (drag & drop)
- Logica de scoring (pesos por resposta)
- Relatorio/diagnostico AI (template + prompt)
- CTA do relatorio ("Agende sessao gratuita" -> booking integrado)
- Dominio/branding (white-label)
- Follow-up automatico (WhatsApp/email drip)

### Fluxo integrado:
```
Instagram/LinkedIn -> formulario inteligente -> AI diagnostico -> score ->
mentor recebe lead quente -> CTA booking -> espaco de mentoria -> retencao AI
```

### Por que ninguem oferece:
- Typeform/Tally = formulario generico, sem AI
- Calendly = so agendamento
- ManyChat = automacao de chat, sem diagnostico
- Kajabi = funil de curso, nao de mentoria

---

## Modelo mais proximo (fora de mentoria)

**Shopify**: ferramenta + comunidade + app store + capital
**Substack**: ferramenta + network + notes

Nos: ferramenta + AI + comunidade + marketplace de templates

---

## Validacao: Programa Founding Mentors

### Oferta:
- Acesso vitalicio ao plano Pro (lifetime deal)
- Voz direta no roadmap
- Badge "Founding Mentor"
- Onboarding hands-on

### Em troca:
- Usar de verdade com alunos reais
- Feedback semanal (5-10 min, audio WhatsApp)
- Permissao para case study / depoimento
- Compromisso minimo 60-90 dias

### Perfil ideal:
- Ja tem alunos/mentorados ativos
- Usa ferramentas digitais
- Tem dor real ("perco controle com muitos alunos")
- Disponivel para feedback
- Publico diverso (carreira, negocios, tech, vida)

### Sequencia:
- Semana 1: Post no grupo de mentores
- Semana 2-3: Conversa individual, selecionar 5-10
- Semana 4: Onboarding (1 espaco real, 2-3 alunos reais)
- Semana 5-8: Feedback semanal, iteracao rapida
- Semana 9-10: Depoimentos, definir pricing real
- Semana 12: Beta aberto com pricing

---

## Stack Tecnico

- React 18 + Vite + TypeScript
- shadcn/ui + Tailwind
- TanStack Query v5
- Supabase (novo projeto separado — DB, Auth, Edge Functions, Storage)
- Reutiliza: componentes UI, layouts, auth pattern, booking refatorado, email engine

### Codigo reutilizavel do ENP Hub (~60-70%):
- shadcn/ui components (100%)
- DashboardLayout + sidebar (adaptar menu)
- AuthContext + ProtectedRoute (100%)
- TanStack Query patterns (mudar tabelas)
- Tailwind config + design tokens (100%)
- React Hook Form + Zod patterns (100%)
- Espaco CRUD (refatorar, remover FKs ENP)
- Booking system (desacoplar de hub_services)
- Email template engine (trocar templates)

---

## Nomes em Consideracao

### Com "Mentor" no nome:
| Nome        | Logica                                        |
|-------------|-----------------------------------------------|
| Mentorly    | Mentor + ly. Limpo, amigavel, global          |
| Mentorq     | Mentor + Q. Curto, tech                       |
| Mentorzo    | Mentor + zo. Dinamico, energia                |
| Mentoriq    | Mentor + IQ. Inteligencia. AI no DNA          |
| Mentorya    | Mentor + ya. Soa como "mentoria" mas global   |
| Mentornex   | Mentor + next. Proximo nivel                  |
| Mentorva    | Mentor + va (vai). Movimento                  |
| Mentorix    | Mentor + ix. Matrix, tech                     |
| Mentoreo    | Mentor + eo. Soa grego, premium               |
| Mentorkraft | Mentor + kraft (forca em alemao). Artesanal   |
| Comentor    | Co + mentor. Comunidade, juntos               |
| Rementor    | Re + mentor. Reinventar mentoria              |
| Promentor   | Pro + mentor. Para profissionais              |
| Wementor    | We + mentor. Nos mentoramos juntos            |
| Mentflow    | Ment(or) + flow. Fluidez                     |
| Mentora.ai  | Mentora + .ai como extensao                   |
| Mentvox     | Ment + vox (voz). A voz do mentor             |

### Outros criativos:
| Nome     | Logica                                          |
|----------|-------------------------------------------------|
| Beakon   | Beacon (farol) com K. Guiar o caminho           |
| Ignium   | Ignis (fogo em latim). Acender potencial        |
| Zentor   | Zen + mentor. Sabedoria                         |
| Kodan    | Japones para transmissao oral de conhecimento   |
| Torcha   | Tocha — passar conhecimento adiante             |
| Elevo    | Elevar. Curto, forte, multilinguagem            |

---

## Decisoes Pendentes
- [ ] Nome final da plataforma
- [ ] Idioma da UI (PT primeiro ou EN desde o inicio?)
- [ ] Criar projeto Supabase separado
- [ ] Repo separado ou dentro do ENP_HUB
