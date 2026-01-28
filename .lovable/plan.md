
# Plano: Redesign Landing Page, Onboarding e Nova Pagina Meu Hub

Este plano abrange tres areas principais de mudancas:
1. **Landing Page**: Ajustes pontuais de links, redes sociais e elementos visuais
2. **Onboarding**: Redesign completo com stepper horizontal no topo e layout centralizado
3. **Meu Hub**: Nova pagina de catalogo de servicos como landing pos-login

---

## PARTE 1: LANDING PAGE (Ajustes Pontuais)

### 1.1 Navbar.tsx
**Alteracoes:**
- Remover completamente a `<nav>` com links "Curriculo AI", "Servicos", "Metodologia"
- Manter apenas: Logo (esquerda) + Botoes "Entrar" e "Acessar Hub" (direita)
- Todos os botoes devem apontar para `/login` ou `/cadastro`

### 1.2 Footer.tsx
**Alteracoes:**
- Trocar Twitter por YouTube (icone `Youtube` do Lucide)
- Atualizar URLs das redes sociais:
  - Instagram: `https://instagram.com/euanapratica` (ou URL real se conhecida)
  - LinkedIn: `https://linkedin.com/company/euanapratica`
  - YouTube: `https://youtube.com/@euanapratica`
- Alterar copyright de "2025" para "2026"
- Todos os links de navegacao devem apontar para `/login`

### 1.3 WaitlistSection.tsx
**Alteracoes:**
- Badge "VAGAS LIMITADAS PARA O BETA": mudar cor do texto e icone para branco (`text-white`)
- Icone Rocket: `text-white`
- Span do texto: `text-white`

### 1.4 HeroSection.tsx
**Alteracoes:**
- Substituir circulos roxos por miniaturas de pessoas geradas por AI
- Usar a funcionalidade de geracao de imagem do Lovable AI (google/gemini-2.5-flash-image) para gerar 5 fotos de perfil profissionais
- Alternativa: usar URLs de avatares placeholder (randomuser.me ou similar)
- Usar logos do projeto existente (`logo-horizontal.png`) no lugar de logos ficticios

### 1.5 BentoGrid.tsx
**Alteracoes:**
- Card "Curriculo USA AI": Link "Testar Agora Gratis" → `/login` (em vez de `/curriculo-usa`)
- Cards secundarios: todos os links "EXPLORAR" → `/login`

### 1.6 SuccessPath.tsx
**Alteracoes:**
- Botao CTA "Conheca nossa metodologia completa" → `/login`

---

## PARTE 2: ONBOARDING (Redesign Completo)

### 2.1 Novo Layout Visual

**Estrutura baseada nas imagens de referencia:**

```
+------------------------------------------------------------------+
|  [EP] EUA Na Pratica   (1)----(2)----(3)----(4)----(5)----(6)  [?] Ajuda |
|                        INICIO PERFIL CONTATO CARREIRA DESTINO FINAL     |
+------------------------------------------------------------------+
|                                                                    |
|    +----------------------------------------------------------+   |
|    |                                                          |   |
|    |                  [ICONE GRANDE AZUL]                     |   |
|    |                                                          |   |
|    |                 Prepare-se para decolar                  |   |
|    |      Sua jornada internacional comeca com um perfil     |   |
|    |                    bem configurado.                      |   |
|    |                                                          |   |
|    |   [IA de Curriculos]      [Comunidade Elite]             |   |
|    |   [Foco em Vistos]        [Trilhas de Carreira]          |   |
|    |                                                          |   |
|    |            [  Configurar meu Perfil  ->  ]               |   |
|    |                                                          |   |
|    +----------------------------------------------------------+   |
|                                                                    |
|   SUA SEGURANCA E NOSSA PRIORIDADE. DADOS PROTEGIDOS POR CRIPT.   |
+------------------------------------------------------------------+
```

### 2.2 Componentes a Criar/Modificar

**Novos Componentes:**
- `OnboardingHorizontalStepper.tsx` - Stepper horizontal no topo com linha de progresso

**Modificar:**
- `OnboardingLayout.tsx` - Remover sidebar vertical, usar layout centralizado
- `OnboardingSidebar.tsx` - Substituir por header com stepper horizontal
- `WelcomeStep.tsx` - Redesign com icone de foguete e grid de beneficios
- `PersonalInfoStep.tsx` - Inputs estilo Stripe (bg-gray-50, sem bordas)
- `ContactStep.tsx` - Layout de telefone com seletor de pais e checkbox WhatsApp
- `LinkedInResumeStep.tsx` - Campo LinkedIn com icone + zona de drag-and-drop
- `LocationStep.tsx` - Selectors + cards visuais de destino (EUA vs Canada)
- `ConfirmationStep.tsx` - Icone check verde, card de recursos desbloqueados

### 2.3 Especificacoes de Estilo

