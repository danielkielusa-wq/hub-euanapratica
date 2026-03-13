import { Link, useLocation } from 'react-router-dom';
import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
  Briefcase,
  Link2,
  Globe,
  Activity,
  BarChart2,
  Mail,
  Send,
  DollarSign,
  ListTodo,
  Lightbulb,
  PlayCircle,
  Zap,
  Menu,
  Video,
  Radio,
  Brain,
  Layers,
  ChevronRight,
  Bell,
  CalendarDays,
  Target,
  Webhook,
  Timer,
  Sparkles,
  Kanban,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useServiceAccess } from '@/hooks/useServiceAccess';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { UpgradeModal } from '@/components/curriculo/UpgradeModal';
import { useMenuVisibility } from '@/hooks/useMenuVisibility';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  noHeader?: boolean;
}

// Student Navigation
const studentNavGroups: NavGroup[] = [
  {
    label: 'MEU HUB',
    noHeader: true,
    items: [
      { label: 'Meu Hub', href: '/dashboard/hub', icon: Compass, menuKey: 'hub', tourId: 'sidebar-meu-hub' },
    ],
  },
  {
    label: 'COMUNIDADE',
    noHeader: true,
    items: [
      { label: 'Comunidade', href: '/comunidade', icon: Users, menuKey: 'comunidade', badge: { text: 'HOT', variant: 'hot' }, tourId: 'sidebar-comunidade' },
    ],
  },
  {
    label: 'AGENDAMENTOS',
    noHeader: true,
    items: [
      { label: 'Agendamentos', href: '/dashboard/agendamentos', icon: CalendarCheck, menuKey: 'agendamentos' },
    ],
  },
  {
    label: 'DISCOVERY',
    items: [
      { label: 'Explore', href: '/catalogo', icon: Search, menuKey: 'catalogo', badge: { text: 'NOVO', variant: 'new' }, tourId: 'sidebar-explore' },
      { label: 'Lives', href: '/lives', icon: Radio, menuKey: 'lives', badge: { text: 'NOVO', variant: 'new' } },
      { label: 'Meus Cursos', href: '/dashboard/cursos', icon: PlayCircle, menuKey: 'cursos', badge: { text: 'NOVO', variant: 'new' } },
      { label: 'Minha Jornada', href: '/dashboard/espacos', icon: LayoutGrid, menuKey: 'espacos' },
      { label: 'Biblioteca', href: '/biblioteca', icon: BookOpen, menuKey: 'biblioteca' },
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
      { label: 'Perfil', href: '/perfil', icon: User, menuKey: 'perfil' },
      { label: 'Meus Pedidos', href: '/meus-pedidos', icon: ShoppingBag, menuKey: 'pedidos' },
      { label: 'Assinatura', href: '/dashboard/assinatura', icon: CreditCard, menuKey: 'assinatura' },
      { label: 'Planos', href: '/pricing', icon: CreditCard, menuKey: 'pricing' },
    ],
  },
  {
    label: 'SUPORTE',
    noHeader: true,
    items: [
      { label: 'Suporte', href: '/dashboard/suporte', icon: LifeBuoy, menuKey: 'suporte' },
    ],
  },
];

