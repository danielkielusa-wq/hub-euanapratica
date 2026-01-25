import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserAuditLogs } from '@/hooks/useAdminUsers';
import { 
  History, 
  UserPlus, 
  Edit, 
  UserCheck, 
  Shield, 
  LogIn,
  Clock
} from 'lucide-react';
import type { AuditAction } from '@/types/auth';

const actionConfig: Record<AuditAction, { label: string; icon: typeof History; color: string }> = {
  created: { label: 'Criado', icon: UserPlus, color: 'bg-green-500/10 text-green-600' },
  updated: { label: 'Atualizado', icon: Edit, color: 'bg-blue-500/10 text-blue-600' },
  status_changed: { label: 'Status Alterado', icon: UserCheck, color: 'bg-amber-500/10 text-amber-600' },
  role_changed: { label: 'Papel Alterado', icon: Shield, color: 'bg-purple-500/10 text-purple-600' },
  profile_updated: { label: 'Perfil Atualizado', icon: Edit, color: 'bg-blue-500/10 text-blue-600' },
  login: { label: 'Login', icon: LogIn, color: 'bg-muted text-muted-foreground' },
};

interface UserAuditLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

export function UserAuditLogModal({ open, onOpenChange, userId, userName }: UserAuditLogModalProps) {
  const { data: logs, isLoading } = useUserAuditLogs(userId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de {userName}
          </DialogTitle>
          <DialogDescription>
            Linha do tempo de alterações e acessos
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="relative space-y-4 pl-6 border-l-2 border-muted ml-4">
              {logs.map((log) => {
                const config = actionConfig[log.action as AuditAction] || actionConfig.updated;
                const Icon = config.icon;
                
                return (
                  <div key={log.id} className="relative">
                    {/* Timeline dot */}
                    <div className={`absolute -left-[25px] p-1.5 rounded-full ${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    
                    <div className="pl-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={config.color}>
                          {config.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      
                      {log.changed_by && (
                        <p className="text-sm text-muted-foreground">
                          Por: {log.changed_by.full_name}
                        </p>
                      )}
                      
                      {log.old_values && log.new_values && (
                        <div className="mt-2 p-2 bg-muted/50 rounded text-xs font-mono">
                          {Object.keys(log.new_values as Record<string, unknown>).map((key) => {
                            const oldVal = (log.old_values as Record<string, unknown>)?.[key];
                            const newVal = (log.new_values as Record<string, unknown>)?.[key];
                            if (oldVal === newVal) return null;
                            return (
                              <div key={key} className="flex gap-2">
                                <span className="text-muted-foreground">{key}:</span>
                                {oldVal !== undefined && (
                                  <span className="line-through text-destructive">{String(oldVal)}</span>
                                )}
                                <span className="text-primary">→</span>
                                <span className="text-green-600">{String(newVal)}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum registro encontrado</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
