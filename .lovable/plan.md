
# Plano: Sistema Completo de Comunidade com Admin de Configuracoes

## Visao Geral

Implementar um sistema de comunidade completo baseado na interface visual fornecida (communidade.tsx), incluindo:
- Forum de discussao com categorias dinamicas
- Sistema de gamificacao (pontos, niveis, badges)
- Ranking de membros ativos
- Integracao com eventos/hot seats
- Painel admin para configurar categorias e regras de pontuacao

---

## Arquitetura de Dados

### Novas Tabelas Necessarias

```text
+--------------------+     +----------------------+     +------------------+
| community_posts    |     | community_categories |     | user_gamification|
+--------------------+     +----------------------+     +------------------+
| id (UUID)          |     | id (UUID)            |     | user_id (UUID)   |
| user_id (FK)       |     | name                 |     | total_points     |
| category_id (FK)   |     | slug                 |     | level            |
| title              |     | icon_name            |     | posts_count      |
| content            |     | display_order        |     | comments_count   |
| created_at         |     | is_active            |     | likes_received   |
| updated_at         |     +----------------------+     | last_activity_at |
| likes_count        |                                  +------------------+
| comments_count     |
+--------------------+
          |
          v
+--------------------+     +---------------------+     +--------------------+
| community_comments |     | community_likes     |     | user_badges        |
+--------------------+     +---------------------+     +--------------------+
| id (UUID)          |     | id (UUID)           |     | id (UUID)          |
| post_id (FK)       |     | user_id (FK)        |     | user_id (FK)       |
| user_id (FK)       |     | post_id (FK)        |     | badge_id (FK)      |
| parent_id (FK)     |     | comment_id (FK)     |     | earned_at          |
| content            |     | created_at          |     +--------------------+
| created_at         |     +---------------------+
| likes_count        |
+--------------------+
          
+---------------------+     +-------------------------+
| badges              |     | gamification_rules      |
+---------------------+     +-------------------------+
| id (UUID)           |     | id (UUID)               |
| name                |     | action_type             |
| description         |     | points                  |
| icon_name           |     | description             |
| condition_type      |     | is_active               |
| condition_value     |     +-------------------------+
| is_active           |
+---------------------+
```

---

## Componentes da Interface

### Pagina Principal da Comunidade (`/comunidade`)

Baseada no design fornecido com:

| Secao | Descricao |
|-------|-----------|
| **Header** | Titulo "Comunidade" + Badge XP/Nivel do usuario |
| **Sidebar Esquerda** | Botao "Nova Discussao" + Lista de categorias dinamicas |
| **Feed Central** | Campo de post + Filtros (Recentes/Populares/Sem Resposta) + Cards de posts |
| **Sidebar Direita** | Card "Sugestao" + Ranking "Membros Ativos" + Proximos Eventos |

### Componentes Reutilizaveis

| Componente | Proposito |
|------------|-----------|
| `CommunityHeader.tsx` | Badge de nivel/XP do usuario |
| `CategorySidebar.tsx` | Lista de categorias com contadores |
| `PostCard.tsx` | Card de post com avatar, titulo, preview, likes, comentarios |
| `PostComposer.tsx` | Campo para criar novo post |
| `RankingSidebar.tsx` | Top 10 membros com XP |
| `EventsWidget.tsx` | Proximos eventos (Hot Seats) |
| `NewPostModal.tsx` | Modal para criar post com categoria |
| `PostDetailPage.tsx` | Pagina completa de um post com comentarios |
| `UserLevelBadge.tsx` | Badge com nivel e barra de progresso |

---

## Admin: Configuracoes da Comunidade

### Nova Secao em `/admin/configuracoes`

Adicionar aba "Comunidade" com:

**1. Gerenciamento de Categorias**
- Lista editavel de categorias (Vistos & Imigracao, Carreira & Jobs, Networking, Vida nos EUA)
- Adicionar/remover categorias
- Reordenar com drag-and-drop
- Toggle ativo/inativo

**2. Regras de Gamificacao**
| Acao | Pontos Padrao | Editavel |
|------|---------------|----------|
| Criar post | +10 | Sim |
| Receber like em post | +2 | Sim |
| Comentar | +5 | Sim |
| Receber like em comentario | +1 | Sim |
| Participar de evento | +20 | Sim |

**3. Configuracao de Niveis**
| Nivel | XP Minimo | Titulo |
|-------|-----------|--------|
| 1 | 0 | Iniciante |
| 2 | 100 | Participante |
| 3 | 250 | Contribuidor |
| 4 | 500 | Veterano |
| 5 | 1000+ | Expert |

**4. Badges Customizaveis**
- Primeiro Post: Criar primeiro post
- Social: Receber 10 likes
- Mentor: Responder 20 posts
- Top 10: Entrar no ranking

---

## Migracoes de Banco de Dados

### Tabelas Principais

```sql
-- Categorias da comunidade (admin-configuravel)
CREATE TABLE community_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon_name TEXT DEFAULT 'hash',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Posts da comunidade
CREATE TABLE community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES community_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Comentarios em posts
CREATE TABLE community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Likes (posts e comentarios)
CREATE TABLE community_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, post_id),
  UNIQUE(user_id, comment_id),
  CHECK (post_id IS NOT NULL OR comment_id IS NOT NULL)
);

-- Gamificacao do usuario
CREATE TABLE user_gamification (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  posts_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  likes_received INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ DEFAULT now()
);

-- Regras de pontuacao (editavel pelo admin)
CREATE TABLE gamification_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL UNIQUE,
  points INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Badges disponíveis
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon_name TEXT DEFAULT 'award',
  condition_type TEXT NOT NULL,
  condition_value INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true
);

-- Badges conquistados por usuarios
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_id)
);
```

