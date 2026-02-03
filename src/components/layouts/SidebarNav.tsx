import { Link, useLocation } from 'react-router-dom';
import { 
  Compass, 
  Users, 
  Calendar, 
  Search, 
  LayoutGrid,
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  FileSearch,
  User,
  ShoppingBag,
  LifeBuoy
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: {
    text: string;
    variant: 'hot' | 'new' | 'ai';
  };
  isSpecial?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'DISCOVERY',
    items: [
      { label: 'Início', href: '/dashboard/hub', icon: Compass },
      { label: 'Comunidade', href: '/comunidade', icon: Users, badge: { text: 'HOT', variant: 'hot' } },
      { label: 'Agenda', href: '/dashboard/agenda', icon: Calendar },
      { label: 'Catálogo', href: '/dashboard/hub', icon: Search, badge: { text: 'NOVO', variant: 'new' } },
      { label: 'Meus Espaços', href: '/dashboard/espacos', icon: LayoutGrid },
    ],
  },
  {
    label: 'MENTORIA',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Biblioteca', href: '/biblioteca', icon: BookOpen },
      { label: 'Tarefas', href: '/dashboard/tarefas', icon: ClipboardList },
    ],
  },
  {
    label: 'TOOLS & AI',
    items: [
      { 
        label: 'ResumePass AI', 
        href: '/curriculo', 
        icon: FileSearch, 
        badge: { text: 'IA', variant: 'ai' },
        isSpecial: true 
      },
    ],
  },
  {
    label: 'MINHA CONTA',
    items: [
      { label: 'Perfil', href: '/perfil', icon: User },
      { label: 'Meus Pedidos', href: '/meus-pedidos', icon: ShoppingBag },
      { label: 'Suporte', href: '/dashboard/suporte', icon: LifeBuoy },
    ],
  },
];

const badgeClasses = {
  hot: 'bg-amber-100 text-amber-700',
  new: 'bg-blue-100 text-blue-600',
  ai: 'bg-indigo-100 text-indigo-600',
};

interface SidebarNavProps {
  onNavigate?: () => void;
}

export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const location = useLocation();

  const isActive = (href: string) => {
    // Exact match for dashboard
    if (href === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    // For other routes, check if current path starts with href
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <nav className="flex-1 px-3 py-2 overflow-y-auto scrollbar-hide">
      {navGroups.map((group, groupIdx) => (
        <div key={group.label} className={cn(groupIdx > 0 && "mt-6")}>
          {/* Group Label */}
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            {group.label}
          </p>
          
          {/* Group Items */}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              
              return (
                <li key={item.href + item.label}>
                  <Link
                    to={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                      item.isSpecial
                        ? active
                          ? "bg-indigo-50 text-indigo-600"
                          : "text-indigo-600 hover:bg-indigo-50/50"
                        : active
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <Icon className={cn(
                      "w-5 h-5 flex-shrink-0",
                      item.isSpecial && !active && "text-indigo-500"
                    )} />
                    <span className="flex-1">{item.label}</span>
                    
                    {/* Badge */}
                    {item.badge && (
                      <span className={cn(
                        "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full tracking-wide",
                        badgeClasses[item.badge.variant]
                      )}>
                        {item.badge.text}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
