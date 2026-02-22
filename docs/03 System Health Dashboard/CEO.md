# Saúde do Sistema — Guia para CEO

## O que é isso?

O painel **Saúde do Sistema** (`/admin/saude-sistema`) é a central de monitoramento da plataforma ENP Hub. Em um único lugar você enxerga se tudo está funcionando: os serviços de email, os pagamentos, as integrações externas e a infraestrutura geral.

Antes deste painel, essas informações estavam espalhadas em logs do servidor, ferramentas externas e planilhas. Agora estão em uma tela só, atualizada em tempo real.

---

## Como acessar

1. Entre como administrador no Hub
2. Menu lateral → **Saúde do Sistema** (ícone de atividade)
3. URL direta: `https://hub.euanapratica.com/admin/saude-sistema`

---

## O que você verá na tela

### Bloco 1 — Status Geral do Sistema

O resultado do **Health Check** completo — o mesmo diagnóstico que o N8N executa automaticamente todo dia.

| Cor | O que significa | Ação necessária |
|-----|-----------------|-----------------|
| **Verde** — Sistema Saudável | Tudo funcionando normalmente | Nenhuma |
| **Amarelo** — Sistema Degradado | Algo está com performance reduzida ou aviso | Acompanhar / acionar dev |
| **Vermelho** — Sistema Fora do Ar | Falha crítica em algum serviço | Acionar dev imediatamente |

> Clique no botão **Health Check** para rodar o diagnóstico. Ele leva cerca de 15 segundos.

---

### Bloco 2 — Integrações

Mostra se cada serviço externo que o Hub usa está ativo e respondendo:

| Integração | O que faz |
|------------|-----------|
| **Supabase DB** | Banco de dados principal — perfis, assinaturas, agendamentos |
| **OpenAI** | IA para análise de currículos e relatórios de carreira |
| **Anthropic** | IA alternativa usada em alguns fluxos |
| **Resend** | Serviço de envio de emails (confirmações, lembretes, boas-vindas) |
| **Ticto** | Plataforma de pagamentos — cobranças e assinaturas |

O botão **Testar** ao lado de cada integração faz uma chamada real à API e mostra se a resposta está OK.

**Ponto verde** = ativo e funcionando
**Ponto vermelho** = falhou no último teste
**Ponto cinza** = ainda não testado nesta sessão

---

### Bloco 3 — Emails

Métricas de todos os emails enviados pela plataforma (confirmações de agendamento, boas-vindas, cobranças, etc.):

- **Enviados (24h)** — total de emails entregues nas últimas 24 horas
- **Falharam (24h)** — emails que tentamos enviar mas não conseguimos
- **Enviados (7 dias)** — volume semanal
- **Taxa de Sucesso** — percentual de entregas bem-sucedidas nos últimos 7 dias

> **Meta saudável**: Taxa de Sucesso ≥ 95%. Abaixo disso, verifique com o desenvolvedor.

O gráfico abaixo mostra o volume por template (tipo de email): confirmação de agendamento, lembrete, boas-vindas, etc. Isso ajuda a identificar qual tipo de email está falhando.

---

### Bloco 4 — Webhooks & Pagamentos

Eventos do Ticto processados nas últimas 24 horas:

- **Recebidos** — quantas notificações de pagamento chegaram da Ticto
- **Processados** — quantas foram tratadas com sucesso
- **Erros** — quantas falharam (ex: email do comprador não encontrado)

A lista de **Últimos Eventos** mostra os 10 eventos mais recentes com status e horário. Isso ajuda a rastrear se um pagamento específico foi processado.

---

### Bloco 5 — Detalhes do Health Check

Seção expandível com o resultado de cada uma das 10 verificações do sistema:

- Login & Autenticação
- Banco de Dados
- APIs & Infraestrutura
- ResumePass, Prime Jobs, Tradutor de Cargos
- Comunidade
- Pagamentos & Ticto
- Edge Functions
- Assinaturas & Lifecycle

Cada verificação mostra um badge **OK** (verde), **Aviso** (amarelo) ou **Falha** (vermelho) e o tempo de resposta em milissegundos.

---

## Quando acionar o desenvolvedor?

| Situação | Urgência |
|----------|----------|
| Status Geral = **Vermelho** | Imediata |
| Taxa de Sucesso de Emails < 80% | Alta |
| Ticto mostrando muitos erros | Alta |
| Integração de pagamento falhando no teste | Alta |
| Status Geral = **Amarelo** por mais de 24h | Média |
| Taxa de Sucesso entre 80%–94% | Baixa |

---

## Perguntas Frequentes

**Com que frequência devo checar este painel?**
O Health Check automático roda via N8N todo dia. Para uso manual, verifique quando houver suspeita de problema (usuários reportando falhas, emails não chegando, pagamentos sem confirmação).

**O que é o N8N?**
É a ferramenta de automação que roda verificações programadas todo dia e pode enviar alertas por email se algo estiver fora do ar.

**Os dados de email são em tempo real?**
Sim. Cada email enviado pela plataforma é registrado automaticamente. O painel mostra os dados das últimas 24 horas e 7 dias sem necessidade de atualização manual.

**O que fazer se um teste de integração falhar?**
Anote qual integração falhou e a mensagem de erro exibida. Repasse para o desenvolvedor — ele vai conseguir diagnosticar com essas informações.

---

**Versão**: 1.0
**Data**: 2026-02-21
