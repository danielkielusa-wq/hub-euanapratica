import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AuditLogRow {
  id: string;
  user_id: string;
  actor_id: string | null;
  action: string;
  source: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string;
  user?: { full_name: string; email: string };
  changed_by?: { full_name: string; email: string };
}

const actionLabels: Record<string, string> = {
  created: 'Criado',
  updated: 'Atualizado',
  status_changed: 'Status Alterado',
  role_changed: 'Papel Alterado',
  profile_updated: 'Perfil Atualizado',
  login: 'Login',
  plan_changed: 'Plano Alterado',
  usage_reset: 'Uso Resetado',
  usage_recorded: 'Uso Registrado',
  user_deleted: 'Usuário Excluído',
  impersonation_started: 'Impersonação Iniciada',
};

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('audit_events')
        .select('id, user_id, actor_id, action, source, old_values, new_values, created_at')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) {
        setIsLoading(false);
        return;
      }

      const rows = (data || []) as AuditLogRow[];
      const profileIds = Array.from(new Set(
        rows.flatMap((row) => [row.user_id, row.actor_id].filter(Boolean) as string[])
      ));

      if (profileIds.length === 0) {
        setLogs(rows);
        setIsLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', profileIds);

      const profileMap = Object.fromEntries(
        (profiles || []).map((p: any) => [p.id, { full_name: p.full_name, email: p.email }])
      );

      const enriched = rows.map((row) => ({
        ...row,
        user: profileMap[row.user_id],
        changed_by: row.actor_id ? profileMap[row.actor_id] : undefined,
      }));

      setLogs(enriched);
      setIsLoading(false);
    };

    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const toDate = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;

    return logs.filter((log) => {
      if (actionFilter !== 'all' && log.action !== actionFilter) return false;
      if (sourceFilter !== 'all' && log.source !== sourceFilter) return false;
      if (fromDate && new Date(log.created_at) < fromDate) return false;
      if (toDate && new Date(log.created_at) > toDate) return false;

      if (!q) return true;
      return [
        log.user?.full_name,
        log.user?.email,
        log.changed_by?.full_name,
        log.changed_by?.email,
        log.action,
        log.source,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [logs, search, actionFilter, sourceFilter, dateFrom, dateTo]);

  const renderChanges = (oldValues: Record<string, unknown> | null, newValues: Record<string, unknown> | null) => {
    if (!newValues) return <span className="text-muted-foreground">—</span>;
    const keys = Object.keys(newValues);
    if (keys.length === 0) return <span className="text-muted-foreground">—</span>;

    return (
      <div className="space-y-1 text-xs">
        {keys.map((key) => (
          <div key={key} className="flex gap-2">
            <span className="text-muted-foreground">{key}:</span>
            {oldValues && oldValues?.[key] !== undefined && (
              <>
                <span className="line-through text-destructive">{String(oldValues?.[key])}</span>
                <span className="text-primary">?</span>
              </>
            )}
            <span className="text-emerald-600">{String(newValues?.[key])}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Auditoria do Sistema</h1>
            <p className="text-muted-foreground">
              Registro de alterações e ações administrativas
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por usuário, email, ação..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                {Object.entries(actionLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as origens</SelectItem>
                {Array.from(new Set(logs.map((log) => log.source))).map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-[150px]"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-[150px]"
            />
          </div>
        </div>

        <Card className="rounded-[24px] overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum registro encontrado.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quando</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Por</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{log.user?.full_name || 'Usuário removido'}</div>
                          <div className="text-muted-foreground">{log.user?.email || log.user_id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {actionLabels[log.action] || log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.source}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{log.changed_by?.full_name || 'Sistema'}</div>
                          <div className="text-muted-foreground">{log.changed_by?.email || ''}</div>
                        </div>
                      </TableCell>
                      <TableCell>{renderChanges(log.old_values, log.new_values)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
