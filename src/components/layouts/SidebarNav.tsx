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
  Activity,
  Mail,
  DollarSign,
  ListTodo,
  Lightbulb,
  PlayCircle,
  Zap,
  Menu,
  Video,
  Radio,
  Brain,
  Workflow,
  Library,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useServiceAccess } from '@/hooks/useServiceAccess';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { UpgradeModal } from '@/components/curriculo/UpgradeModal';
import { useMenuVisibility } from '@/hooks/useMenuVisibility';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  menuKey?: string;
  badge?: {
    text: string;
    variant: 'hot' | 'new' | 'ai';
  };
  isSpecial?: boolean;
  isExternal?: boolean;
  tourId?: string;
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
      { label: 'Meu Hub', href: '/dashboard/hub', icon: Compass, menuKey: 'hub', tourId: 'sidebar-meu-hub' },
      { label: 'Comunidade', href: '/comunidade', icon: Users, menuKey: 'comunidade', badge: { text: 'HOT', variant: 'hot' }, tourId: 'sidebar-comunidade' },
      { label: 'Agendamentos', href: '/dashboard/agendamentos', icon: CalendarCheck, menuKey: 'agendamentos' },
      { label: 'Explore', href: '/catalogo', icon: Search, menuKey: 'catalogo', badge: { text: 'NOVO', variant: 'new' }, tourId: 'sidebar-explore' },
      { label: 'Lives', href: '/lives', icon: Radio, menuKey: 'lives', badge: { text: 'NOVO', variant: 'new' } },
      { label: 'Meus Cursos', href: '/dashboard/cursos', icon: PlayCircle, menuKey: 'cursos', badge: { text: 'NOVO', variant: 'new' } },
      { label: 'Minha Jornada', href: '/dashboard/espacos', icon: LayoutGrid, menuKey: 'espacos' },
    ],
  },
  {
    label: 'MENTORIA',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, menuKey: 'dashboard' },
      { label: 'Biblioteca', href: '/biblioteca', icon: BookOpen, menuKey: 'biblioteca' },
      { label: 'Biblioteca Global', href: '/biblioteca-global', icon: Library, menuKey: 'biblioteca_global' },
      { label: 'Tarefas', href: '/dashboard/tarefas', icon: ClipboardList, menuKey: 'tarefas' },
    ],
  },
  {
    label: 'TOOLS & AI',
    items: [
      {
        label: 'ResumePass AI',
        href: '/curriculo',
        icon: FileSearch,
        menuKey: 'curriculo',
        badge: { text: 'IA', variant: 'ai' },
        isSpecial: true,
        tourId: 'sidebar-resumepass'
      },
      {
        label: 'Title Translator',
        href: '/title-translator',
        icon: Globe,
        menuKey: 'title_translator',
        badge: { text: 'IA', variant: 'ai' },
        isSpecial: true,
        tourId: 'sidebar-title-translator'
      },
      {
        label: 'Prime Jobs',
        href: '/prime-jobs',
        icon: Briefcase,
        menuKey: 'prime_jobs',
        badge: { text: 'NOVO', variant: 'new' }
      },
    ],
  },
  {
    label: 'MINHA CONTA',
    items: [
      { label: 'Planos', href: '/pricing', icon: CreditCard, menuKey: 'pricing' },
      { label: 'Assinatura', href: '/dashboard/assinatura', icon: CreditCard, menuKey: 'assinatura' },
      { label: 'Perfil', href: '/perfil', icon: User, menuKey: 'perfil' },
      { label: 'Meus Pedidos', href: '/meus-pedidos', icon: ShoppingBag, menuKey: 'pedidos' },
      { label: 'Suporte', href: '/dashboard/suporte', icon: LifeBuoy, menuKey: 'suporte' },
    ],
  },
];

// Mentor Navigation
const mentorNavGroups: NavGroup[] = [
  {
    label: 'GESTÃO',
    items: [
      { label: 'Dashboard', href: '/mentor/dashboard', icon: LayoutDashboard, menuKey: 'dashboard' },
      { label: 'Meus Espaços', href: '/mentor/espacos', icon: LayoutGrid, menuKey: 'espacos' },
      { label: 'Agendamentos', href: '/mentor/agendamentos', icon: CalendarCheck, menuKey: 'agendamentos' },
      { label: 'Disponibilidade', href: '/mentor/disponibilidade', icon: Calendar, menuKey: 'disponibilidade' },
      { label: 'Lives', href: '/mentor/lives', icon: Radio, menuKey: 'lives', badge: { text: 'NOVO', variant: 'new' } },
      { label: 'Agenda', href: '/mentor/agenda', icon: Calendar, menuKey: 'agenda' },
      { label: 'Tarefas', href: '/mentor/tarefas', icon: ClipboardList, menuKey: 'tarefas' },
    ],
  },
  {
    label: 'CONTEÚDO',
    items: [
      { label: 'Biblioteca', href: '/biblioteca', icon: BookOpen, menuKey: 'biblioteca' },
      { label: 'Biblioteca Global', href: '/biblioteca-global', icon: Library, menuKey: 'biblioteca_global' },
      { label: 'Upload Materiais', href: '/admin/biblioteca/upload', icon: Upload, menuKey: 'upload_materiais' },
    ],
  },
  {
    label: 'MINHA CONTA',
    items: [
      { label: 'Perfil', href: '/perfil', icon: User, menuKey: 'perfil' },
      { label: 'Suporte', href: '/dashboard/suporte', icon: LifeBuoy, menuKey: 'suporte' },
    ],
  },
];

