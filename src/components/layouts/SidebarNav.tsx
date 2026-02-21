import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentEspacosWithStats } from '@/hooks/useStudentEspacosWithStats';
import {
  Compass,
  Users,
  Calendar,
  CalendarCheck,
  Search,
  LayoutGrid,
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  FileSearch,
  User,
  ShoppingBag,
  LifeBuoy,
  Settings,
  UserCog,
  CreditCard,
  BarChart3,
  MessageSquare,
  Package,
  FileText,
  TestTube,
  Upload,
  Briefcase,
  Link2,
  Globe,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useServiceAccess } from '@/hooks/useServiceAccess';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { UpgradeModal } from '@/components/curriculo/UpgradeModal';

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

// Student Navigation
const studentNavGroups: NavGroup[] = [
  {
    label: 'DISCOVERY',
    items: [
      { label: 'Meu Hub', href: '/dashboard/hub', icon: Compass },
      { label: 'Comunidade', href: '/comunidade', icon: Users, badge: { text: 'HOT', variant: 'hot' } },
      // { label: 'Agenda', href: '/dashboard/agenda', icon: Calendar },
      // { label: 'Agendamentos', href: '/dashboard/agendamentos', icon: CalendarCheck },
      { label: 'Explore', href: '/catalogo', icon: Search, badge: { text: 'NOVO', variant: 'new' } },
      { label: 'Minha Jornada', href: '/dashboard/espacos', icon: LayoutGrid },
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
      {
        label: 'Title Translator',
        href: '/title-translator',
        icon: Globe,
        badge: { text: 'IA', variant: 'ai' },
        isSpecial: true
      },
      {
        label: 'Prime Jobs',
        href: '/prime-jobs',
        icon: Briefcase,
        badge: { text: 'NOVO', variant: 'new' }
      },
    ],
  },
  {
    label: 'MINHA CONTA',
    items: [
      { label: 'Planos', href: '/pricing', icon: CreditCard },
      { label: 'Assinatura', href: '/dashboard/assinatura', icon: CreditCard },
      { label: 'Perfil', href: '/perfil', icon: User },
      { label: 'Meus Pedidos', href: '/meus-pedidos', icon: ShoppingBag },
      { label: 'Suporte', href: '/dashboard/suporte', icon: LifeBuoy },
    ],
  },
];

// Mentor Navigation
const mentorNavGroups: NavGroup[] = [
  {
    label: 'GESTÃO',
    items: [
      { label: 'Dashboard', href: '/mentor/dashboard', icon: LayoutDashboard },
      { label: 'Meus Espaços', href: '/mentor/espacos', icon: LayoutGrid },
      { label: 'Agenda', href: '/mentor/agenda', icon: Calendar },
      { label: 'Tarefas', href: '/mentor/tarefas', icon: ClipboardList },
    ],
  },
  {
    label: 'CONTEÚDO',
    items: [
      { label: 'Biblioteca', href: '/biblioteca', icon: BookOpen },
      { label: 'Upload Materiais', href: '/admin/biblioteca/upload', icon: Upload },
    ],
  },
  {
    label: 'MINHA CONTA',
    items: [
      { label: 'Perfil', href: '/perfil', icon: User },
      { label: 'Suporte', href: '/dashboard/suporte', icon: LifeBuoy },
    ],
  },
];

// Admin Navigation
const adminNavGroups: NavGroup[] = [
  {
    label: 'VISÃO GERAL',
    items: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Relatórios', href: '/admin/relatorios', icon: BarChart3 },
    ],
  },
  {
    label: 'RELATÓRIOS',
    items: [
      { label: 'Auditoria do Sistema', href: '/admin/auditoria', icon: BarChart3 },
    ],
  },
  {
    label: 'GESTÃO DE USUÁRIOS',
    items: [
      { label: 'Usuários', href: '/admin/usuarios', icon: Users },
      { label: 'Matrículas', href: '/admin/matriculas', icon: UserCog },
      { label: 'Assinaturas', href: '/admin/assinaturas', icon: CreditCard },
      { label: 'Saúde Assinaturas', href: '/admin/subscription-health', icon: Activity },
      { label: 'Leads', href: '/admin/leads', icon: FileText },
    ],
  },
  {
    label: 'GESTÃO DE CONTEÚDO',
    items: [
      { label: 'Espaços', href: '/admin/espacos', icon: LayoutGrid },
      { label: 'Produtos', href: '/admin/produtos', icon: Package },
      { label: 'Planos', href: '/admin/planos', icon: CreditCard },
      { label: 'Pedidos', href: '/admin/pedidos', icon: ShoppingBag },
    ],
  },
  {
    label: 'BIBLIOTECA',
    items: [
      { label: 'Biblioteca', href: '/biblioteca', icon: BookOpen },
      { label: 'Upload Materiais', href: '/admin/biblioteca/upload', icon: Upload },
    ],
  },
  {
    label: 'CONFIGURAÇÕES',
    items: [
      { label: 'Configurações', href: '/admin/configuracoes', icon: Settings },
      { label: 'APIs Externas', href: '/admin/configuracoes-apis', icon: Link2 },
      { label: 'Feedback', href: '/admin/feedback', icon: MessageSquare },
      { label: 'Testes E2E', href: '/admin/testes-e2e', icon: TestTube },
      { label: 'Ticto Simulator', href: '/admin/ticto-simulator', icon: TestTube },
    ],
  },
  {
    label: 'MINHA CONTA',
    items: [
      { label: 'Perfil', href: '/perfil', icon: User },
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
  const { user } = useAuth();
  const { data: studentEspacos, isLoading: studentEspacosLoading } = useStudentEspacosWithStats();
  const { hasAccess: canAccessCommunity, isLoading: communityAccessLoading } = useServiceAccess('/comunidade');
  const { planId } = usePlanAccess();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Select navigation based on user role
  const getNavGroups = (): NavGroup[] => {
    switch (user?.role) {
      case 'admin':
        return adminNavGroups;
      case 'mentor':
        return mentorNavGroups;
      default:
        if (!studentEspacosLoading && (studentEspacos?.length || 0) === 0) {
          return studentNavGroups.filter(group => group.label !== 'MENTORIA');
        }
        return studentNavGroups;
    }
  };

  const navGroups = getNavGroups();

  const isActive = (href: string) => {
    // Exact match for dashboard routes
    if (href === '/dashboard' || href === '/mentor/dashboard' || href === '/admin/dashboard') {
      return location.pathname === href;
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

              const isCommunityRoute = item.href === '/comunidade';
              const blockCommunityAccess = isCommunityRoute && !communityAccessLoading && !canAccessCommunity;

              const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
                if (isCommunityRoute && (communityAccessLoading || blockCommunityAccess)) {
                  event.preventDefault();
                  if (!communityAccessLoading) {
                    setShowUpgradeModal(true);
                  }
                  return;
                }
                onNavigate?.();
              };

              return (
                <li key={item.href + item.label}>
                  <Link
                    to={item.href}
                    onClick={handleClick}
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

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        currentPlanId={planId}
        reason="upgrade"
      />
    </nav>
  );
}


