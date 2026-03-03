import React, { useState } from 'react';
import {
  Lightbulb,
  Sparkles,
  FileText,
  Share2,
  Calendar,
  Sliders,
  ChevronDown,
  RefreshCw,
  Zap,
  TrendingUp,
  AlertTriangle,
  HelpCircle,
  ShieldAlert,
  Wand2,
  MoreHorizontal,
  Video,
  BarChart2,
  Filter,
  Info,
  Search,
  ArrowRight,
  Flame,
  Target,
  MessageSquare,
  Trash2,
  PlayCircle,
  X,
  Eye,
  Copy,
  Check,
  Clock
} from 'lucide-react';

const TABS = [
  { id: 'Insights', icon: Lightbulb, label: 'Insights' },
  { id: 'Ideias', icon: Sparkles, label: 'Ideias' },
  { id: 'Roteiros', icon: FileText, label: 'Roteiros' },
  { id: 'Posts', icon: Share2, label: 'Posts' },
  { id: 'Calendário', icon: Calendar, label: 'Calendário' },
  { id: 'Prompts', icon: Sliders, label: 'Prompts' },
];

const SCRIPTS_DATA = [
  {
    id: 201,
    title: "Salário mínimo subindo em 19 estados — mas a IA tá rindo da sua cara",
    format: 'Reels',
    duration: '55s',
    status: 'Draft',
    viralScore: 91,
    date: '28/02 23:38',
    hook: "A Flórida vai pagar $15 a hora em setembro de 2026. Washington já tá acima de $17. 19 estados aumentando salário mínimo — e você acha que tá ganhando. A verdade? A IA tá acabando com o seu job enquanto você comemora migalha.",
    sections: [
      {
        type: 'scene',
        content: "A ILUSÃO DO AUMENTO",
        visual: "Close no rosto do Daniel, expressão séria. Corte rápido para gráfico animado: salário subindo devagar vs curva exponencial de automação.",
        spoken: "Deixa eu te contar uma realidade que ninguém quer ouvir: aumento de salário mínimo é band-aid em hemorragia. Enquanto você comemora mais $2 por hora, a OpenAI acabou de treinar um modelo que faz o trabalho de 10 atendentes. A Tesla robotizou mais uma linha."
      },
      {
        type: 'scene',
        content: "OREGON JÁ ENTENDEU",
        visual: "B-roll: imagens de automação em restaurantes, caixas automáticos. Grafismo: mapa EUA destacando Oregon.",
        spoken: "Enquanto a maioria discute centavos, Oregon tá testando UBI — Universal Basic Income. Pilotos pagando $500-1000/mês SEM CONTRAPARTIDA. Por quê? Porque eles sabem: em 5 anos, metade dos empregos de serviço não existe mais."
      },
      {
        type: 'scene',
        content: "A ESCOLHA",
        visual: "Plano médio, Daniel gesticulando com intensidade. Corte para tela dividida: lado esquerdo job manual sendo automatizado, lado direito profissional tech trabalhando.",
        spoken: "Imigrante em FL achando que $15/h é vitória? Você tá correndo na esteira errada. A real: ou você desenvolve skill que IA não replica — pensamento crítico, relacionamento humano, criatividade estratégica — ou você espera o cheque universal."
      }
    ],
    cta: "Se você tá nos EUA e ainda não pensou como se proteger da onda IA, comenta aqui 'FUTURO' que eu te mando o guia de skills anti-automação.",
    metadata: {
      title: "FLÓRIDA $15/H EM 2026 — MAS IA TÁ ACABANDO COM SEU JOB 🇺🇸 💸",
      description: "19 estados dos EUA estão aumentando salário mínimo em 2026 — Flórida vai pra $15/h. Neste vídeo eu mostro por que aumento de salário mínimo é ilusão de curto prazo.",
      hashtags: ["#ImigracaoEUA", "#Florida2026", "#SalarioMinimo", "#IA", "#Automacao", "#RendaBasicaUniversal"],
      thumbnails: [
        { type: 'confrontation', desc: 'Daniel com expressão de "sério?" olhando pra câmera. Lado esquerdo: nota de dólar com $15. Lado direito: ícone robô/IA ameaçador.' },
        { type: 'data', desc: 'Gráfico simplificado: linha verde subindo devagar (salário mínimo) vs linha vermelha descendo rápido (empregos disponíveis).' }
      ]
    },
    analysis: {
      commentBait: 92,
      shareability: 85,
      hookStrength: 98,
      rewatchValue: 82,
      controversy: 95
    }
  },
  {
    id: 202,
    title: "IA vai acabar com empregos? RBU é a solução nos EUA",
    format: 'Reels',
    duration: '45s',
    status: 'Draft',
    viralScore: 94,
    date: '28/02 23:37',
    hook: "Sam Altman, CEO da OpenAI, acabou de confessar: IA vai eliminar milhões de empregos nos EUA — e a solução dele? Renda básica universal. Você tá preparado pra isso?",
    sections: [
      {
        type: 'scene',
        content: "A CONFISSÃO",
        visual: "Print da manchete ou tweet do Sam Altman. Zoom in na frase chave.",
        spoken: "Não sou eu falando. É o criador do ChatGPT. Ele disse com todas as letras que a IA vai substituir a maioria dos trabalhos cognitivos básicos."
      },
      {
        type: 'scene',
        content: "O PLANO B",
        visual: "Montagem rápida de pessoas recebendo cheques/dinheiro digital. Ícone de 'Worldcoin'.",
        spoken: "A solução proposta? Renda Básica Universal. O governo te paga pra existir porque não tem trabalho pra todo mundo. Parece Black Mirror, mas é o plano de negócios deles."
      }
    ],
    cta: "Você aceitaria viver de renda básica ou prefere lutar pelo seu espaço? Comenta 'LUTA' ou 'RENDA' abaixo.",
    metadata: {
      title: "RBU: O FIM DO TRABALHO? 🤖",
      description: "Sam Altman admite que IA vai levar empregos. A solução é Renda Básica Universal?",
      hashtags: ["#OpenAI", "#SamAltman", "#RBU", "#FuturoDoTrabalho", "#TechNews"],
      thumbnails: [
        { type: 'curiosity', desc: 'Foto do Sam Altman com filtro meio dark. Texto grande: "ELE AVISOU".' }
      ]
    },
    analysis: {
      commentBait: 95,
      shareability: 90,
      hookStrength: 92,
      rewatchValue: 75,
      controversy: 88
    }
  },
  {
    id: 203,
    title: "45% dos brasileiros buscando EUA NÃO são de TI",
    format: 'YouTube',
    duration: '11min',
    status: 'Draft',
    viralScore: 88,
    date: '27/02 18:15',
    hook: "Peguei os dados dos últimos 90 dias: 55% buscam TI, certo? Errado. 45% são gestão, engenharia, marketing — e TODO MUNDO ignora esses perfis. Se você não é dev, esse vídeo vai mudar como você enxerga sua chance nos EUA.",
    sections: [
      {
        type: 'scene',
        content: "INTRODUÇÃO AOS DADOS",
        visual: "Daniel sentado no estúdio, iPad na mão mostrando gráficos.",
        spoken: "Todo mundo acha que visto EB-2 NIW é só pra programador Senior. Mas eu abri a caixa preta da nossa consultoria."
      },
      {
        type: 'scene',
        content: "O PERFIL OCULTO",
        visual: "Gráfico de pizza animado: fatia de 45% se destacando. Ícones de capacete (eng), gravata (gestão), megafone (mkt).",
        spoken: "Engenheiros Civis, Gerentes de Projeto, Especialistas em Marketing Digital. O mercado americano tá desesperado por gente que sabe LIDERAR, não só codar."
      }
    ],
    cta: "Se você é de uma dessas áreas, clica no link da bio e faz a avaliação de perfil gratuita.",
    metadata: {
      title: "NÃO É SÓ TI: A verdade sobre vistos EUA 🇺🇸",
      description: "Análise exclusiva de dados de imigração. 45% das aprovações não são tech.",
      hashtags: ["#VistoEUA", "#EB2NIW", "#CarreiraInternacional", "#Engenharia", "#Marketing"],
      thumbnails: [
        { type: 'data', desc: 'Daniel segurando gráfico de pizza. Texto: "45% NÃO É TI".' }
      ]
    },
    analysis: {
      commentBait: 80,
      shareability: 95,
      hookStrength: 85,
      rewatchValue: 70,
      controversy: 60
    }
  }
];

