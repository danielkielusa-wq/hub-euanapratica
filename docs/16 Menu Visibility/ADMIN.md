# Menu do App — Guia para Administradores

> Ultima atualizacao: 2026-02-25

## O que e

O recurso **Menu do App** permite que voce controle quais opcoes aparecem no menu lateral para alunos e mentores. Por exemplo, voce pode desativar o "Prime Jobs" para que nenhum aluno veja essa opcao no menu, ou ocultar "Upload Materiais" para mentores.

**Importante:** Isso controla apenas a **visibilidade no menu**. As rotas (URLs) continuam acessiveis diretamente. Se voce precisa bloquear o acesso completo a uma funcionalidade, use o sistema de planos em `/admin/planos`.

---

## Onde acessar

Voce tem **dois caminhos** para chegar a configuracao:

1. **Menu lateral** → CONFIGURACOES → **Menu do App**
2. **Configuracoes da Plataforma** (`/admin/configuracoes`) → aba **Menu do App**

Ambos mostram a mesma interface e salvam no mesmo lugar.

---

## Como funciona

### Tela de configuracao

A tela mostra dois paineis lado a lado:

| Menu dos Alunos | Menu dos Mentores |
|---|---|
| Todos os itens do menu do aluno, agrupados por secao (DISCOVERY, MENTORIA, TOOLS & AI, MINHA CONTA) | Todos os itens do menu do mentor, agrupados por secao (GESTAO, CONTEUDO, MINHA CONTA) |

Cada item tem um **toggle** (liga/desliga).

### Ao desligar um toggle

- O item **desaparece imediatamente** do menu lateral para todos os usuarios daquele perfil
- Se todos os itens de uma secao forem desligados, a **secao inteira desaparece**
- A mudanca e salva automaticamente — nao precisa clicar em "Salvar"
- Se houver erro ao salvar, um toast vermelho aparece e o toggle volta ao estado anterior

### Ao ligar um toggle

- O item **reaparece** no menu lateral na posicao original

---

## Itens disponiveis para controle

### Menu dos Alunos (17 itens)

| Secao | Item | Chave |
|-------|------|-------|
| DISCOVERY | Meu Hub | `hub` |
| DISCOVERY | Comunidade | `comunidade` |
| DISCOVERY | Agendamentos | `agendamentos` |
| DISCOVERY | Explore | `catalogo` |
| DISCOVERY | Meus Cursos | `cursos` |
| DISCOVERY | Minha Jornada | `espacos` |
| MENTORIA | Dashboard | `dashboard` |
| MENTORIA | Biblioteca | `biblioteca` |
| MENTORIA | Tarefas | `tarefas` |
| TOOLS & AI | ResumePass AI | `curriculo` |
| TOOLS & AI | Title Translator | `title_translator` |
| TOOLS & AI | Prime Jobs | `prime_jobs` |
| MINHA CONTA | Planos | `pricing` |
| MINHA CONTA | Assinatura | `assinatura` |
| MINHA CONTA | Perfil | `perfil` |
| MINHA CONTA | Meus Pedidos | `pedidos` |
| MINHA CONTA | Suporte | `suporte` |

### Menu dos Mentores (10 itens)

| Secao | Item | Chave |
|-------|------|-------|
| GESTAO | Dashboard | `dashboard` |
| GESTAO | Meus Espacos | `espacos` |
| GESTAO | Agendamentos | `agendamentos` |
| GESTAO | Disponibilidade | `disponibilidade` |
| GESTAO | Agenda | `agenda` |
| GESTAO | Tarefas | `tarefas` |
| CONTEUDO | Biblioteca | `biblioteca` |
| CONTEUDO | Upload Materiais | `upload_materiais` |
| MINHA CONTA | Perfil | `perfil` |
| MINHA CONTA | Suporte | `suporte` |

---

## Perguntas frequentes

### O menu do admin tambem e controlado?
Nao. O menu do admin nunca e filtrado — admins sempre veem tudo.

### Se eu desativar "Perfil", o usuario perde acesso ao perfil?
Nao. O item some do menu, mas se o usuario digitar `/perfil` diretamente na barra de endereco, a pagina ainda abre. Isso e intencional — o controle de menu e apenas de visibilidade/navegacao.

### Quanto tempo demora para a mudanca aparecer?
Para o admin que fez a mudanca, o efeito e imediato. Para outros usuarios, a mudanca aparece em ate **5 minutos** (tempo de cache) ou imediatamente ao recarregar a pagina.

### E se eu desativar tudo de uma secao?
A secao inteira desaparece do menu. Por exemplo, se voce desativar ResumePass AI, Title Translator e Prime Jobs, a secao "TOOLS & AI" some completamente.

### Posso usar isso para "lancar" uma feature nova?
Sim. Voce pode desativar um item (ex: `cursos`) antes do lancamento, preparar tudo, e depois ligar o toggle quando estiver pronto. Todos os alunos verao o novo item aparecer.

---

## Cenarios de uso comuns

| Cenario | Acao |
|---------|------|
| Desativar Prime Jobs temporariamente | Desligar toggle `Prime Jobs` no painel "Alunos" |
| Esconder funcionalidade em beta | Desligar toggle do item — ligar quando estiver pronto |
| Simplificar menu para mentores | Desligar itens que mentores nao usam (ex: Agenda se nao usa) |
| Esconder Meus Pedidos (sem loja ativa) | Desligar toggle `Meus Pedidos` no painel "Alunos" |
