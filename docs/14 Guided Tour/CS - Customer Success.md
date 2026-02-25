# Guided Tour & Primeiros Passos — Guia Customer Success

## O que o usuario ve

### Tour Guiado (primeira vez no Hub)

Quando um novo usuario termina o cadastro e cai no Hub pela primeira vez, ele ve um **tour interativo** que apresenta a plataforma:

1. **Tela de boas-vindas** — Overlay escuro com "Bem-vindo ao seu Hub!" e convite para o tour rapido
2. **Comunidade** — Destaque no menu lateral explicando que ali ele se conecta com outros profissionais
3. **ResumePass AI** — Destaque explicando a analise de curriculo com IA
4. **Title Translator** — Destaque explicando a traducao de cargos
5. **Catalogo** — Destaque mostrando onde encontrar mentorias e servicos
6. **Meu Hub** — Destaque na "home" do usuario
7. **Escolha inicial** — "Por onde quer comecar?" com 3 botoes: Comunidade / Analisar Curriculo / Explorar Catalogo

**O usuario pode pular o tour a qualquer momento** clicando no X. Uma vez completado ou pulado, o tour **nunca mais aparece**.

**No celular**: O tour e simplificado (3 telas sem destaque no menu, que fica escondido no mobile).

### Checklist "Primeiros Passos" (dias seguintes)

Apos o tour, um **card "Primeiros Passos"** aparece no topo do Hub com 4 tarefas:

| Tarefa | Como completa | Aonde leva |
|--------|--------------|------------|
| Complete seu perfil | Adicionar LinkedIn OU curriculo na pagina de Perfil | /perfil |
| Faca seu primeiro post | Publicar qualquer post na Comunidade | /comunidade |
| Analise seu curriculo com IA | Rodar uma analise no ResumePass | /curriculo |
| Explore o catalogo | Visitar a pagina do catalogo | /catalogo |

**Comportamento:**
- Cada tarefa e clicavel — leva direto para a pagina da acao
- O check aparece **automaticamente** quando o usuario completa a acao (nao precisa marcar nada)
- Barra de progresso mostra X/4
- Ao completar 4/4: **animacao de confetti** celebrando
- O usuario pode fechar o card com X a qualquer momento (nao volta mais)
- Se voltar ao Hub depois de fazer algo (ex: postou na Comunidade), o item atualiza automaticamente

## Perguntas frequentes (FAQ)

### "O usuario disse que nao viu o tour"
**Possivel causa**: O tour so aparece UMA vez, no primeiro acesso ao Hub apos o onboarding. Se o usuario pulou rapido ou fechou o navegador, pode ter perdido. Nao ha como re-exibir o tour manualmente por enquanto.

**Acao**: Orientar o usuario sobre os menus manualmente. O checklist ainda deve estar visivel no Hub (a menos que tenha sido fechado).

### "O usuario completou uma tarefa mas o checklist nao atualizou"
**Possivel causa**: O checklist atualiza quando o usuario volta para o Hub (ou troca de aba e volta). Nao e tempo-real.

**Acao**: Pedir para o usuario voltar ao Hub (clicar em "Meu Hub" no menu) — o item deve atualizar.

### "O usuario antigo viu o tour/checklist"
**Nao deveria acontecer**. A migracao marcou todos os usuarios existentes como "tour concluido". Se aconteceu:

**Acao**: Reportar ao DEV com o email do usuario. Pode ser um usuario que estava no meio do onboarding quando o deploy aconteceu.

### "O usuario quer rever o tour"
Atualmente nao ha opcao de re-assistir.

**Acao**: Orientar manualmente ou sugerir ao produto como melhoria (botao "Rever tour" no menu de ajuda).

### "O checklist sumiu mas o usuario nao completou tudo"
**Possivel causa**: O usuario clicou no X para fechar. Uma vez fechado, nao volta.

**Acao**: Orientar o usuario diretamente sobre as acoes pendentes.

### "O tour apareceu em ingles / com visual errado"
**Possivel causa**: Cache do navegador com CSS antigo.

**Acao**: Pedir para o usuario fazer hard refresh (Ctrl+Shift+R) ou limpar cache.

## Cenarios de atendimento

### Novo usuario perdido
> "Nao sei o que fazer na plataforma"

**Roteiro de orientacao:**
1. Verificar se o checklist "Primeiros Passos" esta visivel no Hub
2. Se sim: "Voce ve um card chamado 'Primeiros Passos' no seu Hub? Siga os 4 passos ali — cada um leva voce direto para a acao!"
3. Se nao (ja fechou): Orientar manualmente:
   - "Comece analisando seu curriculo: clique em 'ResumePass AI' no menu da esquerda"
   - "Depois, visite a Comunidade para se conectar com outros profissionais"
   - "E explore o Catalogo para ver mentorias e servicos disponiveis"

### Usuario que pulou o tour
> "Apareceu algo quando entrei mas fechei sem querer"

**Resposta**: "Sem problema! Aquele era um tour de apresentacao da plataforma. Ele so aparece uma vez, mas voce pode explorar tudo pelo menu do lado esquerdo. As principais areas sao: Comunidade, ResumePass AI, Title Translator e Explore. Voce tambem deve ver um card 'Primeiros Passos' no seu Hub com sugestoes do que fazer primeiro!"

### Feedback sobre o tour
Coletar e repassar ao produto:
- "O tour foi util?" → Medir satisfacao
- "Sentiu falta de algo no tour?" → Ideias de novos steps
- "O tour foi longo demais?" → Considerar reduzir steps

## Metricas para acompanhar

Como CS, observe estes sinais de que o tour/checklist estao funcionando:

1. **Menos tickets de "nao sei usar"** na primeira semana
2. **Mais posts na Comunidade** de usuarios novos
3. **Mais analises de curriculo** na primeira semana
4. **Usuarios mencionando o tour/checklist** em feedback positivo

Se notar que usuarios novos continuam perdidos apesar do tour, reportar ao produto para ajustes nos textos e sequencia.

## Resumo visual

```
Usuario novo → Cadastro → Onboarding (dados) → Hub
                                                 |
                                          Tour Guiado (1x)
                                                 |
                                          Checklist (ate fechar/completar)
                                                 |
                                          Usuario engajado
```
