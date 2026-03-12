import React, { useState } from 'react';
import { 
  Users, Calendar as CalendarIcon, ClipboardCheck, Folder, Eye, Video, CheckSquare, 
  UploadCloud, Settings, ChevronRight, MessageCircle, ExternalLink, 
  Clock, FileText, Search, Filter, MoreVertical, Play, Download, 
  Trash2, Plus, Mail, Bell, Link as LinkIcon, CheckCircle2, AlertCircle,
  X, Copy, List, LayoutGrid, Activity, UserPlus, Edit3, Send, Check, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TABS = [
  { id: 'visao-geral', label: 'Dashboard', icon: LayoutGrid },
  { id: 'sessoes', label: 'Schedule', icon: CalendarIcon },
  { id: 'tarefas', label: 'Inbox', icon: Mail },
  { id: 'alunos', label: 'Students', icon: Users },
  { id: 'relatorios', label: 'Report', icon: FileText },
  { id: 'config', label: 'Settings', icon: Settings },
];

// --- MOCK DATA ---
const SESSIONS = [
  { id: 1, title: 'Mentoria Individual', student: 'Ana Clara', date: 'Hoje', time: '14:00', type: '1-on-1', status: 'upcoming', link: 'https://zoom.us/j/123' },
  { id: 2, title: 'Tira-dúvidas Módulo 2', student: 'Turma A', date: 'Amanhã', time: '19:00', type: 'Group', status: 'upcoming', link: 'https://zoom.us/j/456' },
  { id: 3, title: 'Onboarding', student: 'Carlos Silva', date: '12 Mar', time: '10:00', type: '1-on-1', status: 'upcoming', link: 'https://zoom.us/j/789' },
  { id: 4, title: 'Revisão de Estratégia', student: 'Marcos Paulo', date: '05 Mar', time: '15:00', type: '1-on-1', status: 'past', link: '' },
];

const INITIAL_TASKS = [
  { id: 1, student: 'Ana Clara', task: 'Definição de Nicho e Avatar', submitted: '09 Mar 2026', status: 'pending' },
  { id: 2, student: 'Marcos Paulo', task: 'Estrutura da Oferta', submitted: '10 Mar 2026', status: 'reviewing' },
  { id: 3, student: 'Julia Costa', task: 'Script de Vendas', submitted: '10 Mar 2026', status: 'reviewed' },
  { id: 4, student: 'Pedro Alves', task: 'Criativos de Anúncio', submitted: '11 Mar 2026', status: 'pending' },
];

const CHART_DATA = [
  { name: 'S', online: 2, offline: 1 },
  { name: 'M', online: 4, offline: 2 },
  { name: 'T', online: 3, offline: 5 },
  { name: 'W', online: 6, offline: 3 },
  { name: 'T', online: 4, offline: 4 },
  { name: 'F', online: 2, offline: 1 },
  { name: 'S', online: 1, offline: 0 },
];

export default function MentorDashboard() {
  const [activeTab, setActiveTab] = useState('visao-geral');
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [copiedLink, setCopiedLink] = useState<number | null>(null);

  const handleCopyLink = (id: number, link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const renderVisaoGeral = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      
      {/* Top Section: Banner & Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col justify-end">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, Wagner</h1>
            <p className="text-sm text-gray-500">10 Março, Quarta-feira</p>
          </div>
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-6 text-white flex items-center justify-between shadow-sm relative overflow-hidden">
             <div className="relative z-10">
               <p className="text-lg font-medium mb-1">O progresso médio dos seus alunos é <span className="font-bold text-yellow-300">73%</span>.</p>
               <p className="text-sm text-indigo-100">Engaje seus alunos para melhorar seu rank de mentor!</p>
             </div>
             {/* Abstract shape */}
             <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/10 skew-x-12 transform translate-x-8"></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-4 h-full mt-auto">
          <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl font-bold shrink-0">
            WG
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-lg">Wagner</h3>
            <p className="text-xs text-gray-500 mb-3">wagner@mentoria.com</p>
            <div className="flex gap-3">
              <div className="bg-gray-50 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700">Rank: <span className="text-indigo-600">14</span></div>
              <div className="bg-gray-50 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700">Turmas: <span className="text-indigo-600">7</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Chart, Chats, Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Working Hours / Engajamento */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-gray-900">Working Hours</h2>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
              <ChevronLeft className="w-4 h-4 cursor-pointer hover:text-gray-900" />
              <span>01 - 08 Jun 2026</span>
              <ChevronRight className="w-4 h-4 cursor-pointer hover:text-gray-900" />
            </div>
          </div>
          <div className="flex-1 min-h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CHART_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="online" fill="#818cf8" radius={[4, 4, 4, 4]} barSize={8} />
                <Bar dataKey="offline" fill="#34d399" radius={[4, 4, 4, 4]} barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between mt-4 pt-4 border-t border-gray-50">
            <div>
              <p className="text-xs text-gray-500 font-medium">Total</p>
              <p className="text-sm font-bold text-gray-900">36h 45m</p>
            </div>
            <div>
              <p className="text-xs text-indigo-500 font-medium">Online</p>
              <p className="text-sm font-bold text-gray-900">12h 30m</p>
            </div>
            <div>
              <p className="text-xs text-emerald-500 font-medium">Offline</p>
              <p className="text-sm font-bold text-gray-900">14h 15m</p>
            </div>
          </div>
        </div>

        {/* Group Chats / Mensagens */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-gray-900">Group chats</h2>
            <button className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full hover:bg-indigo-100 transition-colors">View all</button>
          </div>
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-sm">
                TG
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-gray-900 truncate">Teacher's Group</h4>
                <p className="text-xs text-gray-500 truncate">Donna: Who can replace me on We...</p>
              </div>
              <div className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">14</div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-sm">
                3A
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-gray-900 truncate">Class 3A</h4>
                <p className="text-xs text-gray-500 truncate flex items-center gap-1"><LinkIcon className="w-3 h-3"/> Composition-task.pdf</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold shadow-sm">
                3B
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-gray-900 truncate">Class 3B</h4>
                <p className="text-xs text-gray-500 truncate">Cody: Where can I read the info for...</p>
              </div>
              <div className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">2</div>
            </div>
          </div>
        </div>

        {/* Calendar Widget */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <ChevronLeft className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-900" />
            <h2 className="text-sm font-bold text-gray-900">June 2026</h2>
            <ChevronRight className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-900" />
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
              <div key={d} className="text-xs font-bold text-gray-400">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Mock days */}
            {Array.from({length: 35}).map((_, i) => {
              const day = i - 2;
              const isCurrentMonth = day > 0 && day <= 30;
              const isToday = day === 8;
              
              return (
                <div key={i} className="flex justify-center items-center h-8">
                  {isCurrentMonth ? (
                    <div className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium cursor-pointer transition-colors
                      ${isToday ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'}
                    `}>
                      {day}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-300">{day <= 0 ? 29 + day : day - 30}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Section: Tests & Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Tests / Tarefas */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-gray-900">Student tests</h2>
            <button className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full hover:bg-indigo-100 transition-colors">All tests</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="pb-3 font-medium">Test name</th>
                  <th className="pb-3 font-medium">Deadline</th>
                  <th className="pb-3 font-medium">Student</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tasks.slice(0, 4).map(task => (
                  <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{task.task}</span>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-gray-500">{task.submitted}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                          {task.student.split(' ').map(n=>n[0]).join('')}
                        </div>
                        <span className="text-sm text-gray-700">{task.student}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      {task.status === 'pending' && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 text-amber-600 text-[10px] font-bold uppercase"><AlertCircle className="w-3 h-3"/> Not viewed</span>}
                      {task.status === 'reviewing' && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold uppercase"><Play className="w-3 h-3"/> Active</span>}
                      {task.status === 'reviewed' && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase"><CheckCircle2 className="w-3 h-3"/> Reviewed</span>}
                    </td>
                    <td className="py-3 text-right">
                      <button className="p-1 text-gray-400 hover:text-gray-900"><MoreVertical className="w-4 h-4"/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Classes / Sessões */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-gray-900">Upcoming Classes</h2>
            <button className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full hover:bg-indigo-100 transition-colors">View all</button>
          </div>
          <div className="space-y-3">
            {SESSIONS.filter(s => s.status === 'upcoming').map(session => (
              <div key={session.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100">
                <div className="bg-white px-3 py-2 rounded-lg text-center shadow-sm shrink-0 min-w-[50px]">
                  <div className="text-xs font-bold text-gray-900">{session.time}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-900 truncate">{session.title} | {session.student}</h4>
                  <p className="text-xs text-gray-500 truncate">{session.date}, {session.type === 'Group' ? 'Online' : 'Offline'}</p>
                </div>
                <button 
                  onClick={() => handleCopyLink(session.id, session.link)}
                  className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center hover:bg-indigo-200 transition-colors shrink-0"
                >
                  {copiedLink === session.id ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

    </motion.div>
  );

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 font-sans bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold">A</div>
          <span className="font-bold text-xl text-gray-900">Attwood School</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-gray-400 hover:text-gray-600"><Search className="w-5 h-5" /></button>
          <button className="text-gray-400 hover:text-gray-600 relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
            WG
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full lg:w-64 shrink-0">
          <div className="space-y-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-indigo-50 text-indigo-600' 
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
          
          <div className="mt-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white text-center shadow-lg">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold mb-4 text-sm">Create new class chat now</h3>
            <button className="w-full py-2 bg-yellow-300 hover:bg-yellow-400 text-yellow-900 font-bold rounded-lg text-sm transition-colors">
              Create class
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'visao-geral' ? renderVisaoGeral() : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center justify-center text-center">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Em construção</h2>
                  <p className="text-gray-500">Esta aba está sendo desenvolvida.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
