import { Bell, Search, Settings, Moon, Globe, Clock, RefreshCw } from "lucide-react";

export function Header() {
  return (
    <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
        </div>
        <div>
          <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">Inteligência Semanal</h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">Relatório de inteligência de vendas com análise por IA</p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3 overflow-x-auto pb-1 sm:pb-0">
        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors shrink-0">
          <RefreshCw className="w-5 h-5" />
        </button>
        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
          <Settings className="w-5 h-5" />
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
          <Clock className="w-4 h-4" />
          Histórico
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          Gerar Agora
        </button>
      </div>
    </header>
  );
}
