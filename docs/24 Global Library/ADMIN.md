# Biblioteca Global — Guia do Administrador

> Última atualização: 2026-02-28
>
> Este documento cobre como criar, organizar e gerenciar o conteúdo da Biblioteca Global — a área de templates, ebooks, links e materiais de apoio disponível para todos os usuários da plataforma.

---

## O que é a Biblioteca Global

A Biblioteca Global é uma área centralizada de recursos da plataforma, **independente dos espaços de aprendizado**. Você, como admin, define toda a estrutura de pastas e os materiais disponíveis. Os estudantes e mentores apenas visualizam e baixam o conteúdo.

### O que pode ser armazenado

| Tipo | Exemplos |
|------|---------|
| **Arquivo** | PDFs, DOCX, XLSX, imagens (PNG, JPG), templates |
| **Link** | Artigos externos, ferramentas, planilhas no Google Drive, vídeos no YouTube |

### Controle de acesso por pasta

Cada pasta pode ter um nível de acesso:

| Acesso | Quem vê |
|--------|---------|
| **Público** | Todos os usuários autenticados (qualquer plano) |
| **Restrito** | Apenas assinantes dos planos Pro e VIP |

---

## Onde acessar

- **Menu lateral** → grupo BIBLIOTECA → **Gerenciar Biblioteca**
- **URL direta:** `/admin/biblioteca-global`

---

## 1. Estrutura da Interface

A página é dividida em dois painéis:

**Painel esquerdo — Árvore de pastas**
- Lista todas as pastas em hierarquia (pastas pai e subpastas)
- Pasta com acesso restrito mostra ícone 🔒
- Ao passar o mouse sobre uma pasta, aparecem os botões de ação

**Painel direito — Conteúdo da pasta**
- Cards de estatísticas no topo (total de pastas, itens e downloads)
- Lista de itens da pasta selecionada
- Botão **"Adicionar Item"** para inserir novo conteúdo

---

## 2. Gerenciar Pastas

### Criar pasta raiz

1. Clicar em **"Nova Pasta"** (topo do painel esquerdo)
2. Preencher:
   - **Nome** (obrigatório): ex. `Modelos de Currículo`
   - **Ícone**: um emoji para identificar visualmente (ex. `📄`, `📚`, `🔗`)
   - **Descrição**: breve explicação do conteúdo
   - **Pasta pai**: deixar vazio para pasta raiz
   - **Acesso**: escolher `Público` ou `Restrito (assinantes)`
3. Clicar em **"Criar"**

### Criar subpasta

1. Passar o mouse sobre a pasta pai na árvore
2. Clicar no ícone **"+"** (criar subpasta)
3. A **Pasta pai** já vem pré-selecionada
4. Preencher nome e demais campos
5. Clicar em **"Criar"**

> As subpastas herdam a visibilidade da navegação, mas **o controle de acesso é independente por pasta**. Uma subpasta pode ser pública dentro de uma pasta restrita (mas raramente faz sentido).

### Editar pasta

1. Passar o mouse sobre a pasta
2. Clicar no ícone de **lápis** ✏️
3. Alterar os campos desejados
4. Clicar em **"Salvar"**

### Excluir pasta

1. Passar o mouse sobre a pasta
2. Clicar no ícone de **lixeira** 🗑️
3. Confirmar no dialog de confirmação

> **Atenção:** a exclusão de uma pasta remove também todos os seus itens e subpastas em cascata. Arquivos armazenados no Storage também são removidos.

---

## 3. Gerenciar Itens

### Adicionar arquivo

1. Selecionar a pasta de destino no painel esquerdo
2. Clicar em **"Adicionar Item"**
3. Selecionar tipo: **Arquivo**
4. Arrastar o arquivo para a área de upload ou clicar para selecionar
   - Formatos aceitos: PDF, DOCX, XLSX, PNG, JPG e outros
   - Múltiplos arquivos podem ser selecionados ao mesmo tempo
5. Para cada arquivo, preencher (ou editar após o upload):
   - **Título** (obrigatório): nome legível para os estudantes
   - **Descrição**: contexto sobre o material
   - **Tags**: palavras-chave para busca (digitar e pressionar Enter ou vírgula)
6. Clicar em **"Salvar"**

### Adicionar link externo

1. Selecionar a pasta de destino
2. Clicar em **"Adicionar Item"**
3. Selecionar tipo: **Link**
4. Preencher:
   - **URL**: endereço completo com `https://`
   - **Título**: nome exibido para os estudantes
   - **Descrição**: contexto do link
   - **Tags**: palavras-chave
