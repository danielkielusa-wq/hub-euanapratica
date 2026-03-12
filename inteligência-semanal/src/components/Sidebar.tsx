import { Calendar, LayoutDashboard, Activity, HeartPulse, BrainCircuit, Users, FileText, MessageSquare, Settings, User } from "lucide-react";
import { cn } from "../lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Visão Geral" },
  { icon: Calendar, label: "Agenda Semanal" },
  { icon: Activity, label: "Analytics Geral" },
  { icon: HeartPulse, label: "Saúde do Sistema" },
  { icon: BrainCircuit, label: "Inteligência Semanal", active: true },
];

const secondaryItems = [
  { label: "FERRAMENTAS AI" },
  { label: "USUÁRIOS & LEADS" },
  { label: "ASSINATURAS & VENDAS" },
  { label: "CONTEÚDO & ENSINO" },
  { label: "COMUNICAÇÃO" },
  { label: "AUTOMAÇÃO & APIS" },
  { label: "SISTEMA" },
  { label: "MINHA CONTA" },
];

export function Sidebar() {
  return (
    <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col h-full">
      <div className="p-4 border-b border-slate-200 flex items-center gap-2">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
          E
        </div>
        <span className="font-semibold text-slate-900">EU NA PRÁTICA</span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-3 mb-2">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Buscar (Ctrl+K)" 
              className="w-full bg-slate-100 border-none rounded-md py-1.5 pl-8 pr-3 text-sm focus:ring-2 focus:ring-indigo-500"
            />
            <svg className="absolute left-2.5 top-2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
        </div>

        <nav className="space-y-0.5 px-2">
          {navItems.map((item, i) => (
            <a 
              key={i} 
              href="#" 
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                item.active 
                  ? "bg-indigo-50 text-indigo-600" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
              {item.active && <span className="ml-auto text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded">AI</span>}
            </a>
          ))}
        </nav>

        <div className="mt-8">
          <nav className="space-y-0.5 px-2">
            {secondaryItems.map((item, i) => (
              <a 
                key={i} 
                href="#" 
                className="flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 uppercase tracking-wider"
              >
                {item.label}
                <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </a>
            ))}
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium text-sm">
            DK
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">Daniel Kiel</p>
            <p className="text-xs text-slate-500 truncate">BÁSICO</p>
          </div>
          <button className="text-slate-400 hover:text-slate-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          </button>
        </div>
        <button className="w-full flex items-center justify-center gap-2 bg-white border border-indigo-600 text-indigo-600 py-2 rounded-md text-sm font-medium hover:bg-indigo-50 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
          UPGRADE PARA VIP
        </button>
      </div>
    </aside>
  );
}
