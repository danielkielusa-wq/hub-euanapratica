
import React, { useState } from 'react';
import { 
  MessageSquare, 
  Heart, 
  Share2, 
  MoreHorizontal, 
  Search, 
  Filter, 
  Plus, 
  Trophy, 
  Calendar, 
  Flame, 
  MessageCircle,
  Hash,
  Award,
  TrendingUp,
  Lightbulb,
  X,
  Image as ImageIcon,
  Paperclip,
  Send,
  Sparkles,
  ArrowRight,
  Zap,
  CheckCircle2,
  Command,
  LayoutGrid,
  FileText,
  User,
  Users,
  Compass,
  Clock
} from 'lucide-react';

interface UpsellSuggestion {
  title: string;
  type: 'Curso' | 'Serviço' | 'Ferramenta';
  icon: React.ElementType;
}

interface Post {
  id: number;
  author: {
    name: string;
    avatar: string;
    level: number;
    badge?: string;
    role: string;
  };
  time: string;
  title: string;
  content: string;
  category: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  image?: string;
  isPinned?: boolean;
  isTrending?: boolean;
  upsell?: UpsellSuggestion; // Recomendação contextual
}

interface Quest {
  id: string;
  title: string;
  xp: number;
  progress: number;
  total: number;
  completed: boolean;
}

interface Member {
  id: number;
  name: string;
  avatar: string;
  points: number;
  level: number;
  trend: 'up' | 'stable';
}

const MOCK_QUESTS: Quest[] = [
  { id: 'q1', title: 'Responder 1 dúvida', xp: 50, progress: 0, total: 1, completed: false },
  { id: 'q2', title: 'Ler 3 artigos', xp: 20, progress: 1, total: 3, completed: false },
  { id: 'q3', title: 'Dar 5 likes', xp: 10, progress: 5, total: 5, completed: true },
];

const MOCK_POSTS: Post[] = [
  {
    id: 3,
    author: { name: 'Daniel Kiel', avatar: 'D', level: 99, badge: 'Mentor', role: 'Founder' },
    time: 'Fixado',
    title: '🚨 Novo Módulo de Networking Disponível',
    content: 'Acabamos de liberar o módulo sobre "Cold Messages" no LinkedIn. A técnica ensinada aumentou a taxa de resposta dos alunos em 40%. Assistam e comentem aqui o que acharam!',
    category: 'Anúncios',
    likes: 156,
    comments: 42,
    isLiked: false,
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800',
    isPinned: true
  },
  {
    id: 1,
    author: { name: 'Fernanda Lima', avatar: 'F', level: 12, badge: 'Veterano', role: 'Software Engineer' },
    time: '2 horas atrás',
    title: 'Minha experiência com a entrevista na Amazon (L5)',
    content: 'Pessoal, acabei de sair da fase de "Loop" na Amazon e queria compartilhar alguns insights sobre as perguntas comportamentais. O método STAR foi ESSENCIAL, mas senti falta de vocabulário técnico em alguns momentos para descrever System Design.',
    category: 'Entrevistas',
    likes: 45,
    comments: 12,
    isLiked: true,
    isTrending: true,
    upsell: {
        title: 'Mock Interview VIP: Treine com Ex-Amazon',
        type: 'Serviço',
        icon: MessageSquare
    }
  },
  {
    id: 2,
    author: { name: 'Roberto Carlos', avatar: 'R', level: 5, role: 'Product Designer' },
    time: '5 horas atrás',
    title: 'Dúvida sobre validação de diploma WES',
    content: 'Alguém aqui já fez o processo de validação WES para visto EB2-NIW? Estou com dúvida se preciso traduzir o histórico escolar antes de enviar ou se eles aceitam em PT-BR.',
    category: 'Vistos & Imigração',
    likes: 8,
    comments: 3,
    isLiked: false,
    upsell: {
        title: 'Guia Definitivo EB2-NIW + Tradução',
        type: 'Curso',
        icon: FileText
    }
  }
];

const LEADERBOARD: Member[] = [
  { id: 1, name: 'Ana Souza', avatar: 'A', points: 2450, level: 15, trend: 'up' },
  { id: 2, name: 'Carlos M.', avatar: 'C', points: 2100, level: 14, trend: 'up' },
  { id: 3, name: 'Beatriz L.', avatar: 'B', points: 1950, level: 12, trend: 'stable' },
];

