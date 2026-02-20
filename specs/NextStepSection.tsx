
import React from 'react';

const NextStepSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl transition-all duration-300">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-600/20 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-indigo-600/20 rounded-full blur-[80px]"></div>

      <div className="relative z-10 p-8 md:p-12 flex flex-col items-center text-center space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full text-blue-400 text-sm font-semibold uppercase tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span>Ação Recomendada</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            O próximo passo é seu, <span className="text-blue-400">José.</span>
          </h2>
          
          <p className="max-w-2xl mx-auto text-slate-300 text-lg leading-relaxed">
            Com base no seu diagnóstico, recomendo a <span className="text-white font-medium">Sessão de Direção ROTA EUA</span>. 
            É o momento de transformar sua análise em estratégia pura para conquistar seu emprego remoto em dólar.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl w-full max-w-xl backdrop-blur-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-left flex-1">
              <h4 className="text-blue-400 font-semibold text-sm uppercase mb-1">Especialmente para você:</h4>
              <p className="text-lg font-bold">Sessão de Direção ROTA EUA</p>
              <div className="flex items-center text-slate-400 text-sm mt-1">
                <i className="fa-regular fa-clock mr-2"></i>
                <span>45 minutos de consultoria estratégica</span>
              </div>
            </div>
            
            <div className="flex-shrink-0">
              <div className="text-3xl font-black text-white">
                100% <span className="text-blue-400 font-medium text-sm">GRATUITO</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col items-center space-y-4">
          <button className="group relative w-full md:w-auto px-10 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-[0_0_30px_-5px_rgba(37,99,235,0.4)] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-3">
            <span>Conhecer Sessão de Direção ROTA EUA</span>
            <i className="fa-solid fa-arrow-right transition-transform group-hover:translate-x-1"></i>
          </button>
          
          <p className="text-slate-500 text-sm font-medium">
            Acesse agora: <a href="#" className="text-slate-400 hover:text-white transition-colors underline decoration-slate-600 underline-offset-4">euanapratica.com/hub</a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default NextStepSection;
