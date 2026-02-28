# Sistema de Lives — Visao Executiva (CEO)

> **Resumo**: O Sistema de Lives permite que mentores criem eventos ao vivo de forma autonoma, sem depender do admin. Suporta lives gratuitas (captacao de leads), pagas (receita avulsa) e exclusivas para assinantes Pro/VIP (retencao). O impacto principal e dar escala a geracao de leads e engajamento, ao mesmo tempo que reduz a carga operacional do admin.

---

## O Problema que Resolve

Antes, criar uma live exigia que o **admin**:
1. Criasse um `hub_service` (tipo `live_event`)
2. Vinculasse a um Espaco
3. Criasse sessoes dentro do Espaco
4. Concedesse acesso via `user_hub_services`

**Resultado**: Processo pesado demais para algo que deveria ser agil. Mentores nao conseguiam criar lives por conta propria, limitando a frequencia de eventos e a captacao de leads.

---

## O que Muda

| Antes | Depois |
|-------|--------|
| Somente admin cria lives | Mentor cria com autonomia total |
| Processo de 4 etapas via admin | Formulario unico em `/mentor/lives/nova` |
| Sem landing page propria | Cada live tem landing page com slug customizavel (`/live/minha-live`) |
| Apenas acesso por servico | 5 modelos de acesso: gratuita, paga, assinantes, pro, vip |
| Sem metricas de inscricao | Dashboard com inscritos, presenca e status em tempo real |

---

## Modelos de Acesso e Estrategia de Negocio

| Modelo | Quem Acessa | Estrategia |
|--------|-------------|-----------|
| **Gratuita** | Qualquer usuario logado | Captacao de leads, brand awareness, topo de funil |
| **Paga** | Quem comprar via Ticto | Receita avulsa por evento (one-shot) |
| **Assinantes** | Qualquer assinatura ativa | Retencao — "sua assinatura inclui lives exclusivas" |
| **Pro** | Plano Pro ou VIP | Upsell de Basico → Pro |
| **VIP** | Apenas plano VIP | Exclusividade, justifica preco premium |

---

## Fluxo do Usuario

### Mentor
1. Acessa `/mentor/lives` → clica "Criar Live"
2. Preenche: titulo, descricao, data/hora, duracao, link da reuniao, tipo de acesso
3. Se paga: informa preco e dados do Ticto
4. Publica → live aparece em `/lives` e na landing page `/live/slug`
5. No dia: clica "Go Live" → status muda para "Ao Vivo"
6. Apos: clica "Encerrar" → pode adicionar URL de gravacao

### Aluno/Lead
1. Descobre a live em `/lives` (pagina de discovery)
2. Clica no card → landing page com detalhes, descricao longa, info do mentor
3. CTA dinamico:
   - Gratuita → "Inscreva-se Gratuitamente"
   - Paga → "Comprar Acesso (R$ X)" → redireciona para Ticto
   - Assinante sem plano → "Assine para Participar" → `/pricing`
   - Pro/VIP sem plano suficiente → "Faca Upgrade" → `/pricing`
   - Vagas esgotadas → "Vagas Esgotadas" (desabilitado)
4. Apos inscricao → live aparece no "Meu Hub" com card dedicado
5. No dia → card mostra "Entrar Agora" com link direto para a reuniao

---

## Impacto Esperado no Negocio

### Geracao de Leads
- Lives gratuitas atraem usuarios que ainda nao compraram nada
- Login obrigatorio = captura de email garantida
- Pos-live: oportunidade de upsell (consultoria, mentoria, plano)

### Receita Direta
- Lives pagas geram receita avulsa sem comprometer a assinatura
- Ticto processa pagamento, webhook concede acesso automaticamente
- Historico de compra aparece em "Meus Pedidos"

### Retencao e Upsell de Plano
- Lives exclusivas para assinantes justificam o valor da assinatura
- Lives "Pro only" criam FOMO e motivam upgrade de Basico → Pro
- Lives "VIP only" reforçam a exclusividade do tier premium

### Escala Operacional
- Mentores criam lives sem depender do admin
- Admin mantem visibilidade total (pode editar/deletar qualquer live)
- Reduz gargalo operacional e aumenta frequencia de eventos

---

## KPIs para Acompanhar

| KPI | Onde Medir | Meta Inicial |
|-----|-----------|-------------|
| Lives criadas/mes | `SELECT COUNT(*) FROM lives WHERE created_at > now() - interval '30 days'` | 4+ por mentor ativo |
| Taxa de inscricao | Inscritos / Visualizacoes da landing page | > 30% para gratuitas |
| Taxa de presenca | `attended=true` / total inscritos | > 50% |
| Conversao pos-live | Compras dentro de 7 dias apos live | > 5% |
| Receita de lives pagas | `SELECT SUM(amount) FROM orders WHERE product_type='one_time_service'` filtrado por live | Crescente MoM |

---

## Paginas Criadas

| Pagina | URL | Quem Ve |
|--------|-----|---------|
| Discovery | `/lives` | Todos (student, mentor, admin) |
| Landing Page | `/live/:slug` | Todos |
| Minhas Lives (mentor) | `/mentor/lives` | Mentor, Admin |
| Criar Live | `/mentor/lives/nova` | Mentor, Admin |
| Detalhe da Live | `/mentor/lives/:id` | Mentor, Admin |
| Editar Live | `/mentor/lives/:id/editar` | Mentor, Admin |

---

## Integracao com o Hub

Quando um usuario se inscreve em uma live, ela aparece automaticamente na secao "Minhas Lives" do Meu Hub (`/dashboard/hub`), com:
- Status visual: azul (agendada), vermelho pulsante (ao vivo), cinza (concluida)
- CTA contextual: "Ver Detalhes", "Entrar Agora", "Ver Gravacao"
- Data/hora formatada em portugues
