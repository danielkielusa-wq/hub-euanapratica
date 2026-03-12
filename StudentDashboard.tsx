import React, { useState } from 'react';
import { 
  BookOpen, Calendar, CheckSquare, Folder, Eye, Video, 
  UploadCloud, Settings, ChevronRight, MessageCircle, ExternalLink, 
  Clock, FileText, Search, Filter, MoreVertical, Play, Download, 
  Trash2, Plus, Mail, Bell, Link as LinkIcon, CheckCircle2, AlertCircle,
  X, Copy, List, LayoutGrid, Activity, UserPlus, Edit3, Send, Check,
  Trophy, Target, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = [
  { id: 'visao-geral', label: 'Visão Geral', icon: Eye },
  { id: 'minhas-tarefas', label: 'Minhas Tarefas', icon: CheckSquare },
  { id: 'agenda', label: 'Agenda', icon: Calendar },
  { id: 'materiais', label: 'Materiais', icon: Folder },
  { id: 'comunidade', label: 'Comunidade', icon: MessageCircle },
  { id: 'config', label: 'Configurações', icon: Settings },
];

const KPIS = [
  { id: 'progresso', label: 'Progresso do Curso', value: '68%', icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'tarefas', label: 'Tarefas Concluídas', value: '12/15', icon: CheckSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'sessoes', label: 'Sessões Participadas', value: '8', icon: Video, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: 'conquistas', label: 'Conquistas', value: '4', icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-50' },
];

// --- MOCK DATA ---
const SESSIONS = [
  { id: 1, title: 'Mentoria Individual', mentor: 'Wagner', date: 'Hoje', time: '14:00', type: '1-on-1', status: 'upcoming', link: 'https://zoom.us/j/123' },
  { id: 2, title: 'Tira-dúvidas Módulo 2', mentor: 'Wagner', date: 'Amanhã', time: '19:00', type: 'Group', status: 'upcoming', link: 'https://zoom.us/j/456' },
  { id: 3, title: 'Revisão de Estratégia', mentor: 'Wagner', date: '05 Mar', time: '15:00', type: '1-on-1', status: 'past', link: '' },
];

const INITIAL_TASKS = [
  { id: 1, task: 'Definição de Nicho e Avatar', module: 'Módulo 1', deadline: 'Hoje', status: 'pending' },
  { id: 2, task: 'Estrutura da Oferta', module: 'Módulo 2', deadline: 'Amanhã', status: 'pending' },
  { id: 3, task: 'Script de Vendas', module: 'Módulo 2', deadline: '08 Mar', status: 'reviewing' },
  { id: 4, task: 'Criativos de Anúncio', module: 'Módulo 1', deadline: '01 Mar', status: 'reviewed', grade: 'Aprovado' },
];

const ACTIVITIES = [
  { id: 1, text: 'Você concluiu o Módulo 2: Estruturação', time: 'Há 2 horas', icon: Play, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 2, text: 'Wagner avaliou sua tarefa "Script de Vendas"', time: 'Há 4 horas', icon: CheckSquare, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: 3, text: 'Nova conquista desbloqueada: "Primeiros Passos"', time: 'Ontem', icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-50' },
];

const NOTIFICATIONS = [
  { id: 1, title: 'Sessão em breve', desc: 'Sua mentoria com Wagner começa em 30 min.', time: 'Há 2 horas', unread: true },
  { id: 2, title: 'Tarefa Avaliada', desc: 'Sua tarefa do Módulo 1 foi avaliada.', time: 'Há 4 horas', unread: true },
];

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('visao-geral');
  const [notifOpen, setNotifOpen] = useState(false);
  
  // Kanban State
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  
  // Sessions State
  const [sessionView, setSessionView] = useState<'list' | 'calendar'>('list');
  const [copiedLink, setCopiedLink] = useState<number | null>(null);

  const handleCopyLink = (id: number, link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const moveTask = (taskId: number, newStatus: string) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const renderVisaoGeral = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* ROW 1 */}
      {/* Trilha de Aprendizado */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
        <div className="p-5 border-b border-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Continue de onde parou</h2>
          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            Ir para o Curso <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 flex-1 flex flex-col justify-center">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="relative w-full md:w-48 h-32 rounded-xl overflow-hidden bg-gray-900 shrink-0 group cursor-pointer">
              <img src="https://picsum.photos/seed/mentorship/400/300" alt="Thumbnail" className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 text-white fill-white" />
                </div>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-[10px] font-bold text-white">
                12:45
              </div>
            </div>
            <div className="flex-1 w-full">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1 block">Módulo 3 • Aula 2</span>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Estratégias de Aquisição Avançadas</h3>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">Aprenda a escalar suas campanhas reduzindo o custo de aquisição e aumentando a qualidade do lead.</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
                <span className="text-xs font-bold text-gray-700">45%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-full">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-2 gap-3 flex-1">
          <button onClick={() => setActiveTab('agenda')} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-gray-100 hover:border-indigo-100 group h-full">
            <Calendar className="w-6 h-6 text-gray-400 group-hover:text-indigo-500" />
            <span className="text-xs font-bold text-gray-600 group-hover:text-indigo-600 text-center">Ver Agenda</span>
          </button>
          <button onClick={() => setActiveTab('comunidade')} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-gray-100 hover:border-indigo-100 group h-full">
            <MessageCircle className="w-6 h-6 text-gray-400 group-hover:text-indigo-500" />
            <span className="text-xs font-bold text-gray-600 group-hover:text-indigo-600 text-center">Fórum</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-gray-100 hover:border-indigo-100 group col-span-2 h-full">
            <Mail className="w-6 h-6 text-gray-400 group-hover:text-indigo-500" />
            <span className="text-xs font-bold text-gray-600 group-hover:text-indigo-600">Enviar Dúvida ao Mentor</span>
          </button>
        </div>
      </div>

      {/* ROW 2 */}
      {/* Tasks Preview */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
        <div className="p-5 border-b border-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Minhas Tarefas Pendentes</h2>
          <button onClick={() => setActiveTab('minhas-tarefas')} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            Ver todas <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="p-2 flex-1 flex flex-col justify-center">
          {tasks.filter(t => t.status === 'pending').slice(0, 2).map(task => (
            <div key={task.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{task.task}</h3>
                  <p className="text-sm text-gray-500">{task.module} • Prazo: {task.deadline}</p>
                </div>
              </div>
              <button onClick={() => { setActiveTab('minhas-tarefas'); }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm">
                Entregar
              </button>
            </div>
          ))}
          {tasks.filter(t => t.status === 'pending').length === 0 && (
            <div className="p-8 text-center text-gray-500 font-medium">
              Você não tem tarefas pendentes! 🎉
            </div>
          )}
        </div>
      </div>

      {/* Próxima Mentoria */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-full">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Próxima Sessão</h2>
        {SESSIONS.filter(s => s.status === 'upcoming').slice(0, 1).map(session => (
          <div key={session.id} className="flex flex-col h-full">
            <div className="bg-indigo-50 rounded-xl p-5 text-center mb-4 flex-1 flex flex-col items-center justify-center">
              <div className="text-indigo-600 font-bold uppercase tracking-wider text-sm mb-1">{session.date}</div>
              <div className="text-4xl font-black text-indigo-700 mb-2">{session.time}</div>
              <h3 className="font-bold text-gray-900 text-lg">{session.title}</h3>
              <p className="text-sm text-gray-600 mt-1">com {session.mentor}</p>
            </div>
            <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2">
              <Video className="w-5 h-5" /> Acessar Sala
            </button>
          </div>
        ))}
      </div>

      {/* ROW 3 */}
      {/* Activity Feed */}
      <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-400 fill-amber-400" /> Conquistas e Atualizações
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ACTIVITIES.map(act => (
            <div key={act.id} className="flex gap-3 p-4 rounded-xl border border-gray-50 bg-gray-50/50 hover:bg-gray-50 transition-colors">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${act.bg} ${act.color}`}>
                <act.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 leading-snug">{act.text}</p>
                <p className="text-xs text-gray-500 mt-1">{act.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </motion.div>
  );

  const renderTarefas = () => {
    const columns = [
      { id: 'pending', title: 'Para Fazer', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
      { id: 'reviewing', title: 'Em Avaliação', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
      { id: 'reviewed', title: 'Concluídas', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' }
    ];

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 h-full flex flex-col">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Minhas Tarefas</h2>
        </div>
        
        <div className="flex gap-6 overflow-x-auto pb-4 flex-1 min-h-[500px]">
          {columns.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id);
            return (
              <div key={col.id} className="flex-1 min-w-[320px] max-w-[400px] bg-gray-50/50 rounded-2xl border border-gray-100 p-4 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${col.bg} ${col.color}`}>
                      <col.icon className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-gray-900">{col.title}</h3>
                  </div>
                  <span className="text-xs font-bold text-gray-500 bg-gray-200 px-2 py-1 rounded-full">{colTasks.length}</span>
                </div>
                
                <div className="space-y-3 flex-1">
                  {colTasks.map(task => (
                    <motion.div layoutId={`task-${task.id}`} key={task.id} className={`bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition-shadow ${col.border}`}>
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                          {task.module}
                        </span>
                        {task.grade && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md">
                            {task.grade}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-gray-800 text-sm mb-2">{task.task}</h4>
                      <p className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Prazo: {task.deadline}
                      </p>
                      
                      <div className="flex gap-2 mt-auto">
                        {col.id === 'pending' && (
                          <button onClick={() => moveTask(task.id, 'reviewing')} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                            <UploadCloud className="w-4 h-4" /> Entregar Tarefa
                          </button>
                        )}
                        {col.id === 'reviewing' && (
                          <div className="flex-1 py-2 bg-gray-50 text-gray-500 text-xs font-bold rounded-lg text-center border border-gray-100">
                            Aguardando Mentor
                          </div>
                        )}
                        {col.id === 'reviewed' && (
                          <button className="flex-1 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg transition-colors">
                            Ver Feedback
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {colTasks.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-sm text-gray-400 font-medium">
                      Nenhuma tarefa
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  };

  const renderSessoes = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-gray-900">Minha Agenda</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button onClick={() => setSessionView('list')} className={`px-4 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${sessionView === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <List className="w-4 h-4" /> Lista
            </button>
            <button onClick={() => setSessionView('calendar')} className={`px-4 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${sessionView === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <Calendar className="w-4 h-4" /> Calendário
            </button>
          </div>
        </div>
      </div>

      {sessionView === 'list' ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 divide-y divide-gray-100">
            {SESSIONS.map(session => (
              <div key={session.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-5">
                  <div className={`p-4 rounded-2xl text-center min-w-[80px] ${session.status === 'upcoming' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-500'}`}>
                    <div className="text-xs font-bold uppercase">{session.date}</div>
                    <div className="text-xl font-black">{session.time}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-bold text-lg ${session.status === 'upcoming' ? 'text-gray-900' : 'text-gray-500'}`}>{session.title}</h3>
                      {session.type === 'Group' && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold uppercase rounded-full">Grupo</span>}
                    </div>
                    <p className="text-sm text-gray-500 flex items-center gap-1.5">
                      <Users className="w-4 h-4" /> Mentor: {session.mentor}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {session.status === 'upcoming' ? (
                    <>
                      <button 
                        onClick={() => handleCopyLink(session.id, session.link)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Copiar Link"
                      >
                        {copiedLink === session.id ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                      </button>
                      <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2">
                        <Video className="w-4 h-4" /> Entrar na Sala
                      </button>
                    </>
                  ) : (
                    <button className="px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2">
                      <Play className="w-4 h-4" /> Ver Gravação
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {/* Simple Mock Calendar View */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Março 2026</h3>
            <div className="flex gap-2">
              <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50"><ChevronRight className="w-4 h-4 rotate-180" /></button>
              <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-xl overflow-hidden border border-gray-200">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="bg-gray-50 p-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">{day}</div>
            ))}
            {Array.from({ length: 35 }).map((_, i) => {
              const dayNum = i - 1; // Offset for mock
              const isCurrentMonth = dayNum > 0 && dayNum <= 31;
              const hasSession = dayNum === 5 || dayNum === 9 || dayNum === 12;
              const isToday = dayNum === 9;
              
              return (
                <div key={i} className={`bg-white min-h-[100px] p-2 ${!isCurrentMonth ? 'opacity-40 bg-gray-50' : ''}`}>
                  <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1 ${isToday ? 'bg-indigo-600 text-white' : 'text-gray-700'}`}>
                    {isCurrentMonth ? dayNum : ''}
                  </div>
                  {hasSession && isCurrentMonth && (
                    <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold p-1.5 rounded truncate mt-1 cursor-pointer hover:bg-indigo-100 transition-colors">
                      14:00 - Mentoria
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'visao-geral': return renderVisaoGeral();
      case 'agenda': return renderSessoes();
      case 'minhas-tarefas': return renderTarefas();
      default:
        return (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Em construção</h2>
            <p className="text-gray-500 max-w-md">
              A aba <span className="font-semibold text-gray-700">{TABS.find(t => t.id === activeTab)?.label}</span> está sendo desenvolvida e estará disponível em breve.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 font-sans">
      
      {/* Hero Header */}
      <div className="relative overflow-visible rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white shadow-lg">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-32 -mb-16 w-48 h-48 rounded-full bg-purple-400 opacity-20 blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Olá, João Pedro 👋</h1>
            <p className="text-indigo-100 text-lg mb-4">Bem-vindo de volta à sua jornada de aprendizado.</p>
            <div className="flex items-center gap-4 text-white font-medium bg-white/10 w-fit px-4 py-2 rounded-xl backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                <span>Progresso: 68%</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-indigo-300"></div>
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-indigo-300" />
                <span>Próxima sessão: Hoje às 14:00</span>
              </div>
            </div>
          </div>

          {/* Notifications Center */}
          <div className="relative">
            <button 
              onClick={() => setNotifOpen(!notifOpen)}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-colors relative"
            >
              <Bell className="w-6 h-6 text-white" />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-indigo-600 rounded-full"></span>
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 text-gray-900"
                >
                  <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold">Notificações</h3>
                    <button className="text-xs text-indigo-600 font-bold hover:text-indigo-700">Marcar lidas</button>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {NOTIFICATIONS.map(n => (
                      <div key={n.id} className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${n.unread ? 'bg-indigo-50/30' : ''}`}>
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-sm font-bold text-gray-900">{n.title}</h4>
                          {n.unread && <span className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5"></span>}
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{n.desc}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{n.time}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 text-center border-t border-gray-50">
                    <button className="text-xs font-bold text-gray-500 hover:text-gray-700">Ver todas</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {KPIS.map((kpi) => (
          <motion.div 
            key={kpi.id}
            whileHover={{ y: -2 }}
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4"
          >
            <div className={`p-3 rounded-xl ${kpi.bg} ${kpi.color}`}>
              <kpi.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">{kpi.label}</p>
              <p className="text-2xl font-bold text-gray-900 leading-none">{kpi.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto no-scrollbar border-b border-gray-200">
        <div className="flex gap-2 pb-px">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap border-b-2
                ${activeTab === tab.id 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-indigo-600' : 'text-gray-400'}`} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
