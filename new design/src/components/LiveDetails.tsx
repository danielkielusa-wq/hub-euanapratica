import React from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  Share2, 
  Bell, 
  MessageCircle, 
  FileText, 
  CheckCircle2,
  ArrowLeft,
  Linkedin,
  Instagram,
  Play
} from 'lucide-react';

interface LiveDetailsProps {
  onBack: () => void;
}

export default function LiveDetails({ onBack }: LiveDetailsProps) {
  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto space-y-6">
      
      {/* Breadcrumb / Back */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-[#7367F0] transition-colors text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Lives
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content (Left Column) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Hero / Thumbnail Area */}
          <div className="relative rounded-2xl overflow-hidden aspect-video group shadow-lg">
            <img 
              src="https://picsum.photos/seed/live_detail/1200/800" 
              alt="Live Cover" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white p-6 text-center backdrop-blur-[2px]">
              <div className="bg-[#7367F0] px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 shadow-lg animate-pulse">
                Em Breve
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4 max-w-xl leading-tight">
                Inglês Técnico para Daily Scrum: Destrave sua fala
              </h1>
              <div className="flex items-center gap-6 text-sm font-medium">
                <span className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg backdrop-blur-md">
                  <Calendar className="w-4 h-4" /> Amanhã
                </span>
                <span className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg backdrop-blur-md">
                  <Clock className="w-4 h-4" /> 19:00 - 20:30
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Sobre esta Masterclass</h2>
            <div className="prose prose-indigo text-gray-600 space-y-4">
              <p>
                Você sente insegurança na hora de dar seu update na Daily? Trava quando precisa explicar um impedimento técnico em inglês?
              </p>
              <p>
                Nesta aula prática, vamos dissecar a estrutura de uma Daily Scrum perfeita. Você vai aprender os phrasal verbs essenciais, como reportar progresso com confiança e como interagir com o time de forma natural.
              </p>
              <p>
                Não é aula de gramática. É inglês de trincheira para quem trabalha (ou quer trabalhar) em times globais.
              </p>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4">O que você vai aprender:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LearningPoint text="Estrutura 'Yesterday, Today, Blockers' avançada" />
                <LearningPoint text="Vocabulário específico para impedimentos técnicos" />
                <LearningPoint text="Como pedir ajuda sem parecer incompetente" />
                <LearningPoint text="Pronúncia dos termos ágeis mais comuns" />
              </div>
            </div>
          </div>

          {/* Discussion / Q&A Preview */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-indigo-600" />
                Perguntas da Comunidade (24)
              </h3>
              <button className="text-sm text-indigo-600 font-bold hover:underline">
                Ver todas
              </button>
            </div>
            
            <div className="space-y-4">
              <Comment 
                user="Carlos M." 
                time="há 2 horas" 
                text="Vai ter material em PDF com os termos técnicos?" 
                likes={12}
              />
              <Comment 
                user="Fernanda L." 
                time="há 5 horas" 
                text="Essa live vai ficar gravada? Tenho reunião nesse horário :(" 
                likes={8}
              />
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-100 flex gap-3">
              <img src="https://picsum.photos/seed/user/40/40" className="w-10 h-10 rounded-full" alt="User" referrerPolicy="no-referrer" />
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  placeholder="Deixe sua pergunta para o mentor..." 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Sidebar (Right Column) */}
        <div className="space-y-6">
          
          {/* Action Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-indigo-100 sticky top-6">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 mb-1">A live começa em</p>
              <div className="text-3xl font-bold text-indigo-600 font-mono tracking-tight">
                23:45:12
              </div>
            </div>

            <button className="w-full bg-[#7367F0] text-white py-3.5 rounded-xl font-bold hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-200 mb-3 flex items-center justify-center gap-2 group">
              <Bell className="w-5 h-5 group-hover:animate-swing" />
              Definir Lembrete
            </button>
            
            <button className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 mb-6">
              <Calendar className="w-5 h-5 text-gray-500" />
              Adicionar à Agenda
            </button>

            <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span className="font-bold text-gray-800">1,240</span> inscritos
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-indigo-600">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Speaker Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-4">Mentor</h3>
            <div className="flex items-center gap-4 mb-4">
              <img src="https://picsum.photos/seed/speaker_mike/64/64" className="w-16 h-16 rounded-full border-2 border-indigo-100" alt="Speaker" referrerPolicy="no-referrer" />
              <div>
                <h4 className="font-bold text-gray-900 text-lg">Mike Ross</h4>
                <p className="text-sm text-indigo-600 font-medium">English Teacher & Tech Enthusiast</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              Especialista em inglês para profissionais de TI. Já ajudou mais de 500 devs a conseguirem vagas internacionais.
            </p>
            <div className="flex gap-2">
              <SocialButton icon={Linkedin} />
              <SocialButton icon={Instagram} />
            </div>
          </div>

          {/* Related Materials */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-4">Material de Apoio</h3>
            <div className="space-y-3">
              <MaterialItem title="Glossário Scrum (PDF)" type="PDF" />
              <MaterialItem title="Template de Daily (Notion)" type="Link" />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

function LearningPoint({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
      <span className="text-sm text-gray-600 leading-snug">{text}</span>
    </div>
  );
}

function Comment({ user, time, text, likes }: any) {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
        {user.charAt(0)}
      </div>
      <div className="flex-1 bg-gray-50 rounded-xl p-3 rounded-tl-none">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-gray-800">{user}</span>
          <span className="text-[10px] text-gray-400">{time}</span>
        </div>
        <p className="text-sm text-gray-600 mb-2">{text}</p>
        <button className="text-xs text-gray-500 font-medium hover:text-indigo-600 flex items-center gap-1">
          Curtir ({likes})
        </button>
      </div>
    </div>
  );
}

function SocialButton({ icon: Icon }: any) {
  return (
    <button className="p-2 bg-gray-50 text-gray-500 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
      <Icon className="w-4 h-4" />
    </button>
  );
}

function MaterialItem({ title, type }: any) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer group">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
          <FileText className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700">{title}</span>
      </div>
      <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded uppercase">{type}</span>
    </div>
  );
}
