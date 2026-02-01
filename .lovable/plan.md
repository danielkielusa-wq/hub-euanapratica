
# Plano: Correção de Truncamento e Exportação CSV

## Problemas Identificados

1. **Cards Truncados**: Os cards de diagnóstico no modal têm texto cortado porque não permitem expansão flexível do conteúdo
2. **Falta Exportação**: Não existe opção para baixar a tabela de leads com URLs dos relatórios

---

## 1. Corrigir Truncamento nos Diagnostic Cards

### Arquivo: `src/components/admin/leads/LeadReportModal.tsx`

**Problema atual (linha ~194)**:
```tsx
<p className="text-xs text-muted-foreground mt-1">{values.secondary}</p>
```
O texto secundário não tem espaço para expansão.

**Solução**:
- Remover altura fixa implícita
- Adicionar `min-h-0` e `flex-1` no container do texto
- Garantir que o card cresça com o conteúdo

```tsx
<div 
  key={item.key} 
  className="bg-background p-6 rounded-[28px] border shadow-sm hover:shadow-md transition-all flex gap-4 items-start min-h-fit"
>
  <div className={cn("w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center", item.bgColor, item.iconColor)}>
    <Icon size={24} />
  </div>
  <div className="flex-1 min-w-0">
    <p className="text-xs font-black text-muted-foreground uppercase tracking-wider mb-1">{item.label}</p>
    <p className="text-sm text-foreground font-bold leading-relaxed">{values.primary}</p>
    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{values.secondary}</p>
  </div>
</div>
```

---

## 2. Adicionar Botão de Download CSV

### Arquivo: `src/components/admin/leads/LeadsTable.tsx`

**Modificações**:

1. Adicionar botão "Exportar CSV" acima da tabela
2. Criar função `downloadCSV()` que:
   - Gera CSV com colunas: Nome, Email, Área, Inglês, Acessos, Data, URL do Relatório
   - Usa `access_token` para montar a URL completa do relatório
   - Faz download automático do arquivo

**Novo código**:

```tsx
import { Download } from 'lucide-react';

// Dentro do componente:
const downloadCSV = () => {
  const headers = ['Nome', 'Email', 'Área', 'Inglês', 'Acessos', 'Importado em', 'URL Relatório'];
  
  const rows = evaluations.map(e => [
    e.name,
    e.email,
    e.area || '',
    e.english_level || '',
    e.access_count.toString(),
    format(new Date(e.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
    `${window.location.origin}/report/${e.access_token}`
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `leads-exportados-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  
  toast({ title: 'CSV exportado!', description: `${evaluations.length} leads exportados.` });
};

// No JSX, antes da tabela:
<div className="flex justify-between items-center mb-4">
  <p className="text-sm text-muted-foreground">{evaluations.length} leads encontrados</p>
  <Button variant="outline" onClick={downloadCSV} className="gap-2 rounded-[12px]">
    <Download className="w-4 h-4" />
    Exportar CSV
  </Button>
</div>
```

---

## Resumo de Mudanças

| Arquivo | Modificação |
|---------|-------------|
| `LeadReportModal.tsx` | Adicionar `min-h-fit`, `flex-1`, `min-w-0` e `leading-relaxed` nos cards |
| `LeadsTable.tsx` | Adicionar função `downloadCSV()` e botão de exportação |

---

## Resultado Esperado

1. **Cards**: Texto completo visível, cards expandem conforme necessário
2. **Exportação**: Botão "Exportar CSV" gera arquivo com todos os dados + URLs dos relatórios
