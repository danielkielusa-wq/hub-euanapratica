import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ArrowRight, 
  Star, 
  Check, 
  Zap, 
  Users, 
  Crown, 
  TrendingUp, 
  MessageCircle,
  Globe,
  LayoutGrid,
  Bot
} from 'lucide-react';

export default function Explore() {
  const [activeCategory, setActiveCategory] = useState('Todos');

  const categories = ['Todos', 'Ferramentas IA', 'Mentoria', 'Consultoria', 'Cursos'];

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-8">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Catálogo de Serviços</h2>
          <p className="text-gray-500 text-sm max-w-xl">
            Explore nossas soluções premium para acelerar sua carreira internacional. 
            Ferramentas de IA, mentorias exclusivas e consultoria especializada.
          </p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar serviços..." 
            className="pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-full transition-all bg-white shadow-sm"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === cat 
                ? 'bg-[#7367F0] text-white shadow-md shadow-indigo-200' 
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* Card 1: Live Investimentos */}
        <CatalogCard 
          badge="GRÁTIS"
          badgeColor="bg-green-100 text-green-600"
          icon={TrendingUp}
          iconColor="text-blue-500"
          iconBg="bg-blue-50"
          category="INVESTIMENTO"
          title="Live Investimentos Real Estate"
          description="Aprenda os fundamentos do mercado imobiliário americano em uma aula ao vivo exclusiva."
          features={['Acesso ao vivo', 'Q&A no final', 'Material em PDF']}
          price="0"
          cta="Acessar Agora"
        />

        {/* Card 2: Sessão Estratégica */}
        <CatalogCard 
          badge="POPULAR"
          badgeColor="bg-indigo-100 text-indigo-600"
          icon={Globe}
          iconColor="text-indigo-500"
          iconBg="bg-indigo-50"
          category="CONSULTORIA"
          title="Sessão Estratégica ROTA EUA"
          description="60 minutos para definir seu plano de ação personalizado para imigração e carreira."
          features={['Plano personalizado', 'Análise de perfil', 'Gravação inclusa']}
          price="193"
          oldPrice="789"
          cta="Agendar Agora"
          highlight
        />

        {/* Card 3: Mentoria em Grupo */}
        <CatalogCard 
          badge="VAGAS ABERTAS"
          badgeColor="bg-purple-100 text-purple-600"
          icon={Users}
          iconColor="text-purple-500"
          iconBg="bg-purple-50"
          category="MENTORIA EM GRUPO"
          title="Mentoria ROTA EUA™ - Turma Abril"
          description="Programa completo de 8 semanas: Resume, LinkedIn, Networking e Entrevistas."
          features={['8 Encontros ao vivo', 'Comunidade VIP', 'Review de CV']}
          price="1947"
          installments="12x R$ 201"
          cta="Garantir Vaga"
        />

        {/* Card 4: Mentoria Individual */}
        <CatalogCard 
          badge="EXCLUSIVO"
          badgeColor="bg-orange-100 text-orange-600"
          icon={Crown}
          iconColor="text-orange-500"
          iconBg="bg-orange-50"
          category="HIGH PERFORMANCE"
          title="Mentoria Individual Executive"
          description="Acompanhamento 1:1 de alto nível para executivos e profissionais sênior."
          features={['Acesso direto ao mentor', 'Simulações de entrevista', 'Suporte prioritário']}
          price="5497"
          installments="12x R$ 568"
          cta="Aplicar"
        />

        {/* Card 5: AI Tools */}
        <CatalogCard 
          badge="NOVO"
          badgeColor="bg-blue-100 text-blue-600"
          icon={Bot}
          iconColor="text-cyan-500"
          iconBg="bg-cyan-50"
          category="FERRAMENTAS IA"
          title="ResumePass AI Generator"
          description="Gere currículos otimizados para ATS em segundos com nossa IA treinada."
          features={['Geração ilimitada', 'Keywords otimizadas', 'Formatos ATS']}
          price="97"
          period="/mês"
          cta="Testar Grátis"
        />

      </div>

      {/* Bottom CTA */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 md:p-12 text-center text-white relative overflow-hidden shadow-xl shadow-indigo-200">
        <div className="relative z-10 max-w-2xl mx-auto">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">Não encontrou o que procurava?</h3>
          <p className="text-indigo-100 mb-8 text-lg">
            Fale com um de nossos especialistas e descubra qual é o melhor caminho para o seu momento atual.
          </p>
          <button className="bg-white text-indigo-600 px-8 py-3.5 rounded-xl font-bold hover:bg-indigo-50 transition-all shadow-lg flex items-center gap-2 mx-auto">
            <MessageCircle className="w-5 h-5" />
            Falar com Especialista
          </button>
        </div>
        
        {/* Decorative Circles */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      </div>

    </div>
  );
}

function CatalogCard({ 
  badge, 
  badgeColor, 
  icon: Icon, 
  iconColor, 
  iconBg, 
  category, 
  title, 
  description, 
  features, 
  price, 
  oldPrice, 
  installments, 
  period,
  cta,
  highlight 
}: any) {
  return (
    <div className={`bg-white rounded-xl p-6 flex flex-col h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
      highlight ? 'border-2 border-indigo-500 shadow-md' : 'border border-gray-100 shadow-sm'
    }`}>
      
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
        {badge && (
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="mb-6 flex-1">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{category}</div>
        <h3 className="text-lg font-bold text-gray-800 mb-3 leading-tight">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed mb-4">
          {description}
        </p>
        
        {/* Features List */}
        <ul className="space-y-2 mb-4">
          {features.map((feature: string, idx: number) => (
            <li key={idx} className="flex items-center gap-2 text-xs text-gray-600">
              <Check className="w-3.5 h-3.5 text-green-500" />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-gray-50">
        <div className="mb-4">
          {oldPrice && (
            <span className="text-xs text-gray-400 line-through mr-2">R$ {oldPrice}</span>
          )}
          <div className="flex items-baseline gap-1">
            <span className="text-sm text-gray-500 font-medium">R$</span>
            <span className="text-2xl font-bold text-gray-800">{price}</span>
            {period && <span className="text-sm text-gray-500">{period}</span>}
          </div>
          {installments && (
            <div className="text-xs text-indigo-600 font-medium mt-1">{installments}</div>
          )}
        </div>
        
        <button className={`w-full py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
          highlight 
            ? 'bg-[#7367F0] text-white hover:bg-indigo-600 shadow-md shadow-indigo-200' 
            : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
        }`}>
          {cta}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
