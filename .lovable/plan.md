

# Plano: Meu Hub como Pagina Inicial + Redesign Inspirado em StudentApps

## Objetivo

Implementar duas mudancas principais:
1. **Redirecionar estudantes para `/dashboard/hub`** apos login (em vez de `/dashboard`)
2. **Redesenhar a pagina StudentHub** seguindo o layout do arquivo `StudentApps.tsx`, focando primeiro nos recursos gratuitos da assinatura e depois nos servicos pagos

---

## Mudancas Necessarias

### 1. Alterar Rota Padrao de Login para Estudantes

| Arquivo | Mudanca |
|---------|---------|
| `src/App.tsx` | Alterar `PublicRoute` para redirecionar estudantes para `/dashboard/hub` |

**Codigo Atual (linha 116-121):**
```typescript
const routes: Record<string, string> = {
  student: '/dashboard',
  mentor: '/mentor/dashboard',
  admin: '/admin/dashboard',
};
```

**Codigo Novo:**
```typescript
const routes: Record<string, string> = {
  student: '/dashboard/hub',  // <- Mudanca aqui
  mentor: '/mentor/dashboard',
  admin: '/admin/dashboard',
};
```

Tambem alterar em `ProtectedRoute` (linhas 91-96):
```typescript
const routes: Record<string, string> = {
  student: '/dashboard/hub',  // <- Mudanca aqui
  ...
};
```

---

### 2. Redesenhar StudentHub Inspirado em StudentApps.tsx

O novo layout tera a seguinte hierarquia visual:

```text
+-----------------------------------------------+
| HEADER: "Seu Hub" + Badge do Plano            |
| Subtitulo contextual baseado no plano         |
+-----------------------------------------------+

+-----------------------------------------------+
| FREE TIER VALUE (Grid 2 colunas)              |
| +-------------------+ +---------------------+ |
| | ResumePass AI     | | Aula Base           | |
| | (Creditos disp.)  | | (Masterclass Free)  | |
| +-------------------+ +---------------------+ |
+-----------------------------------------------+

+-----------------------------------------------+
| UPSELL BANNER (ROTA EUA) - Dark Gradient      |
| Preco + CTA + Garantia                        |
+-----------------------------------------------+

+-----------------------------------------------+
| OUTROS SERVICOS (Grid 3 colunas)              |
| Cards menores com preco e CTA                 |
+-----------------------------------------------+
```

---

### 3. Componentes a Criar/Modificar

| Componente | Acao |
|------------|------|
| `src/pages/hub/StudentHub.tsx` | Reescrever completamente com novo layout |
| `src/components/hub/FreeToolsSection.tsx` | **NOVO** - Grid com ferramentas gratuitas do plano |
| `src/components/hub/UpsellBanner.tsx` | **NOVO** - Banner escuro para ROTA EUA |
| `src/components/hub/SecondaryServicesGrid.tsx` | **NOVO** - Grid de servicos secundarios |

---

### 4. Novo Fluxo de Dados

O novo StudentHub ira:

1. **Buscar quota do usuario** (`useSubscription`) para exibir:
   - Nome do plano (Starter/Pro/VIP)
   - Creditos disponiveis
   
2. **Exibir ferramentas FREE primeiro**:
   - ResumePass AI (com creditos)
   - Aula Base (link externo)
   
3. **Mostrar upsell principal** (servico `is_highlighted = true` da tabela `hub_services`)

4. **Listar servicos secundarios** (demais servicos high-touch)

---

## Detalhes Tecnicos

### Cores e Estilos do StudentApps.tsx

| Elemento | Estilo |
|----------|--------|
| Cards principais | `rounded-[32px] p-8 border border-gray-100 shadow-sm hover:shadow-xl` |
| Blur decorativo | `blur-2xl` em cantos |
| Banner upsell | `bg-[#0F172A]` (slate-900) com gradientes |
| Botao CTA | `bg-brand-600 hover:bg-brand-500 rounded-2xl` |
| Cards secundarios | `rounded-[24px] p-6` |

### Integracao com Dados Existentes

```typescript
// Usar hooks existentes
import { useSubscription } from '@/hooks/useSubscription';
import { useHubServices } from '@/hooks/useHubServices';

// Logica de exibicao
const isFreePlan = quota?.planId === 'basic';
const featuredService = services?.find(s => s.is_highlighted);
const secondaryServices = services?.filter(s => 
  s.service_type === 'consulting' || s.service_type === 'live_mentoring'
);
```

---

## Arquivos Afetados

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/App.tsx` | Editar | Mudar rota padrao de estudantes para `/dashboard/hub` |
| `src/pages/hub/StudentHub.tsx` | Reescrever | Layout completo inspirado em StudentApps |
| `src/components/hub/FreeToolsSection.tsx` | Criar | Grid de ferramentas gratuitas |
| `src/components/hub/UpsellBanner.tsx` | Criar | Banner de upsell ROTA EUA |
| `src/components/hub/SecondaryServicesGrid.tsx` | Criar | Grid de servicos secundarios |

---

## Resultado Final

- Estudantes serao redirecionados para o Hub ao fazer login
- Layout mais limpo e focado em conversao
- Hierarquia visual: Gratuito primeiro -> Upsell principal -> Servicos pagos
- Design moderno com cards arredondados e efeitos de blur

