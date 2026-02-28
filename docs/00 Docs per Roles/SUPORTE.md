# EUA Na Pratica Hub -- Guia do Suporte

> Troubleshooting, FAQ por area e regras de escalacao.
> **Ultima atualizacao:** 2026-02-26

---

## Sumario

1. [Regra de Ouro](#regra-de-ouro)
2. [FAQ por Area](#faq-por-area)
   - [Login e Acesso](#1-login-e-acesso)
   - [Assinatura](#2-assinatura)
   - [Cursos](#3-cursos)
   - [Agendamentos](#4-agendamentos)
   - [Meu Hub](#5-meu-hub)
   - [Comunidade](#6-comunidade)
   - [ResumePass](#7-resumepass)
   - [Pagamento](#8-pagamento)
3. [Glossario de Status](#glossario-de-status)
4. [Quando Escalar](#quando-escalar)
5. [Informacoes para Incluir no Escalonamento](#informacoes-para-incluir-no-escalonamento)
6. [Referencias](#referencias)

---

## Regra de Ouro

> **"Se a solucao exige acesso ao banco de dados ou codigo, escale para CS/Dev."**

O suporte de 1a linha resolve duvidas de uso, orienta navegacao e coleta informacoes para escalonamento. Nunca tente alterar dados diretamente no sistema -- deixe isso para CS (Customer Success) ou Dev.

---

## FAQ por Area

### 1. Login e Acesso

#### "Nao consigo fazer login"

**Passo 1:** Confirmar que o email esta correto (o mesmo usado no cadastro).
**Passo 2:** Orientar o usuario a usar "Esqueci minha senha" em `/esqueci-senha`. Um email de recuperacao sera enviado.
**Passo 3:** Verificar se o email de recuperacao nao foi para a pasta de spam/lixo eletronico. Buscar remetente `noreply@euanapratica.com`.

**Quando escalar:** Se o usuario nao recebe o email de recuperacao apos 15 minutos e ja verificou spam, escale para **Dev** com o email da conta.

#### "Minha conta esta bloqueada"

**Passo 1:** Perguntar se tentou login muitas vezes com senha errada. Supabase pode bloquear temporariamente.
**Passo 2:** Orientar a aguardar 30 minutos e tentar novamente.
**Passo 3:** Se persistir, orientar a usar "Esqueci minha senha" para redefinir.

**Quando escalar:** Se o bloqueio persistir apos reset de senha, escale para **Dev**.

#### "Quero alterar meu email de acesso"

**Passo 1:** Informar que a alteracao de email precisa ser feita pelo admin, pois o email e vinculado a conta de autenticacao.

**Quando escalar:** Sempre escale para **CS/Admin** com: email atual, email desejado, e motivo da troca.

---

### 2. Assinatura

#### "Meu plano nao aparece / nao ativou"

**Passo 1:** Confirmar que o pagamento foi concluido (pedir print do comprovante Ticto, boleto ou Pix).
**Passo 2:** Se pagou via boleto, informar que a compensacao pode levar ate 3 dias uteis.
**Passo 3:** Pedir para recarregar a pagina (`F5` ou `Ctrl+R`) e verificar em `/dashboard/assinatura`.

**Quando escalar:** Se pagamento confirmado e plano nao ativou apos 10 minutos (cartao/Pix) ou 3 dias uteis (boleto), escale para **CS** com: email, plano adquirido, data/hora do pagamento, comprovante.

#### "Estou sendo cobrado mas ja cancelei"

**Passo 1:** Verificar com o usuario se ele cancelou pela plataforma (`/dashboard/assinatura` > "Cancelar Assinatura") ou se apenas parou de usar.
**Passo 2:** Se cancelou pela plataforma, o acesso continua ate o final do periodo pago (`expires_at`). Cobrancias futuras nao devem ocorrer.
**Passo 3:** Se a cobranca veio apos a data de expiracao, coletar dados para escalonamento.

**Quando escalar:** Escale para **CS** com: email, data do cancelamento, data da cobranca indevida, comprovante.

#### "Quero cancelar minha assinatura"

**Passo 1:** Orientar o usuario a acessar `/dashboard/assinatura` e clicar em "Cancelar Assinatura".
**Passo 2:** Informar que o acesso permanece ate o final do periodo pago.
**Passo 3:** O sistema pede feedback em 3 etapas (confirmacao, motivo, conclusao).

**Quando escalar:** Se o botao de cancelar nao funcionar ou nao estiver visivel, escale para **Dev**.

#### "Aparece um banner amarelo/laranja/vermelho sobre pagamento"

**Passo 1:** Explicar que houve uma falha na cobranca automatica. O sistema Ticto esta tentando cobrar novamente.
**Passo 2:** Orientar a clicar em "Atualizar Cartao" no banner para atualizar os dados de pagamento.
**Passo 3:** O acesso e mantido enquanto o banner aparece (dunning). Apenas apos o periodo de graca (7 dias) o acesso e revogado.

**Quando escalar:** Se o usuario atualizou o cartao e o banner nao desapareceu apos 48h, escale para **CS**.

---

### 3. Cursos

#### "O video nao carrega / fica em preto"

**Passo 1:** Pedir para tentar outro navegador (Chrome recomendado).
**Passo 2:** Verificar se esta usando VPN (pode bloquear o streaming do Bunny.net).
**Passo 3:** Perguntar se o problema e em uma aula especifica ou em todas.

**Quando escalar:** Se o problema persiste em multiplos navegadores, escale para **Dev** com: URL da aula, navegador, e se esta no celular ou computador.

#### "Meu progresso esta zerado / perdido"

**Passo 1:** Informar que o progresso sincroniza com o player de video -- e necessario completar ao menos um video inteiro.
**Passo 2:** Orientar a aguardar ate 1 hora para sincronizacao.
**Passo 3:** Pedir para recarregar a pagina.

**Quando escalar:** Se apos 1 hora o progresso continua zerado, escale para **Dev** com: email, nome do curso, porcentagem esperada.

#### "Como baixo meu certificado?"

**Passo 1:** Certificados estao disponiveis apos completar 100% do curso.
**Passo 2:** Verificar se o progresso esta em 100% na pagina do curso.

**Quando escalar:** Se o progresso esta em 100% mas o certificado nao aparece, escale para **CS**.

---

### 4. Agendamentos

#### "Nao consigo agendar uma sessao"

**Passo 1:** Verificar se o aluno tem acesso ao servico (comprou ou assinou). Se nao tem, direcionar para `/pricing` ou `/catalogo`.
**Passo 2:** Verificar se existem horarios disponiveis -- se nenhum slot aparece, o mentor pode nao ter configurado disponibilidade ou todos os horarios estao ocupados. Sugerir tentar outro dia.
**Passo 3:** Verificar se o aluno atingiu o limite de agendamentos simultaneos. Mensagem: "Voce atingiu o limite de agendamentos". O aluno precisa esperar uma sessao concluir ou cancelar antes de agendar nova.

**Quando escalar:** Se o aluno tem acesso, ha slots disponiveis, e mesmo assim da erro, escale para **Dev** com: email, servico, data/hora tentada, print do erro.

#### "Quero cancelar minha sessao"

**Passo 1:** Orientar a acessar `/dashboard/agendamentos`, aba "Proximos", clicar no dropdown > "Cancelar".
**Passo 2:** Se o cancelamento esta bloqueado (muito proximo da sessao), informar sobre a janela de cancelamento (padrao: 24h de antecedencia).
**Passo 3:** Se o aluno precisa cancelar fora da janela, um admin pode cancelar em **Admin > Agendamentos**.

**Quando escalar:** Se o botao de cancelar nao aparece ou da erro, escale para **Dev**. Se o aluno quer cancelar fora da janela, escale para **Admin**.

#### "Quero reagendar minha sessao"

**Passo 1:** Orientar a acessar `/dashboard/agendamentos`, aba "Proximos", clicar no dropdown > "Reagendar".
**Passo 2:** Ha um limite de reagendamentos por sessao (padrao: 2). Se atingiu o limite, o aluno precisa cancelar e criar novo agendamento.
**Passo 3:** A mesma janela de antecedencia se aplica.

**Quando escalar:** Se o limite foi atingido e o aluno tem motivo valido, escale para **Admin** para ajuste manual.

#### "O link da reuniao nao apareceu"

**Passo 1:** O link e configurado pelo mentor. Verificar nos emails de confirmacao e lembrete.
**Passo 2:** Verificar no card da sessao em `/dashboard/agendamentos`.
**Passo 3:** Se nao tem link, o mentor pode nao ter configurado. Informar que entraremos em contato com o mentor.

**Quando escalar:** Escale para **Admin** para contatar o mentor e configurar o link em **Admin > Agendamentos > aba Disponibilidade**.

#### "Nao recebi o email de confirmacao/lembrete"

**Passo 1:** Verificar spam/lixo eletronico. Buscar emails de `noreply@euanapratica.com`.
**Passo 2:** Confirmar que o email no perfil esta correto.
**Passo 3:** Verificar se o agendamento existe em `/dashboard/agendamentos`.

**Quando escalar:** Se o booking existe, email esta correto e nao chegou, escale para **Dev** com: email, ID do booking, nome do template esperado.

---

### 5. Meu Hub

#### "Nao vejo minha compra no Meu Hub"

**Passo 1:** Confirmar que o pagamento foi processado (Ticto confirmou por email).
**Passo 2:** Aguardar ate 5 minutos apos confirmacao (webhook pode ter ate 2min de atraso).
**Passo 3:** Recarregar a pagina com `F5` ou `Ctrl+R`.

**Quando escalar:** Se apos 10 minutos nao apareceu, escale para **CS** com: email, nome do produto, data/hora da compra.

#### "Meus creditos mostram 0"

**Passo 1:** Verificar o plano do usuario em `/dashboard/hub` (header mostra o plano).
**Passo 2:** Plano Basico: 1 analise/mes. Pro: 10/mes. VIP: ilimitado.
**Passo 3:** Os creditos reiniciam todo dia 1 do mes.

**Quando escalar:** Se o usuario tem plano Pro/VIP e mostra 0, escale para **CS** -- pode ser bug no calculo de quota.

#### "Vejo o servico de outra pessoa"

**PRIORIDADE MAXIMA.** Escale imediatamente para **Dev + Admin** com: email do usuario, qual servico aparece, email do "outro usuario" se souber.

---

### 6. Comunidade

#### "Meu post nao publica / da erro"

**Passo 1:** Verificar se o post tem conteudo valido (nao esta vazio).
**Passo 2:** Verificar se a imagem/video sendo anexada nao excede o limite de tamanho.
**Passo 3:** Tentar em outro navegador.

**Quando escalar:** Se persiste, escale para **Dev** com: email, print do erro, conteudo do post.

#### "Nao recebo notificacoes de respostas"

**Passo 1:** As notificacoes aparecem dentro da plataforma (sino no header). Nao ha notificacao por email para posts.
**Passo 2:** Pedir para verificar o sino de notificacoes.

**Quando escalar:** Se o sino nao mostra notificacoes para respostas reais, escale para **Dev**.

---

### 7. ResumePass

#### "Minha analise nao foi gerada"

**Passo 1:** A analise pode levar ate 60 segundos. Pedir para aguardar e nao fechar a pagina.
**Passo 2:** Verificar se o curriculo esta em formato PDF e tem ate 5MB.
**Passo 3:** Tentar novamente com outro arquivo PDF se houver suspeita de corrupao do arquivo.

**Quando escalar:** Se apos 2 tentativas nao gera, escale para **Dev** com: email, nome do arquivo, navegador.

#### "Gastei meu credito e a analise deu erro"

**Passo 1:** Informar que se a analise falhou, o credito pode ter sido consumido pela tentativa.
**Passo 2:** Coletar informacoes para escalonamento.

**Quando escalar:** Escale para **CS** para avaliar se deve restituir o credito. Incluir: email, data/hora da tentativa, erro exibido.

#### "Quero mais creditos de analise"

**Passo 1:** Informar os limites por plano: Basico (1/mes), Pro (10/mes), VIP (ilimitado).
**Passo 2:** Para mais creditos, orientar upgrade de plano em `/pricing`.

**Quando escalar:** Se o usuario acredita que deveria ter mais creditos pelo plano atual, escale para **CS**.

---

### 8. Pagamento

#### "Meu pagamento Ticto nao foi confirmado"

**Passo 1:** Perguntar o metodo de pagamento:
- **Cartao:** Confirmacao e instantanea. Se nao processou, verificar se o cartao foi recusado.
- **Pix:** Tempo real. Se pagou e nao confirmou, aguardar ate 5 minutos.
- **Boleto:** Compensacao em 1-3 dias uteis.

**Passo 2:** Pedir comprovante do pagamento.
**Passo 3:** Verificar se o email usado na compra e o mesmo do cadastro na plataforma.

**Quando escalar:** Se o pagamento foi confirmado pelo Ticto e a plataforma nao atualizou, escale para **CS** com: email, metodo de pagamento, comprovante, data/hora.

#### "Quero reembolso"

**Passo 1:** Informar que reembolsos sao processados pelo admin.
**Passo 2:** Coletar: email, produto/plano, data da compra, motivo do reembolso.

**Quando escalar:** Sempre escale para **CS/Admin** com as informacoes acima.

#### "Aparece cobranca duplicada"

**Passo 1:** Verificar se nao sao cobrancias distintas (ex: servico avulso + assinatura).
**Passo 2:** Verificar em `/meus-pedidos` se aparecem duas entradas para o mesmo produto.
**Passo 3:** Coletar comprovantes de ambas as cobrancias.

**Quando escalar:** Escale para **CS** com: email, datas das cobrancias, valores, comprovantes.

---

## Glossario de Status

### Status de Agendamento (Booking)

| Status | Significado | Visivel como |
|--------|-------------|-------------|
| `confirmed` | Sessao agendada e ativa | "Confirmado" (badge verde) |
| `completed` | Sessao realizada pelo mentor | "Concluido" (badge verde) |
| `cancelled` | Cancelada com antecedencia (> janela de cancelamento) | "Cancelado" (badge vermelho) |
| `no_show` | Cancelada com menos de 24h OU marcada pelo admin | "Nao compareceu" (badge amarelo) |

### Status de Video (Cursos)

| Status | Significado |
|--------|-------------|
| `pending` | Aguardando upload do video |
| `uploading` | Video sendo enviado para o servidor |
| `processing` | Video sendo processado/transcodificado pelo Bunny.net |
| `ready` | Video pronto para reproducao |
| `failed` | Erro no processamento do video |

### Status de Assinatura (Subscription)

| Status | Significado | Acesso ao plano? |
|--------|-------------|-----------------|
| `active` | Assinatura ativa e em dia | Sim |
| `inactive` | Sem assinatura ativa | Nao |
| `past_due` | Falha na cobranca (tentativas em andamento) | Sim (mantido) |
| `grace_period` | 3a falha na cobranca, 7 dias antes de revogar | Sim (mantido) |
| `cancelled` | Assinatura encerrada | Nao (downgrade para Basico) |
| `trial` | Periodo de teste | Sim |

### Status de Pedido (Order)

| Status | Significado | Visivel como |
|--------|-------------|-------------|
| `paid` | Pagamento aprovado | "Pago" (badge verde) |
| `pending` | Aguardando pagamento (boleto/Pix) | "Aguardando" (badge amarelo) |
| `cancelled` | Pedido cancelado | "Cancelado" (badge cinza) |
| `refunded` | Reembolsado | "Reembolsado" (badge vermelho) |

### Status de Processamento (Relatorio de Lead)

| Status | Significado |
|--------|-------------|
| `pending` | Formulario recebido, relatorio pendente |
| `processing` | Relatorio sendo gerado pela IA |
| `completed` | Relatorio pronto para visualizacao |
| `error` | Erro na geracao do relatorio |

### Status de Progresso de Aula

| Status | Significado |
|--------|-------------|
| `not_started` | Aluno nao iniciou a aula |
| `in_progress` | Aluno assistiu parcialmente |
| `completed` | Aluno completou a aula |

---

## Quando Escalar

| Sintoma | Escalar para | Urgencia |
|---------|-------------|----------|
| Dados de outro usuario visiveis | **Dev + Admin** | CRITICA |
| Pagamento confirmado mas servico nao ativou (> 10min) | **CS** | Alta |
| Cobranca duplicada ou indevida | **CS** | Alta |
| Pedido de reembolso | **CS/Admin** | Media |
| Botao/funcao da erro com print do erro | **Dev** | Media |
| Video nao carrega (multiplos navegadores) | **Dev** | Media |
| Email nao recebido (template ativo, email correto) | **Dev** | Media |
| Progresso do curso nao atualiza apos 1h | **Dev** | Media |
| Analise ResumePass nao gera apos 2 tentativas | **Dev** | Media |
| Creditos incorretos com plano ativo | **CS** | Media |
| Pedido de alteracao de email | **CS/Admin** | Baixa |
| Pedido de concessao de acesso cortesia | **CS > Admin** | Baixa |
| Cancelamento fora da janela de antecedencia | **Admin** | Baixa |
| Banner de dunning nao desaparece apos 48h | **CS** | Baixa |
| Duvida sobre evento na agenda (tipos de evento) | Resolver diretamente | -- |
| Duvida sobre status de booking | Resolver diretamente | -- |

---

## Informacoes para Incluir no Escalonamento

Ao escalar um ticket, sempre inclua:

### Dados do usuario
- [ ] Email cadastrado na plataforma
- [ ] Nome completo
- [ ] Plano atual (Basico/Pro/VIP)

### Contexto do problema
- [ ] URL da pagina onde ocorreu o problema
- [ ] Print/screenshot da tela
- [ ] Navegador e versao (Chrome, Safari, Firefox)
- [ ] Dispositivo (celular ou computador)
- [ ] Data e hora em que o problema ocorreu
- [ ] Passos para reproduzir o problema

### Dados especificos (quando aplicavel)
- [ ] ID do booking (para problemas de agendamento)
- [ ] Nome do servico/produto
- [ ] Comprovante de pagamento (para problemas financeiros)
- [ ] Nome do template de email (para problemas de email)
- [ ] Mensagem de erro exibida na tela

### Exemplo de ticket bem formatado

```
ASSUNTO: [URGENCIA: Alta] Plano Pro nao ativou apos pagamento

USUARIO: joao@email.com (Joao Silva)
PLANO: Basico (deveria ser Pro apos compra)
URL: /dashboard/hub
DISPOSITIVO: Desktop, Chrome 122
DATA/HORA: 2026-02-26 14:30 BRT

DESCRICAO:
Usuario pagou Plano Pro Mensal via Pix em 2026-02-26 14:15.
Ticto confirmou pagamento (comprovante anexo).
Apos 30 minutos, plano continua como Basico no Hub.
Usuario ja recarregou a pagina 3 vezes.

ANEXOS: [comprovante-pix.png] [screenshot-hub.png]
```

---

## Referencias

### Paginas Admin relevantes

| Pagina | URL | O que faz |
|--------|-----|-----------|
| Gestao de Usuarios | `/admin/usuarios` | Criar, editar, alterar roles |
| Gestao de Assinaturas | `/admin/subscription-health` | Metricas MRR, reconciliacao |
| Agendamentos | `/admin/agendamentos` | Ver/cancelar/marcar bookings |
| Templates de Email | `/admin/email-templates` | Editar templates, enviar teste |
| Simulador Ticto | `/admin/ticto-simulator` | Simular webhooks de pagamento |
| Saude do Sistema | `/admin/saude-sistema` | Status de APIs, emails, integracao |
| Meus Pedidos (usuario) | `/meus-pedidos` | Historico de transacoes |
| Planos | `/admin/planos` | Configuracao de planos e features |

### Documentacao por area

| Area | Documento |
|------|-----------|
| Booking System | `docs/15 Booking System/CUSTOMER-SERVICE.md` |
| Meu Hub | `docs/18 Meu Hub/SUPORTE.md` |
| Subscription | `docs/06 Subscription and Ticto/SUBSCRIPTION_SYSTEM.md` |
| Orders | `docs/07 Meus Pedidos/ORDERS_SYSTEM.md` |
| Email System | `docs/08 Email System/` |

### Contatos de escalacao

| Papel | Responsabilidade |
|-------|-----------------|
| **CS (Customer Success)** | Questoes financeiras, planos, acessos cortesia, reembolsos |
| **Admin** | Acoes no painel admin, cancelamentos fora da janela, configuracoes |
| **Dev** | Erros tecnicos, bugs, integracao, logs de Edge Functions |

### Emails do sistema

Todos os emails automaticos vem de: **EUA na Pratica** `<noreply@euanapratica.com>`. Este endereco **nao recebe respostas**. Sempre direcione o usuario para o canal de suporte.
