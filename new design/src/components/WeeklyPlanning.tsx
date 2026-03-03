import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Circle,
  Sun,
  Moon,
  ExternalLink,
  Filter,
  RotateCcw
} from 'lucide-react';

type Role = 'Fundador' | 'Assistente CRM' | 'Creator';
type Period = 'Manhã' | 'Final do dia';

interface Task {
  id: string;
  role: Role;
  period: Period;
  title: string;
  description: string;
  link?: string;
  completed: boolean;
}

interface DayColumn {
  date: string;
  dayName: string;
  tasks: Task[];
}

const MOCK_DATA: DayColumn[] = [
  {
    date: '23',
    dayName: 'SEG',
    tasks: [
      {
        id: '1',
        role: 'Fundador',
        period: 'Manhã',
        title: 'Revisão da semana anterior',
        description: 'Métricas de crescimento, novos usuários, MRR e conversões da última semana',
        link: 'Leads Dashboard',
        completed: false
      },
      {
        id: '2',
        role: 'Assistente CRM',
        period: 'Manhã',
        title: 'Leads novos + WhatsApp pendentes',
        description: 'Verificar novos leads e mensagens sem resposta desde sexta-feira',
        link: 'Ver leads',
        completed: false
      },
      {
        id: '3',
        role: 'Creator',
        period: 'Manhã',
        title: 'Planejar pauta da semana',
        description: 'Definir temas, formatos e datas de publicação para os próximos 5 dias',
        completed: false
      },
      {
        id: '4',
        role: 'Fundador',
        period: 'Final do dia',
        title: 'Definir 3 prioridades da semana',
        description: 'O que precisa fechar? O que está travado? O que vai mover o negócio?',
        completed: false
      },
      {
        id: '5',
        role: 'Assistente CRM',
        period: 'Final do dia',
        title: 'Configurar disparos programados',
        description: 'Agendar fluxos WhatsApp e campanhas para os próximos dias',
        link: 'Fluxos WA',
        completed: false
      },
      {
        id: '6',
        role: 'Creator',
        period: 'Final do dia',
        title: 'Agendar posts e conteúdos',
        description: 'Subir conteúdos criados para as ferramentas de agendamento',
        completed: false
      }
    ]
  },
  {
    date: '24',
    dayName: 'TER',
    tasks: [
      {
        id: '7',
        role: 'Assistente CRM',
        period: 'Manhã',
        title: 'Follow-up leads quentes',
        description: 'Quem não respondeu ontem? Retomar contato com os mais quentes',
        link: 'Dashboard',
        completed: false
      },
      {
        id: '8',
        role: 'Fundador',
        period: 'Manhã',
        title: 'Saúde do sistema + custos de API',
        description: 'Verificar alertas, erros e gastos com IA da semana',
        link: 'Saúde',
        completed: false
      },
      {
        id: '9',
        role: 'Creator',
        period: 'Manhã',
        title: 'Analisar engajamento recente',
        description: 'O que teve mais alcance e respostas? Identificar padrões no conteúdo',
        completed: false
      },
      {
        id: '10',
        role: 'Assistente CRM',
        period: 'Final do dia',
        title: 'Atualizar pipeline de leads',
        description: 'Registrar interações, mudar fases e anotar objeções dos leads ativos',
        completed: false
      },
      {
        id: '11',
        role: 'Creator',
        period: 'Final do dia',
        title: 'Criar rascunho de conteúdo',
        description: 'Escrever ou gravar os primeiros conteúdos da pauta da semana',
        completed: false
      }
    ]
  },
  {
    date: '25',
    dayName: 'QUA',
    tasks: [
      {
        id: '12',
        role: 'Fundador',
        period: 'Manhã',
        title: 'Assinaturas: novos e cancelamentos',
        description: 'Verificar churn, novos assinantes e inadimplências pendentes',
        link: 'Assinaturas',
        completed: false
      },
      {
        id: '13',
        role: 'Assistente CRM',
        period: 'Manhã',
        title: 'Agendamentos e sessões do dia',
        description: 'Confirmar sessões agendadas, verificar no-shows e pendências',
        link: 'Agendamentos',
        completed: false
      },
      {
        id: '14',
        role: 'Creator',
        period: 'Manhã',
        title: 'Publicar conteúdo de meio de semana',
        description: 'Quarta é pico de engajamento — aproveitar para conteúdo estratégico',
        completed: false
      },
      {
        id: '15',
        role: 'Fundador',
        period: 'Final do dia',
        title: 'Análise de custos da semana',
        description: 'Revisar gastos com APIs, tendência de uso e oportunidades de otimização',
        link: 'Custos API',
        completed: false
      },
      {
        id: '16',
        role: 'Assistente CRM',
        period: 'Final do dia',
        title: 'Contato ativo: leads em decisão',
        description: 'Leads na fase final — enviar proposta, tirar dúvidas ou dar nudge',
        completed: false
      }
    ]
  },
  {
    date: '26',
    dayName: 'QUI',
    tasks: [
      {
        id: '17',
        role: 'Assistente CRM',
        period: 'Manhã',
        title: 'Lote WA: leads inativos',
        description: 'Enviar fluxo de reativação para leads sem resposta há 7+ dias',
        link: 'Envio em Lote',
        completed: false
      },
      {
        id: '18',
        role: 'Creator',
        period: 'Manhã',
        title: 'Produzir ou gravar conteúdo',
        description: 'Quinta é o melhor dia para gravações — produzir o próximo ciclo',
        completed: false
      },
      {
        id: '19',
        role: 'Fundador',
        period: 'Manhã',
        title: 'Revisar automações N8N',
        description: 'Verificar logs de automações, erros e oportunidades de novos fluxos',
        link: 'Automações',
        completed: false
      },
      {
        id: '20',
        role: 'Assistente CRM',
        period: 'Final do dia',
        title: 'Follow-up de agendamentos',
        description: 'Acompanhar sessões da semana e garantir próximos passos para cada cliente',
        completed: false
      },
      {
        id: '21',
        role: 'Creator',
        period: 'Final do dia',
        title: 'Editar e preparar conteúdo',
        description: 'Editar o gravado e preparar publicações para sexta e semana seguinte',
        completed: false
      }
    ]
  },
  {
    date: '27',
    dayName: 'SEX',
    tasks: [
      {
        id: '22',
        role: 'Fundador',
        period: 'Manhã',
        title: 'Retrospectiva da semana',
        description: 'O que funcionou? O que travou? O que repetir ou abandonar?',
        completed: false
      },
      {
        id: '23',
        role: 'Assistente CRM',
        period: 'Manhã',
        title: 'Fechar ciclo de leads',
        description: 'Atualizar status final de todos os leads trabalhados na semana',
        completed: false
      },
      {
        id: '24',
        role: 'Creator',
        period: 'Manhã',
        title: 'Publicar conteúdo de fechamento',
        description: 'Sexta traz boa tração para bastidores, resultados e depoimentos',
        completed: false
      },
      {
        id: '25',
        role: 'Fundador',
        period: 'Final do dia',
        title: 'Inteligência Semanal',
        description: 'Gerar relatório de IA com insights consolidados de leads e atividades',
        link: 'Ver relatório',
        completed: false
      },
      {
        id: '26',
        role: 'Assistente CRM',
        period: 'Final do dia',
        title: 'Relatório de atividades CRM',
        description: 'Registrar métricas: leads contatados, conversões, agendamentos',
        link: 'Atividades',
        completed: false
      },
      {
        id: '27',
        role: 'Creator',
        period: 'Final do dia',
        title: 'Análise de métricas de conteúdo',
        description: 'Quais posts performaram melhor? O que o público mais respondeu?',
        completed: false
      }
    ]
  }
];