const CATEGORIES = [
  { id: 'all', label: 'Geral', icon: Compass },
  { id: 'vistos', label: 'Vistos', icon: FileText },
  { id: 'carreira', label: 'Carreira', icon: Zap },
  { id: 'networking', label: 'Networking', icon: Users },
];

const StudentCommunity: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'foryou' | 'recent' | 'unanswered'>('foryou');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Helper to get avatar ring color based on level
  const getAvatarRing = (level: number) => {
      if (level >= 50) return 'ring-purple-500 text-purple-600 bg-purple-50';
      if (level >= 20) return 'ring-amber-400 text-amber-600 bg-amber-50';
      if (level >= 10) return 'ring-gray-300 text-gray-600 bg-gray-50';
      return 'ring-transparent text-gray-500 bg-gray-100';
  };

  const renderCreatePostModal = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsPostModalOpen(false)} />
      <div className="relative bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-fade-in-up">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-900">Criar Nova Discussão</h3>
            <button onClick={() => setIsPostModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 transition-colors">
                <X size={20} />
            </button>
        </div>
        <div className="p-6 space-y-4">
            <input 
                type="text" 
                placeholder="Título da sua discussão" 
                className="w-full text-lg font-bold placeholder-gray-400 border-none focus:ring-0 p-0 text-gray-900"
            />
            <textarea 
                placeholder="No que você está pensando ou qual sua dúvida?"
                className="w-full h-40 resize-none border-none focus:ring-0 p-0 text-gray-600 leading-relaxed placeholder-gray-400"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
            />
            <div className="flex gap-2">
                {CATEGORIES.slice(1).map(cat => (
                    <button key={cat.id} className="text-[10px] px-3 py-1 rounded-full border border-gray-200 text-gray-500 hover:border-brand-200 hover:text-brand-600 transition-colors font-bold uppercase">
                        {cat.label}
                    </button>
                ))}
            </div>
        </div>
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
            <div className="flex gap-2 text-gray-400">
                <button className="p-2 hover:bg-white rounded-xl hover:text-brand-600 transition-all"><ImageIcon size={20} /></button>
                <button className="p-2 hover:bg-white rounded-xl hover:text-brand-600 transition-all"><Paperclip size={20} /></button>
            </div>
            <button className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-600/20">
                <Send size={18} /> Publicar
            </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in min-h-screen pb-10">
      {isPostModalOpen && renderCreatePostModal()}

      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Comunidade</h2>
          <p className="text-gray-500 mt-1">O hub social da sua carreira internacional.</p>
        </div>
        
        {/* User XP Pill */}
        <div className="bg-white p-1.5 pl-4 pr-1.5 rounded-full border border-gray-200 shadow-sm flex items-center gap-3">
            <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase text-gray-400">Nível 12</span>
                <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-brand-400 to-brand-600 w-[75%] rounded-full"></div>
                </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                JS
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN - Navigation & Filters */}
        <div className="hidden xl:block xl:col-span-3 space-y-6">
            <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm sticky top-28">
                <button 
                    onClick={() => setIsPostModalOpen(true)}
                    className="w-full py-3.5 bg-brand-600 text-white font-bold rounded-2xl shadow-lg shadow-brand-600/20 hover:bg-brand-700 transition-all flex items-center justify-center gap-2 mb-8 hover:-translate-y-0.5"
                >
                    <Plus size={20} /> Nova Discussão
                </button>

                <p className="px-4 text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">Canais</p>
                <nav className="space-y-1">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                                activeCategory === cat.id 
                                ? 'bg-brand-50 text-brand-600' 
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                        >
                            <cat.icon size={18} /> {cat.label}
                        </button>
                    ))}
                </nav>

                <div className="mt-8 pt-6 border-t border-gray-50">
                    <div className="flex items-center justify-between px-4">
                        <span className="text-sm font-bold text-gray-600">Apenas Mentores</span>
                        <div className="w-10 h-6 bg-gray-200 rounded-full relative cursor-pointer hover:bg-gray-300 transition-colors">
                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* MIDDLE COLUMN - Feed */}
        <div className="xl:col-span-6 space-y-6">
            
            {/* Command Bar (Super Search) */}
            <div className="bg-white rounded-[24px] p-2 border border-gray-100 shadow-sm flex items-center gap-3 focus-within:ring-2 focus-within:ring-brand-100 transition-all relative z-20">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                    <Search size={20} />
                </div>
                <input 
                    type="text" 
                    placeholder="Sobre qual empresa ou assunto você quer saber hoje?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-sm font-medium text-gray-700 placeholder-gray-400 outline-none h-full"
                />
                <div className="hidden sm:flex items-center gap-2 pr-2">
                    <span className="px-2 py-1 bg-gray-50 border border-gray-100 rounded text-[10px] font-bold text-gray-400">⌘ K</span>
                </div>
            </div>

            {/* Smart Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {[
                    { id: 'foryou', label: 'Para Você', icon: Sparkles },
                    { id: 'recent', label: 'Recentes', icon: Clock },
                    { id: 'unanswered', label: 'Sem Resposta', icon: MessageSquare }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`
                            flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap border
                            ${activeTab === tab.id 
                                ? 'bg-gray-900 text-white border-gray-900 shadow-md' 
                                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-900'}
                        `}
                    >
                        {tab.id === 'foryou' && <Sparkles size={14} className={activeTab === 'foryou' ? 'text-amber-300' : 'text-amber-500'} fill="currentColor" />}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Quick Post Mobile */}
            <div className="xl:hidden bg-white rounded-[24px] p-4 border border-gray-100 shadow-sm flex items-center gap-4" onClick={() => setIsPostModalOpen(true)}>
                <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs">JS</div>
                <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3 text-gray-400 text-sm font-medium truncate">
                    Compartilhe sua jornada...
                </div>
            </div>

            {/* Posts Stream */}
            <div className="space-y-6">
                {MOCK_POSTS.map((post) => (
                    <div 
                        key={post.id} 
                        className={`
                            bg-white rounded-[32px] p-6 md:p-8 border shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden group
                            ${post.isPinned ? 'border-indigo-100 bg-gradient-to-b from-white to-indigo-50/20' : 'border-gray-100'}
                        `}
                    >
                        {post.isPinned && (
                            <div className="absolute top-0 right-0 p-4">
                                <div className="bg-indigo-100 text-indigo-600 p-2 rounded-full transform rotate-12 shadow-sm">
                                    <Zap size={16} fill="currentColor" />
                                </div>
                            </div>
                        )}

                        {/* Post Header */}
                        <div className="flex items-start justify-between mb-4 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm border-2 shadow-sm ${getAvatarRing(post.author.level)}`}>
                                    {post.author.avatar}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-gray-900">{post.author.name}</span>
                                        {post.author.badge && (
                                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${post.author.badge === 'Mentor' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {post.author.badge}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                                        <span>{post.author.role}</span>
                                        <span>•</span>
                                        <span>{post.time}</span>
                                    </div>
                                </div>
                            </div>
                            <button className="text-gray-300 hover:text-gray-600 p-2"><MoreHorizontal size={20} /></button>
                        </div>

                        {/* Content */}
                        <div className="mb-6 relative z-10">
                            <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">{post.title}</h3>
                            <p className="text-gray-600 leading-relaxed text-sm mb-4">{post.content}</p>
                            
                            {post.image && (
                                <div className="rounded-2xl overflow-hidden h-64 w-full mb-4 shadow-sm border border-gray-100">
                                    <img src={post.image} alt="Post attachment" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
                                </div>
                            )}
                            
                            <div className="flex flex-wrap gap-2">
                                <span className="inline-block px-3 py-1 bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-gray-100">
                                    #{post.category}
                                </span>
                                {post.isTrending && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-amber-100">
                                        <Flame size={10} fill="currentColor" /> Trending
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Contextual Upsell (PLG) */}
                        {post.upsell && (
                            <div className="mb-6 p-1 rounded-2xl bg-gradient-to-r from-brand-100 via-indigo-100 to-purple-100 relative z-10">
                                <div className="bg-white rounded-xl p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                                            <post.upsell.icon size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-brand-600 uppercase tracking-widest mb-0.5 flex items-center gap-1">
                                                <Sparkles size={10} /> Sugestão do Hub
                                            </p>
                                            <p className="text-xs font-bold text-gray-900">{post.upsell.title}</p>
                                        </div>
                                    </div>
                                    <button className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-900 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors border border-gray-200">
                                        Ver
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Footer Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-50 relative z-10">
                            <div className="flex gap-6">
                                <button className={`flex items-center gap-2 text-sm font-bold transition-all group/btn ${post.isLiked ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'}`}>
                                    <div className={`p-2 rounded-full group-hover/btn:bg-red-50 transition-colors ${post.isLiked ? 'bg-red-50' : ''}`}>
                                        <Heart size={18} className={post.isLiked ? 'fill-red-500' : ''} />
                                    </div>
                                    {post.likes}
                                </button>
                                <button className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-600 transition-all group/btn">
                                    <div className="p-2 rounded-full group-hover/btn:bg-blue-50 transition-colors">
                                        <MessageCircle size={18} />
                                    </div>
                                    {post.comments}
                                </button>
                            </div>
                            <button className="text-gray-400 hover:text-brand-600 transition-colors p-2 hover:bg-brand-50 rounded-full">
                                <Share2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* RIGHT COLUMN - Gamification & Social */}
        <div className="hidden xl:block xl:col-span-3 space-y-8">
            
            {/* My Level Card */}
            <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-brand-600 to-indigo-600 opacity-10"></div>
                <div className="relative z-10 -mt-2">
                    <div className="w-24 h-24 mx-auto rounded-full p-1 bg-white border-4 border-brand-100 shadow-xl mb-4">
                        <div className="w-full h-full rounded-full bg-brand-600 text-white flex items-center justify-center font-black text-2xl">JS</div>
                    </div>
                    <h3 className="font-black text-gray-900 text-lg">Juliana Silva</h3>
                    <p className="text-xs text-brand-600 font-bold uppercase tracking-widest mb-6">Nível 12 • Elite Member</p>
                    
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
                            <span>XP Atual</span>
                            <span>850 / 1000</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-500 w-[85%] rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 text-right">Faltam 150 XP para o Nível 13</p>
                    </div>
                </div>
            </div>

            {/* Daily Quests */}
            <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 bg-amber-50 text-amber-500 rounded-lg">
                        <TargetIcon size={18} /> 
                    </div>
                    <h3 className="font-bold text-gray-900">Missões de Hoje</h3>
                </div>
                
                <div className="space-y-4">
                    {MOCK_QUESTS.map(quest => (
                        <div key={quest.id} className="group flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${quest.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 text-transparent'}`}>
                                    <CheckCircle2 size={12} />
                                </div>
                                <div>
                                    <p className={`text-xs font-bold ${quest.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{quest.title}</p>
                                    <div className="flex items-center gap-1">
                                        <span className="text-[9px] text-gray-400">{quest.progress}/{quest.total}</span>
                                    </div>
                                </div>
                            </div>
                            <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${quest.completed ? 'bg-green-50 text-green-600' : 'bg-brand-50 text-brand-600'}`}>
                                +{quest.xp} XP
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Top Helpers */}
            <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                    <Trophy className="text-brand-500" size={20} />
                    <h3 className="font-bold text-gray-900">Top Helpers</h3>
                </div>
                <div className="space-y-4">
                    {LEADERBOARD.map((member, idx) => (
                        <div key={member.id} className="flex items-center justify-between group cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-50 text-gray-600'}`}>
                                        {member.avatar}
                                    </div>
                                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-black text-white ${idx === 0 ? 'bg-amber-400' : 'bg-gray-400'}`}>
                                        {idx + 1}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-900 group-hover:text-brand-600 transition-colors">{member.name}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{member.points} XP</p>
                                </div>
                            </div>
                            {member.trend === 'up' && <TrendingUp size={14} className="text-green-500" />}
                        </div>
                    ))}
                </div>
                <button className="w-full mt-6 py-2 text-xs font-bold text-gray-400 hover:text-brand-600 transition-colors">
                    Ver Ranking Completo
                </button>
            </div>

        </div>
      </div>
    </div>
  );
};

// Simple Icon for Quest
const TargetIcon = ({ size, className }: { size?: number, className?: string }) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
);

export default StudentCommunity;
