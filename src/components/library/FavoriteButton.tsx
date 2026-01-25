import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle: () => void;
  disabled?: boolean;
  size?: 'sm' | 'default';
}

export function FavoriteButton({ 
  isFavorite, 
  onToggle, 
  disabled,
  size = 'default' 
}: FavoriteButtonProps) {
  return (
    <Button
      variant="ghost"
      size={size === 'sm' ? 'icon' : 'default'}
      className={cn(
        'h-8 w-8',
        isFavorite && 'text-yellow-500 hover:text-yellow-600'
      )}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      disabled={disabled}
      title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
    >
      <Star 
        className={cn(
          'h-4 w-4',
          isFavorite && 'fill-current'
        )} 
      />
    </Button>
  );
}
