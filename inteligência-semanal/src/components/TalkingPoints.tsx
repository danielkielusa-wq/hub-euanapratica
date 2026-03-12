import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { MessageSquare, Copy } from "lucide-react";

const talkingPoints = [
  {
    name: "Daniel Kiel",
    email: "daniel.kiel@sap.com",
    text: "Daniel, vi que você trabalha com SAP e tem perfil super relevante para mercado americano. Rápida pergunta: seu currículo e LinkedIn estão otimizados para como recrutadores gringos procuram SAP specialists? Porque a maioria dos profissionais que consultamos deixa grana na mesa nessa etapa.",
    avatar: "https://ui-avatars.com/api/?name=Daniel+Kiel&background=e0e7ff&color=4f46e5"
  },
  {
    name: "Daniel Perfil Mentoria",
    email: "daniel@perfilmentorado.com",
    text: "Daniel, trabalhos com SAP/ERP e vi seu interesse em carreira internacional. Conversei com outros profissionais da sua área — o maior bloqueio não é achar vaga, é ter o currículo e LinkedIn traduzido de forma que recrutadores americanos entendam seu impacto. Posso te mostrar como a gente resolve isso em 30 min?",
    avatar: "https://ui-avatars.com/api/?name=Daniel+Perfil&background=e0e7ff&color=4f46e5"
  },
  {
    name: "Fernanda Costa",
    email: "teste-vip@euanapratica.com",
    text: "Fernanda, seu perfil de gestão executiva é exatamente o que o mercado americano busca. Conversei com alguns gestores que fizeram transição — eles me disseram que entender timing e posicionamento certo vale mais que currículo perfeito. Podemos bater um papo sobre seu cenário?",
    avatar: "https://ui-avatars.com/api/?name=Fernanda+Costa&background=fce7f3&color=db2777"
  },
  {
    name: "Vitor Domingos",
    email: "vitorhugodomingos@gmail.com",
    text: "Vitor, vi seu interesse em trabalho remoto em dólar. Duas barreiras que você sinalizou: inglês e visto. Ótima notícia — a ordem certa de ataque muda tudo. Posso compartilhar como a gente estrutura isso para profissionais de tech?",
    avatar: "https://ui-avatars.com/api/?name=Vitor+Domingos&background=dcfce7&color=16a34a"
  },
  {
    name: "Marcus Vinicius Lopes da Silva",
    email: "marcus_engmec@outlook.com",
    text: "Marcus, você é engenheiro com interesse legítimo em carreira internacional. Financeiro e visto são reais, mas a estratégia certa não é resolver tudo antes — é começar com o que abre portas. Quer conversar sobre qual é seu próximo passo realista?",
    avatar: "https://ui-avatars.com/api/?name=Marcus+Vinicius&background=f1f5f9&color=475569"
  }
];

export function TalkingPoints() {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-500" />
          <CardTitle className="text-lg">Pontos de Conversa para Vendas</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {talkingPoints.map((point, i) => (
          <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors group relative">
            <div className="flex items-center gap-3 mb-3">
              <img src={point.avatar} alt={point.name} className="w-8 h-8 rounded-full shadow-sm" />
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">{point.name}</h4>
                <p className="text-xs text-slate-500">{point.email}</p>
              </div>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed pr-8">
              "{point.text}"
            </p>
            <button className="absolute top-4 right-4 p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
              <Copy className="w-4 h-4" />
            </button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
