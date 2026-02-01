
# Plano: Remover Truncamento dos Cards de Diagnóstico

## Problema Identificado

O screenshot mostra a **página pública do relatório** (`/report/[token]`), não o modal admin. O componente `DiagnosticGrid.tsx` tem classes CSS que forçam truncamento:

```tsx
// Linha 80 - trunca em 1 linha
<p className="font-bold text-foreground text-base truncate">

// Linha 83 - limita a 2 linhas
<p className="text-xs text-muted-foreground mt-1 line-clamp-2">
```

---

## Solução

### Modificar `src/components/report/DiagnosticGrid.tsx`

Remover as classes de truncamento e permitir que o texto expanda naturalmente:

| Linha | Antes | Depois |
|-------|-------|--------|
| 80 | `truncate` | remover classe |
| 83 | `line-clamp-2` | remover classe |

**Código corrigido:**

```tsx
// Linha 80 - título do diagnóstico
<p className="font-bold text-foreground text-base">
  {item.getValue(diagnostic)}
</p>

// Linha 83 - descrição do diagnóstico  
<p className="text-xs text-muted-foreground mt-1 leading-relaxed">
  {item.getDescription(diagnostic)}
</p>
```

Adicionar `leading-relaxed` na descrição para melhor legibilidade em textos mais longos.

---

## Arquivo a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/components/report/DiagnosticGrid.tsx` | Remover `truncate` e `line-clamp-2`, adicionar `leading-relaxed` |

---

## Resultado Esperado

- Cards expandem verticalmente para mostrar todo o texto
- Nenhum conteúdo cortado com "..."
- Melhor legibilidade com espaçamento de linha adequado
