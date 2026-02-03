import { MoreHorizontal, FileText, Linkedin, GraduationCap, MessageSquare, Calendar, Map, FileSearch, type LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { HubService } from '@/types/hub';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { cn } from '@/lib/utils';

interface SecondaryServicesGridProps {
  services: HubService[];
  isLoading?: boolean;
}

const colorMap: Record<string, { text: string; bg: string }> = {
  blue: { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' },
  purple: { text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30' },
  amber: { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30' },
  green: { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30' },
  red: { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30' },
  default: { text: 'text-muted-foreground', bg: 'bg-muted' },
};

const iconMap: Record<string, LucideIcon> = {
  linkedin: Linkedin,
  graduationcap: GraduationCap,
  messagesquare: MessageSquare,
  calendar: Calendar,
  map: Map,
  filesearch: FileSearch,
  filetext: FileText,
};

function getIconComponent(iconName: string): LucideIcon {
  const key = iconName.toLowerCase().replace(/[-_]/g, '');
  return iconMap[key] || FileText;
}

export function SecondaryServicesGrid({ services, isLoading }: SecondaryServicesGridProps) {
  const { getDiscountForServiceType, getCouponCode, planName, isPremiumPlan } = usePlanAccess();

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-8 px-2">
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-[24px]" />
          ))}
        </div>
      </div>
    );
  }

  if (services.length === 0) return null;

  const handleServiceClick = (service: HubService) => {
    let url = service.ticto_checkout_url || service.redirect_url;
    
    // Append coupon code if user has one
    const coupon = getCouponCode();
    if (url && coupon) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}coupon=${coupon}`;
    }
    
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8 px-2">
        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
          Outros Serviços
        </h3>
        <button className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
          Ver todos <MoreHorizontal size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {services.map((service) => {
          const colors = colorMap[service.accent_color || 'default'] || colorMap.default;
          const IconComponent = getIconComponent(service.icon_name);
          
          // Calculate discounted price
          const discount = getDiscountForServiceType(service.service_type || 'default');
          const originalPrice = service.price || 0;
          const discountedPrice = originalPrice * (1 - discount / 100);
          const hasDiscount = discount > 0 && originalPrice > 0;

          const priceDisplay = hasDiscount
            ? `R$ ${discountedPrice.toFixed(0)}`
            : (service.price_display || (service.price ? `R$ ${service.price}` : 'Sob Consulta'));

          return (
            <div 
              key={service.id} 
              className="bg-card p-6 rounded-[24px] border border-border shadow-sm hover:border-primary/20 hover:shadow-md transition-all group flex flex-col cursor-pointer"
              onClick={() => handleServiceClick(service)}
            >
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", colors.bg, colors.text)}>
                <IconComponent size={24} />
              </div>
              <h4 className="font-bold text-foreground mb-2">{service.name}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed mb-6 flex-1">{service.description}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex flex-col">
                  {hasDiscount && (
                    <span className="text-[10px] text-muted-foreground line-through">
                      R$ {originalPrice}
                    </span>
                  )}
                  <span className="text-xs font-bold text-foreground">{priceDisplay}</span>
                  {hasDiscount && (
                    <span className="text-[9px] font-bold text-green-600 dark:text-green-400">
                      Seu desconto {planName}: {discount}% off
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-black text-muted-foreground bg-muted px-3 py-1.5 rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  {service.cta_text || 'CONTRATAR'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
