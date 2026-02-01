import {
  CheckCircle2,
  Calendar,
  ArrowRight,
  Mail,
  Sparkles,
  ArrowLeft,
  Gift,
  ShieldCheck,
  Linkedin,
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const ThankYouCurriculo = () => {
  const navigate = useNavigate();

  const handleScheduleClick = () => {
    window.open("https://tidycal.com/euanapratica/curriculo", "_blank");
  };

  return (
    <div className="animate-fade-in-up min-h-screen pb-20 max-w-5xl mx-auto px-4 sm:px-6 bg-background">
      {/* Top Navigation */}
      <div className="pt-8 pb-12">
        <button
          onClick={() => navigate("/dashboard/hub")}
          className="group flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold text-sm transition-all"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Voltar ao Hub
        </button>
      </div>

      {/* Main Success Card */}
      <div className="bg-card rounded-[48px] shadow-2xl shadow-primary/5 border border-border overflow-hidden relative">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 opacity-60"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 opacity-40"></div>

        <div className="relative z-10 px-8 py-16 md:p-20 text-center">
          {/* Animated Success Icon */}
          <div
            className="w-24 h-24 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500 rounded-[32px] flex items-center justify-center mx-auto mb-10 shadow-lg shadow-emerald-500/10 animate-bounce"
            style={{ animationDuration: "3s" }}
          >
            <CheckCircle2 size={48} strokeWidth={3} />
          </div>

          <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6">
            <Sparkles size={14} className="animate-pulse" /> Confirmado
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-foreground mb-6 tracking-tight leading-[1.1]">
            Currículo & LinkedIn <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600">
              Magnéticos Garantidos! 🇺🇸
            </span>
          </h1>

          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-12">
            Prepare-se para transformar seu posicionamento. Vamos ajustar cada detalhe para que você seja visto como o profissional de elite que o mercado americano busca.
          </p>

          {/* Product Summary Box */}
          <div className="max-w-xl mx-auto bg-muted/50 border border-border rounded-3xl p-8 mb-12 text-left">
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 bg-card rounded-2xl flex items-center justify-center text-primary shadow-sm border border-border flex-shrink-0">
                <Linkedin size={28} />
              </div>
              <div>
                <h3 className="font-black text-foreground text-lg">Consultoria – Currículo e LinkedIn Magnético</h3>
                <p className="text-sm text-muted-foreground">Sessão prática de 60 minutos individuais</p>
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs mt-2 uppercase tracking-widest">
                  <ShieldCheck size={14} /> Reserva Confirmada
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={handleScheduleClick}
              size="lg"
              className="w-full sm:w-auto px-10 py-6 bg-foreground hover:bg-foreground/90 text-background font-black rounded-[24px] shadow-2xl shadow-foreground/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-3 text-lg h-auto"
            >
              Agendar minha Sessão <ArrowRight size={20} />
            </Button>
            <a
              href="mailto:contato@euanapratica.com"
              className="w-full sm:w-auto px-10 py-5 bg-card hover:bg-muted text-foreground border border-border font-bold rounded-[24px] transition-all flex items-center justify-center gap-3 text-lg"
            >
              <Mail size={20} className="text-primary" /> Email Suporte
            </a>
          </div>
        </div>
      </div>

      {/* Credit Incentive Card */}
      <div className="mt-8 bg-[#1e3a8a] rounded-[40px] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-[#1e3a8a]/20 group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary opacity-20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:opacity-30 transition-opacity"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[28px] flex items-center justify-center flex-shrink-0 animate-pulse">
            <Gift size={36} className="text-blue-300" />
          </div>
          <div className="text-center md:text-left flex-1">
            <h2 className="text-2xl font-black mb-2">Upgrade Inteligente</h2>
            <p className="text-blue-100 leading-relaxed font-medium">
              100% do valor desta sessão será convertido em crédito caso você entre na Mentoria em Grupo ou na Mentoria Individual em até 7 dias. Entre em contato através de{" "}
              <span className="text-white font-bold underline">contato@euanapratica.com</span>.
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className="bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-300">Válido por</p>
              <p className="text-2xl font-black">7 Dias</p>
            </div>
          </div>
        </div>
      </div>

      {/* What to expect next */}
      <div className="mt-20">
        <h3 className="text-2xl font-black text-foreground mb-10 text-center">O que acontece agora?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Agendamento */}
          <div className="bg-card p-10 rounded-[40px] border border-border shadow-sm text-center flex flex-col items-center hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-muted text-primary rounded-3xl flex items-center justify-center mb-6">
              <Calendar size={32} />
            </div>
            <h4 className="font-bold text-foreground text-lg mb-3">Agendamento</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Você precisa clicar no link de agendamento acima para escolher o melhor horário na agenda do Daniel. Escolha um slot que lhe permita preparar o material.
            </p>
          </div>

          {/* Preparação */}
          <div className="bg-card p-10 rounded-[40px] border border-border shadow-sm text-center flex flex-col items-center hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-muted text-primary rounded-3xl flex items-center justify-center mb-6">
              <FileText size={32} />
            </div>
            <h4 className="font-bold text-foreground text-lg mb-3">Preparação</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Envie seu currículo atual e o link do seu LinkedIn para{" "}
              <span className="text-foreground font-bold">daniel@euanapratica.com</span> com no máximo{" "}
              <span className="text-primary font-bold">5 dias de antecedência</span> da sessão para torná-la mais produtiva.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThankYouCurriculo;