5. Clicar em **"Salvar"**

> Links abrem em nova aba quando o estudante clicar. Um clique em link também é registrado como "download" para fins de estatísticas.

### Editar item

1. Passar o mouse sobre o card do item
2. Clicar no ícone de **lápis** ✏️
3. Alterar título, descrição ou tags
4. Clicar em **"Salvar"**

> Não é possível substituir o arquivo de um item já criado. Para trocar o arquivo, exclua o item e crie um novo.

### Excluir item

1. Passar o mouse sobre o card do item
2. Clicar no ícone de **lixeira** 🗑️
3. Confirmar no dialog

> Ao excluir um item do tipo arquivo, o arquivo também é removido do Storage automaticamente.

---

## 4. Estatísticas

No topo do painel direito, três cards mostram:

| Card | O que mostra |
|------|-------------|
| **Pastas** | Total de pastas criadas |
| **Itens** | Total de itens (arquivos + links) |
| **Downloads** | Total de downloads + aberturas de link registradas |

O contador de downloads em cada card de item mostra o número de vezes que aquele material específico foi baixado/acessado.

---

## 5. Boas Práticas

### Organização de pastas

- Use uma hierarquia rasa (no máximo 2-3 níveis) para facilitar a navegação
- Nomeie as pastas de forma clara e orientada à necessidade do estudante
- Use ícones emoji para tornar a navegação visual e intuitiva

**Exemplos de estrutura:**
```
📄 Modelos de Currículo (Público)
   └── 💻 Área de Tecnologia
   └── 📊 Área de Dados
📚 Ebooks (Público)
🔒 Recursos Exclusivos (Restrito)
   └── 🎯 Estratégias Avançadas
🔗 Links Úteis (Público)
```

### Gestão de arquivos

- Prefira PDFs para documentos — maior compatibilidade com o preview inline
- Use títulos descritivos (evite nomes de arquivo como `modelo-v3-final.docx`)
- Adicione tags relevantes para facilitar a busca por parte dos estudantes
- Mantenha descrições curtas e focadas no benefício do material

### Controle de acesso

- Conteúdo exclusivo (ebooks premium, templates avançados) → pasta **Restrita**
- Materiais de valor para todos (templates básicos, links de referência) → pasta **Pública**
- Evite misturar acesso em pastas do mesmo nível para não confundir a percepção de valor

---

## 6. Monitoramento

### Via interface

- Acompanhe o contador de downloads nos cards dos itens
- Use os stats gerais para ver o volume total de uso

### Via banco de dados

```sql
-- Top 10 materiais mais baixados
SELECT i.title, i.item_type, f.name AS pasta, COUNT(d.id) AS downloads
FROM library_items i
LEFT JOIN library_item_downloads d ON d.item_id = i.id
JOIN library_folders f ON f.id = i.folder_id
GROUP BY i.id, i.title, i.item_type, f.name
ORDER BY downloads DESC
LIMIT 10;

-- Downloads por data
SELECT DATE(downloaded_at) AS dia, COUNT(*) AS downloads
FROM library_item_downloads
GROUP BY dia
ORDER BY dia DESC
LIMIT 30;

-- Itens mais favoritados
SELECT i.title, COUNT(fav.id) AS favoritos
FROM library_items i
LEFT JOIN library_item_favorites fav ON fav.item_id = i.id
GROUP BY i.id, i.title
ORDER BY favoritos DESC
LIMIT 10;
```

---

## 7. Referência de Arquivos

| Componente | Arquivo |
|-----------|---------|
| Página admin | `src/pages/admin/AdminGlobalLibrary.tsx` |
| Hooks CRUD admin | `src/hooks/useAdminGlobalLibrary.ts` |
| Hook de upload | `src/hooks/useGlobalLibraryUpload.ts` |
| Componente: árvore admin | `src/components/admin/global-library/AdminFolderTree.tsx` |
| Componente: dialog de pasta | `src/components/admin/global-library/FolderFormDialog.tsx` |
| Componente: sheet de item | `src/components/admin/global-library/ItemFormDialog.tsx` |
| Componente: card admin | `src/components/admin/global-library/LibraryItemCard.tsx` |
| Types | `src/types/global-library.ts` |
| Migration | `supabase/migrations/20260228997000_global_library.sql` |
| Storage bucket | `materials` (prefixo `global-library/`) |
