import { Card, CardContent } from "./ui/Card";
import { Clock, Calendar, Zap, DollarSign } from "lucide-react";

export function InfoBar() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="bg-white border-none shadow-none">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Último Relatório</p>
            <p className="text-sm font-semibold text-slate-900">12 mar 2026 às 08:43</p>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-white border-none shadow-none">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Próximo Agendado</p>
            <p className="text-sm font-semibold text-slate-900">Seg 06:00 BRT</p>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-white border-none shadow-none">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Método</p>
            <p className="text-sm font-semibold text-slate-900">Manual</p>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-white border-none shadow-none">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Duração / Custo</p>
            <p className="text-sm font-semibold text-slate-900">29.8s</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
