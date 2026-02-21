import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, ShoppingBag, ArrowRight, Receipt } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { usePaymentHistory } from '@/hooks/usePaymentHistory';

export default function MyOrders() {
  const { user } = useAuth();
  const { data: orders, isLoading } = usePaymentHistory(user?.id);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default'; // Green/success
      case 'pending':
        return 'secondary'; // Yellow/warning
      case 'cancelled':
        return 'outline'; // Gray
      case 'refunded':
        return 'destructive'; // Red
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pago';
      case 'pending':
        return 'Aguardando';
      case 'cancelled':
        return 'Cancelado';
      case 'refunded':
        return 'Reembolsado';
      default:
        return status || 'Pendente';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getProductTypeLabel = (type: string) => {
    switch (type) {
      case 'one_time_service':
        return 'Compra única';
      case 'subscription_initial':
        return 'Assinatura';
      case 'subscription_renewal':
        return 'Renovação';
      default:
        return type;
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#F5F5F7] p-6">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Meus Pedidos</h1>
            </div>
            <p className="text-muted-foreground">
              Acompanhe o histórico de suas compras e acesse seus serviços
            </p>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : orders && orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className="rounded-[32px] p-6 bg-card/80 backdrop-blur-sm border-border/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 shrink-0">
                        <ShoppingBag className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground">
                            {order.product_name}
                          </h3>
                          {order.billing_cycle && (
                            <Badge variant="outline" className="text-xs">
                              {order.billing_cycle === 'monthly' ? 'Mensal' : 'Anual'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(order.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm font-medium text-foreground">
                            {formatCurrency(order.amount, order.currency)}
                          </p>
                          <span className="text-xs text-muted-foreground">•</span>
                          <p className="text-xs text-muted-foreground">
                            {getProductTypeLabel(order.product_type)}
                          </p>
                        </div>
                        {order.ticto_order_id && (
                          <p className="text-xs text-muted-foreground font-mono mt-1">
                            ID: {order.ticto_order_id}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 ml-16 sm:ml-0">
                      <Badge variant={getStatusVariant(order.status)}>
                        {getStatusLabel(order.status)}
                      </Badge>
                      {order.status === 'paid' && order.service?.route && (
                        <Link to={order.service.route}>
                          <Button size="sm" className="rounded-xl">
                            Acessar
                            <ArrowRight className="ml-1 h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="rounded-[32px] p-12 text-center bg-card/80 backdrop-blur-sm border-border/50">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mx-auto mb-4">
                <ShoppingBag className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhum pedido encontrado
              </h3>
              <p className="text-muted-foreground mb-6">
                Você ainda não realizou nenhuma compra. Explore nosso Hub para descobrir serviços incríveis!
              </p>
              <Link to="/dashboard/hub">
                <Button className="rounded-xl">
                  Explorar Hub
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