export default function WeeklyPlanning() {
  const [selectedRole, setSelectedRole] = useState<Role | 'Todos'>('Todos');
  const [tasks, setTasks] = useState(MOCK_DATA);

  const toggleTask = (dayIndex: number, taskId: string) => {
    const newTasks = [...tasks];
    const task = newTasks[dayIndex].tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      setTasks(newTasks);
    }
  };

  const getRoleColor = (role: Role) => {
    switch (role) {
      case 'Fundador': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'Assistente CRM': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'Creator': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRoleBadgeColor = (role: Role) => {
    switch (role) {
      case 'Fundador': return 'text-amber-700 bg-amber-100';
      case 'Assistente CRM': return 'text-emerald-700 bg-emerald-100';
      case 'Creator': return 'text-orange-700 bg-orange-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const totalTasks = tasks.reduce((acc, day) => acc + day.tasks.length, 0);
  const completedTasks = tasks.reduce((acc, day) => acc + day.tasks.filter(t => t.completed).length, 0);
  const progress = Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="p-8 max-w-[1800px] mx-auto space-y-8 font-sans h-full flex flex-col">
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Planejamento</div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2 font-serif">
            Agenda Semanal
          </h1>
          <p className="text-gray-500 text-lg">
            Rituais diários para cada papel do negócio
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 w-full xl:w-auto">
          {/* Progress Widget */}
          <div className="bg-gray-900 text-white p-4 rounded-xl w-full sm:w-64 shadow-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Progresso da semana</span>
              <span className="text-xl font-bold text-emerald-400">{progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5 mb-2">
              <div 
                className="bg-emerald-400 h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-[10px] text-gray-400 text-right">
              {completedTasks} de {totalTasks} tarefas concluídas
            </div>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-2 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 p-1">
          <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
            <CalendarIcon className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">23 - 27 de fev. 2026</span>
            <span className="text-[10px] font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full uppercase tracking-wide ml-2">
              Esta Semana
            </span>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors ml-2">
            <RotateCcw className="w-3 h-3" />
            Resetar semana
          </button>
        </div>

        <div className="flex gap-1 p-1 overflow-x-auto w-full md:w-auto">
          {(['Todos', 'Fundador', 'Assistente CRM', 'Creator'] as const).map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                ${selectedRole === role 
                  ? 'bg-gray-900 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'}
              `}
            >
              {role === 'Todos' ? 'Todos os papéis' : role}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 flex-1 overflow-x-auto pb-4">
        {tasks.map((day, dayIndex) => (
          <div key={day.date} className="flex flex-col min-w-[280px]">
            {/* Column Header */}
            <div className="flex items-baseline justify-between mb-4 px-2 border-b border-gray-200 pb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{day.dayName}</span>
              <span className="text-3xl font-serif font-medium text-gray-900 opacity-20">{day.date}</span>
            </div>

            <div className="space-y-6">
              {/* Morning Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-2">
                  <Sun className="w-3 h-3 text-amber-500" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Manhã</span>
                </div>
                
                {day.tasks
                  .filter(t => t.period === 'Manhã' && (selectedRole === 'Todos' || t.role === selectedRole))
                  .map(task => (
                    <div 
                      key={task.id}
                      className={`
                        group relative p-4 rounded-xl border transition-all duration-200 hover:shadow-md
                        ${task.completed ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-gray-200'}
                      `}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${getRoleBadgeColor(task.role)}`}>
                          {task.role}
                        </span>
                        <button 
                          onClick={() => toggleTask(dayIndex, task.id)}
                          className={`
                            transition-colors duration-200
                            ${task.completed ? 'text-emerald-500' : 'text-gray-300 hover:text-gray-400'}
                          `}
                        >
                          {task.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                        </button>
                      </div>
                      
                      <h3 className={`text-sm font-bold mb-1.5 leading-tight ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                        {task.title}
                      </h3>
                      
                      <p className={`text-xs leading-relaxed mb-3 ${task.completed ? 'text-gray-400' : 'text-gray-500'}`}>
                        {task.description}
                      </p>

                      {task.link && (
                        <a href="#" className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-wide">
                          {task.link}
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  ))}
              </div>

              {/* End of Day Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-2 pt-2">
                  <Moon className="w-3 h-3 text-indigo-400" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Final do dia</span>
                </div>

                {day.tasks
                  .filter(t => t.period === 'Final do dia' && (selectedRole === 'Todos' || t.role === selectedRole))
                  .map(task => (
                    <div 
                      key={task.id}
                      className={`
                        group relative p-4 rounded-xl border transition-all duration-200 hover:shadow-md
                        ${task.completed ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-gray-200'}
                      `}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${getRoleBadgeColor(task.role)}`}>
                          {task.role}
                        </span>
                        <button 
                          onClick={() => toggleTask(dayIndex, task.id)}
                          className={`
                            transition-colors duration-200
                            ${task.completed ? 'text-emerald-500' : 'text-gray-300 hover:text-gray-400'}
                          `}
                        >
                          {task.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                        </button>
                      </div>
                      
                      <h3 className={`text-sm font-bold mb-1.5 leading-tight ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                        {task.title}
                      </h3>
                      
                      <p className={`text-xs leading-relaxed mb-3 ${task.completed ? 'text-gray-400' : 'text-gray-500'}`}>
                        {task.description}
                      </p>

                      {task.link && (
                        <a href="#" className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-wide">
                          {task.link}
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
