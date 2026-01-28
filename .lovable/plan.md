
# Plano: Atualização dos Menus de Navegação por Role

## Problema Identificado

O menu lateral (`DashboardLayout.tsx`) está desatualizado. Várias páginas foram criadas e registradas no `App.tsx`, mas nunca foram adicionadas aos menus das respectivas roles.

## Páginas Faltando por Role

### Student (estudante)
| Página | Rota | Ícone Sugerido |
|--------|------|----------------|
| Meus Pedidos | `/meus-pedidos` | `ShoppingBag` |
| Biblioteca | `/biblioteca` | `Library` |

### Mentor
| Página | Rota | Ícone Sugerido |
|--------|------|----------------|
| Meus Pedidos | `/meus-pedidos` | `ShoppingBag` |

### Admin
| Página | Rota | Ícone Sugerido |
|--------|------|----------------|
| Histórico de Compras | `/admin/pedidos` | `Receipt` |
| Simulador Ticto | `/admin/ticto-simulator` | `FlaskConical` ou `Webhook` |

---

## Mudanças no Arquivo

**Arquivo:** `src/components/layouts/DashboardLayout.tsx`

### 1. Importar novos ícones

Adicionar ao import existente:
```typescript
import { 
  // ... ícones existentes
  ShoppingBag,  // Para "Meus Pedidos"
  Receipt,      // Para "Histórico de Compras" (admin)
  Webhook       // Para "Simulador Ticto" (admin)
} from 'lucide-react';
```

### 2. Atualizar menu do Student

```typescript
student: [
  {
    label: 'OVERVIEW',
    items: [
      { label: 'Meu Hub', href: '/dashboard/hub', icon: LayoutDashboard },
      { label: 'Dashboard', href: '/dashboard', icon: Users },
      { label: 'Meus Espaços', href: '/dashboard/espacos', icon: GraduationCap },
      { label: 'Currículo USA', href: '/curriculo', icon: FileCheck },
      { label: 'Agenda', href: '/dashboard/agenda', icon: Calendar },
      { label: 'Tarefas', href: '/dashboard/tarefas', icon: ClipboardList },
      { label: 'Biblioteca', href: '/biblioteca', icon: Library }, // NOVO
    ],
  },
  {
    label: 'MINHA CONTA',  // Nova seção
    items: [
      { label: 'Meus Pedidos', href: '/meus-pedidos', icon: ShoppingBag }, // NOVO
    ],
  },
  {
    label: 'SOCIAL',
    items: [
      { label: 'Suporte', href: '/dashboard/suporte', icon: MessageCircle },
    ],
  },
],
```

### 3. Atualizar menu do Mentor

```typescript
mentor: [
  {
    label: 'OVERVIEW',
    items: [
      { label: 'Dashboard', href: '/mentor/dashboard', icon: LayoutDashboard },
      { label: 'Meus Espaços', href: '/mentor/espacos', icon: GraduationCap },
      { label: 'Currículo USA', href: '/curriculo', icon: FileCheck },
      { label: 'Agenda', href: '/mentor/agenda', icon: Calendar },
      { label: 'Biblioteca', href: '/biblioteca', icon: Library },
      { label: 'Tarefas', href: '/mentor/tarefas', icon: ClipboardList },
    ],
  },
  {
    label: 'MINHA CONTA',  // Nova seção
    items: [
      { label: 'Meus Pedidos', href: '/meus-pedidos', icon: ShoppingBag }, // NOVO
    ],
  },
  {
    label: 'CONFIGURAÇÕES',
    items: [
      { label: 'Perfil', href: '/perfil', icon: Settings },
    ],
  },
],
```

### 4. Atualizar menu do Admin

```typescript
admin: [
  {
    label: 'OVERVIEW',
    items: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Espaços', href: '/admin/espacos', icon: GraduationCap },
      { label: 'Biblioteca', href: '/biblioteca', icon: Library },
      { label: 'Usuários', href: '/admin/usuarios', icon: Users },
      { label: 'Produtos', href: '/admin/produtos', icon: BookOpen },
      { label: 'Matrículas', href: '/admin/matriculas', icon: ClipboardList },
    ],
  },
  {
    label: 'FINANCEIRO',  // Nova seção
    items: [
      { label: 'Histórico de Compras', href: '/admin/pedidos', icon: Receipt }, // NOVO
      { label: 'Assinaturas', href: '/admin/assinaturas', icon: CreditCard }, // Movido de RELATÓRIOS
    ],
  },
  {
    label: 'RELATÓRIOS',
    items: [
      { label: 'Relatórios', href: '/admin/relatorios', icon: UserCog },
      { label: 'Feedback', href: '/admin/feedback', icon: MessageSquarePlus },
      { label: 'Testes E2E', href: '/admin/testes-e2e', icon: FlaskConical },
    ],
  },
  {
    label: 'FERRAMENTAS',  // Nova seção
    items: [
      { label: 'Simulador Ticto', href: '/admin/ticto-simulator', icon: Webhook }, // NOVO
    ],
  },
  {
    label: 'CONFIGURAÇÕES',
    items: [
      { label: 'Configurar Planos', href: '/admin/planos', icon: SlidersHorizontal },
      { label: 'Configurações', href: '/admin/configuracoes', icon: Settings },
    ],
  },
],
```

---

## Resumo das Mudanças

| Role | Itens Adicionados | Seções Novas |
|------|-------------------|--------------|
| Student | Biblioteca, Meus Pedidos | MINHA CONTA |
| Mentor | Meus Pedidos | MINHA CONTA |
| Admin | Histórico de Compras, Simulador Ticto | FINANCEIRO, FERRAMENTAS |

---

## Estrutura Final dos Menus

### Student
```
OVERVIEW
├── Meu Hub
├── Dashboard
├── Meus Espaços
├── Currículo USA
├── Agenda
├── Tarefas
└── Biblioteca

MINHA CONTA
└── Meus Pedidos

SOCIAL
└── Suporte
```

### Mentor
```
OVERVIEW
├── Dashboard
├── Meus Espaços
├── Currículo USA
├── Agenda
├── Biblioteca
└── Tarefas

MINHA CONTA
└── Meus Pedidos

CONFIGURAÇÕES
└── Perfil
```

### Admin
```
OVERVIEW
├── Dashboard
├── Espaços
├── Biblioteca
├── Usuários
├── Produtos
└── Matrículas

FINANCEIRO
├── Histórico de Compras
└── Assinaturas

RELATÓRIOS
├── Relatórios
├── Feedback
└── Testes E2E

FERRAMENTAS
└── Simulador Ticto

CONFIGURAÇÕES
├── Configurar Planos
└── Configurações
```
