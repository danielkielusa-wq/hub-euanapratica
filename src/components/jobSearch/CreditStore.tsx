
import React from 'react';
// Added ShieldCheck to imports
import { X, CreditCard, Check, Zap, Sparkles, TrendingUp, ArrowRight, ShieldCheck } from 'lucide-react';

interface CreditStoreProps {
  onClose: () => void;
}

const PACKAGES = [
  { id: '1', name: 'Starter', qty: 5, price: 'R$ 47', sub: 'R$ 9,40 por aplicação', popular: false },
  { id: '2', name: 'Performance', qty: 15, price: 'R$ 97', sub: 'R$ 6,46 por aplicação', popular: true },
  { id: '3', name: 'Career Rush', qty: 40, price: 'R$ 197', sub: 'R$ 4,92 por aplicação', popular: false },
];

const CreditStore: React.FC<CreditStoreProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-md transition-opacity" onClick={onClose} />
      
      <div className="relative bg-[#F9FAFB] w-full max-w-4xl rounded-[48px] shadow-2xl overflow-hidden animate-fade-in-up">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-600 opacity-5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        
        <div className="p-10 md:p-14 relative z-10">
            <div className="flex justify-between items-start mb-12">
                <div>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tight">Store de Créditos</h2>
                    <p className="text-gray-500 mt-2 font-medium">Aumente seu poder de fogo e aplique para mais vagas.</p>
                </div>
                <button onClick={onClose} className="p-3 hover:bg-gray-200 rounded-full text-gray-400 transition-all">
                    <X size={24} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {PACKAGES.map((pkg) => (
                    <div key={pkg.id} className={`
                        relative bg-white rounded-[40px] p-8 border-2 transition-all group hover:scale-[1.02]
                        ${pkg.popular ? 'border-brand-600 shadow-2xl shadow-brand-500/10' : 'border-gray-100 shadow-sm'}
                    `}>
                        {pkg.popular && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 bg-brand-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                                MAIS VENDIDO
                            </div>
                        )}
                        
                        <div className="text-center space-y-1 mb-8">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{pkg.name}</p>
                            <div className="flex items-baseline justify-center gap-1">
                                <span className="text-5xl font-black text-gray-900">{pkg.qty}</span>
                                <span className="text-sm font-bold text-gray-400">APLICAÇÕES</span>
                            </div>
                        </div>

                        <div className="space-y-4 mb-10 border-t border-b border-gray-50 py-6">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                                <Check size={14} className="text-brand-600" />
                                ResumePass™ Incluído
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                                <Check size={14} className="text-brand-600" />
                                Sugestão de Cover Letter IA
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                                <Check size={14} className="text-brand-600" />
                                Tracking em tempo real
                            </div>
                        </div>

                        <div className="text-center mb-8">
                            <p className="text-2xl font-black text-gray-900">{pkg.price}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">{pkg.sub}</p>
                        </div>

                        <button className={`
                            w-full py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest
                            ${pkg.popular 
                                ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-600/20' 
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}
                        `}>
                            COMPRAR AGORA <ArrowRight size={14} />
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-12 text-center">
                <div className="inline-flex items-center gap-6 px-8 py-4 bg-gray-50 rounded-full border border-gray-100">
                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <ShieldCheck size={14} className="text-emerald-500" /> Checkout Seguro
                    </div>
                    <div className="w-px h-4 bg-gray-200" />
                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <Zap size={14} className="text-amber-500" /> Ativação Imediata
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CreditStore;
