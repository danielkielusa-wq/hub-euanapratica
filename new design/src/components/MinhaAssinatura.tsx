import React from 'react';
import { 
  CheckCircle, 
  CreditCard, 
  Calendar, 
  Shield, 
  ExternalLink, 
  AlertCircle,
  Clock,
  Download,
  ChevronRight
} from 'lucide-react';

export default function MinhaAssinatura() {
  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Minha Assinatura</h1>
        <p className="text-gray-500">Gerencie seu plano, pagamentos e faturamento.</p>
      </div>

      {/* Plan Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">PLANO ATUAL</div>
            <h2 className="text-4xl font-bold text-gray-900 mb-1">Pro</h2>
            <div className="text-gray-500 font-medium">R$ 48/mês</div>
          </div>
          <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full border border-green-100">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-bold">Ativa</span>
          </div>
        </div>

        {/* Plan Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">CICLO</div>
            <div className="font-semibold text-gray-800">Mensal</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">PRÓX. COBRANÇA</div>
            <div className="font-semibold text-gray-800">01/04/2026</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">VÁLIDO ATÉ</div>
            <div className="font-semibold text-gray-800">01/04/2026</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col md:flex-row items-center gap-4 pt-6 border-t border-gray-100">
          <button className="flex items-center gap-2 px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors w-full md:w-auto justify-center">
            Mudar Plano
            <ExternalLink className="w-4 h-4" />
          </button>
          <button className="text-red-500 font-medium hover:text-red-600 hover:underline text-sm md:ml-auto">
            Cancelar Assinatura
          </button>
        </div>
      </div>

      {/* History Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 min-h-[300px] flex flex-col">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-5 h-5 text-gray-400" />
          <h3 className="font-bold text-gray-800">Histórico de Eventos</h3>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">Nenhum evento de assinatura registrado.</p>
          <p className="text-sm text-gray-400 mt-1">Suas faturas e mudanças de plano aparecerão aqui.</p>
        </div>
      </div>

      {/* Security Footer */}
      <div className="flex items-center justify-center gap-2 text-gray-400 text-xs py-4">
        <Shield className="w-4 h-4" />
        <span>Pagamentos processados com segurança pela Ticto. Seus dados financeiros não são armazenados em nossos servidores.</span>
      </div>
    </div>
  );
}
