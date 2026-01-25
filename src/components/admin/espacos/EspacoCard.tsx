import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CATEGORY_LABELS, type EspacoExtended } from '@/types/admin';
import { Users, Calendar, MoreVertical, Eye, Edit, Copy, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EspacoCardProps {
  espaco: EspacoExtended;
  onView: (id: string) => void;
  onEdit: (espaco: EspacoExtended) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function EspacoCard({ espaco, onView, onEdit, onDuplicate, onDelete }: EspacoCardProps) {
  const statusVariant = {
    active: 'default',
    inactive: 'secondary',
    completed: 'outline'
  }[espaco.status || 'active'] as 'default' | 'secondary' | 'outline';

  const statusLabel = {
    active: 'Ativa',
    inactive: 'Inativa',
    completed: 'Concluída'
  }[espaco.status || 'active'];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{espaco.name}</CardTitle>
              <Badge variant={statusVariant}>{statusLabel}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                {CATEGORY_LABELS[espaco.category] || espaco.category}
              </Badge>
              {espaco.mentor && (
                <span>Mentor: {espaco.mentor.full_name}</span>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(espaco.id)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver Detalhes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(espaco)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(espaco.id)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(espaco.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        {espaco.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {espaco.description}
          </p>
        )}
        
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{espaco.enrolled_count ?? 0} / {espaco.max_students}</span>
          </div>
          
          {espaco.start_date && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(espaco.start_date), "dd MMM yyyy", { locale: ptBR })}
                {espaco.end_date && (
                  <> - {format(new Date(espaco.end_date), "dd MMM yyyy", { locale: ptBR })}</>
                )}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
