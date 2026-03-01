import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, ShoppingBag, ArrowRight, Receipt } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { usePaymentHistory, type Order } from '@/hooks/usePaymentHistory';

function getServiceLink(order: Order): string | null {
  if (order.status !== 'paid') return null;
  const svc = order.service;
  if (!svc) return null;

  // Live mentoring: go directly to booking flow
  if (svc.service_type === 'live_mentoring' && order.service_id) {
    return `/dashboard/agendar/${order.service_id}`;
  }

  // Other services: prefer redirect_url (Thank You page), fallback to route
  const url = svc.redirect_url || svc.route;
  if (!url) return null;

  // If it's a full URL (external), return as-is; if relative, ensure leading slash
  if (url.startsWith('http')) return url;
  return url.startsWith('/') ? url : `/${url}`;
}

function getActionLabel(order: Order): string {
  if (order.service?.service_type === 'live_mentoring') return 'Agendar Sessão';
  return 'Acessar';
}

export default function MyOrders() {
  const { user } = useAuth();
  const { data: orders, isLoading } = usePaymentHistory(user?.id);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pago';
      case 'pending':
        return 'Pendente';
      case 'cancelled':
        return 'Cancelado';
      case 'refunded':
        return 'Reembolsado';
      default:
        return status || 'Pendente';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-blue-600';
      case 'pending':
        return 'bg-amber-500';
      case 'cancelled':
        return 'bg-gray-400';
      case 'refunded':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
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
      <div className="min-h-screen bg-[#F8F9FA] dark:bg-background p-6 md:p-12 font-sans">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-100 dark:bg-blue-500/10 p-2 rounded-lg">
                <Receipt className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground tracking-tight">
                Meus Pedidos
              </h1>
            </div>
            <p className="text-gray-500 dark:text-muted-foreground text-lg ml-12">
              Acompanhe o histórico de suas compras e acesse seus serviços
            </p>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400 mb-3" />
              <p className="text-gray-500 dark:text-muted-foreground text-sm">Carregando pedidos...</p>
            </div>
          ) : orders && orders.length > 0 ? (
            <div className="space-y-6">
              {orders.map((order) => {
                const link = getServiceLink(order);
                return (
                  <div
                    key={order.id}
                    className="bg-white dark:bg-card rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-white/10 flex flex-col md:flex-row md:items-center gap-6 transition-all hover:shadow-md"
                  >
                    {/* Icon */}
                    <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-2xl shrink-0 self-start md:self-center">
                      <ShoppingBag className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-foreground mb-1 truncate">
                        {order.product_name}
                        {order.billing_cycle && (
                          <span className="ml-2 text-xs font-medium text-gray-400 dark:text-muted-foreground">
                            ({order.billing_cycle === 'monthly' ? 'Mensal' : 'Anual'})
                          </span>
                        )}
                      </h3>
                      <p className="text-gray-500 dark:text-muted-foreground text-sm mb-3">
                        {format(new Date(order.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-2">
                        <span className="font-semibold">{formatCurrency(order.amount, order.currency)}</span>
                        <span className="text-gray-400">•</span>
                        <span>{getProductTypeLabel(order.product_type)}</span>
                      </div>
                      {order.ticto_order_id && (
                        <p className="text-xs text-gray-400 dark:text-muted-foreground font-mono">
                          ID: {order.ticto_order_id}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-row md:flex-col items-center md:items-end gap-4 shrink-0 mt-2 md:mt-0 justify-between md:justify-start w-full md:w-auto">
                      <span className={`${getStatusColor(order.status)} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                        {getStatusLabel(order.status)}
                      </span>

                      {link && (
                        link.startsWith('http') ? (
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm hover:shadow active:scale-95"
                          >
                            {getActionLabel(order)}
                            <ArrowRight className="w-4 h-4" />
                          </a>
                        ) : (
                          <Link
                            to={link}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm hover:shadow active:scale-95"
                          >
                            {getActionLabel(order)}
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-card rounded-3xl p-12 shadow-sm border border-gray-100 dark:border-white/10 text-center">
              <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-2xl inline-flex mb-4">
                <ShoppingBag className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-foreground mb-2">
                Nenhum pedido encontrado
              </h3>
              <p className="text-gray-500 dark:text-muted-foreground mb-6">
                Você ainda não realizou nenhuma compra. Explore nosso Hub para descobrir serviços incríveis!
              </p>
              <Link
                to="/dashboard/hub"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors inline-flex items-center gap-2 shadow-sm hover:shadow active:scale-95"
              >
                Explorar Hub
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

        </div>
      </div>
    </DashboardLayout>
  );
}