### Triggers para Gamificacao Automatica

```sql
-- Trigger ao criar post: +10 pontos
CREATE OR REPLACE FUNCTION update_gamification_on_post()
RETURNS TRIGGER AS $$
BEGIN
  -- Incrementar contador e pontos
  INSERT INTO user_gamification (user_id, total_points, posts_count, last_activity_at)
  VALUES (NEW.user_id, 10, 1, now())
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = user_gamification.total_points + 10,
    posts_count = user_gamification.posts_count + 1,
    last_activity_at = now(),
    level = CASE 
      WHEN user_gamification.total_points + 10 >= 1000 THEN 5
      WHEN user_gamification.total_points + 10 >= 500 THEN 4
      WHEN user_gamification.total_points + 10 >= 250 THEN 3
      WHEN user_gamification.total_points + 10 >= 100 THEN 2
      ELSE 1
    END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_gamification_post
AFTER INSERT ON community_posts
FOR EACH ROW EXECUTE FUNCTION update_gamification_on_post();
```

---

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/community/Community.tsx` | Pagina principal da comunidade |
| `src/pages/community/PostDetail.tsx` | Detalhe de um post com comentarios |
| `src/components/community/CommunityHeader.tsx` | Header com badge de nivel |
| `src/components/community/CategorySidebar.tsx` | Sidebar com categorias |
| `src/components/community/PostCard.tsx` | Card de post individual |
| `src/components/community/PostComposer.tsx` | Campo para criar post |
| `src/components/community/RankingSidebar.tsx` | Top membros ativos |
| `src/components/community/NewPostModal.tsx` | Modal de criacao |
| `src/components/community/CommentThread.tsx` | Thread de comentarios |
| `src/components/community/UserLevelBadge.tsx` | Badge de nivel/XP |
| `src/hooks/useCommunityPosts.ts` | Hook para posts |
| `src/hooks/useCommunityCategories.ts` | Hook para categorias |
| `src/hooks/useGamification.ts` | Hook para gamificacao |
| `src/hooks/useCommunityConfig.ts` | Hook para config admin |
| `src/types/community.ts` | Tipos TypeScript |
| `src/components/admin/community/CommunitySettings.tsx` | Painel admin |
| `src/components/admin/community/CategoryManager.tsx` | CRUD de categorias |
| `src/components/admin/community/GamificationRules.tsx` | Editar pontos |
| `src/components/admin/community/BadgeManager.tsx` | Gerenciar badges |

---

## Arquivos a Modificar

| Arquivo | Modificacao |
|---------|-------------|
| `src/App.tsx` | Adicionar rotas `/comunidade` e `/comunidade/:postId` |
| `src/components/layouts/DashboardLayout.tsx` | Adicionar link "Comunidade" no menu |
| `src/pages/admin/AdminSettings.tsx` | Adicionar aba "Comunidade" com as configuracoes |
| `src/types/plans.ts` | Ja existe feature `community` - verificar integracao |
| `src/components/guards/FeatureGate.tsx` | Usar para proteger acesso por plano |

---

## Integracao com Plano de Acesso

A comunidade respeitara o sistema de planos existente:

```typescript
// Em Community.tsx
const { hasFeature } = usePlanAccess();

if (!hasFeature('community')) {
  return <UpgradePrompt feature="community" />;
}
```

A feature `community` ja existe em `types/plans.ts` e esta configurada como `true` para todos os planos (inclusive basic).

---

## Fluxo de Usuario

```text
Estudante acessa /comunidade
    |
    v
FeatureGate verifica feature 'community'
    |
    +--> NAO: Exibe UpgradePrompt
    |
    +--> SIM: Renderiza Community.tsx
              |
              v
         +------------------+
         | Sidebar          | Header (Nivel + XP)
         | - Categorias     | - Badge nivel
         | - Nova Discussao | - Barra progresso
         +------------------+
              |
              v
         +------------------+
         | Feed Central     | Sidebar Direita
         | - Filtros        | - Ranking Top 10
         | - Posts          | - Eventos
         +------------------+
```

---

## Design Visual (Referencia)

Baseado na imagem fornecida:

- **Cards de Post**: `rounded-[24px]`, sombra suave, border-gray-100
- **Badge de Nivel**: Circular com numero, barra de progresso XP
- **Categorias**: Prefix `#` com icone, hover state bg-brand-50
- **Avatar**: Inicial em circulo colorido, badge de nivel pequeno
- **Tags de Categoria**: `rounded-full px-3 py-1 bg-gray-100 text-xs`
- **Botoes de Acao**: Like com coracao vermelho, comentario com icone
- **Sidebar Ranking**: Avatar + Nome + XP + indicador de posicao

Cores principais:
- Primary brand: `#5B4CFF` (violeta/brand-600)
- Destaque VIP: `#9b51e0` (roxo)
- Fundo cards: `white` com `border-gray-100`
- XP Badge: `bg-yellow-400` com texto escuro

---

## Criterios de Sucesso

| Criterio | Verificacao |
|----------|-------------|
| Categorias dinamicas | Admin pode adicionar/remover categorias |
| Pontuacao editavel | Admin pode alterar pontos por acao |
| Feed funcional | Posts aparecem com filtros funcionando |
| Likes em tempo real | Contador atualiza instantaneamente |
| Ranking atualizado | Top 10 reflete pontuacao atual |
| Integracao Hot Seats | Eventos aparecem na sidebar |
| Acesso por plano | Feature respeitada conforme plano |
| Mobile responsive | Layout funciona em todos tamanhos |
