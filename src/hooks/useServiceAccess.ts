import { useHubServices, useUserHubAccess } from '@/hooks/useHubServices';

export function useServiceAccess(serviceRoute: string) {
  const { data: services, isLoading: servicesLoading } = useHubServices();
  const { data: userAccess, isLoading: accessLoading } = useUserHubAccess();

  const service = services?.find((s) => s.route === serviceRoute);

  // User has access if:
  // 1. Service status is 'available' (free for all)
  // 2. User has an active entry in user_hub_services for this service
  const hasAccess =
    service?.status === 'available' ||
    (service && userAccess?.includes(service.id));

  return {
    hasAccess: !!hasAccess,
    service,
    isLoading: servicesLoading || accessLoading,
  };
}