// Mentor Navigation
const mentorNavGroups: NavGroup[] = [
  {
    label: 'VISÃO GERAL',
    items: [
      { label: 'Dashboard', href: '/mentor/dashboard', icon: LayoutDashboard, menuKey: 'dashboard' },
      { label: 'Agenda', href: '/mentor/agenda', icon: CalendarDays, menuKey: 'agenda' },
      { label: 'Disponibilidade', href: '/mentor/disponibilidade', icon: Calendar, menuKey: 'disponibilidade' },
    ],
  },
  {
    label: 'ENSINO',
    items: [
      { label: 'Meus Espaços', href: '/mentor/espacos', icon: LayoutGrid, menuKey: 'espacos' },
      { label: 'Lives', href: '/mentor/lives', icon: Radio, menuKey: 'lives', badge: { text: 'NOVO', variant: 'new' } },
      { label: 'Tarefas', href: '/mentor/tarefas', icon: ClipboardList, menuKey: 'tarefas' },
      { label: 'Biblioteca', href: '/biblioteca', icon: BookOpen, menuKey: 'biblioteca' },
    ],
  },
  {
    label: 'COMUNIDADE',
    noHeader: true,
    items: [
      { label: 'Comunidade', href: '/comunidade', icon: Users, menuKey: 'comunidade', badge: { text: 'HOT', variant: 'hot' } },
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
    label: 'VISÃO GERAL',
    items: [
      { label: 'Agenda Semanal', href: '/admin/agenda-semanal', icon: CalendarDays },
      { label: 'Analytics Geral', href: '/admin/analytics', icon: BarChart2 },
      { label: 'Saúde do Sistema', href: '/admin/saude-sistema', icon: Activity },
      { label: 'Inteligencia Semanal', href: '/admin/inteligencia-semanal', icon: Brain, badge: { text: 'AI', variant: 'ai' as const } },
    ],
  },
  {
    label: 'CONTEÚDO & CRIAÇÃO',
    items: [
      { label: 'Content Factory', href: '/admin/content-factory', icon: Zap, badge: { text: 'AI', variant: 'ai' as const } },
      { label: 'Content Pipeline', href: '/admin/content-pipeline', icon: Kanban },
      { label: 'Conteúdo Grupo', href: '/admin/conteudo-grupo', icon: Sparkles, badge: { text: 'IA', variant: 'ai' as const } },
    ],
  },
  {
    label: 'FERRAMENTAS AI',
    items: [
      { label: 'AI SDR', href: '/admin/sdr', icon: Target, badge: { text: 'AI', variant: 'ai' as const } },
      { label: 'Idea Kanban', href: '/admin/idea-kanban', icon: Lightbulb },
    ],
  },
  {
    label: 'USUÁRIOS & LEADS',
    items: [
      { label: 'Leads Dashboard', href: '/admin/leads-dashboard', icon: BarChart3 },
      { label: 'Atividades', href: '/admin/atividades', icon: ListTodo },
      { label: 'Leads', href: '/admin/leads', icon: FileText },
      { label: 'Usuários', href: '/admin/usuarios', icon: Users },
      { label: 'Matrículas', href: '/admin/matriculas', icon: UserCog },
      { label: 'Lista de Espera', href: '/admin/lista-espera', icon: ClipboardList },
    ],
  },
  {
    label: 'ASSINATURAS & VENDAS',
    items: [
      { label: 'Planos', href: '/admin/planos', icon: CreditCard },
      { label: 'Assinaturas', href: '/admin/assinaturas', icon: CreditCard },
      { label: 'Saúde Assinaturas', href: '/admin/subscription-health', icon: Activity },
      { label: 'Pedidos', href: '/admin/pedidos', icon: ShoppingBag },
      { label: 'Produtos', href: '/admin/produtos', icon: Package },
    ],
  },
  {
    label: 'CONTEÚDO & ENSINO',
    items: [
      { label: 'Espaços', href: '/admin/espacos', icon: LayoutGrid },
      { label: 'Cursos', href: '/admin/cursos', icon: PlayCircle, badge: { text: 'NOVO', variant: 'new' } },
      { label: 'Lives', href: '/mentor/lives', icon: Radio },
      { label: 'Agendamentos', href: '/admin/agendamentos', icon: CalendarCheck },
      { label: 'Biblioteca', href: '/biblioteca', icon: BookOpen },
      { label: 'Gerenciar Biblioteca', href: '/admin/biblioteca-global', icon: Settings },
      { label: 'Prime Jobs', href: '/admin/prime-jobs', icon: Briefcase },
    ],
  },
  {
    label: 'COMUNICAÇÃO',
    items: [
      { label: 'Templates de Email', href: '/admin/email-templates', icon: Mail },
      { label: 'Campanhas Email', href: '/admin/campanhas-email', icon: Send },
      { label: 'Templates WhatsApp', href: '/admin/manychat-flows', icon: MessageSquare },
      { label: 'Notificacoes', href: '/admin/notificacoes', icon: Bell },
    ],
  },
  {
    label: 'AUTOMAÇÃO & APIs',
    items: [
      { label: 'Automacoes N8N', href: '/admin/automacoes', icon: Zap },
      { label: 'Cron Jobs', href: '/admin/cron-jobs', icon: Timer },
      { label: 'Webhooks & Eventos', href: '/admin/webhook-docs', icon: Webhook },
      { label: 'APIs Externas', href: '/admin/configuracoes-apis', icon: Link2 },
      { label: 'Custos de API', href: '/admin/custos-api', icon: DollarSign },
    ],
  },
  {
    label: 'SISTEMA',
    items: [
      { label: 'Configurações', href: '/admin/configuracoes', icon: Settings },
      { label: 'Hub Dashboard', href: '/admin/hub-config', icon: LayoutDashboard },
      { label: 'Menu do App', href: '/admin/menu-config', icon: Menu },
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
  collapsed?: boolean;
}

export function SidebarNav({ onNavigate, collapsed }: SidebarNavProps) {
  const location = useLocation();
  const { user } = useAuth();
  const { hasAccess: canAccessCommunity, isLoading: communityAccessLoading } = useServiceAccess('/comunidade');
  const { planId } = usePlanAccess();
  const { isItemVisible } = useMenuVisibility();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const isActive = useCallback((href: string) => {
    if (href === '/dashboard' || href === '/mentor/dashboard' || href === '/admin/dashboard') {
      return location.pathname === href;
    }
    return location.pathname === href || location.pathname.startsWith(href + '/');
  }, [location.pathname]);

  // Select navigation based on user role, filtered by admin-controlled visibility
  const navGroups = useMemo((): NavGroup[] => {
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
        return studentNavGroups
          .map(group => ({
            ...group,
            items: group.items.filter(item => !item.menuKey || isItemVisible('student', item.menuKey)),
          }))
          .filter(group => group.items.length > 0);
      }
    }
  }, [user?.role, isItemVisible]);

  // Determine which group contains the active link
  const activeGroupLabel = useMemo(() => {
    for (const group of navGroups) {
      if (group.items.some(item => isActive(item.href))) {
        return group.label;
      }
    }
    return navGroups[0]?.label ?? '';
  }, [navGroups, isActive]);

  // Track expanded groups — active group starts expanded
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set([activeGroupLabel]));

  // When active group changes (navigation), ensure it's expanded
  useMemo(() => {
    if (activeGroupLabel && !expandedGroups.has(activeGroupLabel)) {
      setExpandedGroups(prev => new Set([...prev, activeGroupLabel]));
    }
  }, [activeGroupLabel]);

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  return (
    <TooltipProvider delayDuration={0}>
      <nav className="flex-1 px-3 py-2 overflow-y-auto scrollbar-hide">
        {navGroups.map((group, groupIdx) => {
          const isExpanded = group.noHeader ? true : expandedGroups.has(group.label);
          const hasActiveItem = group.items.some(item => isActive(item.href));

          return (
            <div key={group.label} className={cn(groupIdx > 0 && "mt-2")}>
              {/* Collapsible Group Header — hidden when sidebar collapsed or standalone items */}
              {!group.noHeader && !collapsed && (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-colors duration-150",
                    hasActiveItem
                      ? "text-blue-600"
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-50/50"
                  )}
                >
                  <span>{group.label}</span>
                  <ChevronRight className={cn(
                    "w-3.5 h-3.5 transition-transform duration-200",
                    isExpanded && "rotate-90"
                  )} />
                </button>
              )}

              {/* Collapsed: thin separator between groups */}
              {!group.noHeader && collapsed && groupIdx > 0 && (
                <div className="hidden lg:block mx-2 my-1 border-t border-gray-100" />
              )}

              {/* Group Items */}
              <div
                className={cn(
                  !group.noHeader && !collapsed && "overflow-hidden transition-all duration-200 ease-in-out",
                  !group.noHeader && !collapsed && (isExpanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0")
                )}
              >
                <ul className={cn("space-y-0.5 pb-1", collapsed && "lg:flex lg:flex-col lg:items-center")}>
                  {group.items.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;

                    const isCommunityRoute = item.href === '/comunidade';
                    const isMentorOrAdmin = user?.role === 'mentor' || user?.role === 'admin';
                    const blockCommunityAccess = isCommunityRoute && !isMentorOrAdmin && !communityAccessLoading && !canAccessCommunity;

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
                      "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150",
                      collapsed && "lg:justify-center lg:px-0 lg:py-2 lg:w-10 lg:h-10",
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
                          "w-[18px] h-[18px] flex-shrink-0",
                          item.isSpecial && !active && "text-indigo-500"
                        )} />
                        <span className={cn("flex-1", collapsed && "lg:hidden")}>{item.label}</span>
                        {item.badge && (
                          <span className={cn(
                            "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full tracking-wide",
                            badgeClasses[item.badge.variant],
                            collapsed && "lg:hidden"
                          )}>
                            {item.badge.text}
                          </span>
                        )}
                      </>
                    );

                    const linkElement = item.isExternal ? (
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
                    );

                    return (
                      <li key={item.href + item.label}>
                        {collapsed ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              {linkElement}
                            </TooltipTrigger>
                            <TooltipContent side="right" sideOffset={8} className="hidden lg:block">
                              <p>{item.label}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          linkElement
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          );
        })}

        <UpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          currentPlanId={planId}
          reason="upgrade"
        />
      </nav>
    </TooltipProvider>
  );
}


