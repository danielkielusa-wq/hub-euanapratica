# Guided Tour & Primeiros Passos — Visao Estrategica (CEO)

## O que e

Duas features complementares que guiam novos usuarios nos primeiros minutos e dias apos o cadastro:

1. **Tour Guiado** — Tour interativo com spotlight que apresenta as funcionalidades principais da sidebar (Comunidade, ResumePass AI, Title Translator, Catalogo) no primeiro acesso ao Hub.
2. **Checklist "Primeiros Passos"** — Card persistente no dashboard com 4 acoes-chave que o usuario deve completar para extrair valor da plataforma.

## Por que importa

### Problema
Hoje, apos o onboarding (cadastro + dados pessoais), o usuario cai no Hub sem nenhuma orientacao. Ele nao sabe o que fazer primeiro, quais ferramentas sao gratuitas, nem como acessar a Comunidade. Resultado: **baixo engajamento na primeira semana e churn precoce**.

### Solucao
O tour + checklist criam um **caminho guiado** que:
- Reduz o "time to value" (usuario descobre o ResumePass AI em < 2 minutos)
- Direciona para as features de maior retenção (Comunidade, analise de curriculo)
- Cria habito de retorno via checklist de progresso

### Metricas de sucesso esperadas

| Metrica | Antes | Meta |
|---------|-------|------|
| % usuarios que usam ResumePass na 1a semana | ~15% (estimado) | 40%+ |
| % usuarios que fazem 1o post na Comunidade | ~5% (estimado) | 20%+ |
| % usuarios que visitam o Catalogo | ~10% (estimado) | 50%+ |
| Retenção D7 (voltou apos 7 dias) | baseline a medir | +30% vs baseline |

### Funil de conversao

```
Cadastro → Onboarding (6 steps) → Tour Guiado → Checklist → Engajamento → Upsell
                                   ^^^^^^^^^     ^^^^^^^^^
                                   NOVO          NOVO
```

O tour direciona para features gratuitas (ResumePass, Comunidade) que funcionam como **hook de retenção**. O checklist mantem o usuario voltando ate completar as 4 ações. Usuarios engajados tem maior propensao a converter em planos pagos e consultorias.

## Como funciona para o usuario

### Tour (primeira visita)
1. Usuario completa onboarding e cai no Hub
2. Apos 1 segundo, overlay escuro aparece com "Bem-vindo ao seu Hub!"
3. Spotlight vai percorrendo cada item da sidebar com explicação
4. No final: "Por onde quer comecar?" com 3 botoes de acao
5. Pode pular a qualquer momento
6. Nunca aparece novamente

### Checklist (dias seguintes)
1. Card "Primeiros Passos" no topo do Hub com barra de progresso
2. 4 itens clicaveis que levam direto para a ação:
   - Complete seu perfil (LinkedIn/curriculo)
   - Faca seu primeiro post na Comunidade
   - Analise seu curriculo com IA
   - Explore o catalogo
3. Cada item e marcado automaticamente quando cumprido (sem ação manual)
4. Ao completar 4/4: animação de confetti celebrando
5. Pode ser dispensado com X a qualquer momento

### Mobile
Tour simplificado em 3 steps (sem spotlight na sidebar que esta oculta). Checklist funciona identicamente.

## Usuarios existentes
Nao sao afetados. A migracao marcou todos os usuarios que ja completaram onboarding como "tour visto + checklist dispensado". So usuarios novos veem.

## Proximos passos possiveis
- **Analytics**: Tracker de qual step do tour o usuario parou (se pulou no step 3, sinal que a mensagem nao engajou)
- **A/B test**: Testar textos diferentes no tour
- **Tour de features novas**: Quando lancar algo novo, mini-tour de 2 steps so para aquela feature
- **Checklist dinamico**: Adicionar mais itens conforme o usuario avanca (ex: "Agende sua primeira sessao")
- **Gamificacao**: Integrar com sistema de pontos/badges existente

## Status
- **Data de lancamento**: 2026-02-24
- **Impacto em performance**: driver.js tem ~5KB gzipped. Sem impacto perceptivel.
- **Risco**: Zero. Feature aditiva, nao altera nenhum fluxo existente. Pode ser desativada removendo 2 linhas do StudentHub.
