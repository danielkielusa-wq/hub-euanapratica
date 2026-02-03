
# Plano: Redesenho do Menu Sidebar - Visual Premium Estruturado

## Visao Geral

Redesenhar completamente o componente DashboardLayout com uma sidebar moderna seguindo o design de referencia (Glassmorphism, flutuante, estruturada), incluindo:

- Novo layout visual com estilo glassmorphism e bordas arredondadas
- Barra de busca estilo "Spotlight" com atalho CMD+K
- Grupos de navegacao reorganizados conforme especificado
- Badges especiais (HOT, NOVO, IA) nos itens relevantes
- Footer com card do usuario, plano e botao de upgrade
- Sistema de busca global que pesquisa em todo o app

---

## Estrutura de Navegacao (Nova Hierarquia)

| Grupo | Item | Icone Lucide | Badge |
|-------|------|--------------|-------|
| **DISCOVERY** | Inicio | Compass | - |
| | Comunidade | Users | HOT (amber) |
| | Agenda | Calendar | - |
| | Catalogo | Search | NOVO (azul) |
| | Meus Espacos | LayoutGrid | - |
| **MENTORIA** | Dashboard | LayoutDashboard | - |
| | Biblioteca | BookOpen | - |
| | Tarefas | ClipboardList | - |
| **TOOLS & AI** | ResumePass AI | FileSearch | IA (indigo, estilo especial) |
| **MINHA CONTA** | Perfil | User | - |
| | Meus Pedidos | ShoppingBag | - |
| | Suporte | LifeBuoy | - |

---

## Componentes Visuais

### Header da Sidebar
- Logo "USAHUB" com icone arredondado azul
- Botao X para fechar (apenas mobile)

### Barra de Busca Spotlight
- Input com placeholder "Busca rapida..."
- Badge visual "CMD + K" a direita
- Atalho de teclado funcional para abrir/focar
- Debounce na digitacao
- Pesquisa em: servicos, paginas, espacos, agenda, tarefas

### Navegacao Agrupada
- Titulos de grupo: uppercase, text-xs, text-gray-400
- Itens: flex com icone + label + badge opcional
- Active state: bg-blue-50 (bg-brand-50) + text-blue-600
- Hover state: bg-gray-50
- Item ResumePass AI: estilo especial indigo/roxo

### Footer (Pinned Bottom)
- Card com fundo suave (bg-gray-50/80)
- Avatar circular com iniciais do usuario
- Nome + Status do plano (Free/PRO/VIP)
- Icone de logout
- Botao "UPGRADE PARA VIP" com borda brand e texto bold

---

## Estilos CSS

### Container da Sidebar
```css
// Desktop: fixo a esquerda, flutuante
w-[300px] bg-white/90 backdrop-blur-xl border border-gray-100 rounded-[24px] shadow-lg m-4

// Mobile: translate-x animado, overlay escuro
```

### Cores Principais
| Elemento | Cor |
|----------|-----|
| Fundo pagina | #F8F9FB |
| Sidebar | white/90 com backdrop-blur |
| Brand primary | #2563EB (Azul Royal) |
| Brand hover | bg-blue-50 (#EFF6FF) |
| Texto ativo | text-blue-600 |
| Badge HOT | bg-amber-100 text-amber-700 |
| Badge NOVO | bg-blue-100 text-blue-600 |
| Badge IA | bg-indigo-100 text-indigo-600 |
| Grupo label | text-gray-400 |

### Badges
```css
text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide
```

---

## Sistema de Busca Global

### Escopo da Busca
A busca pesquisara em:

1. **Paginas do App** - Rotas disponiveis para o usuario
2. **Espacos** - Espacos que o usuario tem acesso
3. **Sessoes/Agenda** - Proximos eventos/sessoes
4. **Tarefas** - Assignments pendentes
5. **Servicos do Hub** - Produtos e servicos disponiveis

### Implementacao
- Modal de busca ou dropdown abaixo do input
- Resultados agrupados por categoria
- Click navega para o item
- Atalho CMD+K (Mac) ou CTRL+K (Windows)

---

## Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/components/layouts/DashboardLayout.tsx` | Reescrever completamente com novo design |

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/components/layouts/SidebarNav.tsx` | Componente isolado da sidebar |
| `src/components/layouts/SpotlightSearch.tsx` | Componente de busca global |
| `src/components/layouts/SidebarUserCard.tsx` | Card do usuario no footer |

---

## Comportamento Responsivo

### Desktop (lg e acima)
- Sidebar visivel e fixa
- Width: 300px
- Margem de 16px (m-4) para efeito flutuante
- Bordas arredondadas (rounded-[24px])
- Main content com margin-left adequada

### Mobile (abaixo de lg)
- Sidebar escondida por padrao (translate-x-full ou -translate-x-full)
- Botao hamburger no header mobile
- Ao abrir: overlay escuro no fundo (bg-black/20)
- Sidebar desliza da esquerda
- Botao X para fechar dentro da sidebar

---

## Integracao com usePlanAccess

O footer da sidebar usara `usePlanAccess` para:

```typescript
const { planName, isPremiumPlan, isVipPlan, theme } = usePlanAccess();

// Exibir badge do plano
// Condicionar exibicao do botao "UPGRADE PARA VIP" (ocultar se ja for VIP)
// Aplicar cor do tema no avatar/badge
```

---

## Preview Visual (Referencia)

Com base na imagem fornecida:

```
+----------------------------------+
|  [U] USAHUB                   X  |
+----------------------------------+
|  [Q] Busca rapida...     ⌘ K    |
+----------------------------------+
|  DISCOVERY                       |
|  [o] Inicio           (active)   |
|  [👥] Comunidade          [HOT]  |
|  [📅] Agenda                     |
|  [🔍] Catalogo          [NOVO]   |
|  [⊞] Meus Espacos               |
+----------------------------------+
|  MENTORIA                        |
|  [📊] Dashboard                  |
|  [📚] Biblioteca                 |
|  [📋] Tarefas                    |
+----------------------------------+
|  TOOLS & AI                      |
|  [📄] ResumePass AI       [IA]   |  <- Estilo indigo
+----------------------------------+
|  MINHA CONTA                     |
|  [👤] Perfil                     |
|  [🛍️] Meus Pedidos              |
|  [🛟] Suporte                    |
+----------------------------------+
|  +-------------------------------+|
|  | [A] Aluno Exemplo        [→] ||
|  |     MEMBRO PRO               ||
|  +-------------------------------+|
|  [ UPGRADE PARA VIP ]            |
+----------------------------------+
```

---

## Criterios de Sucesso

| Criterio | Verificacao |
|----------|-------------|
| Estilo Glassmorphism | Backdrop-blur + transparencia aplicados |
| Hierarquia correta | 4 grupos na ordem especificada |
| Badges funcionais | HOT, NOVO e IA nos itens corretos |
| Busca CMD+K | Atalho de teclado funciona |
| Footer com plano | Exibe nome e status do usuario logado |
| Mobile responsivo | Sidebar oculta/mostra com animacao |
| Active state visual | Item ativo com bg-blue-50 + text-blue-600 |
| ResumePass especial | Estilo indigo diferenciado |
