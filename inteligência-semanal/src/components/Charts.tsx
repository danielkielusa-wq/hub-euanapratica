import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, PieChart as PieChartIcon, Share2 } from "lucide-react";

const pipelineData = [
  { name: 'Semana Passada', leads: 47 },
  { name: 'Esta Semana', leads: 35 },
];

const taskData = [
  { name: 'Vencidas', value: 17 },
  { name: 'Pendentes', value: 8 },
  { name: 'Concluídas', value: 24 },
];

const sourceData = [
  { name: 'Instagram Reels', value: 16 },
  { name: 'LinkedIn', value: 10 },
  { name: 'Orgânico', value: 6 },
  { name: 'Indicação', value: 3 },
];

const COLORS_TASKS = ['#ef4444', '#f59e0b', '#10b981'];
const COLORS_SOURCES = ['#ec4899', '#0ea5e9', '#8b5cf6', '#14b8a6'];

export function Charts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            <CardTitle className="text-lg">Pipeline de Leads</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pipelineData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="leads" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-indigo-500" />
            <CardTitle className="text-lg">Origem dos Leads</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6 h-64 flex items-center justify-center relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sourceData}
                cx="35%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
              >
                {sourceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS_SOURCES[index % COLORS_SOURCES.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-3 absolute right-4 w-32">
            {sourceData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS_SOURCES[index] }}></div>
                <span className="text-slate-600 truncate">{entry.name}</span>
                <span className="font-semibold text-slate-900 ml-auto">{entry.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-indigo-500" />
            <CardTitle className="text-lg">Status das Tarefas</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6 h-64 flex items-center justify-center relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={taskData}
                cx="35%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
              >
                {taskData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS_TASKS[index % COLORS_TASKS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-3 absolute right-4 w-28">
            {taskData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS_TASKS[index] }}></div>
                <span className="text-slate-600 truncate">{entry.name}</span>
                <span className="font-semibold text-slate-900 ml-auto">{entry.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
