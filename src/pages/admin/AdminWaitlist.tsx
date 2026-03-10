import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/admin/shared/StatCard';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Users, Clock, Phone, CheckCircle2, XCircle, Loader2, MoreHorizontal, FileText } from 'lucide-react';
import { useWaitlist, useUpdateWaitlistStatus, type WaitlistFilters, type WaitlistItem } from '@/hooks/useAdminWaitlist';

const STATUS_LABELS: Record<string, string> = {
  waiting: 'Aguardando',
  contacted: 'Contatado',
  enrolled: 'Inscrito',
  declined: 'Recusou',
};

const STATUS_VARIANTS: Record<string, string> = {
  waiting: 'bg-amber-50 text-amber-700 border-amber-200',
  contacted: 'bg-blue-50 text-blue-700 border-blue-200',
  enrolled: 'bg-green-50 text-green-700 border-green-200',
  declined: 'bg-red-50 text-red-700 border-red-200',
};

export default function AdminWaitlist() {
  const [filters, setFilters] = useState<WaitlistFilters>({ status: 'all', search: '' });
  const { data: items = [], isLoading } = useWaitlist(filters);
  const updateStatus = useUpdateWaitlistStatus();

  const stats = useMemo(() => ({
    total: items.length,
    waiting: items.filter((i) => i.status === 'waiting').length,
    contacted: items.filter((i) => i.status === 'contacted').length,
    enrolled: items.filter((i) => i.status === 'enrolled').length,
  }), [items]);

  const handleStatusChange = (id: string, status: string) => {
    updateStatus.mutate({ id, status });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lista de Espera</h1>
          <p className="text-muted-foreground mt-1">
            Interessados na Mentoria em Grupo
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total" value={stats.total} icon={Users} />
          <StatCard title="Aguardando" value={stats.waiting} icon={Clock} variant={stats.waiting > 0 ? 'warning' : 'default'} />
          <StatCard title="Contatados" value={stats.contacted} icon={Phone} />
          <StatCard title="Inscritos" value={stats.enrolled} icon={CheckCircle2} />
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <Input
            placeholder="Buscar por nome, email ou whatsapp..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="max-w-sm"
          />
          <Select value={filters.status} onValueChange={(status) => setFilters({ ...filters, status })}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="waiting">Aguardando</SelectItem>
              <SelectItem value="contacted">Contatado</SelectItem>
              <SelectItem value="enrolled">Inscrito</SelectItem>
              <SelectItem value="declined">Recusou</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Candidatos</CardTitle>
            <CardDescription>
              {items.length} {items.length === 1 ? 'pessoa encontrada' : 'pessoas encontradas'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : items.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">Nenhum registro encontrado.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Relatorio</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <WaitlistRow key={item.id} item={item} onStatusChange={handleStatusChange} />
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

function WaitlistRow({ item, onStatusChange }: { item: WaitlistItem; onStatusChange: (id: string, status: string) => void }) {
  return (
    <TableRow>
      <TableCell className="font-medium">{item.name}</TableCell>
      <TableCell className="text-sm">{item.email}</TableCell>
      <TableCell className="text-sm font-mono">{item.whatsapp}</TableCell>
      <TableCell>
        <Badge variant="outline" className={STATUS_VARIANTS[item.status] || ''}>
          {STATUS_LABELS[item.status] || item.status}
        </Badge>
      </TableCell>
      <TableCell>
        {item.has_report ? (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            <FileText className="h-3 w-3 mr-1" />
            Sim
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {new Date(item.created_at).toLocaleDateString('pt-BR')}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {item.status !== 'contacted' && (
              <DropdownMenuItem onClick={() => onStatusChange(item.id, 'contacted')}>
                Marcar como Contatado
              </DropdownMenuItem>
            )}
            {item.status !== 'enrolled' && (
              <DropdownMenuItem onClick={() => onStatusChange(item.id, 'enrolled')}>
                Marcar como Inscrito
              </DropdownMenuItem>
            )}
            {item.status !== 'declined' && (
              <DropdownMenuItem onClick={() => onStatusChange(item.id, 'declined')}>
                Marcar como Recusou
              </DropdownMenuItem>
            )}
            {item.status !== 'waiting' && (
              <DropdownMenuItem onClick={() => onStatusChange(item.id, 'waiting')}>
                Voltar para Aguardando
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