const INSIGHTS_DATA = [
  {
    id: 1,
    type: 'Barreiras',
    title: 'O Custo do Sonho: Barreira financeira (66%) é 2x maior que a familiar (28%)',
    description: 'Dados mostram que a barreira financeira é o maior impedimento.',
    relevance: 85,
    controversy: 60,
    viralScore: 92,
    badgeColor: 'bg-rose-100 text-rose-700',
    icon: ShieldAlert
  },
  {
    id: 2,
    type: 'Tendência',
    title: 'Tech domina (55%), mas 45% do seu público se sente ignorado',
    description: 'Profissionais de Tecnologia compõem a maioria, mas outras áreas crescem.',
    relevance: 80,
    controversy: 25,
    viralScore: 88,
    badgeColor: 'bg-blue-100 text-blue-700',
    icon: TrendingUp
  },
  {
    id: 3,
    type: 'Barreiras',
    title: 'Você está aplicando cedo demais? 96% dos candidatos estão mornos',
    description: 'Análise de temperatura de leads mostra que a maioria ainda não está pronta.',
    relevance: 90,
    controversy: 75,
    viralScore: 95,
    badgeColor: 'bg-rose-100 text-rose-700',
    icon: ShieldAlert
  },
  {
    id: 4,
    type: 'Gap',
    title: 'Histórias de membros superam conselhos de especialistas',
    description: 'Posts de jornadas pessoais têm 3x mais engajamento que dicas técnicas.',
    relevance: 70,
    controversy: 10,
    viralScore: 78,
    badgeColor: 'bg-amber-100 text-amber-700',
    icon: AlertTriangle
  },
  {
    id: 5,
    type: 'Pergunta',
    title: '"Consegui a vaga, mas não o visto. E agora?"',
    description: 'Tópico de alta discussão na comunidade sem resposta definitiva.',
    relevance: 95,
    controversy: 40,
    viralScore: 85,
    badgeColor: 'bg-indigo-100 text-indigo-700',
    icon: HelpCircle
  },
  {
    id: 6,
    type: 'Barreiras',
    title: 'A ilusão da clareza: Por que "saber o que quer" não é suficiente',
    description: 'Apenas 14% admitem falta de clareza, mas dados mostram contradição.',
    relevance: 88,
    controversy: 55,
    viralScore: 82,
    badgeColor: 'bg-rose-100 text-rose-700',
    icon: ShieldAlert
  }
];

