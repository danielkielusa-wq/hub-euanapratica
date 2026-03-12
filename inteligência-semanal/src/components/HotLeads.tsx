import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Flame } from "lucide-react";

const leads = [
  {
    name: "Marcus Vinicius Lopes da Silva",
    email: "marcus_engmec@outlook.com",
    phone: "+5562999177703",
    temp: "quente",
    area: "Engenharia",
    lastContact: "Nunca",
    action: "Mentoria em Grupo ROTA ...",
    avatar: "https://ui-avatars.com/api/?name=Marcus+Vinicius&background=f1f5f9&color=475569"
  },
  {
    name: "Daniel Kiel",
    email: "daniel.kiel@sap.com",
    phone: "+14704469625",
    temp: "muito-quente",
    area: "SAP/ERP",
    lastContact: "03/03",
    action: "Reposicionar seu currícul...",
    avatar: "https://ui-avatars.com/api/?name=Daniel+Kiel&background=e0e7ff&color=4f46e5"
  },
  {
    name: "Daniel Perfil Mentoria",
    email: "daniel@perfilmentorado.com",
    phone: "+14704469625",
    temp: "muito-quente",
    area: "SAP/ERP",
    lastContact: "28/02",
    action: "Reposicionar seu currícul...",
    avatar: "https://ui-avatars.com/api/?name=Daniel+Perfil&background=e0e7ff&color=4f46e5"
  },
  {
    name: "Fernanda Costa",
    email: "teste-vip@euanapratica.com",
    phone: "+5511912345003",
    temp: "muito-quente",
    area: "Gestão e Neg...",
    lastContact: "Nunca",
    action: "Mentoria Executiva ENP ...",
    avatar: "https://ui-avatars.com/api/?name=Fernanda+Costa&background=fce7f3&color=db2777"
  },
  {
    name: "Vitor Domingos",
    email: "vitorhugodomingos@gmail.com",
    phone: "55(11) 95862-1649",
    temp: "quente",
    area: "Tecnologia",
    lastContact: "Nunca",
    action: "—",
    avatar: "https://ui-avatars.com/api/?name=Vitor+Domingos&background=dcfce7&color=16a34a"
  },
  {
    name: "Carlos Mendes",
    email: "teste-pro@euanapratica.com",
    phone: "+5511912345002",
    temp: "quente",
    area: "Tecnologia da...",
    lastContact: "Nunca",
    action: "Mentoria em Grupo ROTA ...",
    avatar: "https://ui-avatars.com/api/?name=Carlos+Mendes&background=fef3c7&color=d97706"
  }
];

export function HotLeads() {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-red-500" />
          <CardTitle className="text-lg">Leads Quentes sem Follow-up</CardTitle>
        </div>
        <Badge variant="critical" className="bg-red-50 text-red-600 border-red-100">6 leads</Badge>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Priorize contato IMEDIATO com Daniel Kiel (daniel.kiel@sap.com) — score 100, muito-quente em SAP/ERP, sem barreiras, horário ideal fins de semana via WhatsApp. 
          Segundo Daniel Perfil Mentoria (daniel@perfilmentorado.com), também muito-quente com score 100, barreira familiar mas mesmo perfil SAP. Ambos precisam de Mentoria Individual High Performance focada em reposicionamento de currículo/LinkedIn para padrão americano — isso é a chave para abrir todas as portas. 
          Terceiro: Fernanda Costa (teste-vip@euanapratica.com), score 98, Gestão Executiva VIP, nenhuma barreira — ideal para Mentoria Executiva ENP. Os demais (Marcus, Vitor, Carlos) têm barreiras significativas (visto/inglês/família) mas estão quentes — mapeie melhor produtos para cada perfil.
        </p>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-y border-slate-200">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Telefone</th>
                <th className="px-4 py-3 font-medium">Temp.</th>
                <th className="px-4 py-3 font-medium">Área</th>
                <th className="px-4 py-3 font-medium">Último Contato</th>
                <th className="px-4 py-3 font-medium">Ação Recomendada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map((lead, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-indigo-600 flex items-center gap-3">
                    <img src={lead.avatar} alt={lead.name} className="w-6 h-6 rounded-full" />
                    {lead.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{lead.email}</td>
                  <td className="px-4 py-3 text-slate-600">{lead.phone}</td>
                  <td className="px-4 py-3">
                    <Badge variant={lead.temp}>{lead.temp}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{lead.area}</td>
                  <td className="px-4 py-3">
                    <span className={lead.lastContact === "Nunca" ? "text-rose-500 font-medium" : "text-slate-600"}>
                      {lead.lastContact}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{lead.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
