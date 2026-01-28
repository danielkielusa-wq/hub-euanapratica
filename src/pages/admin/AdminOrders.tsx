import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, Receipt } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAdminPaymentHistory } from '@/hooks/usePaymentHistory';

export default function AdminOrders() {
  const { data: orders, isLoading } = useAdminPaymentHistory();

  const getStatusVariant = (status: string | null) => {
    switch (status) {
      case 'processed':
        return 'default';
      case 'received':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'processed':
        return 'Aprovado';
      case 'received':
        return 'Aguardando';
      default:
        return status || 'Pendente';
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-muted/30 p-6">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Histórico de Compras</h1>
            </div>
            <p className="text-muted-foreground">
              Visualize todas as transações de compra da plataforma
            </p>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : orders && orders.length > 0 ? (
            <Card className="rounded-2xl overflow-hidden bg-card/80 backdrop-blur-sm border-border/50">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Usuário</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Transação</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">
                            {order.profile?.full_name || 'N/A'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {order.profile?.email || 'N/A'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">
                        {order.service?.name || 'N/A'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {order.transaction_id || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(order.status)}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <Card className="rounded-2xl p-12 text-center bg-card/80 backdrop-blur-sm border-border/50">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mx-auto mb-4">
                <Receipt className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhuma transação encontrada
              </h3>
              <p className="text-muted-foreground">
                Ainda não há transações registradas no sistema.
              </p>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
