
# Plano: Redesign Completo da Landing Page "EUA Na Pratica"

## Visao Geral

Transformar a landing page atual em uma experiencia "Elite SaaS" inspirada em Linear, Apple e Stripe, com foco em alta conversao, autoridade e minimalismo moderno.

## Arquitetura de Componentes

Criar uma estrutura modular de componentes para a landing page:

```text
src/
  components/
    landing/
      Navbar.tsx              # Sticky navbar com glassmorphism
      HeroSection.tsx         # Hero com floating widgets e prova social
      TrustLogos.tsx          # Logos de empresas em grayscale
      BentoGrid.tsx           # Grid de servicos estilo Bento
      AIPreview.tsx           # Widget interativo Antes/Depois com typewriter
      SuccessPath.tsx         # Grid de 6 passos numerados
      WaitlistSection.tsx     # CTA com formulario glassmorphism
      Footer.tsx              # Footer com links e redes sociais
  pages/
    Index.tsx                 # Orquestra todos os componentes
```

## Detalhamento por Secao

### 1. Atualizacao do Design System (index.css e tailwind.config.ts)

**Novas variaveis CSS:**
- `--brand-blue`: 221 83% 53% (Blue Corporate #2563EB)
- `--navy-dark`: 224 76% 33% (#1e3a8a)
- `--bg-apple`: 240 5% 96% (#F5F5F7)
- `--indigo`: 239 84% 67% (#4F46E5)
- `--emerald-success`: 160 84% 39%

**Novas animacoes no Tailwind:**
- `typewriter`: Efeito de digitacao letra por letra
- `shimmer`: Brilho que percorre o botao
- `ping-slow`: Pulsacao suave para CTAs
- `float`: Flutuacao sutil para widgets

**Novos border-radius:**
- `rounded-[40px]`: Cards principais
- `rounded-3xl`: Elementos internos

---

### 2. Navbar.tsx

**Especificacao Visual:**
- Fundo: `bg-white/80 backdrop-blur-md`
- Sticky top-0 com z-50
- Altura: h-16
- Sombra sutil no scroll

**Logo:**
- Badge navy escuro (`bg-[#1e3a8a]`) com "USA" em branco
- Texto "Na Pratica" em peso semibold

**Botoes:**
- "Entrar": Ghost, cor navy
- "Acessar Hub": Preto solido com hover suave

---

### 3. HeroSection.tsx

**Layout:**
- Background: `#F5F5F7` com mesh gradient sutil
- Container centralizado max-w-4xl

**Badge Topo:**
- Pill verde com icone de raio
- Texto: "PLATAFORMA 2.0: NOVAS FERRAMENTAS DE IA DISPONIVEIS"

**Titulo:**
```text
Construa sua carreira
nos Estados Unidos.
```
- "nos Estados Unidos" com gradiente azul para indigo
- Fonte: Inter Black (900), text-5xl a text-7xl

**Floating Widgets (posicao absoluta):**
- Esquerda: Card branco com icone $ verde, "SALARIO MEDIO", "$110k/ano"
- Direita: Card branco com icone grafico azul, "JOBS ABERTOS", "+452 Novas"

**Subtitulo:**
- Texto muted-foreground, max-w-2xl, text-lg

**CTAs:**
- "Acessar o Hub": Preto solido com seta, rounded-xl
- "Ver Mentorias": Outline preto

**Prova Social:**
- 4-5 avatares sobrepostos (stacked circles)
- Badge "+2k" azul
- 5 estrelas douradas
- Texto: "Junte-se a milhares de brasileiros de sucesso"

---

### 4. TrustLogos.tsx

**Especificacao:**
- Label superior: "NOSSOS ALUNOS ESTAO NAS MAIORES TECHS E CONSULTORIAS DOS EUA"
- Logos em texto (nao imagens): Google, amazon, Meta, Microsoft, Deloitte., SAP
- Estilo: text-gray-400 com hover:text-gray-700 transition
- Grid responsivo com gap-8 a gap-16

---

### 5. BentoGrid.tsx (Secao de Servicos)

**Titulo:**
- "Um ecossistema completo para sua jornada americana"
- Subtitulo: "Nao e apenas um curso..."
- Link: "Ver todos os servicos" com seta

**Grid Layout (3 colunas):**

**Card Principal (col-span-2, row-span-2):**
- Fundo: `bg-[#111827]` (navy escuro)
- Badge: "RECOMENDADO" verde no topo
- Icone: FileCheck em azul
- Titulo: "Curriculo USA **AI**" (AI em azul)
- Descricao: "Nossa inteligencia artificial analisa seu CV..."
- CTA: "Testar Agora Gratis" botao branco
- Visual: Mockup de documento processado (gradiente)

**Cards Secundarios:**
1. **Portal do Aluno:**
   - Fundo branco, borda sutil
   - Icone: GraduationCap azul
   - Link: "EXPLORAR ->"

2. **Hot Seats & Mastermind:**
   - Fundo branco
   - Icone: Mic/Link azul
   - Descricao: "Encontros mensais exclusivos com Daniel Kiel..."
   - Link: "EXPLORAR ->"

3. **Cursos EUA Na Pratica:**
   - Badge: Cadeado "EM DESENVOLVIMENTO"
   - Icone: BookOpen

4. **Expert Marketplace:**
   - Badge: Cadeado "EM DESENVOLVIMENTO"
   - Icone: Users

---

### 6. AIPreview.tsx (Secao Interativa)

**Header:**
- Badge: "TECNOLOGIA PROPRIETARIA" com icone de lapis
- Titulo: "Nao apenas traduzimos. **Maximizamos seu impacto.**"
- Subtitulo: Framework STAR, resultados quantificaveis

**Widget Interativo (2 colunas):**

**Coluna Esquerda - Card Escuro:**
```text
Estado 1 (Input):
- Label: "PADRAO COMUM (BRASIL)" com dot laranja
- Texto em portugues italico opaco:
  "Fui responsavel por cuidar dos servidores e migrar o sistema para a nuvem."

Botao Central:
- Icone Zap em circulo azul
- Efeito de pulsacao (animate-ping)

Estado 2 (Output - apos clique):
- Label: "PADRAO HIGH-IMPACT (USA AI)" com dot azul
- Efeito typewriter no texto:
  "Spearheaded a cloud migration project for 50+ microservices, 
   reducing operational latency by 35% and saving $120k in annual 
   infrastructure costs."
- Cursor piscando durante digitacao
- Badges ao final: "POWER VERBS", "METRICS INCLUDED"
```

**Coluna Direita - Lista de Beneficios:**
1. **Verbos de Poder** (icone Zap)
   - "Substituimos termos passivos por verbos de acao agressivos..."

2. **Quantificacao de Dados** (icone ArrowRight)
   - "Tudo nos EUA e sobre numeros..."

3. **ATS Friendly** (icone Check)
   - "Garantimos que seu documento seja legivel..."

---

### 7. SuccessPath.tsx (Trilha de Sucesso)

**Header:**
- Badge: "JORNADA COMPLETA" com icone Zap azul
- Titulo: "Sua trilha para o sucesso."
- Subtitulo: "Um plano executavel de 6 etapas..."

**Grid 3x2 de Cards:**

| Passo | Icone | Cor Fundo | Titulo | Descricao |
|-------|-------|-----------|--------|-----------|
| 01 | Grid | Azul | Acesso ao Hub | Ganhe acesso ao HUB EUA Na Pratica... |
| 02 | BookOpen | Azul | Recursos Gratuitos | Comece sua jornada aprendendo... |
| 03 | FileCheck | Verde | Validacao IA | Ajuste seu curriculo para os padroes... |
| 04 | Link | Laranja | Hot Seats & Network | Networking de elite e sessoes ao vivo... |
| 05 | Send | Rosa | Mentoria e Educacao | Aprofunde seus conhecimentos... |
| 06 | Plane | Indigo | Sua Carreira USA | Visto aprovado, contrato assinado... |

**Estilo dos Cards:**
- Fundo: `bg-[#F8F9FA]` com borda sutil
- Icone em circulo colorido (pastel)
- Label "PASSO 0X" em azul
- Hover: `-translate-y-1` com sombra

**CTA Final:**
- Botao outline: "Conheca nossa metodologia completa"

---

### 8. WaitlistSection.tsx (CTA Final)

**Container:**
- Fundo escuro `bg-[#0f172a]` a `bg-[#1e1b4b]` (mesh gradient)
- Cantos arredondados: `rounded-[40px]`
- Padding generoso (py-20)

**Conteudo:**
- Badge: "VAGAS LIMITADAS PARA O BETA" com icone de foguete
- Titulo: "Seja o primeiro a **dominar o mercado USA.**"
- Subtitulo: "As ferramentas de IA e o Concierge de Vagas estao em fase final..."

**Formulario:**
- Input grande com icone de email
- Placeholder: "Seu melhor e-mail corporativo"
- Botao: "Garantir Acesso" azul com icone Zap
- Efeito shimmer no botao

**Trust Badges:**
- "PRIVACIDADE GARANTIDA" com icone escudo
- "ZERO SPAM" com icone X
- "ACESSO IMEDIATO AO HUB FREE" com icone check

---

### 9. Footer.tsx

**Layout:**
- Fundo branco
- 4 colunas: Logo | Plataforma | Empresa | Social

**Coluna 1 - Logo:**
- Badge "USA" + "Na Pratica"
- Tagline: "Transformando o sonho americano em um plano de carreira solido..."

**Coluna 2 - Plataforma:**
- Portal do Aluno
- Cursos
- Mentores

**Coluna 3 - Empresa:**
- Sobre Nos
- Carreiras
- Imprensa

**Coluna 4 - Social:**
- Icones: Instagram, LinkedIn, Twitter

**Rodape:**
- Linha divisoria
- Copyright 2025

---

## Animacoes Detalhadas

### Typewriter Effect (AIPreview)
```css
@keyframes typewriter {
  from { width: 0; }
  to { width: 100%; }
}

@keyframes blink {
  50% { opacity: 0; }
}

.typewriter-text {
  overflow: hidden;
  white-space: nowrap;
  animation: typewriter 3s steps(80) forwards;
}

.cursor {
  animation: blink 1s step-end infinite;
}
```

### Shimmer Effect (Botoes)
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.shimmer {
  background: linear-gradient(
    90deg, 
    transparent 25%, 
    rgba(255,255,255,0.3) 50%, 
    transparent 75%
  );
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
}
```

### Entrada no Viewport
- Usar `animate-fade-slide-up` com delays escalonados
- `hover:-translate-y-1 transition-transform duration-300`

---

## Arquivos a Criar/Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/index.css` | Modificar | Adicionar variaveis CSS e animacoes |
| `tailwind.config.ts` | Modificar | Adicionar keyframes e cores |
| `src/components/landing/Navbar.tsx` | Criar | Navbar sticky com glassmorphism |
| `src/components/landing/HeroSection.tsx` | Criar | Hero com widgets flutuantes |
| `src/components/landing/TrustLogos.tsx` | Criar | Logos de empresas |
| `src/components/landing/BentoGrid.tsx` | Criar | Grid de servicos |
| `src/components/landing/AIPreview.tsx` | Criar | Widget interativo com typewriter |
| `src/components/landing/SuccessPath.tsx` | Criar | Trilha de 6 passos |
| `src/components/landing/WaitlistSection.tsx` | Criar | CTA com formulario |
| `src/components/landing/Footer.tsx` | Criar | Footer completo |
| `src/components/landing/index.ts` | Criar | Barrel exports |
| `src/pages/Index.tsx` | Reescrever | Orquestrar novos componentes |

---

## Dependencias

Nenhuma dependencia adicional necessaria. Utilizaremos:
- React + TypeScript
- Tailwind CSS (ja instalado)
- Lucide React para icones (ja instalado)
- Fonte Inter (ja configurada)

---

## Consideracoes de Performance

1. **Lazy Loading**: Usar `React.lazy()` para secoes abaixo da dobra
2. **Intersection Observer**: Disparar animacoes apenas quando visiveis
3. **Sem Imagens Externas**: Usar texto/CSS para logos e mockups
4. **CSS Nativo**: Preferir animacoes CSS sobre JavaScript

---

## Verificacao Final

Apos implementacao, verificar:
1. Responsividade em mobile, tablet e desktop
2. Animacao de typewriter funcionando corretamente
3. Hover effects em todos os cards
4. Formulario de waitlist funcional (integracao futura)
5. Links de navegacao corretos (/login, /cadastro, /dashboard)
6. Acessibilidade (contraste, focus states)
