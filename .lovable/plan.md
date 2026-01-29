
# Plano: Corrigir Extração de Texto DOCX no Currículo USA

## Problema Identificado

O erro "Erro no processamento - Não foi possível processar seu currículo" ocorre porque a **extração de texto de arquivos DOCX está falhando**.

### Causa Raiz

O código atual tenta ler o DOCX como se fosse texto simples:

```typescript
const rawContent = textDecoder.decode(uint8Array);
const textMatches = rawContent.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
```

**Problema**: DOCX é um arquivo **ZIP comprimido** contendo XMLs. Decodificar os bytes brutos como texto não funciona porque o conteúdo está comprimido. A regex `<w:t>` pode encontrar padrões aleatórios nos bytes binários, mas não extrai o texto real do documento.

### Por Que Funcionou Antes?

O código pode ter funcionado parcialmente para alguns arquivos onde a compressão produziu bytes que coincidiam com os padrões XML, mas é fundamentalmente incorreto e falha para a maioria dos arquivos DOCX.

---

## Solução

Usar a biblioteca **zip.js** (compatível com Deno) para:
1. Descompactar o arquivo DOCX
2. Extrair o arquivo `word/document.xml` de dentro do ZIP
3. Parsear o XML e extrair o texto dos elementos `<w:t>`

---

## Mudanças Técnicas

### Arquivo: `supabase/functions/analyze-resume/index.ts`

#### 1. Adicionar Import do zip.js

```typescript
import { BlobReader, ZipReader } from "https://deno.land/x/zipjs@v2.7.52/index.js";
```

#### 2. Substituir Lógica de Extração DOCX

**Código Atual (linhas 190-230)**:
```typescript
} else if (isDocx) {
  const uint8Array = new Uint8Array(arrayBuffer);
  const textDecoder = new TextDecoder("utf-8");
  const rawContent = textDecoder.decode(uint8Array);
  // ... regex extraction que falha
}
```

**Código Novo**:
```typescript
} else if (isDocx) {
  try {
    // DOCX is a ZIP archive - properly unzip it
    const blob = new Blob([arrayBuffer]);
    const zipReader = new ZipReader(new BlobReader(blob));
    const entries = await zipReader.getEntries();
    
    // Find word/document.xml (main content)
    const documentEntry = entries.find(e => e.filename === "word/document.xml");
    
    if (!documentEntry || !documentEntry.getData) {
      await zipReader.close();
      return new Response(
        JSON.stringify({
          error_code: "EXTRACTION_FAILED",
          error: "Arquivo corrompido",
          error_message: "O arquivo DOCX parece estar corrompido. Por favor, abra no Word, salve novamente e tente.",
          parsing_error: true,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Extract document.xml content
    const documentBlob = await documentEntry.getData(new BlobWriter());
    const documentXml = await documentBlob.text();
    await zipReader.close();
    
    // Extract text from <w:t> tags
    const textMatches = documentXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
    const extractedText = textMatches
      .map(match => match.replace(/<[^>]+>/g, ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (extractedText.length < 100) {
      return new Response(
        JSON.stringify({
          error_code: "INSUFFICIENT_CONTENT",
          error: "Conteúdo insuficiente",
          error_message: "O currículo contém muito pouco texto. Certifique-se de que o arquivo não está vazio ou protegido.",
          parsing_error: true,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    resumeContent = extractedText.slice(0, 15000);
    
  } catch (zipError) {
    console.error("DOCX extraction error:", zipError);
    return new Response(
      JSON.stringify({
        error_code: "EXTRACTION_FAILED",
        error: "Falha na extração",
        error_message: "Não foi possível ler o arquivo DOCX. Por favor, converta para PDF e tente novamente.",
        parsing_error: true,
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
```

#### 3. Adicionar Import do BlobWriter

```typescript
import { BlobReader, BlobWriter, ZipReader } from "https://deno.land/x/zipjs@v2.7.52/index.js";
```

---

## Fluxo Corrigido

```text
Upload DOCX
     │
     ▼
Criar Blob do arrayBuffer
     │
     ▼
ZipReader abre o arquivo como ZIP
     │
     ▼
Buscar entry "word/document.xml"
     │
     ├── Não encontrou? → Erro "Arquivo corrompido"
     │
     ▼
Extrair conteúdo XML do entry
     │
     ▼
Regex extrai texto dos <w:t> tags
     │
     ├── Texto < 100 chars? → Erro "Conteúdo insuficiente"
     │
     ▼
Enviar para Gemini AI
     │
     ▼
Retornar análise completa ✓
```

---

## Arquivo a Modificar

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/analyze-resume/index.ts` | Adicionar zip.js e corrigir extração DOCX |

---

## Benefícios

1. **Funciona Corretamente**: Descompacta o ZIP e lê o XML real
2. **Mensagens de Erro Claras**: Diferencia entre "corrompido", "vazio" e "falha de extração"
3. **Compatibilidade**: zip.js é uma biblioteca madura e testada
4. **Fallback Seguro**: Sugere conversão para PDF se tudo falhar

---

## Testes Recomendados

Após implementação, testar com:
1. Arquivo DOCX normal (como o do usuário: CV_Wagner_Sabino.docx)
2. Arquivo PDF (verificar que não quebrou)
3. Arquivo DOCX vazio
4. Arquivo DOCX protegido por senha
