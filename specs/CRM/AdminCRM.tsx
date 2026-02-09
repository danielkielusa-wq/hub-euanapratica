
import React, { useState } from 'react';
import { 
  Plus, 
  MoreHorizontal, 
  Search, 
  Filter, 
  ChevronDown, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target,
  MessageSquare,
  Calendar,
  Zap,
  Clock,
  CheckCircle2,
  X,
  Mail,
  Phone,
  Tag,
  History,
  AlertCircle,
  GripVertical,
  Trash2,
  ArrowRightLeft,
  StickyNote,
  Bell,
  CheckCircle,
  CalendarClock
} from 'lucide-react';

interface Note {
  id: string;
  content: string;
  date: string;
}

interface Task {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

interface Lead {
  id: string;
  name: string;
  avatar: string;
  service: string;
  value: string;
  status: 'new' | 'contacted' | 'qualified' | 'customer' | 'upsell';
  priority: 'low' | 'med' | 'high';
  score: number;
  email: string;
  lastContact: string;
  source: string;
  notes: Note[];
  tasks: Task[];
}

const COLUMNS = [
  { id: 'new', title: 'New Lead', color: 'bg-[#0086d0]', borderColor: 'border-[#0086d0]' },
  { id: 'contacted', title: 'Contacted', color: 'bg-[#a25ddc]', borderColor: 'border-[#a25ddc]' },
  { id: 'qualified', title: 'Qualified', color: 'bg-[#ffcb00]', borderColor: 'border-[#ffcb00]' },
  { id: 'customer', title: 'Customer', color: 'bg-[#00c875]', borderColor: 'border-[#00c875]' },
  { id: 'upsell', title: 'Upsell Opp.', color: 'bg-[#579bfc]', borderColor: 'border-[#579bfc]' },
];

const INITIAL_LEADS: Lead[] = [
  { 
    id: '1', name: 'Ricardo Mendes', avatar: 'RM', service: 'Mentoria Elite', value: 'R$ 4.500', 
    status: 'new', priority: 'high', score: 85, email: 'ricardo@exemplo.com', lastContact: '2h atrás', source: 'Instagram Ads',
    notes: [{ id: 'n1', content: 'Interessado em visto EB2-NIW. Possui 10 anos de experiência em Tech.', date: 'Hoje, 09:00' }],
    tasks: [{ id: 't1', title: 'Enviar PDF de apresentação', dueDate: '2025-02-15', completed: false }]
  },
  { 
    id: '2', name: 'Juliana Silva', avatar: 'JS', service: 'Resume Review', value: 'R$ 397', 
    status: 'contacted', priority: 'med', score: 60, email: 'ju.silva@exemplo.com', lastContact: '5h atrás', source: 'Indicação',
    notes: [], tasks: []
  },
  { 
    id: '3', name: 'Felipe Rocha', avatar: 'FR', service: 'Rota EUA', value: 'R$ 397', 
    status: 'customer', priority: 'low', score: 95, email: 'felipe@dev.com', lastContact: '1d atrás', source: 'YouTube',
    notes: [{ id: 'n2', content: 'Cliente antigo do Hub. Ótimo perfil para Upsell.', date: 'Ontem' }],
    tasks: []
  }
];

const AdminCRM: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [showDashboard, setShowDashboard] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Input states for Lead Drawer
  const [noteInput, setNoteInput] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDate, setTaskDate] = useState('');

  // Create Modal State
  const [newLead, setNewLead] = useState<Partial<Lead>>({
    name: '', email: '', service: 'Mentoria Elite', value: 'R$ 0', priority: 'med', status: 'new', source: 'Manual'
  });

  const getStatusColor = (status: Lead['status']) => {
    switch (status) {
      case 'customer': return 'bg-[#00c875]';
      case 'contacted': return 'bg-[#fdab3d]';
      case 'upsell': return 'bg-[#579bfc]';
      case 'new': return 'bg-[#0086d0]';
      default: return 'bg-[#c4c4c4]';
    }
  };

  const getPriorityColor = (p: Lead['priority']) => {
    switch (p) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'med': return 'text-amber-600 bg-amber-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // --- ACTIONS ---
  const updateLeadStatus = (id: string, newStatus: Lead['status']) => {
    setLeads(leads.map(l => l.id === id ? { ...l, status: newStatus, lastContact: 'Agora' } : l));
    if (selectedLead?.id === id) {
      setSelectedLead(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const handleAddNote = () => {
    if (!selectedLead || !noteInput.trim()) return;
    const newNote: Note = { id: Date.now().toString(), content: noteInput, date: 'Agora' };
    const updated = leads.map(l => l.id === selectedLead.id ? { ...l, notes: [newNote, ...l.notes] } : l);
    setLeads(updated);
    setSelectedLead({ ...selectedLead, notes: [newNote, ...selectedLead.notes] });
    setNoteInput('');
  };

  const handleAddTask = () => {
    if (!selectedLead || !taskTitle.trim()) return;
    const newTask: Task = { id: Date.now().toString(), title: taskTitle, dueDate: taskDate || 'Sem data', completed: false };
    const updated = leads.map(l => l.id === selectedLead.id ? { ...l, tasks: [newTask, ...l.tasks] } : l);
    setLeads(updated);
    setSelectedLead({ ...selectedLead, tasks: [newTask, ...selectedLead.tasks] });
    setTaskTitle('');
    setTaskDate('');
  };

  const toggleTask = (taskId: string) => {
    if (!selectedLead) return;
    const updatedTasks = selectedLead.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    setLeads(leads.map(l => l.id === selectedLead.id ? { ...l, tasks: updatedTasks } : l));
    setSelectedLead({ ...selectedLead, tasks: updatedTasks });
  };

  const onDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId);
  };

  const onDrop = (e: React.DragEvent, status: Lead['status']) => {
    const leadId = e.dataTransfer.getData('leadId');
    updateLeadStatus(leadId, status);
  };

  // --- MODALS & DRAWERS ---

  const LeadDetailDrawer = () => {
    if (!selectedLead) return null;
    return (
      <div className="fixed inset-0 z-[120] flex justify-end">
        <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setSelectedLead(null)} />
        <div className="relative w-full md:max-w-2xl bg-[#F9FAFB] h-full shadow-2xl animate-fade-in-right overflow-y-auto no-scrollbar">
          {/* Header */}
          <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-black text-lg shadow-lg">
                {selectedLead.avatar}
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900 leading-tight">{selectedLead.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${getStatusColor(selectedLead.status)} text-white`}>
                    {selectedLead.status}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
              <X size={24} />
            </button>
          </div>

          <div className="p-6 md:p-8 space-y-10 pb-24">
            {/* Quick Actions (Mobile First Grid) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                <Mail className="text-brand-600" size={20} />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">E-mail</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                <Phone className="text-green-600" size={20} />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">WhatsApp</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                <Calendar className="text-purple-600" size={20} />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Reunião</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                <Tag className="text-amber-600" size={20} />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Etiqueta</span>
              </button>
            </div>

            {/* Stage Grid (For Mobile Movement) */}
            <div className="space-y-4">
               <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <ArrowRightLeft size={14} /> Mover para Etapa
               </h3>
               <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2">
                    {COLUMNS.map(col => (
                        <button
                            key={col.id}
                            onClick={() => updateLeadStatus(selectedLead.id, col.id as any)}
                            className={`px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border ${
                                selectedLead.status === col.id 
                                ? `${col.color} text-white border-transparent shadow-md scale-105`
                                : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'
                            }`}
                        >
                            {col.title}
                        </button>
                    ))}
               </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-4">
                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <StickyNote size={14} /> Notas e Observações
                </h3>
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                    <div className="flex gap-3 mb-6">
                        <textarea 
                            value={noteInput}
                            onChange={(e) => setNoteInput(e.target.value)}
                            placeholder="Adicione uma nota interna..."
                            className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm focus:bg-white focus:ring-2 focus:ring-brand-100 transition-all outline-none min-h-[100px] resize-none"
                        />
                        <button onClick={handleAddNote} className="bg-brand-600 text-white p-4 rounded-2xl hover:bg-brand-700 self-end shadow-lg shadow-brand-600/20">
                            <Plus size={24} />
                        </button>
                    </div>
                    <div className="space-y-4">
                        {selectedLead.notes.map(n => (
                            <div key={n.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                                <p className="text-sm text-gray-800 leading-relaxed font-medium">{n.content}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase mt-3 tracking-widest">{n.date}</p>
                            </div>
                        ))}
                        {selectedLead.notes.length === 0 && <p className="text-center text-xs text-gray-400 py-4">Sem notas.</p>}
                    </div>
                </div>
            </div>

            {/* Tasks & Reminders */}
            <div className="space-y-4">
                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Bell size={14} /> Ações e Lembretes
                </h3>
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                    <div className="space-y-3 mb-6">
                        <input 
                            type="text" 
                            placeholder="O que precisa ser feito?"
                            value={taskTitle}
                            onChange={(e) => setTaskTitle(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold focus:bg-white outline-none"
                        />
                        <div className="flex gap-2">
                            <input 
                                type="date" 
                                value={taskDate}
                                onChange={(e) => setTaskDate(e.target.value)}
                                className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none"
                            />
                            <button onClick={handleAddTask} className="px-6 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-all">
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {selectedLead.tasks.map(t => (
                            <div key={t.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${t.completed ? 'bg-gray-50/50 opacity-60' : 'bg-white border-gray-100'}`}>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => toggleTask(t.id)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${t.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-200 text-transparent'}`}>
                                        <CheckCircle2 size={14} />
                                    </button>
                                    <div>
                                        <p className={`text-sm font-bold ${t.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>{t.title}</p>
                                        <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1 mt-0.5"><CalendarClock size={10} /> {t.dueDate}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {selectedLead.tasks.length === 0 && <p className="text-center text-xs text-gray-400 py-4">Sem lembretes.</p>}
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const CreateLeadModal = () => (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)} />
      <div className="relative bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-fade-in-up">
        <div className="p-8 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-2xl font-black text-gray-900">Novo Lead</h3>
          <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={24} /></button>
        </div>
        <form onSubmit={(e) => {
            e.preventDefault();
            const leadToAdd: Lead = {
                ...newLead as Lead,
                id: Date.now().toString(),
                avatar: (newLead.name || 'U').substring(0,2).toUpperCase(),
                score: 50, lastContact: 'Agora', notes: [], tasks: []
            };
            setLeads([leadToAdd, ...leads]);
            setIsCreateModalOpen(false);
        }} className="p-8 space-y-6">
            <div className="space-y-4">
                <input type="text" placeholder="Nome do Cliente" required onChange={e => setNewLead({...newLead, name: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold outline-none focus:bg-white" />
                <input type="email" placeholder="E-mail" required onChange={e => setNewLead({...newLead, email: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold outline-none focus:bg-white" />
                <div className="grid grid-cols-2 gap-4">
                    <select onChange={e => setNewLead({...newLead, service: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold outline-none">
                        <option>Mentoria Elite</option>
                        <option>Resume Review</option>
                        <option>Rota EUA</option>
                    </select>
                    <select onChange={e => setNewLead({...newLead, priority: e.target.value as any})} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold outline-none">
                        <option value="med">Prioridade: Média</option>
                        <option value="high">Alta</option>
                        <option value="low">Baixa</option>
                    </select>
                </div>
            </div>
            <button type="submit" className="w-full py-5 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-[24px] shadow-xl shadow-brand-600/20 transition-all flex items-center justify-center gap-2">
                <Plus size={20} /> Salvar no Pipeline
            </button>
        </form>
      </div>
    </div>
  );

  const renderCard = (lead: Lead) => {
    const hasNotes = lead.notes.length > 0;
    const pendingTasks = lead.tasks.filter(t => !t.completed).length;

    return (
        <div 
          key={lead.id} 
          draggable
          onDragStart={(e) => onDragStart(e, lead.id)}
          onClick={() => setSelectedLead(lead)}
          className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-4 md:p-5 hover:shadow-xl hover:border-brand-200 transition-all group cursor-grab active:cursor-grabbing mb-4 relative overflow-hidden active:scale-95"
        >
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gray-100 group-hover:bg-brand-500 transition-colors" />
          
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 text-gray-900 flex items-center justify-center font-black text-xs group-hover:bg-brand-600 group-hover:text-white transition-all">
                {lead.avatar}
              </div>
              <div>
                <h4 className="text-xs font-black text-gray-900 truncate w-32 tracking-tight leading-none mb-1">{lead.name}</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{lead.service}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
               {hasNotes && <StickyNote size={12} className="text-brand-400" fill="currentColor" />}
               {pendingTasks > 0 && <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-lg border border-amber-100"><Bell size={10} fill="currentColor" /><span className="text-[9px] font-black">{pendingTasks}</span></div>}
               <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${getPriorityColor(lead.priority)}`}>
                 {lead.priority}
               </span>
            </div>
          </div>
    
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
               <span className="text-[9px] font-black uppercase text-gray-300 tracking-wider">Investimento</span>
               <span className="text-xs font-black text-gray-900">{lead.value}</span>
            </div>
            <div className="text-right">
               <span className="text-[9px] font-black uppercase text-gray-300 tracking-wider">Visto há</span>
               <p className="text-[10px] font-bold text-gray-500">{lead.lastContact}</p>
            </div>
          </div>
    
          <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
             <div className="flex -space-x-1.5">
                <div className="w-6 h-6 rounded-full bg-brand-50 border-2 border-white flex items-center justify-center text-brand-600"><Zap size={10} fill="currentColor" /></div>
                <div className="w-6 h-6 rounded-full bg-blue-50 border-2 border-white flex items-center justify-center text-blue-600"><MessageSquare size={10} /></div>
             </div>
             <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg">
                <div className="w-8 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full ${lead.score > 70 ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${lead.score}%` }} />
                </div>
                <span className="text-[10px] font-black text-gray-500">{lead.score}%</span>
             </div>
          </div>
        </div>
      );
  };

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fade-in flex flex-col h-full space-y-6">
      {selectedLead && <LeadDetailDrawer />}
      {isCreateModalOpen && <CreateLeadModal />}

      {/* Header (Mobile Responsive) */}
      <div className="bg-white rounded-[40px] p-6 shadow-sm border border-gray-100 flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
               Monday CRM Pipeline <span className="hidden md:inline-block bg-green-50 text-green-600 text-[10px] px-3 py-1 rounded-full uppercase tracking-widest border border-green-100">Sync Ativo</span>
            </h2>
            <p className="text-gray-500 mt-1 text-sm">Controle visual e gestão de relacionamento.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Pesquisar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white transition-all outline-none"
                />
            </div>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-2xl text-sm shadow-xl shadow-brand-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
               <Plus size={20} /> Novo Lead
            </button>
          </div>
        </div>
      </div>

      {/* Stats - Horizontal Scroll on Mobile */}
      {showDashboard && (
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-1">
           {[
              { label: 'Pipeline', val: `R$ ${filteredLeads.length * 1.5}k`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Ativos', val: filteredLeads.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Tarefas', val: leads.reduce((acc, l) => acc + l.tasks.filter(t => !t.completed).length, 0), icon: Bell, color: 'text-amber-600', bg: 'bg-amber-50' },
           ].map((stat, i) => (
             <div key={i} className="min-w-[160px] flex-1 bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm flex flex-col items-center text-center">
                <div className={`w-8 h-8 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-2`}>
                    <stat.icon size={16} />
                </div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-xl font-black text-gray-900 tracking-tight">{stat.val}</p>
             </div>
           ))}
        </div>
      )}

      {/* Board */}
      <div className="flex-1 overflow-x-auto no-scrollbar pb-10">
        <div className="flex gap-6 min-w-max h-full px-1">
           {COLUMNS.map(col => (
             <div 
                key={col.id} 
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDrop(e, col.id as Lead['status'])}
                className="w-[280px] md:w-[320px] flex flex-col h-full"
              >
                <div className="flex flex-col mb-4 px-2">
                    <div className={`h-1.5 w-full ${col.color} rounded-t-full mb-3`} />
                    <div className="flex justify-between items-center">
                        <h3 className="font-black text-gray-900 text-[11px] uppercase tracking-widest">{col.title}</h3>
                        <span className="text-[10px] font-black text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                            {filteredLeads.filter(l => l.status === col.id).length}
                        </span>
                    </div>
                </div>
                
                <div className="flex-1 rounded-[32px] p-3 md:p-4 bg-gray-50/50 border border-gray-100 min-h-[500px]">
                   {filteredLeads.filter(l => l.status === col.id).map(lead => renderCard(lead))}
                   
                   <button 
                    onClick={() => { setIsCreateModalOpen(true); }}
                    className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:text-brand-600 hover:bg-white hover:border-brand-300 transition-all text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 group mt-2"
                  >
                      <Plus size={16} /> Item
                   </button>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default AdminCRM;
