import { Card, CardContent } from '@/components/ui/card';
import { FolderOpen, MessageCircle, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

const quickActions: QuickAction[] = [
  {
    title: 'Meus Conteúdos',
    description: 'Acesse materiais e recursos',
    icon: <FolderOpen className="w-6 h-6" />,
    href: '/dashboard/conteudo',
  },
  {
    title: 'Falar com Mentor',
    description: 'Tire suas dúvidas',
    icon: <MessageCircle className="w-6 h-6" />,
    href: '/dashboard/suporte',
  },
  {
    title: 'Agenda Completa',
    description: 'Veja todos os eventos',
    icon: <CalendarDays className="w-6 h-6" />,
    href: '/dashboard/agenda',
  },
];

export function QuickActions() {
  return (
    <div className="flex flex-col items-center gap-4 w-full sm:grid sm:grid-cols-3">
      {quickActions.map((action) => (
        <Link key={action.title} to={action.href} className="w-full max-w-[90%] sm:max-w-none mx-auto sm:mx-0">
          <Card 
            variant="glass" 
            className="hover:scale-[1.02] cursor-pointer h-full"
          >
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40">
                <div className="text-indigo-600 dark:text-indigo-400">
                  {action.icon}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-900 dark:text-slate-100">{action.title}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{action.description}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