const IDEAS_DATA = [
  {
    id: 101,
    score: 87,
    title: "Caso real: Dev demitido por IA, tentou viver de renda universal",
    description: "4 stories narrando história ficcional (mas plausível) de dev que apostou em renda universal, foi demitido, não tinha plano B. Mostra consequências reais. Ends with: 'A porta tá aberta — mas não pra quem fica esperando governo.'",
    tags: ['Stories', 'roast', 'urgent'],
    hooks: [
      { type: 'data', label: 'Dados', text: 'Dev demitido por IA esperou renda universal — se arrependeu em março.', score: 84 },
      { type: 'claim', label: 'Afirmação', text: 'Essa história de renda universal te salvar é conto de fadas — dev da minha rede aprendeu na dor.', score: 88 },
      { type: 'question', label: 'Pergunta', text: 'Você sabe quantos devs demitidos por IA tão esperando governo? Dica: não é como Bolsa Família.', score: 81 },
      { type: 'provocation', label: 'Provocação', text: 'Renda universal nos EUA é como sonho de pobre: todo mundo vê nos TikTok, ninguém recebe.', score: 86 },
    ],
    date: '01/03 13:32'
  },
  {
    id: 102,
    score: 86,
    title: "IA vai cortar 1 milhão de jobs até 2027 — e aí?",
    description: "Análise fria sobre o relatório recente da Goldman Sachs vs realidade do mercado de tech recruiters.",
    tags: ['Stories', 'data_story', 'urgent'],
    hooks: [
      { type: 'data', label: 'Dados', text: 'Relatório Goldman Sachs: 300mi de empregos afetados. Seu plano B é chorar?', score: 89 },
      { type: 'provocation', label: 'Provocação', text: 'Enquanto você discute se IA é arte, seu concorrente tá automatizando seu trabalho.', score: 92 },
    ],
    date: '01/03 12:15'
  }
];

