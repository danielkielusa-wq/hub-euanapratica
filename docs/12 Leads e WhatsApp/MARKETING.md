# WhatsApp Integration — Guia de Marketing

> **Audiência:** Time de Marketing
> **Última atualização:** Fevereiro 2026

---

## O que mudou

O ENP Hub agora possui WhatsApp **integrado diretamente ao CRM**. Isso muda como o marketing se comunica com leads:

- Todas as mensagens enviadas e recebidas ficam **registradas na ficha do lead**
- É possível ver se o lead **leu** a mensagem
- A **IA analisa o perfil do lead** e sugere mensagens personalizadas por temperatura, área e barreiras
- Templates de mensagem podem ser criados e mantidos pelo marketing

---

## Templates de WhatsApp (`/admin/whatsapp-templates`)

### O que são

Templates são mensagens pré-escritas com variáveis dinâmicas. Exemplos de variáveis disponíveis:

| Variável | O que substitui |
|----------|----------------|
| `{{leadName}}` | Nome do lead |
| `{{reportLink}}` | Link do relatório personalizado do lead |
| `{{productName}}` | Produto recomendado pela IA |

### Templates ativos (padrão)

| Nome | Quando usar |
|------|-------------|
| `lead_welcome` | Primeiro contato — boas-vindas + link do relatório |
| `lead_followup_3d` | 3 dias sem resposta |
| `lead_followup_7d` | 7 dias sem resposta, segunda tentativa |

### Como criar um novo template

1. Acesse `/admin/whatsapp-templates`
2. Clique em **"Novo Template"**
3. Preencha:
   - **Nome**: slug único (ex: `oferta_black_friday`)
   - **Nome de exibição**: texto que aparece no menu (ex: `Oferta Black Friday`)
   - **Mensagem**: texto com variáveis `{{nomeVariavel}}`
   - **Categoria**: agrupa templates no menu (ex: `oferta`, `followup`, `lead`)
4. Clique em **Salvar**
5. Marque como **Ativo** para aparecer no envio

### Boas práticas para templates

- Máximo 300 caracteres — WhatsApp favorece mensagens curtas
- 1–2 emojis por mensagem (mais que isso parece spam)
- Sempre incluir CTA claro: uma pergunta, um link ou um convite
- Nunca começar com "Você ganhou" ou "Clique aqui" — risco de bloqueio

---

## Sugestão de Mensagem por IA

O sistema usa IA para criar mensagens personalizadas por lead. O marketing pode customizar o prompt que guia a IA.

### Como a IA funciona

Para cada lead, a IA recebe:
- Nome, área, nível de inglês, objetivo, barreiras identificadas
- Temperatura do lead (quente / morno / frio)
- Histórico de mensagens WhatsApp já trocadas
- Produto recomendado

E retorna 2–4 sugestões com:
- **Texto pronto** com nome e detalhes do lead
- **Intenção**: welcome, follow_up, re_engage, offer, support
- **Tom**: formal, amigável ou urgente
- **Motivo**: por que essa mensagem é relevante agora

### Customizando o prompt da IA

O prompt pode ser ajustado em `/admin/configuracoes` → chave `suggest_whatsapp_prompt`.

Exemplos de personalização:
- Incluir o nome do método (ex: "Método ROTA") nas sugestões
- Ajustar o estilo de comunicação (mais formal, mais casual)
- Incluir provas sociais ou casos de sucesso como referência
- Direcionar para produtos específicos em determinados períodos

---

## Rastreamento e Segmentação

### Status de leitura das mensagens

O CRM mostra em tempo real:
- ✓ cinza: mensagem enviada
- ✓✓ cinza: entregue no celular do lead
- ✓✓ azul: lead **leu** a mensagem

Leads que leram mas não responderam são candidatos prioritários para uma segunda mensagem ou campanha de remarketing.

### Segmentos com base em comportamento WhatsApp

Para criar públicos segmentados (peça ao Dev para exportar):

| Segmento | Critério na base |
|----------|-----------------|
| Leram mas não responderam | `whatsapp_logs`: status `read`, sem inbound subsequente |
| Responderam pelo menos uma vez | `lead_interactions`: type `whatsapp_received` |
| Nunca foram contactados | Sem registro em `whatsapp_logs` |
| Leads quentes sem contato nos últimos 7 dias | temperature = quente/muito-quente + sem mensagem recente |

---

## Automação com N8N (a configurar)

O N8N pode disparar mensagens automaticamente com base em eventos:

| Trigger | Ação sugerida |
|---------|--------------|
| Novo lead cadastrado | Enviar `lead_welcome` em até 5 minutos |
| Lead não abriu relatório após 3 dias | Enviar `lead_followup_3d` |
| Lead abriu relatório mas não respondeu | Enviar mensagem de oferta |
| Lead frio há 30+ dias | Iniciar sequência de reengajamento |

Para configurar automações, forneça ao Dev os critérios e o template desejado para cada fluxo.

---

## Limites e cuidados

### Risco de banimento do número

O WhatsApp pode banir o número se:
- Muitos destinatários marcarem como spam
- Volume de envio muito alto sem interação prévia
- Mensagens com características de propaganda massiva

**Recomendações**:
- Priorizar leads que já interagiram com a marca (formulário preenchido, relatório acessado)
- Não disparar para listas frias importadas
- Máximo recomendado: ~200 mensagens/dia para um número novo, escalando gradualmente
- Espaçar as mensagens — não enviar em rajada

### Opt-out informal

Se um lead responder "para", "não quero", "remova meu número" ou similar, registre como nota na ficha e pare os envios para ele. Não há opt-out automático implementado ainda — é um processo manual por enquanto.
