import { Card, CardContent } from '@/components/ui/card';
import { FolderOpen, MessageCircle, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    title: 'Meus Conteúdos',
    description: 'Acesse materiais e recursos',
    icon: <FolderOpen className="w-6 h-6" />,
    href: '/dashboard/conteudo',
    color: 'bg-primary/10 text-primary',
  },
  {
    title: 'Falar com Mentor',
    description: 'Tire suas dúvidas',
    icon: <MessageCircle className="w-6 h-6" />,
    href: '/dashboard/suporte',
    color: 'bg-chart-2/10 text-chart-2',
  },
  {
    title: 'Agenda Completa',
    description: 'Veja todos os eventos',
    icon: <CalendarDays className="w-6 h-6" />,
    href: '/dashboard/agenda',
    color: 'bg-chart-4/10 text-chart-4',
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {quickActions.map((action) => (
        <Link key={action.title} to={action.href}>
          <Card className="hover:shadow-md transition-all hover:scale-[1.02] cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-3 rounded-lg ${action.color}`}>
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground">{action.title}</h4>
                <p className="text-sm text-muted-foreground truncate">{action.description}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
