# Meu Hub — Guia de Suporte (1ª Linha)

> FAQ e troubleshooting básico para a equipe de suporte que atende tickets iniciais.
> **Regra geral:** se a solução exigir acesso ao banco de dados ou código, escale para CS/Admin.

---

## O que é "Minha Jornada"?

É uma seção que aparece na página **Seu Hub** (`/dashboard/hub`) mostrando todos os serviços e ferramentas que o usuário possui. Aparece automaticamente — se não tiver nada comprado, a seção é invisível (sem erro, apenas oculta).

---

## FAQ

### "Não vejo minha compra no Meu Hub"

**Passo 1:** Confirmar que o pagamento foi processado com sucesso.
- Ticto deve ter enviado confirmação por email
- Se pagamento está pendente → aguardar confirmação do gateway

**Passo 2:** Aguardar até 5 minutos após a confirmação do pagamento.
- O webhook Ticto processa em tempo real, mas pode haver atraso de até 2 min

**Passo 3:** Recarregar a página (`F5` ou `Ctrl+R`)

**Passo 4 (escalar):** Se após 10 min o serviço ainda não apareceu → escalar para CS com:
- Email do cliente
- Nome do produto comprado
- Data/hora aproximada da compra

---

### "Cliquei em 'Agendar Sessão' mas deu erro"

→ Direcionar para `/dashboard/agendar` direto
→ Se o erro persistir → escalar para DEV com print do erro

---

### "Meus créditos de ResumePass mostram 0"

**Verificar plano:**
1. Abrir `/dashboard/hub` — ver qual plano aparece no cabeçalho
2. Plano Básico: 1 análise/mês
3. Plano Pro/VIP: 5+ análises/mês (verificar configuração exata com CS)

**Se o usuário tem plano Pro ou VIP e mostra 0:**
→ Escalar para CS — pode ser bug no carregamento de quota

**Se os créditos foram usados:**
→ Informar que os créditos reiniciam todo dia 1 do mês

---

### "Agendar uma sessão e agora o card sumiu"

→ O card vai para a seção "Em Andamento" (não sumiu, mudou de posição)
→ Orientar o usuário a rolar a página para cima — as seções ficam em ordem: Ação Necessária → Em Andamento → Próximos Eventos → Histórico

---

### "Fiz a sessão e quer fazer outra, mas o card diz 'Concluído'"

→ Para fazer uma nova sessão, é necessário comprar novamente
→ Direcionar para a landing page do serviço (`/consultoria` ou link específico)
→ Após nova compra, o card retorna automaticamente

---

### "Tenho duas compras do mesmo serviço mas aparece só um card"

→ Comportamento correto: é um card único com `sessions_total` incrementado
→ No card de consultoria, se houver 2+ sessões, aparece um contador "X/Y sessões utilizadas"

---

### "O card do meu curso mostra 0% mesmo tendo acessado"

→ O progresso é sincronizado com o player de vídeo — precisa ter completado ao menos um vídeo inteiro
→ Aguardar até 1 hora para sincronização
→ Se persistir → escalar para DEV

---

### "Aparece 'Próximos Eventos' mas não tem data"

→ O serviço está ativo mas a data da sessão ainda não foi programada pelo mentor
→ Verificar na agenda (`/dashboard/agenda`) se há sessões marcadas
→ Se o evento já foi anunciado mas sem data no sistema → contato com CS para atualizar `metadata.session_datetime`

---

### "Vejo o serviço de outra pessoa"

→ **PRIORIDADE MÁXIMA** — escalar imediatamente para DEV/Admin
→ Coletar: email do usuário, qual serviço aparece, email do "outro usuário" se souber

---

## O que Escalar e Para Quem

| Situação | Escalar para |
|----------|-------------|
| Pagamento confirmado mas serviço não aparece após 10min | CS |
| Erro ao clicar em botão (print do erro) | DEV |
| Créditos incorretos com plano ativo | CS |
| Progresso do curso não atualiza | DEV |
| Dados de outro usuário visíveis | DEV + ADMIN (urgente) |
| Pedido de concessão de acesso cortesia | CS → Admin |
| Reclamação de cobrança / reembolso | CS |

---

## Informações Úteis para Coletar no Ticket

Sempre perguntar ao usuário:
1. URL da página onde viu o problema
2. Print da tela
3. Navegador e versão (Chrome, Safari, Firefox?)
4. Se está no celular ou computador
5. Email cadastrado na plataforma
