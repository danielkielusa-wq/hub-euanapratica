import { useHubServices, useUserHubAccess } from '@/hooks/useHubServices';
import { useSubscription } from '@/hooks/useSubscription';

// Rotas que são ferramentas incluídas em qualquer assinatura ativa
const SUBSCRIPTION_INCLUDED_ROUTES = ['/curriculo'];

export function useServiceAccess(serviceRoute: string) {
  const { data: services, isLoading: servicesLoading } = useHubServices();
  const { data: userAccess, isLoading: accessLoading } = useUserHubAccess();
  const { quota, isLoading: subscriptionLoading } = useSubscription();

  const service = services?.find((s) => s.route === serviceRoute);

  // Verifica se é uma ferramenta incluída na assinatura
  const isSubscriptionTool = SUBSCRIPTION_INCLUDED_ROUTES.includes(serviceRoute);
  const hasActiveSubscription = quota?.planId != null;

  // User has access if:
  // 1. É uma ferramenta de assinatura E o usuário tem plano ativo
  // 2. Service status is 'available' (free for all)
  // 3. User has an active entry in user_hub_services for this service
  const hasAccess =
    (isSubscriptionTool && hasActiveSubscription) ||
    service?.status === 'available' ||
    (service && userAccess?.includes(service.id));

  return {
    hasAccess: !!hasAccess,
    service,
    isLoading: servicesLoading || accessLoading || subscriptionLoading,
  };
}
