import { useState } from 'react';
import {
  Bell, Loader2, MessageCircle, Heart, Rocket, Video, Radio, Clock,
  BookOpen, Award, GraduationCap, Coins, CheckCircle, XCircle, AlertTriangle,
  CalendarCheck, CalendarX, CalendarClock, Users, HandMetal, Film, CalendarPlus,
  AlarmClock, RefreshCw, Pencil,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { PageHeader } from '@/components/admin/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  useNotificationTypeConfigs,
  useToggleInApp,
  useToggleEmail,
  useUpdateNotificationConfig,
  useNotificationStats,
  type NotificationTypeConfig,
} from '@/hooks/useAdminNotifications';

// ── Icon map ────────────────────────────────────────────────────────

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

const CATEGORY_LABELS: Record<string, string> = {
  system: 'Sistema',
  social: 'Social',
  business: 'Negocios',
  learning: 'Aprendizado',
  scheduling: 'Agendamento',
};

const CATEGORY_COLORS: Record<string, string> = {
  system: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  social: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  business: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
  learning: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  scheduling: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
};

// ── Main component ──────────────────────────────────────────────────

export default function AdminNotifications() {
  const { data: configs = [], isLoading, refetch } = useNotificationTypeConfigs();
  const { data: stats = {} } = useNotificationStats();
  const toggleInApp = useToggleInApp();
  const toggleEmail = useToggleEmail();
  const updateConfig = useUpdateNotificationConfig();

  const [editing, setEditing] = useState<NotificationTypeConfig | null>(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIcon, setEditIcon] = useState('');

  // Group configs by category
  const grouped = configs.reduce<Record<string, NotificationTypeConfig[]>>((acc, cfg) => {
    const cat = cfg.category || 'system';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(cfg);
    return acc;
  }, {});

  const categoryOrder = ['system', 'social', 'business', 'learning', 'scheduling'];

  const handleEdit = (cfg: NotificationTypeConfig) => {
    setEditing(cfg);
    setEditDisplayName(cfg.display_name);
    setEditDescription(cfg.description || '');
    setEditIcon(cfg.icon || 'bell');
  };

  const handleSaveEdit = () => {
    if (!editing) return;
    updateConfig.mutate({
      id: editing.id,
      display_name: editDisplayName,
      description: editDescription || null,
      icon: editIcon,
    }, {
      onSuccess: () => setEditing(null),
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#7367F0]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader title="Tipos de Notificacao" icon={Bell}>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-1.5" />
          Atualizar
        </Button>
      </PageHeader>

      <div className="space-y-8 mt-6">
        {categoryOrder.map((category) => {
          const items = grouped[category];
          if (!items || items.length === 0) return null;

          return (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className={CATEGORY_COLORS[category]}>
                  {CATEGORY_LABELS[category] || category}
                </Badge>
                <span className="text-xs text-gray-400">{items.length} tipo(s)</span>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {items.map((cfg) => {
                  const Icon = ICON_MAP[cfg.icon] || Bell;
                  const sentCount = stats[cfg.type_key] || 0;

                  return (
                    <Card key={cfg.id} className="relative group">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${CATEGORY_COLORS[cfg.category] || CATEGORY_COLORS.system}`}>
                              <Icon className="w-4.5 h-4.5" />
                            </div>
                            <div>
                              <CardTitle className="text-sm">{cfg.display_name}</CardTitle>
                              <code className="text-[10px] text-gray-400 font-mono">{cfg.type_key}</code>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleEdit(cfg)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3">
                        {cfg.description && (
                          <p className="text-xs text-gray-500 dark:text-muted-foreground">
                            {cfg.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                              <Switch
                                checked={cfg.in_app_enabled}
                                onCheckedChange={(checked) =>
                                  toggleInApp.mutate({ id: cfg.id, in_app_enabled: checked })
                                }
                                className="scale-75"
                              />
                              In-app
                            </label>
                            <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                              <Switch
                                checked={cfg.email_enabled}
                                onCheckedChange={(checked) =>
                                  toggleEmail.mutate({ id: cfg.id, email_enabled: checked })
                                }
                                className="scale-75"
                              />
                              Email
                            </label>
                          </div>
                          {sentCount > 0 && (
                            <span className="text-[10px] text-gray-400">
                              {sentCount} enviada(s)
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Tipo de Notificacao</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label>Nome de exibicao</Label>
              <Input
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Descricao</Label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>
            <div>
              <Label>Icone (nome lucide)</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  value={editIcon}
                  onChange={(e) => setEditIcon(e.target.value)}
                  placeholder="bell"
                />
                {(() => {
                  const PreviewIcon = ICON_MAP[editIcon] || Bell;
                  return <PreviewIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />;
                })()}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Nomes validos: bell, heart, rocket, coins, etc. (lucide-react)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateConfig.isPending}>
              {updateConfig.isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
