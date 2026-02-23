# WhatsApp Integration — Guia de Customer Success

> **Audiência:** Time de Customer Success / CRM
> **Última atualização:** Fevereiro 2026

---

## O que está disponível agora

O ENP Hub tem WhatsApp **integrado diretamente na ficha de cada lead**. Você consegue:

- **Enviar mensagens** sem sair do CRM (texto livre ou templates)
- **Receber respostas** — elas aparecem automaticamente no CRM em formato de chat
- **Ver status de entrega**: enviado, entregue, lido
- **Usar IA para sugerir mensagens** personalizadas por perfil de lead

---

## Como enviar uma mensagem

1. Abra qualquer lead em `/admin/leads-dashboard` → clique no nome
2. Clique na aba **WhatsApp**
3. Clique no botão verde **"Enviar Mensagem"**
4. Na janela que abre, escolha o modo:

### Modo: Texto Livre
- Digite a mensagem diretamente
- Veja o contador de caracteres (ideal: até 300)
- Clique em **Enviar**

### Modo: Template
- Selecione um template da lista
- As variáveis (`{{leadName}}`, `{{reportLink}}`) são preenchidas automaticamente com os dados do lead
- Você pode editar antes de enviar
- Clique em **Enviar**

---

## Como funciona a aba WhatsApp

A aba mostra a conversa completa em formato de chat, igual ao WhatsApp:

- **Mensagens à direita** (fundo verde): enviadas pelo CRM
- **Mensagens à esquerda** (fundo branco): recebidas do lead
- **Separadores de data**: agrupam mensagens por dia
- **Scroll automático**: sempre vai para a mensagem mais recente

### Ícones de status (mensagens enviadas)

| Ícone | Significado |
|-------|-------------|
| ✓ cinza | Mensagem enviada com sucesso |
| ✓✓ cinza | Entregue no celular do lead |
| ✓✓ azul | Lead **leu** a mensagem |

Se a mensagem ficar sem ícone ou com erro, verifique se o WhatsApp está conectado (ver seção abaixo).

---

## Sugestão de mensagem por IA

O botão **"Sugerir WhatsApp"** (ícone de estrela ✨) analisa o perfil completo do lead e cria mensagens personalizadas.

**Como usar**:
1. Na aba WhatsApp, clique em **"Sugerir WhatsApp"**
2. Aguarde 5–10 segundos
3. A IA retorna 2–4 opções, cada uma com:
   - Texto pronto (com nome do lead, área, objetivo)
   - Intenção (welcome, follow-up, oferta, suporte, reengajamento)
   - Tom (amigável, formal ou urgente)
   - Motivo (por que essa mensagem faz sentido agora)
4. Clique na opção desejada → ela é copiada para o campo de envio
5. Edite se quiser → Envie

**Dica**: a IA leva em conta as mensagens já enviadas e nunca sugere repetição do que já foi dito.

---

## Recebendo respostas

Quando um lead responde no WhatsApp:
- A mensagem chega automaticamente no CRM em segundos
- Aparece na aba WhatsApp do lead como bolha à esquerda
- Não é necessário verificar o celular — tudo chega aqui

**Lead não identificado**: se alguém mandar mensagem de um número não cadastrado no CRM, a mensagem é registrada em `whatsapp_logs` mas não aparece na ficha de nenhum lead. Para verificar, peça ao Dev acesso à tabela `whatsapp_logs`.

---

## Rotina de uso recomendada

### Ao abrir o dia
- Acesse `/admin/leads-dashboard`
- Filtre por temperatura "quente" e "muito-quente"
- Verifique quem respondeu durante a madrugada/manhã
- Responda as mensagens pendentes

### Ao receber um lead novo
1. Abra a ficha do lead
2. Verifique temperatura, barreiras, produto recomendado
3. Aba WhatsApp → "Sugerir WhatsApp" para ver a mensagem ideal
4. Envie o template `lead_welcome` ou a sugestão da IA

### Após 3 dias sem resposta
- Envie o template `lead_followup_3d`

### Após 7 dias sem resposta
- Envie o template `lead_followup_7d` (inclui link do relatório)
- Se sem resposta após isso, marque para automação ou deixe para fluxo frio

---

## O que fazer quando o WhatsApp desconectar

O WhatsApp pode se desconectar se o celular com o chip ficou sem bateria, sem internet, ou foi trocado.

**Sintomas**: mensagens enviadas ficam paradas em ✓ cinza (enviado mas não entregue), ou aparecem erros ao tentar enviar.

**Como resolver**:
1. Avise o time de Dev — eles têm acesso ao painel de reconexão
2. O Dev vai gerar um novo QR code no sistema
3. No celular com o chip do WhatsApp da empresa: WhatsApp → três pontinhos → Dispositivos conectados → Conectar dispositivo → Escanear QR
4. Em ~30 segundos a conexão é restabelecida

**Não tente resolver sozinho** — a reconexão precisa ser feita pelo Dev ou por alguém com acesso ao celular da empresa.

---

## Situações comuns e como lidar

### Lead tem telefone cadastrado errado
O botão "Enviar Mensagem" fica desabilitado ou a mensagem falha. Peça ao lead para confirmar o número (por email ou outro canal) e atualize o cadastro na ficha.

### Lead está com ✓✓ azul mas não responde
Ele leu — não insista com muitas mensagens. Aguarde 2–3 dias e tente uma abordagem diferente (outro template, outra hora do dia).

### Lead responde fora do horário comercial
A mensagem fica registrada no CRM. Não precisa responder na hora — o histórico não some.

### Lead pede para não ser contactado
Registre uma nota na aba **Interações**: `"Lead pediu para não receber mensagens - [data]"`. Não envie mais mensagens para esse lead. (Não há bloqueio automático por enquanto.)

### Mensagem enviada com conteúdo errado
Não é possível apagar ou editar após o envio. Envie uma segunda mensagem corrigindo, se necessário. Registre uma nota explicando.

---

## Dúvidas frequentes

**Posso enviar para qualquer número?**
Apenas para leads com telefone cadastrado em `career_evaluations`. O sistema não permite envio para números avulsos.

**O lead vê de qual número vem?**
Sim — vem do número do chip conectado ao Evolution API (número da empresa). Garanta que o nome do WhatsApp Business esteja configurado como "EUA na Prática" ou similar.

**As mensagens ficam salvas se eu fechar o navegador?**
Sim — todo o histórico fica no banco de dados, acessível a qualquer momento.

**Posso ver mensagens de um lead que já não trabalha comigo?**
Sim — o histórico permanece enquanto o lead existir no CRM.
