

# Diagnóstico: Webhook Ticto - Token Mismatch

## Problema Identificado

Os logs da Edge Function mostram claramente o problema:

```
Token mismatch: {
  received: "RGvEA2PlWhyMPxg6Fjfb...",
  expected: "R0e5A6ARbu2uvePB80Bz..."
}
```

**O token configurado como `TICTO_SECRET_KEY` NÃO corresponde ao token que a Ticto está enviando no payload.**

---

## Análise

| Item | Valor |
|------|-------|
| Token enviado pela Ticto | `RGvEA2PlWhyMPxg6Fjfb...` |
| Token configurado (TICTO_SECRET_KEY) | `R0e5A6ARbu2uvePB80Bz...` |
| **Status** | **Tokens diferentes** |

---

## Solução

Você precisa **atualizar o Secret `TICTO_SECRET_KEY`** com o token correto.

O token correto que você me informou é:
```
RGvEA2PlWhyMPxg6FjfbNFa90EydvH51T0T4pCXkjOZHcgJ4tqQbcrL0wDQZHINoKtgQPwWyi3CCZujoVTwZgK8JyAAV70cC2WGl
```

### Passos:

1. Irei atualizar o secret `TICTO_SECRET_KEY` com o valor correto
2. Após a atualização, o webhook passará a aceitar as requisições da Ticto

---

## Validação da Documentação Ticto

Conforme a documentação v2.0, nossa implementação está correta:

| Campo | Documentação | Nossa Implementação |
|-------|--------------|---------------------|
| `token` | Campo no body JSON | Extraímos de `payload.token` |
| `status` | "authorized" = Venda Realizada | Incluído nos status válidos |
| `customer.email` | Email do comprador | Extraímos corretamente |
| `item.product_id` | ID do Produto | Extraímos corretamente |
| `order.hash` | Código do pedido | Usamos como transaction_id |

### Status importantes segundo a documentação:
- `authorized` - Venda Realizada (liberar acesso)
- `refunded` - Reembolso (revogar acesso)
- `chargeback` - Chargeback (revogar acesso)
- `waiting_payment` - Aguardando Pagamento (não liberar)

---

## Próximo Passo

Atualizar o secret com o valor correto que você me forneceu.