**Card Central:**
- `max-w-2xl`
- `rounded-[40px]`
- `shadow-[0_10px_40px_rgba(0,0,0,0.03)]`
- Fundo branco (`bg-white`)

**Stepper Horizontal:**
- Linha fina conectando circulos
- Passos concluidos: Check icon em circulo azul
- Passo atual: Numero em circulo azul com ring
- Passos futuros: Numero em circulo cinza claro
- Labels: INICIO, PERFIL, CONTATO, CARREIRA, DESTINO, FINAL

**Inputs (Estilo Stripe):**
- `bg-gray-50 border-0`
- Focus: `ring-2 ring-blue-500/50 border-blue-500 bg-white`
- Labels: `text-[10px] font-black tracking-[0.2em] uppercase text-gray-500`

**Botoes de Navegacao:**
- "Voltar": Discreto, cinza, sem fundo
- "Proximo >": Azul primario (`bg-blue-600`), rounded-xl, icone seta

**Footer de Seguranca:**
- Texto pequeno cinza: "SUA SEGURANCA E NOSSA PRIORIDADE. DADOS PROTEGIDOS POR CRIPTOGRAFIA."

---

## PARTE 3: NOVA PAGINA MEU HUB

### 3.1 Estrutura da Pagina

**Rota:** `/dashboard/hub` ou `/hub` (substitui ou precede o dashboard atual)

**Layout:**
```
+--------+------------------------------------------------+
|        |  [Busca]                    [Notif] [Avatar] |
|  Menu  |-----------------------------------------------|
|  Lado  |                                               |
|        |  Meu Hub de Servicos                          |
|        |  Centralize sua carreira internacional...     |
|        |                                               |
|        |  (V) Meus Servicos Ativos                     |
|        |  +----------+ +----------+ +----------+       |
|        |  | Portal   | | Curriculo | | Certific.|      |
|        |  | do Aluno | | USA [*]   | | ados     |      |
|        |  +----------+ +----------+ +----------+       |
|        |                                               |
|        |  [*] Explorar & Contratar                     |
|        |  +----------+ +----------+ +----------+       |
|        |  | Mock     | | Visa     | | Job      |       |
|        |  | Interview| | Journey  | | Hunter   |       |
|        |  +----------+ +----------+ +----------+       |
+--------+-----------------------------------------------+
```

### 3.2 Banco de Dados

**Nova Tabela: `hub_services`**
```sql
CREATE TABLE public.hub_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon_name TEXT NOT NULL, -- Ex: "GraduationCap", "FileCheck", "Globe"
  status TEXT NOT NULL DEFAULT 'available', -- 'available', 'premium', 'coming_soon'
  route TEXT, -- Rota interna como "/curriculo"
  category TEXT, -- "Carreira", "Educacao", "Imigracao"
  is_visible_in_hub BOOLEAN DEFAULT true,
  is_highlighted BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  
  -- Campos Stripe (para futura integracao)
  stripe_price_id TEXT,
  product_type TEXT DEFAULT 'subscription', -- 'subscription' ou 'one_time'
  price_display TEXT, -- "Gratis", "R$47/mes", "Premium"
  currency TEXT DEFAULT 'BRL',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela para rastrear quais servicos cada usuario tem acesso
CREATE TABLE public.user_hub_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.hub_services(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active', -- 'active', 'expired', 'cancelled'
  started_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, service_id)
);
```

**Seed Data:**
```sql
INSERT INTO public.hub_services (name, description, icon_name, status, route, category, is_highlighted) VALUES
('Portal do Aluno', 'Acesse suas mentorias, aulas gravadas, atividades e conecte-se com sua turma.', 'GraduationCap', 'available', '/dashboard', 'Educacao', false),
('Curriculo USA', 'Valide se seu curriculo passa nos robos (ATS) das empresas americanas com nossa IA.', 'FileCheck', 'available', '/curriculo', 'Carreira', true),
('Certificados', 'Centralize e valide seus certificados e diplomas traduzidos para aplicacao.', 'Award', 'available', '/certificados', 'Educacao', false),
('Mock Interview AI', 'Treine para entrevistas em ingles com um recrutador virtual e receba feedback instantaneo.', 'Monitor', 'premium', NULL, 'Carreira', false),
('Visa Journey', 'Organize documentos, prazos e etapas do seu processo de visto O-1 ou EB-2 NIW.', 'Globe', 'coming_soon', NULL, 'Imigracao', false),
('Job Hunter', 'Concierge de vagas "escondidas" no mercado americano curadas para brasileiros.', 'Building2', 'coming_soon', NULL, 'Carreira', false);
```

### 3.3 Componentes do Hub

**Nova Pagina:** `src/pages/hub/StudentHub.tsx`

**Componentes:**
- `HubServiceCard.tsx` - Card individual de servico
- `HubServiceGrid.tsx` - Grid de cards com secoes
- `HubHeader.tsx` - Titulo e subtitulo da pagina

