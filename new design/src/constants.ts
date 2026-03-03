import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Search, 
  Radio, 
  PlaySquare, 
  LayoutGrid, 
  ChevronDown, 
  ChevronRight,
  LogOut,
  Zap,
  FileText,
  Languages,
  Briefcase,
  TrendingUp,
  Crown,
  ShoppingBag,
  CreditCard,
  Video,
  Settings,
  CalendarCheck,
  BarChart3,
  FolderOpen
} from 'lucide-react';

export const SIDEBAR_ITEMS = [
  {
    category: 'PLANEJAMENTO',
    items: [
      { icon: CalendarCheck, label: 'Agenda Semanal' }
    ]
  },
  {
    category: 'ANALYTICS',
    items: [
      { icon: BarChart3, label: 'Analytics Geral' }
    ]
  },
  {
    category: 'RECURSOS',
    items: [
      { icon: FolderOpen, label: 'Biblioteca' }
    ]
  },
  {
    category: 'DISCOVERY',
    items: [
      { icon: LayoutDashboard, label: 'Meu Hub', active: true },
      { icon: Users, label: 'Comunidade', badge: 'HOT', badgeColor: 'bg-orange-100 text-orange-600' },
      { icon: Calendar, label: 'Agendamentos' },
      { icon: Search, label: 'Explore', badge: 'NOVO', badgeColor: 'bg-blue-100 text-blue-600' },
      { icon: Radio, label: 'Lives', badge: 'NOVO', badgeColor: 'bg-blue-100 text-blue-600' },
      { icon: PlaySquare, label: 'Meus Cursos', badge: 'NOVO', badgeColor: 'bg-blue-100 text-blue-600' },
      { icon: LayoutGrid, label: 'Minha Jornada' },
    ]
  },
  {
    category: 'MENTORIA',
    items: [
      { icon: Crown, label: 'Planos', badge: 'PRO', badgeColor: 'bg-purple-100 text-purple-600' }
    ]
  },
  {
    category: 'TOOLS & AI',
    items: [
      { icon: FileText, label: 'ResumePass' },
      { icon: Languages, label: 'Title Translator' },
      { icon: Briefcase, label: 'Prime Jobs' },
      { icon: Video, label: 'Content Studio', badge: 'AI', badgeColor: 'bg-purple-100 text-purple-600' },
    ]
  },
  {
    category: 'MINHA CONTA',
    items: [
      { icon: ShoppingBag, label: 'Meus Pedidos' },
      { icon: CreditCard, label: 'Minha Assinatura' }
    ]
  },
  {
    category: 'ADMIN',
    items: [
      { icon: Settings, label: 'Configurar Planos' }
    ]
  }
];
