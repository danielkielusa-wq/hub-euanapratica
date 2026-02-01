
# Plano: Correção do Truncamento de Cards e Exportação CSV

## Problemas Identificados

### 1. Cards Truncados
O grid 2x2 força altura uniforme entre os cards. Como o texto varia muito de tamanho (ex: "Não informado" vs descrições longas), os cards maiores são cortados.

**Solução**: Usar CSS Grid com `auto-rows: min-content` ou mudar para Flexbox com wrap para permitir altura variável.

### 2. Exportação CSV
| Problema | Causa | Solução |
|----------|-------|---------|
| Formato diferente do input | Exporta apenas 7 colunas vs ~18 do input | Exportar todas as colunas do `LeadCSVRow` + URL |
| Caracteres especiais | Falta BOM UTF-8 | Adicionar `\uFEFF` no início do CSV |
| Duplicatas por email | Sem filtro | Agrupar por email e manter mais recente |

---

## Mudanças Necessárias

### 1. `LeadReportModal.tsx` - Corrigir Truncamento

**Problema atual (linha ~179):**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
```

O grid padrão iguala alturas dos itens na mesma linha.

**Solução - Usar auto-rows:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-min">
```

Ou usar Masonry-style com flexbox:
```tsx
<div className="columns-1 md:columns-2 gap-4 space-y-4">
  {diagnosticConfig.map((item) => (
    <div key={item.key} className="break-inside-avoid bg-background p-6 ...">
```

---

### 2. `LeadsTable.tsx` - Corrigir Exportação CSV

**Novo código do `downloadCSV()`:**

```typescript
const downloadCSV = () => {
  // Headers no mesmo formato do input + URL
  const headers = [
    'Nome', 'email', 'telefone', 'Area', 'Atuação', 
    'trabalha internacional', 'experiencia', 'Englishlevel',
    'objetivo', 'VisaStatus', 'timeline', 'FamilyStatus',
    'incomerange', 'investment range', 'impediment', 
    'impedmentother', 'main concern', 'relatorio', 'URL Relatório'
  ];
  
  // Deduplicar por email, mantendo mais recente (já ordenado por created_at desc)
  const uniqueByEmail = new Map<string, CareerEvaluation>();
  evaluations.forEach(e => {
    if (!uniqueByEmail.has(e.email)) {
      uniqueByEmail.set(e.email, e);
    }
  });
  const dedupedEvaluations = Array.from(uniqueByEmail.values());
  
  const rows = dedupedEvaluations.map(e => [
    e.name,
    e.email,
    e.phone || '',
    e.area || '',
    e.atuacao || '',
    e.trabalha_internacional ? 'Sim' : 'Não',
    e.experiencia || '',
    e.english_level || '',
    e.objetivo || '',
    e.visa_status || '',
    e.timeline || '',
    e.family_status || '',
    e.income_range || '',
    e.investment_range || '',
    e.impediment || '',
    e.impediment_other || '',
    e.main_concern || '',
    e.report_content || '',
    `${window.location.origin}/report/${e.access_token}`
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  
  // Adicionar BOM UTF-8 para Excel interpretar corretamente
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `leads-exportados-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  
  toast({ 
    title: 'CSV exportado!', 
    description: `${dedupedEvaluations.length} leads únicos exportados (${evaluations.length - dedupedEvaluations.length} duplicatas removidas).` 
  });
};
```

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/components/admin/leads/LeadReportModal.tsx` | Adicionar `auto-rows-min` ao grid dos diagnostic cards |
| `src/components/admin/leads/LeadsTable.tsx` | Reescrever `downloadCSV()` com formato completo, BOM e deduplicação |

---

## Resultado Esperado

1. **Cards**: Cada card expande para mostrar todo o texto, sem cortes
2. **CSV**: 
   - Mesmo formato do input + coluna URL
   - Caracteres especiais preservados (ç, ã, é, etc.)
   - Apenas o registro mais recente por email
