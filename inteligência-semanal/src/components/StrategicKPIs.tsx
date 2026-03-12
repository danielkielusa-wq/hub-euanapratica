import { Card, CardContent } from "./ui/Card";
import { DollarSign, Target, Percent, TrendingDown } from "lucide-react";

export function StrategicKPIs() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="border-l-4 border-l-emerald-500">
        <CardContent className="p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Pipeline Potencial (Hot)</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">R$ 45.000</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-emerald-600 font-medium flex items-center">
              6 leads
            </span>
            <span className="text-slate-500 ml-2">prontos para fechamento</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-rose-500">
        <CardContent className="p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Conversão (Lead → Agenda)</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">0.0%</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-rose-600 font-medium flex items-center">
              <TrendingDown className="w-4 h-4 mr-1" />
              -12%
            </span>
            <span className="text-slate-500 ml-2">vs semana anterior</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-indigo-500">
        <CardContent className="p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">MRR Ativo</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">R$ 12.400</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-slate-600 font-medium flex items-center">
              3 Assinaturas
            </span>
            <span className="text-slate-500 ml-2">(2 VIP, 1 Pro)</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-amber-500">
        <CardContent className="p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Custo por Lead (CPL)</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">R$ 42,50</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-amber-600 font-medium flex items-center">
              <TrendingDown className="w-4 h-4 mr-1" />
              +15%
            </span>
            <span className="text-slate-500 ml-2">Custo subiu esta semana</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
