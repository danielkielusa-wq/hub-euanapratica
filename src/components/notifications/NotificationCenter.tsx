import { useState } from 'react';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  useUnreadCount,
  useNotificationsList,
  useMarkAsRead,
  useMarkAllAsRead,
} from '@/hooks/useNotifications';
import { NotificationItem } from './NotificationItem';

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'all' | 'unread'>('all');
  const navigate = useNavigate();

  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: allNotifications = [], isLoading: loadingAll } = useNotificationsList('all');
  const { data: unreadNotifications = [], isLoading: loadingUnread } = useNotificationsList('unread');
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const notifications = tab === 'unread' ? unreadNotifications : allNotifications;
  const isLoading = tab === 'unread' ? loadingUnread : loadingAll;

  const handleRead = (id: string) => {
    markAsRead.mutate(id);
  };

  const handleNavigate = (url: string) => {
    setOpen(false);
    navigate(url);
  };

  const handleMarkAllRead = () => {
    markAllAsRead.mutate();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative p-2 text-gray-500 hover:bg-gray-100 hover:text-[#7367F0] rounded-full transition-colors"
          aria-label="Notificacoes"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-[#7367F0] text-white text-[10px] font-bold rounded-full border-2 border-white dark:border-card">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[380px] p-0 rounded-xl shadow-xl border border-gray-200/50 dark:border-white/10 bg-white dark:bg-card"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/10">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-foreground">
            Notificacoes
          </h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-[#7367F0] hover:text-[#7367F0]/80 hover:bg-[#7367F0]/10"
              onClick={handleMarkAllRead}
              disabled={markAllAsRead.isPending}
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as 'all' | 'unread')} className="w-full">
          <div className="px-4 pt-2">
            <TabsList className="w-full h-8 bg-gray-100/80 dark:bg-white/5 p-0.5 rounded-lg">
              <TabsTrigger
                value="all"
                className="flex-1 h-7 text-xs rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-white/10"
              >
                Todas
              </TabsTrigger>
              <TabsTrigger
                value="unread"
                className="flex-1 h-7 text-xs rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-white/10"
              >
                Nao lidas
                {unreadCount > 0 && (
                  <span className="ml-1.5 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center bg-[#7367F0] text-white text-[10px] font-bold rounded-full">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="mt-0">
            <NotificationList
              notifications={notifications}
              isLoading={isLoading}
              onRead={handleRead}
              onNavigate={handleNavigate}
            />
          </TabsContent>

          <TabsContent value="unread" className="mt-0">
            <NotificationList
              notifications={notifications}
              isLoading={isLoading}
              onRead={handleRead}
              onNavigate={handleNavigate}
            />
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

function NotificationList({
  notifications,
  isLoading,
  onRead,
  onNavigate,
}: {
  notifications: ReturnType<typeof useNotificationsList>['data'];
  isLoading: boolean;
  onRead: (id: string) => void;
  onNavigate: (url: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3">
          <Inbox className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-500 dark:text-muted-foreground">
          Nenhuma notificacao
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Quando houver novidades, elas aparecerao aqui
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-[400px]">
      {notifications.map((notif) => (
        <NotificationItem
          key={notif.id}
          notification={notif}
          onRead={onRead}
          onNavigate={onNavigate}
        />
      ))}
    </ScrollArea>
  );
}
