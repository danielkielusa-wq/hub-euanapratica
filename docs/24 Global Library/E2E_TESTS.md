# Biblioteca Global — Manual de Testes E2E

**Última atualização:** 2026-02-28
**Escopo:** Todos os fluxos da Biblioteca Global — Admin (criação de conteúdo) e Estudante/Mentor (consumo)

---

## Como usar este manual

Cada caso de teste segue este formato:

- **Pré-condição:** o que precisa estar configurado antes de executar
- **Passos:** ações na interface da aplicação, em ordem
- **Resultado esperado:** o que você deve ver/acontecer

> Referências a banco de dados (SQL, tabelas, colunas) estão na [Seção de Referência Técnica](#referência-técnica) ao final. Consulte apenas quando precisar validar dados internos.

---

## Pré-requisitos de Configuração

### Usuários necessários

| Papel | Como criar |
|-------|-----------|
| **Admin** | Usuário com role `admin` (use sua conta de admin) |
| **Estudante Pro/VIP** | Registrar em `/register` + completar onboarding + ter assinatura com plano `pro` ou `vip` |
| **Estudante Básico** | Registrar em `/register` + completar onboarding + manter plano `basic` (padrão) |

### Verificar feature flags dos planos

```sql
SELECT id, features->>'library_full_access' AS library_full_access
FROM public.plans
WHERE id IN ('basic', 'pro', 'vip');
```

Esperado: `basic = false`, `pro = true`, `vip = true`. Se divergir, corrija:

```sql
UPDATE public.plans
SET features = features || '{"library_full_access": true}'::jsonb
WHERE id IN ('pro', 'vip');

UPDATE public.plans
SET features = features || '{"library_full_access": false}'::jsonb
WHERE id = 'basic';
```

### Dados de teste mínimos necessários

Os testes desta seção criam os dados do zero. Não é necessário pré-popular — apenas ter os usuários acima.

### Arquivos de teste

Tenha em mãos:
- Um arquivo PDF (ex: `curriculo-modelo.pdf`)
- Um arquivo DOCX ou XLSX (ex: `planilha-vagas.xlsx`)
- Uma imagem PNG ou JPG (ex: `banner.png`)
- Um link externo válido (ex: `https://www.linkedin.com`)

---

## 1. Admin — Criar Estrutura de Pastas

**Rota:** `/admin/biblioteca-global`

### 1.1 Criar pasta raiz pública

**Pré-condição:** Logado como admin. Nenhuma pasta existe ainda.

**Passos:**
1. Acessar `/admin/biblioteca-global`
2. Clicar em **"Nova Pasta"** (botão no topo da coluna esquerda)
3. Preencher:
   - Nome: `Modelos de Currículo`
   - Ícone: `📄`
   - Descrição: `Templates prontos para o mercado americano`
   - Pasta pai: (vazio — raiz)
   - Acesso: `Público`
4. Clicar em **"Criar"**

**Resultado esperado:**
- Toast verde: "Pasta criada com sucesso"
- Pasta aparece no painel esquerdo com o ícone `📄` e o nome

---

### 1.2 Criar pasta raiz restrita

**Pré-condição:** Logado como admin.

**Passos:**
1. Clicar em **"Nova Pasta"**
2. Preencher:
   - Nome: `Ebooks Exclusivos`
   - Ícone: `📚`
   - Acesso: `Restrito (assinantes)`
3. Clicar em **"Criar"**

**Resultado esperado:**
- Pasta aparece com ícone de cadeado 🔒 ao lado do nome
- Toast verde de confirmação

---

### 1.3 Criar subpasta

**Pré-condição:** Pasta `Modelos de Currículo` existe.

**Passos:**
1. No painel esquerdo, passar o mouse sobre `Modelos de Currículo`
2. Clicar no ícone **"+"** (criar subpasta) que aparece ao passar o mouse
3. Preencher:
   - Nome: `Área de Tecnologia`
   - Pasta pai: `Modelos de Currículo` (pré-selecionada)
   - Acesso: `Público`
4. Clicar em **"Criar"**

**Resultado esperado:**
- Subpasta aparece indentada sob `Modelos de Currículo`
- Pode ser expandida/colapsada com a seta

---

### 1.4 Editar pasta

**Pré-condição:** Pasta `Ebooks Exclusivos` existe.

**Passos:**
1. Passar o mouse sobre `Ebooks Exclusivos`
2. Clicar no ícone de **lápis** (editar)
3. Alterar o nome para `Ebooks Premium`
4. Clicar em **"Salvar"**

**Resultado esperado:**
- Nome atualiza no painel esquerdo
- Toast verde: "Pasta atualizada"

---

### 1.5 Excluir pasta vazia

**Pré-condição:** Pasta `Área de Tecnologia` existe e está vazia.

**Passos:**
1. Passar o mouse sobre `Área de Tecnologia`
2. Clicar no ícone de **lixeira** (excluir)
3. Confirmar no dialog de confirmação

**Resultado esperado:**
- Pasta removida da árvore
- Toast verde: "Pasta excluída"

---

## 2. Admin — Adicionar Itens

**Rota:** `/admin/biblioteca-global`

### 2.1 Fazer upload de arquivo PDF

**Pré-condição:** Pasta `Modelos de Currículo` existe e está selecionada.

**Passos:**
1. Clicar na pasta `Modelos de Currículo` no painel esquerdo
2. Clicar em **"Adicionar Item"** (botão no painel direito)
3. Selecionar tipo: **Arquivo**
4. Arrastar o arquivo `curriculo-modelo.pdf` para a área de drop (ou clicar para selecionar)
5. Preencher:
   - Título: `Modelo de Currículo ATS`
   - Descrição: `Modelo otimizado para sistemas ATS do mercado americano`
   - Tags: digitar `curriculo` + Enter, `ats` + Enter, `americano` + Enter
6. Clicar em **"Salvar"**

**Resultado esperado:**
- Sheet fecha
- Card do item aparece na área de conteúdo com:
  - Ícone PDF vermelho
  - Título `Modelo de Currículo ATS`
  - Badge `PDF` e tamanho do arquivo
  - Tags `curriculo`, `ats`, `americano`
  - Contador `0 downloads`

---

### 2.2 Fazer upload de planilha XLSX

**Pré-condição:** Pasta `Modelos de Currículo` selecionada.

**Passos:**
1. Clicar em **"Adicionar Item"**
2. Tipo: **Arquivo**
3. Selecionar `planilha-vagas.xlsx`
4. Título: `Planilha de Rastreamento de Vagas`
5. Clicar em **"Salvar"**

**Resultado esperado:**
- Card aparece com ícone XLSX verde e badge `XLSX`

---

### 2.3 Adicionar link externo

**Pré-condição:** Pasta `Modelos de Currículo` selecionada.

**Passos:**
1. Clicar em **"Adicionar Item"**
2. Selecionar tipo: **Link**
3. URL: `https://www.linkedin.com`
4. Título: `LinkedIn — Perfil Profissional`
5. Descrição: `Guia de configuração do LinkedIn para o mercado internacional`
6. Tags: `linkedin` + Enter, `perfil` + Enter
7. Clicar em **"Salvar"**

**Resultado esperado:**
- Card aparece com ícone de link azul/ciano e badge `LINK`
- Sem botão de download — apenas botão de abrir link externo

---

### 2.4 Editar item

**Pré-condição:** Item `Modelo de Currículo ATS` existe.

**Passos:**
1. Passar o mouse sobre o card do item
2. Clicar no ícone de **lápis** (editar)
3. Alterar a descrição para `Template ATS-friendly para o mercado americano e canadense`
4. Adicionar tag `canadense`
5. Clicar em **"Salvar"**

**Resultado esperado:**
- Descrição atualiza no card
- Nova tag `canadense` visível
- Toast verde de confirmação

---

### 2.5 Excluir item

**Pré-condição:** Item `Planilha de Rastreamento de Vagas` existe.

**Passos:**
1. Passar o mouse sobre o card
2. Clicar no ícone de **lixeira**
3. Confirmar no dialog

**Resultado esperado:**
- Card removido da lista
- Toast verde: "Item excluído"

**Verificação técnica (opcional):**
```sql
-- O arquivo deve ter sido removido do Storage
-- Verificar ausência via Supabase Dashboard → Storage → materials → global-library/
```

---

### 2.6 Visualizar estatísticas

**Pré-condição:** Pelo menos 1 pasta e 1 item criados.

**Passos:**
1. Acessar `/admin/biblioteca-global`
2. Observar os cards de estatísticas no topo da página

**Resultado esperado:**
- Card **"Pastas"** mostra contagem correta
- Card **"Itens"** mostra contagem correta
- Card **"Downloads"** começa em `0`

---

## 3. Admin — Validar Controle de Acesso

### 3.1 Verificar que pasta restrita tem cadeado

**Pré-condição:** Pasta `Ebooks Premium` com acesso `restricted` existe.

**Passos:**
1. Observar o painel esquerdo de pastas no admin

**Resultado esperado:**
- Pasta `Ebooks Premium` mostra ícone 🔒 ao lado do nome
- Pastas públicas não mostram o cadeado

---

## 4. Estudante Pro/VIP — Navegação e Download

**Rota:** `/biblioteca-global`

### 4.1 Ver todas as pastas (incluindo restritas)

**Pré-condição:** Logado como estudante com plano `pro` ou `vip`. Pastas públicas e restritas existem.

**Passos:**
1. Clicar em **"Biblioteca"** no menu lateral
2. Observar o painel de pastas à esquerda

**Resultado esperado:**
- Pasta `Modelos de Currículo` (pública) visível
- Pasta `Ebooks Premium` (restrita) **também visível** com ícone 🔒
- Ao selecionar `Modelos de Currículo`, os itens aparecem à direita

---

### 4.2 Navegar por subpasta via breadcrumb

**Pré-condição:** Pasta `Modelos de Currículo` contém item `Modelo de Currículo ATS`.

**Passos:**
1. Clicar em `Modelos de Currículo` no painel esquerdo
2. Observar a URL e o breadcrumb no topo

**Resultado esperado:**
- URL: `/biblioteca-global/pasta/<uuid>`
- Breadcrumb: `Biblioteca / 📄 Modelos de Currículo`
- Botão **"Voltar"** visível
- Items da pasta visíveis no painel direito

---

### 4.3 Fazer download de arquivo

**Pré-condição:** Item `Modelo de Currículo ATS` (PDF) existe na pasta.

**Passos:**
1. Acessar a pasta `Modelos de Currículo`
2. Localizar o card `Modelo de Currículo ATS`
3. Clicar no ícone de **download** (seta para baixo)

**Resultado esperado:**
- Download do arquivo inicia no navegador
- O contador de downloads incrementa em `1` (visível para o admin)

**Verificação técnica (opcional):**
```sql
SELECT d.downloaded_at, u.email
FROM library_item_downloads d
JOIN auth.users u ON u.id = d.user_id
JOIN library_items i ON i.id = d.item_id
WHERE i.title = 'Modelo de Currículo ATS'
ORDER BY d.downloaded_at DESC
LIMIT 5;
```

---

### 4.4 Visualizar preview de PDF

**Pré-condição:** Item PDF existe. Navegador com suporte a PDF (Chrome/Edge).

**Passos:**
1. Localizar o card do PDF
2. Clicar no ícone de **olho** (visualizar)

**Resultado esperado:**
- Modal de preview abre
- PDF renderiza dentro do modal
- Botão de download disponível no modal
- Fechar o modal com `×` retorna à lista

---

### 4.5 Abrir link externo

**Pré-condição:** Item do tipo link existe (`LinkedIn — Perfil Profissional`).

**Passos:**
1. Localizar o card do link
2. Clicar no ícone de **link externo** (seta saindo da caixa)

**Resultado esperado:**
- URL `https://www.linkedin.com` abre em **nova aba**
- A aba atual permanece na biblioteca

---

### 4.6 Favoritar e desfavoritar item

**Pré-condição:** Logado como estudante Pro/VIP. Item `Modelo de Currículo ATS` existe.

**Passos:**
1. Localizar o card do item
2. Clicar na estrela ⭐ (favoritar)
3. Observar a mudança visual
4. Clicar novamente na estrela (desfavoritar)

**Resultado esperado:**
- Ao favoritar: estrela fica amarela/preenchida
- Ao desfavoritar: estrela volta a ficar cinza/vazia
- Ação persiste ao recarregar a página

**Verificação técnica (opcional):**
```sql
SELECT f.*, i.title
FROM library_item_favorites f
JOIN library_items i ON i.id = f.item_id
WHERE f.user_id = '<uuid-do-estudante>';
```

---

### 4.7 Filtrar por favoritos

**Pré-condição:** Pelo menos 1 item favoritado.

**Passos:**
1. Acessar uma pasta com itens
2. Clicar no botão **"Favoritos"** (ícone de estrela na barra de filtros)

**Resultado esperado:**
- Apenas os itens favoritados são exibidos
- Itens não favoritados desaparecem da lista
- Clicar novamente em "Favoritos" desativa o filtro e todos os itens voltam

---

### 4.8 Filtrar por tipo de item

**Pré-condição:** Pasta com pelo menos 1 arquivo e 1 link.

**Passos:**
1. Clicar na badge **"Arquivos"** nos filtros
2. Observar os resultados
3. Clicar em **"Links"**
4. Remover o filtro clicando na badge ativa

**Resultado esperado:**
- "Arquivos": apenas arquivos (PDF, DOCX, etc.) aparecem
- "Links": apenas links aparecem
- Ao remover: todos os tipos voltam

---

### 4.9 Buscar material por título

**Pré-condição:** Pasta com múltiplos itens, incluindo `Modelo de Currículo ATS`.

**Passos:**
1. Digitar `curriculo` na barra de busca
2. Observar os resultados em tempo real (ou ao pressionar Enter)

**Resultado esperado:**
- Apenas itens cujo título ou descrição contém `curriculo` aparecem
- Outros itens somem da lista

---

## 5. Estudante Básico — Restrição de Acesso

**Rota:** `/biblioteca-global`

### 5.1 Não ver pastas restritas

**Pré-condição:** Logado como estudante com plano `basic`. Pastas pública e restrita existem.

**Passos:**
1. Clicar em **"Biblioteca"** no menu lateral
2. Observar o painel de pastas à esquerda

**Resultado esperado:**
- Pasta `Modelos de Currículo` (pública) **visível**
- Pasta `Ebooks Premium` (restrita) **NÃO visível**
- Apenas pastas públicas aparecem na árvore

---

### 5.2 Acessar pastas públicas normalmente

**Pré-condição:** Estudante básico logado. Pasta pública com itens existe.

**Passos:**
1. Clicar em `Modelos de Currículo`
2. Fazer download de um arquivo

**Resultado esperado:**
- Items públicos visíveis e funcionais
- Download funciona normalmente para estudantes básicos

---

## 6. Mentor — Acesso à Biblioteca

### 6.1 Verificar que mentor vê a biblioteca no menu

**Pré-condição:** Logado como mentor.

**Passos:**
1. Verificar o menu lateral

**Resultado esperado:**
- Item **"Biblioteca"** visível no grupo CONTEÚDO do menu lateral
- Clicar leva para `/biblioteca-global`

### 6.2 Mentor tem o mesmo acesso que estudante

**Pré-condição:** Logado como mentor com ou sem assinatura Pro/VIP.

**Resultado esperado:**
- Mentor sem plano Pro: vê apenas pastas públicas
- Mentor com plano Pro/VIP: vê todas as pastas

---

## 7. Admin — Verificar Contagem de Downloads

**Pré-condição:** Pelo menos 1 download realizado nos testes anteriores.

**Passos:**
1. Acessar `/admin/biblioteca-global`
2. Observar o card de estatísticas **"Downloads"**
3. Selecionar a pasta onde o download ocorreu
4. Verificar o número no card do item

**Resultado esperado:**
- Card de stats mostra total de downloads ≥ 1
- Item que foi baixado mostra contador atualizado

---

## Referência Técnica

### Tabelas

| Tabela | Descrição |
|--------|-----------|
| `library_folders` | Estrutura de pastas (hierárquica via `parent_id`) |
| `library_items` | Arquivos e links dentro das pastas |
| `library_item_downloads` | Log de downloads por usuário |
| `library_item_favorites` | Favoritos por usuário |

### Queries úteis

```sql
-- Ver todas as pastas com contagem de itens
SELECT f.name, f.access_level, COUNT(i.id) AS item_count
FROM library_folders f
LEFT JOIN library_items i ON i.folder_id = f.id
GROUP BY f.id, f.name, f.access_level
ORDER BY f.name;

-- Ver itens de uma pasta específica
SELECT title, item_type, file_type, file_size, download_count, created_at
FROM library_items
WHERE folder_id = '<uuid-da-pasta>'
ORDER BY display_order, created_at;

-- Ver contagem total de downloads
SELECT i.title, COUNT(d.id) AS downloads
FROM library_items i
LEFT JOIN library_item_downloads d ON d.item_id = i.id
GROUP BY i.id, i.title
ORDER BY downloads DESC;

-- Limpar dados de teste
DELETE FROM library_item_downloads WHERE item_id IN (SELECT id FROM library_items);
DELETE FROM library_item_favorites WHERE item_id IN (SELECT id FROM library_items);
DELETE FROM library_items;
DELETE FROM library_folders;
```

### Arquivos relevantes

| Componente | Arquivo |
|-----------|---------|
| Página admin | `src/pages/admin/AdminGlobalLibrary.tsx` |
| Página estudante | `src/pages/library/GlobalLibrary.tsx` |
| Hooks admin | `src/hooks/useAdminGlobalLibrary.ts` |
| Hooks estudante | `src/hooks/useGlobalLibrary.ts` |
| Upload | `src/hooks/useGlobalLibraryUpload.ts` |
| Types | `src/types/global-library.ts` |
| Migration | `supabase/migrations/20260228997000_global_library.sql` |
