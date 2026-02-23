# WhatsApp Integration — Visão Executiva (CEO)

> **Audiência:** CEO / Fundadores
> **Última atualização:** Fevereiro 2026

---

## O que é e por que existe

O ENP Hub agora possui um canal de WhatsApp **bidirecional integrado ao CRM**. Isso significa que o time pode enviar e receber mensagens diretamente na ficha do lead — sem sair do sistema, sem depender de celular pessoal, com todo o histórico registrado.

**Antes:** o admin clicava num link `wa.me` que abria o WhatsApp pessoal no celular. Sem histórico, sem rastreamento, sem como outro membro da equipe ver o que foi dito.

**Agora:** conversa completa visível no CRM, IA que sugere mensagens personalizadas, entrega e leitura rastreadas, respostas que chegam automaticamente no sistema.

---

## Como funciona (visão geral)

```
Admin (CRM)  →  Edge Function  →  Evolution API  →  WhatsApp do lead
Lead responde →  Evolution API  →  Webhook         →  CRM (aparece automaticamente)
```

- **Evolution API v2**: software open-source que conecta um número de WhatsApp a uma API HTTP. Rodando num VPS próprio da empresa.
- **Webhook**: cada mensagem recebida do lead chega em tempo real ao CRM.
- **IA (Anthropic/OpenAI)**: analisa o perfil completo do lead e sugere 2–4 mensagens personalizadas para enviar.

---

## Valor de negócio

| Antes | Agora |
|-------|-------|
| Contato via celular pessoal, sem rastro | Histórico completo no CRM para toda a equipe |
| Sem saber se a mensagem foi lida | Status: enviado ✓ / entregue ✓✓ / lido ✓✓ azul |
| Mensagens genéricas | IA personaliza por nome, área, barreiras, temperatura |
| Tempo para escrever cada mensagem | Templates prontos + sugestão automática por IA |
| Sem saber quem respondeu | Resposta associada ao lead automaticamente |

---

## Infraestrutura e Custos

| Componente | O que é | Custo estimado |
|------------|---------|----------------|
| VPS Hostinger | Servidor onde roda o Evolution API | ~R$ 80–150/mês |
| Evolution API v2 | Software open-source (gratuito) | $0 |
| Supabase Edge Functions | Processamento das mensagens | Incluído no plano atual |
| IA para sugestões | OpenAI / Anthropic (pay-per-use) | ~$0,001 por sugestão |
| Número de WhatsApp | Chip/eSIM dedicado | Variável (operadora) |

**Recomendação**: usar um número dedicado para a empresa (não pessoal) para evitar risco de banimento e garantir continuidade do serviço.

---

## Riscos e Pontos de Atenção

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Número banido pelo WhatsApp | Perda do canal de comunicação | Usar chip dedicado; não enviar spam; respeitar limites de volume |
| VPS fora do ar | Mensagens não chegam/saem | Monitorar uptime; contato com Hostinger em caso de queda |
| WhatsApp desconectado (QR expirado) | Envio e recebimento param | Time de Dev reconecta em ~5 minutos via painel admin |
| Número pessoal do time usado no sistema | Risco de privacidade e continuidade | Migrar para número empresarial dedicado |

---

## Métricas para acompanhar

- **Volume de mensagens enviadas/recebidas por semana** — indicador de atividade do time de CS
- **Taxa de leitura** (mensagens com status "lido") — indica se o lead está engajado
- **Taxa de resposta dos leads** — mensagens inbound / mensagens outbound
- **Tempo médio de primeiro contato** após chegada do lead — meta: < 1h para leads quentes

Estas métricas podem ser extraídas da tabela `whatsapp_logs` no banco de dados — peça ao time de Dev.

---

## Status atual

- Integração: **ativa e funcionando**
- Webhook de recebimento: **configurado** (`receive-whatsapp-webhook`)
- Envio via CRM: **funcionando** (`send-whatsapp`)
- Sugestão por IA: **funcionando** (`suggest-whatsapp-messages`)
- Automação N8N: a configurar (welcome automático, follow-ups)
