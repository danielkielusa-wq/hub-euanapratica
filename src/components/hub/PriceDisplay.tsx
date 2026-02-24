import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PriceDisplayProps {
  price: number;
  currency?: string;
  priceDisplay?: string | null;
  anchorPrice?: number | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showBadge?: boolean;
}

export function formatCurrency(price: number, currency: string = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

const sizeStyles = {
  sm: {
    anchor: 'text-[10px]',
    price: 'text-xs font-bold',
    badge: 'text-[9px] px-1.5 py-0',
  },
  md: {
    anchor: 'text-xs',
    price: 'text-sm font-semibold',
    badge: 'text-[10px] px-2 py-0',
  },
  lg: {
    anchor: 'text-sm',
    price: 'text-lg font-semibold',
    badge: 'text-xs px-2 py-0.5',
  },
};

export function PriceDisplay({
  price,
  currency = 'BRL',
  priceDisplay,
  anchorPrice,
  size = 'md',
  className,
  showBadge = true,
}: PriceDisplayProps) {
  const styles = sizeStyles[size];
  const hasAnchor = !!anchorPrice && anchorPrice > price && price > 0;
  const discount = hasAnchor
    ? Math.round((1 - price / anchorPrice!) * 100)
    : 0;
  const displayText = priceDisplay || formatCurrency(price, currency);

  if (!price || price === 0) return null;

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {hasAnchor && (
        <span className={cn('line-through text-muted-foreground', styles.anchor)}>
          {formatCurrency(anchorPrice!, currency)}
        </span>
      )}

      <span className={cn(styles.price, 'text-foreground')}>
        {displayText}
      </span>

      {hasAnchor && discount > 0 && showBadge && (
        <Badge
          variant="outline"
          className={cn(
            'rounded-full font-bold bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
            styles.badge,
          )}
        >
          {discount}% OFF
        </Badge>
      )}
    </div>
  );
}