**Card Visual:**
- `rounded-[32px]`
- `border border-gray-100`
- `shadow-sm`
- Hover: `-translate-y-1 shadow-md`
- Badge status: "DISPONIVEL" (verde), "PREMIUM" (roxo), "EM BREVE" (cinza)
- Icone em quadrado arredondado colorido
- Botao: "Acessar Agora ->" ou "Upgrade para Acessar" ou "Em Breve"

**Destaque Curriculo USA:**
- Borda azul leve
- Icone Sparkles ao lado do nome
- Botao azul primario

### 3.4 Ajustes no Menu Lateral (Sidebar)

**Modificar `DashboardLayout.tsx`:**
- Adicionar "Meu Hub" como primeiro item do menu (acima de Dashboard)
- Icone: `Home` ou `LayoutGrid`
- Rota: `/dashboard/hub`

**Nova Estrutura do Menu Student:**
```typescript
{
  label: 'OVERVIEW',
  items: [
    { label: 'Meu Hub', href: '/dashboard/hub', icon: Home },       // NOVO
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Meus Espacos', href: '/dashboard/espacos', icon: GraduationCap },
    { label: 'Curriculo USA', href: '/curriculo', icon: FileCheck, badge: 'IA' }, // Badge
    { label: 'Agenda', href: '/dashboard/agenda', icon: Calendar },
    { label: 'Tarefas', href: '/dashboard/tarefas', icon: ClipboardList },
  ],
},
```

### 3.5 Hooks e Queries

**Novo Hook:** `useHubServices.ts`
```typescript
export function useHubServices() {
  return useQuery({
    queryKey: ['hub-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hub_services')
        .select('*')
        .eq('is_visible_in_hub', true)
        .order('display_order');
      
      if (error) throw error;
      return data;
    },
  });
}

export function useUserHubAccess() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-hub-access', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_hub_services')
        .select('service_id, status')
        .eq('user_id', user.id)
        .eq('status', 'active');
      
      if (error) throw error;
      return data.map(d => d.service_id);
    },
    enabled: !!user?.id,
  });
}
```

---

## RESUMO DE ARQUIVOS A MODIFICAR/CRIAR

### Modificar:
| Arquivo | Descricao |
|---------|-----------|
| `src/components/landing/Navbar.tsx` | Remover nav links, manter apenas logo + botoes |
| `src/components/landing/Footer.tsx` | YouTube, URLs reais, copyright 2026 |
| `src/components/landing/WaitlistSection.tsx` | Badge em branco |
| `src/components/landing/HeroSection.tsx` | Avatares com fotos |
| `src/components/landing/BentoGrid.tsx` | Links para /login |
| `src/components/landing/SuccessPath.tsx` | CTA para /login |
| `src/components/onboarding/OnboardingLayout.tsx` | Layout centralizado |
| `src/components/onboarding/OnboardingSidebar.tsx` | Substituir por header horizontal |
| `src/components/onboarding/steps/*.tsx` | Redesign de cada etapa |
| `src/components/layouts/DashboardLayout.tsx` | Adicionar Meu Hub no menu |
| `src/App.tsx` | Adicionar rota /dashboard/hub |

### Criar:
| Arquivo | Descricao |
|---------|-----------|
| `src/components/onboarding/OnboardingHorizontalStepper.tsx` | Stepper horizontal |
| `src/pages/hub/StudentHub.tsx` | Pagina principal do Hub |
| `src/components/hub/HubServiceCard.tsx` | Card de servico |
| `src/components/hub/HubServiceGrid.tsx` | Grid de servicos |
| `src/hooks/useHubServices.ts` | Hooks para buscar servicos |
| Migracao SQL | Tabelas hub_services e user_hub_services |

### Geracao de Imagem (AI):
- Gerar 5 avatares profissionais para o Hero usando Lovable AI ou usar placeholders

---

## ORDEM DE IMPLEMENTACAO

1. **Migracao de Banco de Dados** - Criar tabelas hub_services e user_hub_services
2. **Landing Page Ajustes** - Rapido, poucas linhas de codigo
3. **Pagina Meu Hub** - Componentes + hooks + rota
4. **Onboarding Redesign** - Mais complexo, manter funcionalidade existente

---

## NOTAS TECNICAS

### Seguranca (RLS)
- hub_services: Leitura publica para usuarios autenticados
- user_hub_services: Usuarios so veem seus proprios acessos, admins veem todos

### Responsividade
- Hub: Grid 1 coluna mobile, 3 colunas desktop
- Onboarding: Stepper horizontal esconde labels em mobile, mostra apenas numeros

### Animacoes
- Todos os cards: `transition-all duration-300 hover:-translate-y-1`
- Entrada nas secoes: `animate-fade-in`
- Botoes shimmer no Hub para servicos AI
