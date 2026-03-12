import React, { useState } from 'react';
import { 
  Users, Calendar, ClipboardCheck, Folder, Eye, Video, CheckSquare, 
  UploadCloud, Settings, ChevronRight, MessageCircle, ExternalLink, 
  Clock, FileText, Search, Filter, MoreVertical, Play, Download, 
  Trash2, Plus, Mail, Bell, Link as LinkIcon, CheckCircle2, AlertCircle,
  X, Copy, List, LayoutGrid, Activity, UserPlus, Edit3, Send, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = [
  { id: 'visao-geral', label: 'Visão Geral', icon: Eye },
  { id: 'sessoes', label: 'Sessões', icon: Calendar },
  { id: 'tarefas', label: 'Tarefas', icon: LayoutGrid },
  { id: 'materiais', label: 'Materiais', icon: Folder },
  { id: 'meus-arquivos', label: 'Meus Arquivos', icon: UploadCloud },
  { id: 'alunos', label: 'Alunos', icon: Users },
  { id: 'config', label: 'Config', icon: Settings },
];

const KPIS = [
  { id: 'alunos', label: 'Alunos Ativos', value: '32', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'sessoes', label: 'Sessões na Semana', value: '5', icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: 'correcoes', label: 'Tarefas Pendentes', value: '12', icon: ClipboardCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
  { id: 'materiais', label: 'Materiais', value: '24', icon: Folder, color: 'text-purple-600', bg: 'bg-purple-50' },
];

// --- MOCK DATA ---
const SESSIONS = [
  { id: 1, title: 'Mentoria Individual', student: 'Ana Clara', date: 'Hoje', time: '14:00', type: '1-on-1', status: 'upcoming', link: 'https://zoom.us/j/123' },
  { id: 2, title: 'Tira-dúvidas Módulo 2', student: 'Turma A', date: 'Amanhã', time: '19:00', type: 'Group', status: 'upcoming', link: 'https://zoom.us/j/456' },
  { id: 3, title: 'Onboarding', student: 'Carlos Silva', date: '12 Mar', time: '10:00', type: '1-on-1', status: 'upcoming', link: 'https://zoom.us/j/789' },
  { id: 4, title: 'Revisão de Estratégia', student: 'Marcos Paulo', date: '05 Mar', time: '15:00', type: '1-on-1', status: 'past', link: '' },
];

const INITIAL_TASKS = [
  { id: 1, student: 'Ana Clara', task: 'Definição de Nicho e Avatar', submitted: 'Há 2 horas', status: 'pending' },
  { id: 2, student: 'Marcos Paulo', task: 'Estrutura da Oferta', submitted: 'Ontem', status: 'reviewing' },
  { id: 3, student: 'Julia Costa', task: 'Script de Vendas', submitted: '08 Mar', status: 'reviewed' },
  { id: 4, student: 'Pedro Alves', task: 'Criativos de Anúncio', submitted: 'Há 5 horas', status: 'pending' },
];

const STUDENTS = [
  { id: 1, name: 'Ana Clara', email: 'ana@example.com', progress: 45, lastActive: 'Hoje', status: 'active', avatar: 'AC', notes: 'Aluna muito dedicada. Focar em precificação na próxima sessão.' },
  { id: 2, name: 'Marcos Paulo', email: 'marcos@example.com', progress: 12, lastActive: 'Há 2 dias', status: 'active', avatar: 'MP', notes: 'Com dificuldades no módulo de tráfego.' },
  { id: 3, name: 'Julia Costa', email: 'julia@example.com', progress: 89, lastActive: 'Hoje', status: 'active', avatar: 'JC', notes: 'Pronta para lançar. Revisar script final.' },
  { id: 4, name: 'Carlos Silva', email: 'carlos@example.com', progress: 0, lastActive: 'Nunca', status: 'inactive', avatar: 'CS', notes: 'Ainda não fez o onboarding.' },
];

const FILES = [
  { id: 1, name: 'Template_Precificacao.xlsx', size: '1.2 MB', date: '10 Fev 2026', type: 'sheet' },
  { id: 2, name: 'Guia_Onboarding_Alunos.pdf', size: '3.5 MB', date: '05 Fev 2026', type: 'pdf' },
  { id: 3, name: 'Contrato_Mentoria_Padrao.docx', size: '800 KB', date: '15 Jan 2026', type: 'doc' },
];

const ACTIVITIES = [
  { id: 1, text: 'Ana Clara enviou a tarefa "Nicho"', time: 'Há 2 horas', icon: CheckSquare, color: 'text-amber-500', bg: 'bg-amber-50' },
  { id: 2, text: 'Marcos Paulo concluiu o Módulo 2', time: 'Há 4 horas', icon: Play, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 3, text: 'Nova inscrição: João Pedro', time: 'Ontem', icon: UserPlus, color: 'text-emerald-500', bg: 'bg-emerald-50' },
];

const NOTIFICATIONS = [
  { id: 1, title: 'Alunos inativos', desc: '3 alunos não acessam há mais de 7 dias.', time: 'Há 1 hora', unread: true },
  { id: 2, title: 'Sessão em breve', desc: 'Mentoria com Ana Clara começa em 30 min.', time: 'Há 2 horas', unread: true },
];

export default function MentorCockpit() {
  const [activeTab, setActiveTab] = useState('visao-geral');
  const [notifOpen, setNotifOpen] = useState(false);
  
  // Kanban State
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  
  // Sessions State
  const [sessionView, setSessionView] = useState<'list' | 'calendar'>('list');
  const [copiedLink, setCopiedLink] = useState<number | null>(null);

  // Students State
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [studentDrawer, setStudentDrawer] = useState<number | null>(null);

  const handleCopyLink = (id: number, link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const moveTask = (taskId: number, newStatus: string) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const toggleStudentSelection = (id: number) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const toggleAllStudents = () => {
    if (selectedStudents.length === STUDENTS.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(STUDENTS.map(s => s.id));
    }
  };

  const renderVisaoGeral = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* ROW 1 */}
      {/* Agenda */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
        <div className="p-5 border-b border-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Na sua agenda</h2>
          <button onClick={() => setActiveTab('sessoes')} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            Ver todas <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="p-2 flex-1 flex flex-col justify-center">
          {SESSIONS.filter(s => s.status === 'upcoming').slice(0, 2).map(session => (
            <div key={session.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl text-center min-w-[60px]">
                  <div className="text-xs font-bold uppercase">{session.date}</div>
                  <div className="text-lg font-black">{session.time}</div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{session.title}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {session.student}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleCopyLink(session.id, session.link)}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Copiar Link"
                >
                  {copiedLink === session.id ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                </button>
                <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm">
                  Entrar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-full">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-2 gap-3 flex-1">
          <button onClick={() => setActiveTab('sessoes')} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-gray-100 hover:border-indigo-100 group h-full">
            <Calendar className="w-6 h-6 text-gray-400 group-hover:text-indigo-500" />
            <span className="text-xs font-bold text-gray-600 group-hover:text-indigo-600 text-center">Agendar Sessão</span>
          </button>
          <button onClick={() => setActiveTab('tarefas')} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-gray-100 hover:border-indigo-100 group h-full">
            <Edit3 className="w-6 h-6 text-gray-400 group-hover:text-indigo-500" />
            <span className="text-xs font-bold text-gray-600 group-hover:text-indigo-600 text-center">Nova Tarefa</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-gray-100 hover:border-indigo-100 group col-span-2 h-full">
            <Send className="w-6 h-6 text-gray-400 group-hover:text-indigo-500" />
            <span className="text-xs font-bold text-gray-600 group-hover:text-indigo-600">Enviar Aviso para Turma</span>
          </button>
        </div>
      </div>

      {/* ROW 2 */}
      {/* Tasks Preview */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
        <div className="p-5 border-b border-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Para entregar (Correções)</h2>
          <button onClick={() => setActiveTab('tarefas')} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            Ir para Kanban <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="p-2 flex-1 flex flex-col justify-center">
          {tasks.filter(t => t.status === 'pending').slice(0, 2).map(task => (
            <div key={task.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  {task.student.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{task.task}</h3>
                  <p className="text-sm text-gray-500">Enviado por {task.student} • {task.submitted}</p>
                </div>
              </div>
              <button onClick={() => { setActiveTab('tarefas'); moveTask(task.id, 'reviewing'); }} className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-lg transition-colors shadow-sm">
                Iniciar Revisão
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center justify-center text-center h-full">
        <h2 className="text-lg font-bold text-gray-900 w-full text-left mb-4">Engajamento da Turma</h2>
        <div className="relative w-32 h-32 flex items-center justify-center mb-4">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f3f4f6" strokeWidth="12" />
            <circle 
              cx="50" cy="50" r="40" fill="transparent" stroke="#4f46e5" strokeWidth="12" 
              strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * 68) / 100}
              strokeLinecap="round" className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-gray-900">68%</span>
            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Ativos</span>
          </div>
        </div>
        <p className="text-sm font-medium text-gray-500 bg-gray-50 px-4 py-2 rounded-full mt-auto">
          22 de 32 alunos engajados
        </p>
      </div>

      {/* ROW 3 */}
      {/* Activity Feed */}
      <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-gray-400" /> Atividades Recentes
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

  const renderSessoes = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-gray-900">Sessões de Mentoria</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button onClick={() => setSessionView('list')} className={`px-4 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${sessionView === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <List className="w-4 h-4" /> Lista
            </button>
            <button onClick={() => setSessionView('calendar')} className={`px-4 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${sessionView === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <Calendar className="w-4 h-4" /> Calendário
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm ml-auto sm:ml-0">
            <Plus className="w-4 h-4" /> Nova Sessão
          </button>
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
                      <Users className="w-4 h-4" /> {session.student}
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

  const renderTarefas = () => {
    const columns = [
      { id: 'pending', title: 'Pendentes', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
      { id: 'reviewing', title: 'Em Revisão', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
      { id: 'reviewed', title: 'Avaliadas', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' }
    ];

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 h-full flex flex-col">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Quadro de Correções</h2>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Nova Tarefa
          </button>
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
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-xs">
                            {task.student.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{task.student}</p>
                            <p className="text-[10px] text-gray-500">{task.submitted}</p>
                          </div>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600"><MoreVertical className="w-4 h-4" /></button>
                      </div>
                      <h4 className="font-bold text-gray-800 text-sm mb-4">{task.task}</h4>
                      
                      <div className="flex gap-2 mt-auto">
                        {col.id === 'pending' && (
                          <button onClick={() => moveTask(task.id, 'reviewing')} className="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-colors">
                            Iniciar
                          </button>
                        )}
                        {col.id === 'reviewing' && (
                          <>
                            <button onClick={() => moveTask(task.id, 'pending')} className="py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors">
                              Voltar
                            </button>
                            <button onClick={() => moveTask(task.id, 'reviewed')} className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg transition-colors">
                              Concluir
                            </button>
                          </>
                        )}
                        {col.id === 'reviewed' && (
                          <button className="flex-1 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg transition-colors">
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

  const renderAlunos = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-gray-900">Gestão de Alunos</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Buscar aluno..." className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
          </div>
          <button className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                <th className="p-4 w-12">
                  <input 
                    type="checkbox" 
                    checked={selectedStudents.length === STUDENTS.length && STUDENTS.length > 0}
                    onChange={toggleAllStudents}
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="p-4">Aluno</th>
                <th className="p-4">Progresso</th>
                <th className="p-4">Último Acesso</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {STUDENTS.map(student => (
                <tr 
                  key={student.id} 
                  className={`hover:bg-gray-50/50 transition-colors cursor-pointer ${selectedStudents.includes(student.id) ? 'bg-indigo-50/30' : ''}`}
                  onClick={(e) => {
                    // Prevent opening drawer if clicking checkbox or action buttons
                    if ((e.target as HTMLElement).closest('input[type="checkbox"]') || (e.target as HTMLElement).closest('button')) return;
                    setStudentDrawer(student.id);
                  }}
                >
                  <td className="p-4">
                    <input 
                      type="checkbox" 
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => toggleStudentSelection(student.id)}
                      className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                        {student.avatar}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{student.name}</p>
                        <p className="text-xs text-gray-500">{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-full max-w-[120px] bg-gray-100 rounded-full h-2">
                        <div className={`h-2 rounded-full ${student.progress > 70 ? 'bg-emerald-500' : student.progress > 20 ? 'bg-amber-500' : 'bg-gray-300'}`} style={{ width: `${student.progress}%` }}></div>
                      </div>
                      <span className="text-xs font-bold text-gray-700">{student.progress}%</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{student.lastActive}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${student.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {student.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-2 text-gray-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50">
                      <Mail className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Actions Floating Bar */}
      <AnimatePresence>
        {selectedStudents.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full flex items-center gap-6 shadow-2xl z-40"
          >
            <span className="text-sm font-bold">{selectedStudents.length} selecionados</span>
            <div className="w-px h-4 bg-gray-700"></div>
            <div className="flex gap-2">
              <button className="text-sm font-medium hover:text-indigo-300 transition-colors flex items-center gap-2">
                <Mail className="w-4 h-4" /> Enviar Email
              </button>
              <button className="text-sm font-medium hover:text-indigo-300 transition-colors flex items-center gap-2 ml-4">
                <Download className="w-4 h-4" /> Exportar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Student Drawer */}
      <AnimatePresence>
        {studentDrawer !== null && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40"
              onClick={() => setStudentDrawer(null)}
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-gray-100"
            >
              {(() => {
                const student = STUDENTS.find(s => s.id === studentDrawer);
                if (!student) return null;
                return (
                  <>
                    <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xl shadow-inner">
                          {student.avatar}
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">{student.name}</h2>
                          <p className="text-sm text-gray-500">{student.email}</p>
                          <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${student.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                            {student.status === 'active' ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => setStudentDrawer(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="p-6 overflow-y-auto flex-1 space-y-8">
                      {/* Progress */}
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Progresso do Curso</h3>
                        <div className="flex items-center gap-4">
                          <div className="flex-1 bg-gray-100 rounded-full h-3">
                            <div className={`h-3 rounded-full ${student.progress > 70 ? 'bg-emerald-500' : student.progress > 20 ? 'bg-amber-500' : 'bg-gray-300'}`} style={{ width: `${student.progress}%` }}></div>
                          </div>
                          <span className="text-lg font-black text-gray-900">{student.progress}%</span>
                        </div>
                      </div>

                      {/* Private Notes */}
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Edit3 className="w-4 h-4 text-gray-400" /> Anotações Privadas
                        </h3>
                        <textarea 
                          className="w-full p-4 bg-yellow-50/50 border border-yellow-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-yellow-400 outline-none resize-none min-h-[120px]"
                          defaultValue={student.notes}
                          placeholder="Adicione notas sobre o aluno (apenas você pode ver)..."
                        />
                        <div className="flex justify-end mt-2">
                          <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700">Salvar Anotações</button>
                        </div>
                      </div>

                      {/* History */}
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-gray-400" /> Histórico
                        </h3>
                        <div className="space-y-4 border-l-2 border-gray-100 ml-2 pl-4">
                          <div className="relative">
                            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-white"></div>
                            <p className="text-sm font-medium text-gray-900">Sessão Individual Concluída</p>
                            <p className="text-xs text-gray-500">05 Mar 2026</p>
                          </div>
                          <div className="relative">
                            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white"></div>
                            <p className="text-sm font-medium text-gray-900">Tarefa "Nicho" Avaliada</p>
                            <p className="text-xs text-gray-500">28 Fev 2026</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'visao-geral': return renderVisaoGeral();
      case 'sessoes': return renderSessoes();
      case 'tarefas': return renderTarefas();
      case 'alunos': return renderAlunos();
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
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Wagner - Mentoria HP</h1>
            <div className="flex items-center gap-4 text-indigo-100 font-medium">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>32 Alunos Ativos</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-indigo-300"></div>
              <div className="flex items-center gap-1.5">
                <Video className="w-4 h-4" />
                <span>5 Sessões esta semana</span>
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