export default function ContentStudio() {
  const [activeTab, setActiveTab] = useState('Insights');
  const [selectedIdea, setSelectedIdea] = useState<typeof IDEAS_DATA[0] | null>(null);
  const [selectedScript, setSelectedScript] = useState<typeof SCRIPTS_DATA[0] | null>(null);

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 font-sans relative min-h-screen">
      {/* Modern Header with Gradient Text */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">
            Content <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">Studio AI</span>
          </h1>
          <p className="text-gray-500 text-lg">Transforme dados da sua comunidade em conteúdo viral.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex bg-gray-100 p-1 rounded-lg">
            {TABS.slice(0, 4).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2
                  ${activeTab === tab.id 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'}
                `}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === 'Insights' && (
        <>
          {/* AI Command Center - Hero Section */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl opacity-20 group-hover:opacity-30 transition duration-500 blur"></div>
            <div className="relative bg-white rounded-xl p-2 shadow-xl flex items-center gap-4 border border-gray-100">
              <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                <Sparkles className="w-6 h-6" />
              </div>
              <input 
                type="text" 
                placeholder="Sobre o que você quer escrever hoje? (ex: 'Carreira internacional', 'Vistos', 'Tech')"
                className="flex-1 text-lg bg-transparent border-none focus:ring-0 placeholder:text-gray-400 text-gray-800 outline-none"
              />
              <button className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center gap-2">
                Gerar Ideias
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            
            {/* Quick Chips */}
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {['Tendências de Visto', 'Salários em Tech', 'Transição de Carreira', 'Inglês para Devs'].map((chip) => (
                <button key={chip} className="px-4 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50 transition-colors whitespace-nowrap">
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Filter className="w-4 h-4" />
              <span>Filtrando por:</span>
              <span className="font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded">Últimos 7 dias</span>
              <span className="font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded">Alta Relevância</span>
            </div>
            <button className="text-sm text-purple-600 font-medium hover:text-purple-700 flex items-center gap-1">
              <RefreshCw className="w-4 h-4" />
              Atualizar Dados
            </button>
          </div>

          {/* Modern Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {INSIGHTS_DATA.map((item) => (
              <div 
                key={item.id} 
                className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-purple-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col relative overflow-hidden"
              >
                {/* Hover Gradient Effect */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${item.badgeColor} flex items-center gap-1.5`}>
                    <item.icon className="w-3 h-3" />
                    {item.type}
                  </span>
                  <div className="flex items-center gap-1 text-gray-400">
                    <Flame className={`w-4 h-4 ${item.viralScore > 90 ? 'text-orange-500 fill-orange-500' : ''}`} />
                    <span className="text-sm font-bold text-gray-700">{item.viralScore}</span>
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-gray-900 mb-2 leading-snug group-hover:text-purple-700 transition-colors">
                  {item.title}
                </h3>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                  {item.description}
                </p>

                {/* Metrics Mini-Dashboard */}
                <div className="grid grid-cols-2 gap-2 mb-6 bg-gray-50 p-3 rounded-xl">
                  <div>
                    <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Relevância</div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${item.relevance}%` }} />
                      </div>
                      <span className="text-xs font-bold text-gray-700">{item.relevance}%</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Polêmica</div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full" style={{ width: `${item.controversy}%` }} />
                      </div>
                      <span className="text-xs font-bold text-gray-700">{item.controversy}%</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-50">
                  <span className="text-xs text-gray-400 font-medium">Detectado hoje</span>
                  <button 
                    onClick={() => setActiveTab('Ideias')}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-900 bg-white border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all shadow-sm"
                  >
                    <Wand2 className="w-4 h-4" />
                    Criar Post
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'Ideias' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Ideas Header / Metrics Dashboard */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              {/* Main Score */}
              <div className="flex items-center gap-4 pr-8 border-r border-gray-100">
                <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center border-4 border-purple-100">
                  <Zap className="w-8 h-8 text-purple-600 fill-purple-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500 font-medium uppercase tracking-wide">Score de Viralidade</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">87</span>
                    <span className="text-sm text-green-600 font-medium">+12% vs média</span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-500 mb-1">Média</div>
                  <div className="text-xl font-bold text-gray-900">87</div>
                </div>
                <div className="bg-green-50 rounded-xl p-3">
                  <div className="text-xs text-green-600 mb-1">Máximo</div>
                  <div className="text-xl font-bold text-green-700">94</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-500 mb-1">Mínimo</div>
                  <div className="text-xl font-bold text-gray-900">80</div>
                </div>
                <div className="bg-purple-50 rounded-xl p-3">
                  <div className="text-xs text-purple-600 mb-1">80+ Viral</div>
                  <div className="text-xl font-bold text-purple-700">13</div>
                </div>
              </div>

              {/* Action */}
              <div className="flex gap-3">
                 <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <RefreshCw className="w-4 h-4" />
                  Atualizar
                </button>
                <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                  <Sparkles className="w-4 h-4" />
                  Gerar Tópico Livre
                </button>
              </div>
            </div>

            {/* Attribute Bars */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t border-gray-100">
              {[
                { label: 'Hook Power', value: 92, color: 'bg-rose-500' },
                { label: 'Controvérsia', value: 88, color: 'bg-orange-500' },
                { label: 'Identificação', value: 86, color: 'bg-blue-500' },
                { label: 'Compartilhabilidade', value: 85, color: 'bg-green-500' },
                { label: 'Dados', value: 86, color: 'bg-purple-500' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-500 font-medium">{stat.label}</span>
                    <span className="text-gray-900 font-bold">{stat.value}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${stat.color}`} style={{ width: `${stat.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 pb-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar nas ideias..." 
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300"
              />
            </div>
            <div className="flex gap-2 ml-auto">
              <button className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2">
                Todos os status <ChevronDown className="w-3 h-3" />
              </button>
              <button className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2">
                Mais recentes <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Ideas List (Summary Cards) */}
          <div className="space-y-4">
            {IDEAS_DATA.map((idea) => (
              <div key={idea.id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 group">
                <div className="flex gap-6 items-center">
                  {/* Left: Score */}
                  <div className="flex flex-col items-center gap-2">
                    <div className={`
                      w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold border-4
                      ${idea.score >= 90 ? 'bg-green-50 text-green-700 border-green-100' : 
                        idea.score >= 80 ? 'bg-orange-50 text-orange-700 border-orange-100' : 
                        'bg-gray-50 text-gray-700 border-gray-100'}
                    `}>
                      {idea.score}
                    </div>
                    <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Viral</span>
                  </div>

                  {/* Middle: Content Summary */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-gray-900">{idea.title}</h3>
                      <div className="flex gap-1">
                        {idea.tags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase tracking-wide border border-gray-200">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed max-w-3xl line-clamp-2">
                      {idea.description}
                    </p>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 font-medium mr-2">{idea.date}</span>
                    <button 
                      onClick={() => setSelectedIdea(idea)}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-purple-600 hover:border-purple-200 transition-all shadow-sm"
                    >
                      <Eye className="w-4 h-4" />
                      Ver Detalhes
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-all shadow-md hover:shadow-lg">
                      <FileText className="w-4 h-4" />
                      Gerar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Roteiros' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           {/* Scripts Header */}
           <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Meus Roteiros</h2>
                <p className="text-gray-500 text-sm">Gerencie e edite seus roteiros gerados.</p>
              </div>
              <div className="flex gap-3">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Buscar roteiros..." 
                      className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all w-64"
                    />
                 </div>
                 <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Novo Roteiro
                 </button>
              </div>
           </div>

           {/* Scripts List (Summary Cards) */}
           <div className="grid grid-cols-1 gap-4">
              {SCRIPTS_DATA.map((script) => (
                <div key={script.id} className="bg-white p-5 rounded-xl border border-gray-200 hover:border-purple-200 hover:shadow-md transition-all group flex items-center gap-6">
                   {/* Icon/Format */}
                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      script.format === 'Reels' ? 'bg-pink-50 text-pink-600' : 'bg-red-50 text-red-600'
                   }`}>
                      {script.format === 'Reels' ? <Zap className="w-6 h-6" /> : <PlayCircle className="w-6 h-6" />}
                   </div>

                   {/* Content */}
                   <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                         <h3 className="text-base font-bold text-gray-900 truncate">{script.title}</h3>
                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                            script.status === 'Draft' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-600'
                         }`}>
                            {script.status}
                         </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                         <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {script.date}
                         </span>
                         <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {/* Note: Clock is not imported, I should check imports or use another icon. Using simple text for now or generic icon */}
                            {script.duration}
                         </span>
                      </div>
                   </div>

                   {/* Metrics */}
                   <div className="flex flex-col items-end gap-1 px-4 border-l border-r border-gray-100">
                      <div className="flex items-center gap-1.5">
                         <Flame className={`w-4 h-4 ${script.viralScore > 90 ? 'text-orange-500 fill-orange-500' : 'text-gray-400'}`} />
                         <span className="text-lg font-bold text-gray-900">{script.viralScore}</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Viral Score</span>
                   </div>

                   {/* Actions */}
                   <div className="flex items-center gap-2 pl-2">
                      <button 
                        onClick={() => setSelectedScript(script)}
                        className="p-2 text-gray-500 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors"
                        title="Ver Detalhes"
                      >
                         <Eye className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors">
                         <MoreHorizontal className="w-5 h-5" />
                      </button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Idea Detail Modal */}
      {selectedIdea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedIdea(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 border-b border-gray-100 bg-gray-50/50">
              <div className="pr-8">
                 <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase tracking-wide border border-purple-200">
                       Ideia #{selectedIdea.id}
                    </span>
                    <div className="flex gap-1">
                       {selectedIdea.tags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-white border border-gray-200 text-gray-500 rounded text-[10px] font-bold uppercase tracking-wide">
                             {tag}
                          </span>
                       ))}
                    </div>
                 </div>
                 <h2 className="text-2xl font-bold text-gray-900 leading-tight">{selectedIdea.title}</h2>
              </div>
              <button 
                onClick={() => setSelectedIdea(null)}
                className="p-2 bg-white border border-gray-200 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
               <div className="space-y-8">
                  {/* Description */}
                  <div>
                     <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Descrição & Contexto
                     </h3>
                     <p className="text-lg text-gray-700 leading-relaxed bg-gray-50 p-6 rounded-xl border border-gray-100">
                        {selectedIdea.description}
                     </p>
                  </div>

                  {/* Hooks Section */}
                  <div>
                     <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Target className="w-4 h-4 text-rose-500" />
                        Hooks Sugeridos
                     </h3>
                     <div className="grid grid-cols-1 gap-4">
                        {selectedIdea.hooks.map((hook, index) => (
                           <div key={index} className="flex gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-purple-200 hover:shadow-md transition-all group">
                              <div className="flex flex-col items-center gap-1 min-w-[60px]">
                                 <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors">
                                    {hook.score}
                                 </div>
                                 <span className="text-[10px] font-bold uppercase text-gray-400">Score</span>
                              </div>
                              <div className="flex-1">
                                 <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase tracking-wide mb-2">
                                    {hook.label}
                                 </span>
                                 <p className="text-gray-800 font-medium text-lg leading-snug">"{hook.text}"</p>
                              </div>
                              <button className="self-center p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                                 <Copy className="w-4 h-4" />
                              </button>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
               <button 
                  onClick={() => setSelectedIdea(null)}
                  className="px-6 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
               >
                  Fechar
               </button>
               <button className="px-8 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors shadow-lg flex items-center gap-2">
                  <Wand2 className="w-4 h-4" />
                  Gerar Roteiro Completo
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Script Detail Modal */}
      {selectedScript && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedScript(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
             {/* Detail Header */}
             <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50 backdrop-blur-sm sticky top-0 z-10">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                     <span className="px-2.5 py-1 bg-gray-200 text-gray-600 rounded-md text-xs font-bold uppercase tracking-wide">
                        {selectedScript.status}
                     </span>
                     <span className="text-gray-400 text-xs font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Editado há 2h
                     </span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 leading-tight max-w-2xl">
                    {selectedScript.title}
                  </h2>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedScript(null)} className="p-2.5 text-gray-500 hover:bg-white hover:text-gray-900 rounded-lg transition-all border border-transparent hover:border-gray-200">
                     <X className="w-5 h-5" />
                  </button>
                </div>
             </div>

             {/* Scrollable Content */}
             <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
                <div className="max-w-4xl mx-auto space-y-8 pb-10">
                  
                  {/* Viral Score Banner */}
                  <div className="flex items-center gap-8 p-5 bg-gradient-to-br from-purple-50 via-white to-blue-50 rounded-2xl border border-purple-100 shadow-sm">
                     <div className="flex flex-col items-center px-2">
                        <div className="relative">
                          <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-purple-600 to-blue-600">
                            {selectedScript.viralScore}
                          </span>
                          <Sparkles className="w-4 h-4 text-yellow-400 absolute -top-1 -right-3 fill-yellow-400" />
                        </div>
                        <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider mt-1">Viral Score</span>
                     </div>
                     <div className="w-px h-12 bg-purple-100" />
                     <div className="flex-1 grid grid-cols-3 gap-8">
                        <div>
                          <div className="text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Hook Power</div>
                          <div className="text-lg font-bold text-gray-900">{selectedScript.analysis.hookStrength}/100</div>
                          <div className="h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-rose-500 rounded-full" style={{ width: `${selectedScript.analysis.hookStrength}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Retenção</div>
                          <div className="text-lg font-bold text-gray-900">{selectedScript.analysis.rewatchValue}/100</div>
                          <div className="h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${selectedScript.analysis.rewatchValue}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-1">Polêmica</div>
                          <div className="text-lg font-bold text-gray-900">{selectedScript.analysis.controversy}/100</div>
                          <div className="h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-orange-500 rounded-full" style={{ width: `${selectedScript.analysis.controversy}%` }} />
                          </div>
                        </div>
                     </div>
                  </div>

                  {/* Hook */}
                  <div className="space-y-3">
                     <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <Target className="w-4 h-4 text-rose-500" />
                        O Gancho (0-3s)
                     </h3>
                     <div className="p-6 bg-yellow-50/50 border border-yellow-100 rounded-2xl text-gray-800 font-medium text-lg leading-relaxed relative group">
                        <div className="absolute top-4 left-4 text-yellow-300 opacity-50">
                          <MessageSquare className="w-6 h-6" />
                        </div>
                        <span className="relative z-10">"{selectedScript.hook}"</span>
                     </div>
                  </div>

                  {/* Script Sections */}
                  <div className="space-y-8">
                     {selectedScript.sections.map((section, idx) => (
                        <div key={idx} className="group relative pl-8 border-l-2 border-gray-100 hover:border-purple-200 transition-colors">
                           <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-gray-200 group-hover:border-purple-500 group-hover:scale-110 transition-all shadow-sm flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                           </div>
                           
                           <div className="mb-3 flex items-center gap-3">
                              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cena {idx + 1}</span>
                              <h4 className="text-sm font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded">{section.content}</h4>
                           </div>

                           <div className="grid grid-cols-1 gap-4">
                              <div className="bg-blue-50/50 border border-blue-100/50 p-4 rounded-xl text-sm text-blue-900 flex gap-4 items-start">
                                 <Video className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                 <div className="space-y-1">
                                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wide block">Visual</span>
                                    <span className="leading-relaxed">{section.visual}</span>
                                 </div>
                              </div>
                              <div className="bg-white border border-gray-100 p-5 rounded-xl text-base text-gray-800 leading-relaxed shadow-sm flex gap-4 items-start group-hover:shadow-md transition-all">
                                 <MessageSquare className="w-4 h-4 text-purple-500 shrink-0 mt-1" />
                                 <div className="space-y-1">
                                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wide block">Falado</span>
                                    <span>"{section.spoken}"</span>
                                 </div>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>

                  {/* CTA */}
                  <div className="p-8 bg-gray-900 text-white rounded-2xl relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
                     <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3 text-purple-300 text-xs font-bold uppercase tracking-wider">
                           <Zap className="w-4 h-4" />
                           Call to Action
                        </div>
                        <p className="font-medium text-xl leading-relaxed">"{selectedScript.cta}"</p>
                     </div>
                  </div>

                  {/* Metadata Footer */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-100">
                     <div>
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                           <Target className="w-4 h-4 text-gray-400" />
                           Hashtags Otimizadas
                        </h4>
                        <div className="flex flex-wrap gap-2">
                           {selectedScript.metadata.hashtags.map(tag => (
                              <span key={tag} className="text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors cursor-pointer">
                                 {tag}
                              </span>
                           ))}
                        </div>
                     </div>
                     <div>
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                           <Sparkles className="w-4 h-4 text-gray-400" />
                           Sugestão de Thumbnail
                        </h4>
                        <div className="space-y-3">
                           {selectedScript.metadata.thumbnails.map((thumb, i) => (
                              <div key={i} className="flex gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                 <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                                    {i + 1}
                                 </div>
                                 <div className="flex-1">
                                    <span className="font-bold text-gray-900 uppercase text-xs block mb-1">{thumb.type}</span>
                                    <span className="text-xs leading-relaxed">{thumb.desc}</span>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>

                </div>
             </div>

             {/* Script Modal Footer Actions */}
             <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                <div className="flex gap-2">
                   <button className="p-2.5 text-gray-500 hover:bg-white hover:text-purple-600 hover:shadow-sm rounded-lg transition-all border border-transparent hover:border-gray-200">
                     <Share2 className="w-4 h-4" />
                   </button>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-all shadow-lg shadow-gray-200">
                   <Copy className="w-4 h-4" />
                   Copiar Roteiro
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
