# Relatorio de Lead — CTAs e Checklist — Guia para Administradores

> Ultima atualizacao: 2026-02-25

## O que e

Quando um lead acessa o relatorio de diagnostico e **nao tem assinatura ativa**, ele ve uma versao limitada do relatorio com dois botoes de acao (CTAs):

1. **Agendar sessao** — direciona para a URL de agendamento de consultoria
2. **Ver planos** — direciona para a pagina de planos (`/pricing`)

Alem disso, apos um lead assinar e fazer login no Hub, o **checklist de boas-vindas** mostra automaticamente o item "Ver seu diagnostico de carreira" com link direto para o relatorio completo.

---

## Configurando a URL de agendamento

### Onde acessar

**Configuracoes da Plataforma** (`/admin/configuracoes`) → secao **Leads / Webhook** → campo **"URL de Agendamento da Sessao de Diagnostico"**

### Como funciona

1. Insira a URL completa do agendamento (ex: link do Calendly, Hubspot, ou landing page interna)
2. Clique em **Salvar Configuracoes**
3. A mudanca entra em vigor imediatamente para todos os relatorios

### Exemplos de URLs validas

| Tipo | Exemplo |
|------|---------|
| Calendly | `https://calendly.com/euanapratica/sessao-diagnostico` |
| Landing page interna | `https://hub.euanapratica.com/servico/sessao-diagnostico` |
| Formulario externo | `https://forms.google.com/d/e/xxxx/viewform` |

**Importante:** Se o campo estiver vazio ou com URL generica, o botao "Agendar sessao" vai direcionar para `https://hub.euanapratica.com` (fallback).

---

## CTAs no relatorio limitado

O lead ve dois cards na base do relatorio:

| CTA | Descricao | Destino |
|-----|-----------|---------|
| **Agendar sessao** | Card azul, "Quero ajuda profissional" | URL configurada em `/admin/configuracoes` → campo de agendamento |
| **Ver planos** (Recomendado) | Card violeta com destaque, "Quero o relatorio completo" | Pagina `/pricing` do Hub |

Alem dos cards, as secoes bloqueadas do relatorio (analise detalhada, plano de acao 90d/6m, checkpoints) mostram botoes menores "Ver planos" que tambem direcionam para `/pricing`.

---

## Checklist pos-assinatura

### O que o usuario ve

Quando um usuario que tinha um relatorio de lead assina e faz login no Hub, o checklist de boas-vindas (`/dashboard/hub`) mostra automaticamente:

| Item | Descricao | Link |
|------|-----------|------|
| Ver seu diagnostico de carreira | Acesse o relatorio personalizado da sua carreira internacional | `/report/:token` (token do relatorio do usuario) |

O item aparece em **2a posicao** no checklist (apos "Complete seu perfil").

### Condicoes para aparecer

O item **so aparece** se:

1. O email do usuario cadastrado bate com o email de alguma `career_evaluation` no banco
2. Essa evaluation ja tem um `formatted_report` (relatorio processado)

Se o usuario nao passou pelo formulario de lead (nao tem career_evaluation), o item nao aparece.

### Marcacao automatica

O item e marcado como concluido automaticamente quando o usuario visita a pagina do relatorio estando logado. Nao precisa acao do admin.

---

## Perguntas frequentes

### O link de agendamento e o mesmo para todos os leads?
Sim. Todos os relatorios limitados usam a mesma URL configurada em `/admin/configuracoes`. Se voce precisa de links diferentes por servico, configure a URL para uma landing page que ofereca opcoes.

### O botao "Ver planos" direciona para onde?
Para a pagina `/pricing` que mostra os planos de assinatura (Basic, Pro, VIP). Essa pagina ja existe no sistema.

### Se eu mudar a URL de agendamento, os relatorios antigos sao afetados?
Sim. A URL e carregada em tempo real — qualquer lead que abrir o relatorio depois da mudanca vera a nova URL.

### O item do checklist aparece para usuarios que assinaram antes do formulario de lead existir?
Nao. O item so aparece se houver um `career_evaluation` com email correspondente. Usuarios antigos sem avaliacao nao verao o item.

### O lead consegue acessar o relatorio completo pelo checklist mesmo sem assinatura?
Nao. O link do checklist leva ao `/report/:token` que valida o `access_level`. Se o usuario nao tiver assinatura ativa com `full_report_access`, vera a versao limitada normalmente.

---

## Cenarios de uso

| Cenario | Acao |
|---------|------|
| Configurar URL de agendamento pela primeira vez | `/admin/configuracoes` → Leads/Webhook → preencher campo → Salvar |
| Trocar de Calendly para outra plataforma | Atualizar o campo com a nova URL → Salvar |
| Lead assinou mas nao encontra o relatorio | Verificar se o email do cadastro bate com o email da `career_evaluation` |
| Desativar o CTA de consultoria temporariamente | Limpar o campo da URL — o botao abrira `hub.euanapratica.com` como fallback |
