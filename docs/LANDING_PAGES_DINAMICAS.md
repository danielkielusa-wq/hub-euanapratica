# Landing Pages Dinâmicas de Serviços

## Visão Geral

Sistema de landing pages dinâmicas para serviços do Hub, permitindo que cada serviço tenha uma página de apresentação completa e personalizável configurada através do painel administrativo.

## Arquitetura

### 1. Estrutura de Dados

#### Tabela `hub_services`

Novos campos adicionados:

```sql
- duration: TEXT              -- Ex: "45 Minutos"
- meeting_type: TEXT          -- Ex: "Google Meet"
- landing_page_data: JSONB    -- Dados estruturados da landing page
```

#### Estrutura do JSON `landing_page_data`

```typescript
{
  hero?: {
    subtitle?: string;        // Ex: "Carreira nos EUA"
    tagline?: string;         // Ex: "CONSULTORIA INDIVIDUAL"
  };
  mentor?: {
    name: string;             // Ex: "Daniel Kiel"
    initials: string;         // Ex: "DK"
    title: string;            // Ex: "Mentor & Strategist"
    quote?: string;           // Citação do mentor
  };
  benefits_section?: {
    title?: string;           // Ex: "O que você vai descobrir nesta sessão?"
    description?: string;     // Descrição da seção de benefícios
  };
  benefits?: Array<{
    icon: string;             // Nome do ícone Lucide (ex: "Briefcase")
    title: string;            // Título do benefício
    description: string;      // Descrição detalhada
  }>;
  target_audience?: Array<{
    title: string;            // Perfil do público (ex: "Exploradores")
    description: string;      // Descrição do perfil
  }>;
  faq_section?: {
    title: string;            // Título da seção FAQ
    description: string;      // Conteúdo (aceita HTML básico)
  };
}
```

### 2. Componentes

#### [ServiceLandingPage.tsx](src/components/services/ServiceLandingPage.tsx)
Componente principal que renderiza a landing page dinamicamente baseado nos dados do serviço.

**Características:**
- Hero section com gradient e efeitos visuais
- Card do mentor (quando disponível)
- Grid de benefícios com ícones
- Seção de público-alvo
- FAQ section
- CTA sticky footer

#### [ServiceDetail.tsx](src/pages/services/ServiceDetail.tsx)
Página wrapper que busca os dados do serviço e renderiza o componente.

**Features:**
- Loading state
- Error handling
- Redirect automático para hub se serviço não encontrado

### 3. Hooks

#### [useServiceLandingPage.ts](src/hooks/useServiceLandingPage.ts)
Hook para buscar dados do serviço por ID ou slug (route).

```typescript
const { data: service, isLoading, error } = useServiceLandingPage({
  slug: 'rota-eua-45min'  // ou serviceId: 'uuid'
});
```

### 4. Rotas

```typescript
// Rota pública para landing pages
/servicos/:slug  -> ServiceDetail
```

Exemplo: `/servicos/rota-eua-45min`

## Fluxo de URLs

O sistema usa uma hierarquia de priorização de URLs:

### Para usuários SEM acesso ao serviço:

1. **landing_page_url** (ex: `/servicos/rota-eua-45min`)
   - Landing page de apresentação
   - Mostra detalhes completos do serviço
   - CTA leva para checkout

2. **ticto_checkout_url** (ex: `https://pay.ticto.com.br/produto-id`)
   - Link direto para checkout Ticto
   - Fallback se não houver landing page

3. **redirect_url**
   - URL genérica de redirecionamento
   - Último fallback

### Para usuários COM acesso ao serviço:

1. **route** (ex: `/dashboard/agendar/service-id`)
   - Rota interna da aplicação
   - Acesso direto ao serviço

## Como Configurar um Novo Serviço

### 1. Via Painel Admin (`/admin/produtos`)

1. Crie/edite o serviço
2. Preencha os campos básicos:
   - Nome
   - Descrição
   - Duração
   - Tipo de reunião
   - CTA Text

3. Configure URLs:
   - `landing_page_url`: `/servicos/[slug]`
   - `ticto_checkout_url`: URL do Ticto
   - `route`: Rota interna (se aplicável)

4. Adicione o JSON em `landing_page_data` (campo JSON no banco)

### 2. Via Migration SQL

```sql
UPDATE hub_services
SET
  duration = '60 Minutos',
  meeting_type = 'Zoom',
  route = 'meu-servico',
  landing_page_url = '/servicos/meu-servico',
  landing_page_data = '{
    "hero": {
      "subtitle": "Seu Subtítulo",
      "tagline": "CATEGORIA"
    },
    "mentor": {
      "name": "Nome do Mentor",
      "initials": "NM",
      "title": "Cargo",
      "quote": "Citação inspiradora"
    },
    "benefits_section": {
      "title": "O que você vai descobrir nesta sessão?",
      "description": "Descrição introdutória da seção de benefícios..."
    },
    "benefits": [
      {
        "icon": "Target",
        "title": "Benefício 1",
        "description": "Descrição detalhada..."
      }
    ],
    "target_audience": [
      {
        "title": "Perfil 1",
        "description": "Para quem..."
      }
    ],
    "faq_section": {
      "title": "Perguntas Frequentes",
      "description": "Conteúdo HTML aqui..."
    }
  }'::jsonb
WHERE name = 'Nome do Serviço';
```

## Ícones Disponíveis

Todos os ícones do [Lucide Icons](https://lucide.dev/) estão disponíveis. Os mais comuns:

- `Briefcase` - Trabalho/Carreira
- `Globe` - Internacional/Global
- `Users` - Pessoas/Grupo
- `MapPin` - Localização
- `Target` - Objetivo/Alvo
- `TrendingUp` - Crescimento
- `Award` - Premiação/Conquista
- `Zap` - Rapidez/Energia
- `CheckCircle2` - Confirmação
- `ShieldCheck` - Segurança

## Exemplo: ROTA EUA 45min

Acesse: `/servicos/rota-eua-45min`

Este serviço está completamente configurado e serve como template de referência.

## Testes

Para testar uma landing page:

1. Certifique-se que o serviço tem `route` configurado (slug único)
2. Acesse: `http://localhost:8080/servicos/[slug]`
3. Verifique:
   - Carregamento dos dados
   - Renderização dos componentes
   - Funcionamento do CTA
   - Responsividade mobile

## Próximos Passos

- [ ] SEO metadata dinâmico (title, description, OG tags)
- [ ] Analytics tracking (view, click CTA)
- [ ] A/B testing de CTAs
- [ ] Preview no painel admin
- [ ] Template builder visual
