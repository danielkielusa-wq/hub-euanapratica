import {
  MessageCircle, Heart, Rocket, Video, Radio, Clock,
  BookOpen, Award, GraduationCap, Coins, CheckCircle,
  XCircle, AlertTriangle, CalendarCheck, CalendarX,
  CalendarClock, Users, Bell, HandMetal, Film, CalendarPlus,
  AlarmClock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Notification } from '@/hooks/useNotifications';

const ICON_MAP: Record<string, React.ElementType> = {
  'message-circle': MessageCircle,
  'heart': Heart,
  'rocket': Rocket,
  'video': Video,
  'radio': Radio,
  'clock': Clock,
  'book-open': BookOpen,
  'award': Award,
  'graduation-cap': GraduationCap,
  'coins': Coins,
  'check-circle': CheckCircle,
  'x-circle': XCircle,
  'alert-triangle': AlertTriangle,
  'calendar-check': CalendarCheck,
  'calendar-x': CalendarX,
  'calendar-x-2': CalendarX,
  'calendar-clock': CalendarClock,
  'calendar-plus': CalendarPlus,
  'alarm-clock': AlarmClock,
  'users': Users,
  'bell': Bell,
  'hand-metal': HandMetal,
  'film': Film,
};

const CATEGORY_COLORS: Record<string, string> = {
  system: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  social: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
  business: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400',
  learning: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
  scheduling: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
};

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onNavigate: (url: string) => void;
}

export function NotificationItem({ notification, onRead, onNavigate }: NotificationItemProps) {
  const isUnread = !notification.read_at;
  const IconComponent = ICON_MAP[notification.icon || 'bell'] || Bell;
  const categoryColor = CATEGORY_COLORS[notification.category || 'system'] || CATEGORY_COLORS.system;

  const timeAgo = notification.created_at
    ? formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR })
    : '';

  const handleClick = () => {
    if (isUnread) {
      onRead(notification.id);
    }
    if (notification.action_url) {
      onNavigate(notification.action_url);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/5 border-b border-gray-100 dark:border-white/5 last:border-b-0',
        isUnread && 'bg-blue-50/50 dark:bg-blue-950/20'
      )}
    >
      {/* Icon */}
      <div className={cn('mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center', categoryColor)}>
        <IconComponent className="w-4 h-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm leading-tight',
          isUnread ? 'font-semibold text-gray-900 dark:text-foreground' : 'font-medium text-gray-700 dark:text-gray-300'
        )}>
          {notification.title}
        </p>
        {notification.message && (
          <p className="text-xs text-gray-500 dark:text-muted-foreground mt-0.5 line-clamp-2">
            {notification.message}
          </p>
        )}
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{timeAgo}</p>
      </div>

      {/* Unread indicator */}
      {isUnread && (
        <span className="mt-2 flex-shrink-0 w-2 h-2 rounded-full bg-[#7367F0]" />
      )}
    </button>
  );
}
