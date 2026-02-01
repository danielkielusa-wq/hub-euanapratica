
# Plano: Página de Thank You para Consultoria ROTA 60min

## Objetivo

Criar uma página de agradecimento pós-pagamento em `/thank-you/rota60min` baseada no template fornecido, além de adicionar um ícone de preview na configuração de produtos para o campo "URL de Redirecionamento".

---

## Análise do Template

O componente fornecido (`ThankYouPage.tsx`) usa classes `brand-*` que não existem no projeto atual. Vou mapear:
- `brand-50` → `primary/5` ou `blue-50`
- `brand-100` → `primary/10`
- `brand-300` → `primary/40`
- `brand-500` → `primary`
- `brand-600` → `primary` (222, 83%, 53% = Navy)
- `brand-900` → `#1e3a8a` (Navy Dark - já definido no CSS)

---

## Arquivos a Criar/Modificar

| Ação | Arquivo | Descrição |
|------|---------|-----------|
| Criar | `src/pages/thankyou/ThankYouRota60.tsx` | Página de Thank You adaptada |
| Modificar | `src/App.tsx` | Adicionar rota `/thank-you/rota60min` |
| Modificar | `src/components/admin/hub/HubServiceForm.tsx` | Adicionar ícone de preview no campo redirect_url |

---

## 1. Nova Página: `ThankYouRota60.tsx`

Estrutura baseada no template:

### Header
- Botão "Voltar ao Hub" com seta animada

### Card Principal (rounded-[48px])
- Ícone de sucesso animado (CheckCircle2)
- Badge "CONFIRMADO" verde
- Título: "Sua vaga na Consultoria está garantida! 🇺🇸"
- Subtítulo descritivo
- Box com resumo do produto (ícone calendário + "Sessão de Direção ROTA EUA™")
- Botões de ação: "Agendar minha Sessão" + "Email Suporte"

### Card de Bônus (fundo Navy)
- Ícone Gift animado
- "Bônus Exclusivo de Crédito"
- Texto sobre reversão do valor
- Badge "Válido por 7 Dias"

### Seção "O que acontece agora?"
- Grid 2 colunas com cards:
  - Agendamento (Clock icon)
  - Preparação (Zap icon)

---

## 2. Rota no App.tsx

```typescript
// Nova rota pública (sem auth necessário)
<Route path="/thank-you/rota60min" element={<ThankYouRota60 />} />
```

A página será pública para funcionar como URL de retorno da Ticto.

---

## 3. Ícone de Preview no Formulário de Produto

No campo "URL de Redirecionamento" do `HubServiceForm.tsx`:

```tsx
<div className="flex gap-2">
  <Input placeholder="https://..." {...field} className="flex-1" />
  {field.value && (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={() => window.open(field.value, '_blank')}
      title="Abrir URL em nova aba"
    >
      <ExternalLink className="h-4 w-4" />
    </Button>
  )}
</div>
```

---

## Mapeamento de Cores

Para manter consistência com o design system existente:

| Template | Projeto |
|----------|---------|
| `brand-50` | `bg-primary/5` |
| `brand-100` | `bg-primary/10` |
| `brand-300` | `text-primary/60` |
| `brand-500/5` | `shadow-primary/5` |
| `brand-600` | `text-primary` ou `from-primary` |
| `brand-900` | `bg-[#1e3a8a]` (Navy Dark) |
| `gray-*` | Manter como está (Tailwind padrão) |
| `emerald-*` | Manter como está |

---

## Fluxo de Uso

```text
Usuário completa pagamento na Ticto
          │
          ▼
Ticto redireciona para /thank-you/rota60min
          │
          ▼
Página exibe confirmação com:
  ├── Sucesso visual (animação)
  ├── Resumo do produto comprado
  ├── CTA para agendar sessão
  └── Informação sobre bônus de crédito
          │
          ▼
Usuário clica "Voltar ao Hub" → /dashboard/hub
```

---

## Design Adaptações

1. **Animações**: Usar `animate-bounce` com `animationDuration: 3s` para suavidade
2. **Gradientes**: Usar `from-primary to-indigo-600` (similar ao template)
3. **Border Radius**: Manter 48px para card principal, 40px para secundários
4. **Sombras**: `shadow-2xl shadow-primary/5` para efeito premium

---

## Responsividade

- Grid de próximos passos: `grid-cols-1 md:grid-cols-2`
- Botões de ação: `flex-col sm:flex-row`
- Padding adaptativo: `px-4 sm:px-6`, `p-8 md:p-20`

---

## Resumo de Mudanças

| Arquivo | Linhas Afetadas |
|---------|-----------------|
| `src/pages/thankyou/ThankYouRota60.tsx` | Novo (150+ linhas) |
| `src/App.tsx` | +3 linhas (import + rota) |
| `src/components/admin/hub/HubServiceForm.tsx` | ~15 linhas (campo redirect_url) |