// Admin Navigation
const adminNavGroups: NavGroup[] = [
  {
    label: 'ANALYTICS',
    items: [
      { label: 'Saúde do Sistema', href: '/admin/saude-sistema', icon: Activity },
      { label: 'Leads Dashboard', href: '/admin/leads-dashboard', icon: BarChart3 },
      { label: 'Atividades', href: '/admin/atividades', icon: ListTodo },
      { label: 'Custos de API', href: '/admin/custos-api', icon: DollarSign },
      { label: 'Inteligencia Semanal', href: '/admin/inteligencia-semanal', icon: Brain, badge: { text: 'AI', variant: 'ai' as const } },
    ],
  },
  {
    label: 'GESTÃO DO NEGÓCIO',
    items: [
      { label: 'Idea Kanban', href: '/admin/idea-kanban', icon: Lightbulb },
      { label: 'Content Studio', href: '/admin/content-studio', icon: Video, badge: { text: 'AI', variant: 'ai' as const } },
    ],
  },
  {
    label: 'GESTÃO DE CONTEÚDO',
    items: [
      { label: 'Agendamentos', href: '/admin/agendamentos', icon: CalendarCheck },
      { label: 'Espaços', href: '/admin/espacos', icon: LayoutGrid },
      { label: 'Cursos', href: '/admin/cursos', icon: PlayCircle, badge: { text: 'NOVO', variant: 'new' } },
      { label: 'Produtos', href: '/admin/produtos', icon: Package },
      { label: 'Planos', href: '/admin/planos', icon: CreditCard },
      { label: 'Pedidos', href: '/admin/pedidos', icon: ShoppingBag },
      { label: 'Lives', href: '/mentor/lives', icon: Radio },
      { label: 'Prime Jobs', href: '/admin/prime-jobs', icon: Briefcase },
    ],
  },
  {
    label: 'BIBLIOTECA',
    items: [
      { label: 'Biblioteca', href: '/biblioteca', icon: BookOpen },
      { label: 'Biblioteca Global', href: '/biblioteca-global', icon: Library },
      { label: 'Gerenciar Biblioteca', href: '/admin/biblioteca-global', icon: Settings },
      { label: 'Upload Materiais', href: '/admin/biblioteca/upload', icon: Upload },
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
    label: 'CONFIGURAÇÕES',
    items: [
      { label: 'Configurações', href: '/admin/configuracoes', icon: Settings },
      { label: 'Hub Dashboard', href: '/admin/hub-config', icon: LayoutDashboard },
      { label: 'Menu do App', href: '/admin/menu-config', icon: Menu },
      { label: 'APIs Externas', href: '/admin/configuracoes-apis', icon: Link2 },
      { label: 'Templates de Email', href: '/admin/email-templates', icon: Mail },
      { label: 'Templates WhatsApp', href: '/admin/whatsapp-templates', icon: MessageSquare },
      { label: 'Automacoes N8N', href: '/admin/automacoes', icon: Zap },
      { label: 'Fluxos WhatsApp', href: '/admin/whatsapp-flows', icon: Workflow },
      { label: 'Páginas Legais', href: '/admin/paginas-legais', icon: FileText },
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

// Assistant (Customer Associate) Navigation
const assistantNavGroups: NavGroup[] = [
  {
    label: 'MEU TRABALHO',
    items: [
      { label: 'Leads', href: '/assistant/leads', icon: BarChart3 },
      { label: 'Atividades', href: '/assistant/atividades', icon: ListTodo },
      { label: 'Inteligência Semanal', href: '/assistant/inteligencia-semanal', icon: Brain },
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
  const { isItemVisible } = useMenuVisibility();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Select navigation based on user role, filtered by admin-controlled visibility
  const getNavGroups = (): NavGroup[] => {
    switch (user?.role) {
      case 'admin':
        return adminNavGroups;
      case 'assistant':
        return assistantNavGroups;
      case 'mentor': {
        return mentorNavGroups
          .map(group => ({
            ...group,
            items: group.items.filter(item => !item.menuKey || isItemVisible('mentor', item.menuKey)),
          }))
          .filter(group => group.items.length > 0);
      }
      default: {
        let groups = studentNavGroups;
        if (!studentEspacosLoading && (studentEspacos?.length || 0) === 0) {
          groups = groups.filter(group => group.label !== 'MENTORIA');
        }
        return groups
          .map(group => ({
            ...group,
            items: group.items.filter(item => !item.menuKey || isItemVisible('student', item.menuKey)),
          }))
          .filter(group => group.items.length > 0);
      }
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

              const linkClass = cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                item.isSpecial
                  ? active
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-indigo-600 hover:bg-indigo-50/50"
                  : active
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              );

              const linkContent = (
                <>
                  <Icon className={cn(
                    "w-5 h-5 flex-shrink-0",
                    item.isSpecial && !active && "text-indigo-500"
                  )} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className={cn(
                      "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full tracking-wide",
                      badgeClasses[item.badge.variant]
                    )}>
                      {item.badge.text}
                    </span>
                  )}
                </>
              );

              return (
                <li key={item.href + item.label}>
                  {item.isExternal ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkClass}
                    >
                      {linkContent}
                    </a>
                  ) : (
                    <Link
                      to={item.href}
                      onClick={handleClick}
                      className={linkClass}
                      data-tour={item.tourId || undefined}
                    >
                      {linkContent}
                    </Link>
                  )}
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


