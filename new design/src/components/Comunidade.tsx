import React, { useState } from 'react';
import { 
  Search, 
  MessageSquare, 
  Heart, 
  Share2, 
  MoreHorizontal, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Send,
  MapPin,
  Briefcase,
  Users,
  TrendingUp,
  Calendar,
  Hash
} from 'lucide-react';

export default function Comunidade() {
  const [activeTab, setActiveTab] = useState('feed');

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Comunidade Rota EUA 🇺🇸</h2>
          <p className="text-gray-500 text-sm">Conecte-se, compartilhe e cresça com outros profissionais.</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar na comunidade..." 
            className="pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-full md:w-64 transition-all bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Navigation & Profile (3 cols) */}
        <div className="hidden lg:block lg:col-span-3 space-y-6">
          
          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
            <div className="px-6 pb-6 text-center relative">
              <div className="w-20 h-20 mx-auto -mt-10 rounded-full border-4 border-white overflow-hidden bg-white">
                <img src="https://picsum.photos/seed/daniel/200/200" alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <h3 className="mt-3 font-bold text-gray-800">Daniel Kiel</h3>
              <p className="text-xs text-gray-500 mb-4">Software Engineer • Seattle, WA</p>
              
              <div className="flex justify-center gap-6 border-t border-gray-50 pt-4">
                <div>
                  <div className="font-bold text-gray-800">1.2k</div>
                  <div className="text-xs text-gray-400">Seguidores</div>
                </div>
                <div>
                  <div className="font-bold text-gray-800">48</div>
                  <div className="text-xs text-gray-400">Posts</div>
                </div>
              </div>
            </div>
          </div>

          {/* Menu */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <nav className="space-y-1">
              <MenuItem icon={MessageSquare} label="Feed Principal" active />
              <MenuItem icon={Hash} label="Tópicos" />
              <MenuItem icon={Users} label="Networking" />
              <MenuItem icon={Calendar} label="Eventos" badge="3" />
              <MenuItem icon={Briefcase} label="Vagas" />
            </nav>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Tópicos Populares</h4>
            <div className="flex flex-wrap gap-2">
              <Tag label="#Vistos" />
              <Tag label="#CarreiraTech" />
              <Tag label="#Moradia" />
              <Tag label="#Networking" />
              <Tag label="#Inglês" />
            </div>
          </div>

        </div>

        {/* Middle Column: Feed (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Create Post */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex gap-4">
              <img src="https://picsum.photos/seed/daniel/40/40" alt="User" className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
              <div className="flex-1">
                <input 
                  type="text" 
                  placeholder="No que você está pensando hoje?" 
                  className="w-full bg-gray-50 border-none rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-100 transition-all mb-3"
                />
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
                      <ImageIcon className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
                      <LinkIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <button className="bg-[#7367F0] text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors flex items-center gap-2">
                    <Send className="w-3.5 h-3.5" />
                    Publicar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Posts Feed */}
          <div className="space-y-6">
            <PostCard 
              author="Sarah Jenkins"
              role="Product Manager @ Google"
              avatar="https://picsum.photos/seed/sarah/40/40"
              time="2h atrás"
              content="Muito feliz em compartilhar que finalmente consegui minha aprovação no visto O-1! 🎉 Foi uma jornada longa de 8 meses, mas valeu a pena. Se alguém tiver dúvidas sobre o processo de cartas de recomendação, podem me chamar!"
              tags={['#VistoO1', '#Conquista', '#Imigração']}
              likes={142}
              comments={23}
              shares={5}
              image="https://picsum.photos/seed/visa/600/300"
            />

            <PostCard 
              author="Carlos Mendes"
              role="Senior Dev @ Startup"
              avatar="https://picsum.photos/seed/carlos/40/40"
              time="5h atrás"
              content="Alguém aqui já passou pelo processo de entrevista na Amazon para vagas L5? Gostaria de saber o quão profundo eles vão no System Design. Alguma dica de material específico?"
              tags={['#InterviewPrep', '#BigTech', '#SystemDesign']}
              likes={24}
              comments={15}
            />

            <PostCard 
              author="Comunidade Rota EUA"
              role="Admin"
              avatar="https://picsum.photos/seed/admin/40/40"
              time="1d atrás"
              content="📅 Agenda da Semana: Não percam a Live de Q&A sobre Carreira Internacional nesta quinta-feira às 19h! Link nos comentários."
              tags={['#Eventos', '#Live']}
              likes={56}
              comments={4}
              isPinned
            />
          </div>

        </div>

        {/* Right Column: Widgets (3 cols) */}
        <div className="hidden lg:block lg:col-span-3 space-y-6">
          
          {/* Trending */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-gray-800">Em Alta</h3>
            </div>
            <div className="space-y-4">
              <TrendingItem category="Vistos" title="Mudanças nas regras do H1B para 2026" posts="2.4k posts" />
              <TrendingItem category="Tecnologia" title="O mercado de IA em San Francisco" posts="1.8k posts" />
              <TrendingItem category="Eventos" title="Meetup Rota EUA em NY" posts="542 posts" />
            </div>
          </div>

          {/* Suggested Connections */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
             <h3 className="font-bold text-gray-800 mb-4">Sugestões para você</h3>
             <div className="space-y-4">
               <SuggestionItem 
                 name="Amanda Lee" 
                 role="Recruiter @ Meta" 
                 avatar="https://picsum.photos/seed/amanda/40/40" 
               />
               <SuggestionItem 
                 name="Roberto Silva" 
                 role="Tech Lead @ Uber" 
                 avatar="https://picsum.photos/seed/roberto/40/40" 
               />
               <SuggestionItem 
                 name="Julia Chen" 
                 role="UX Designer @ Apple" 
                 avatar="https://picsum.photos/seed/julia/40/40" 
               />
             </div>
             <button className="w-full mt-4 text-sm text-indigo-600 font-medium hover:underline">
               Ver mais
             </button>
          </div>

        </div>

      </div>
    </div>
  );
}

function MenuItem({ icon: Icon, label, active, badge }: any) {
  return (
    <button className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      active ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
    }`}>
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </div>
      {badge && (
        <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </button>
  );
}

function Tag({ label }: any) {
  return (
    <span className="text-xs font-medium px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 cursor-pointer transition-colors">
      {label}
    </span>
  );
}

function PostCard({ author, role, avatar, time, content, tags, likes, comments, shares, image, isPinned }: any) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {isPinned && (
        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">
          <MapPin className="w-3 h-3" /> Fixado
        </div>
      )}
      
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <img src={avatar} alt={author} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
          <div>
            <h4 className="font-bold text-gray-800 text-sm">{author}</h4>
            <p className="text-xs text-gray-500">{role}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{time}</span>
          <button className="text-gray-400 hover:text-gray-600">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-gray-700 text-sm leading-relaxed mb-4 whitespace-pre-line">
        {content}
      </p>

      {image && (
        <div className="mb-4 rounded-lg overflow-hidden border border-gray-100">
          <img src={image} alt="Post content" className="w-full h-auto object-cover" referrerPolicy="no-referrer" />
        </div>
      )}

      {tags && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag: string, idx: number) => (
            <span key={idx} className="text-xs text-indigo-600 font-medium hover:underline cursor-pointer">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
        <div className="flex gap-6">
          <button className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors text-sm group">
            <Heart className="w-4 h-4 group-hover:fill-red-500" />
            <span>{likes}</span>
          </button>
          <button className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors text-sm">
            <MessageSquare className="w-4 h-4" />
            <span>{comments}</span>
          </button>
          <button className="flex items-center gap-2 text-gray-500 hover:text-green-500 transition-colors text-sm">
            <Share2 className="w-4 h-4" />
            <span>{shares || 0}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function TrendingItem({ category, title, posts }: any) {
  return (
    <div className="cursor-pointer group">
      <div className="text-xs text-gray-400 mb-0.5">{category}</div>
      <div className="font-semibold text-gray-800 text-sm group-hover:text-indigo-600 transition-colors mb-0.5">{title}</div>
      <div className="text-xs text-gray-400">{posts}</div>
    </div>
  );
}

function SuggestionItem({ name, role, avatar }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img src={avatar} alt={name} className="w-9 h-9 rounded-full object-cover" referrerPolicy="no-referrer" />
        <div>
          <div className="font-semibold text-gray-800 text-sm">{name}</div>
          <div className="text-xs text-gray-500">{role}</div>
        </div>
      </div>
      <button className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
        <Users className="w-4 h-4" />
      </button>
    </div>
  );
}
