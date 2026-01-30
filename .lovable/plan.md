

# Plano: Corrigir Parser CSV para Campos Multi-Linha

## Problema Identificado

O CSV tem um campo `relatorio` que contém **quebras de linha** dentro de aspas:

```csv
Nome,email,...,relatorio
Daniel Kiel,kiel.daniel@gmail.com,...,"Oi, George...
Você está na fase de *Preparação...
📋 *O que o diagnóstico aponta...
...mais 30 linhas..."
```

O parser atual divide o texto por `\n` primeiro (linha 9), o que quebra o campo multi-linha em 30+ linhas separadas, cada uma sendo tratada como um registro inválido.

**Resultado**: 1 linha válida (a primeira parte) + 24 "linhas" que são fragmentos do relatório.

---

## Solução

Reescrever o `parseCSV` para processar caractere por caractere, respeitando:
1. Campos entre aspas que contêm vírgulas
2. Campos entre aspas que contêm **quebras de linha**
3. Aspas escapadas (`""`)

---

## Mudanças Técnicas

### Arquivo: `src/hooks/useLeadImport.ts`

Substituir a função `parseCSV` por uma versão que:

```typescript
function parseCSV(text: string): LeadCSVRow[] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  
  // Normaliza quebras de linha
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    const nextChar = normalized[i + 1];
    
    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Aspas escapadas
          currentField += '"';
          i++;
        } else {
          // Fim do campo entre aspas
          inQuotes = false;
        }
      } else {
        // Incluir qualquer caractere (inclusive \n) dentro de aspas
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.length > 0) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }
  
  // Última linha
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }
  
  // Primeira linha são os headers
  if (rows.length < 2) return [];
  
  const headers = rows[0].map(h => h.replace(/^\uFEFF/, '')); // Remove BOM
  const result: LeadCSVRow[] = [];
  
  for (let i = 1; i < rows.length; i++) {
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = rows[i][index] || '';
    });
    result.push(row as unknown as LeadCSVRow);
  }
  
  return result;
}
```

---

## Lógica do Novo Parser

```text
Lendo caractere por caractere:
     │
     ├── Dentro de aspas? (inQuotes = true)
     │      ├── Char é " seguido de "? → Adicionar " ao campo (aspas escapadas)
     │      ├── Char é " sozinho? → Sair do modo aspas
     │      └── Qualquer outro char (inclusive \n)? → Adicionar ao campo
     │
     └── Fora de aspas? (inQuotes = false)
            ├── Char é "? → Entrar no modo aspas
            ├── Char é ,? → Finalizar campo, começar próximo
            ├── Char é \n? → Finalizar campo E linha, começar nova linha
            └── Outro char? → Adicionar ao campo
```

---

## Arquivo a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useLeadImport.ts` | Reescrever função `parseCSV` (linhas 8-40) |

---

## Benefícios

1. **Campos multi-linha**: Relatórios com quebras de linha são parseados corretamente
2. **Aspas escapadas**: Suporta `""` dentro de campos
3. **BOM handling**: Remove o caractere BOM do início do arquivo
4. **Compatibilidade**: Funciona com CSVs exportados do Excel/Google Sheets

---

## Resultado Esperado

Após a correção:
- **1 lead válido** (Daniel Kiel com o relatório completo de 30+ linhas)
- **0 erros**

