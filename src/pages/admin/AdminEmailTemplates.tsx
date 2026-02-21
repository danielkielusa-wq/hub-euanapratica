import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Mail, Plus, Edit, Trash2, MoreVertical, Search, Eye } from 'lucide-react';
import { useAdminEmailTemplates, type EmailTemplate } from '@/hooks/useAdminEmailTemplates';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EmailTemplateDialog } from '@/components/admin/email-templates/EmailTemplateDialog';
import { EmailTemplatePreviewDialog } from '@/components/admin/email-templates/EmailTemplatePreviewDialog';

const CATEGORY_LABELS: Record<string, string> = {
  subscription: 'Assinatura',
  booking: 'Agendamento',
  espaco: 'Espaço',
  system: 'Sistema',
};

const CATEGORY_COLORS: Record<string, string> = {
  subscription: 'bg-blue-100 text-blue-700',
  booking: 'bg-green-100 text-green-700',
  espaco: 'bg-purple-100 text-purple-700',
  system: 'bg-gray-100 text-gray-700',
};

export default function AdminEmailTemplates() {
  const { templates, isLoading, toggleEnabled, deleteTemplate } = useAdminEmailTemplates();

  const [search, setSearch] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);

  const filteredTemplates = templates.filter(t =>
    t.display_name.toLowerCase().includes(search.toLowerCase()) ||
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.subject.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deletingTemplateId) return;
    await deleteTemplate(deletingTemplateId);
    setDeletingTemplateId(null);
  };

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Templates de Email</h1>
              <p className="text-sm text-muted-foreground">
                Gerencie os templates de email do sistema
              </p>
            </div>
          </div>

          <Button
            className="rounded-[12px] gap-2"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="w-4 h-4" />
            Novo Template
          </Button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>
        </div>

        {/* Templates Table */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <Card className="rounded-[24px] border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Mail className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {search ? 'Nenhum template encontrado' : 'Nenhum template criado'}
              </h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                {search
                  ? 'Tente ajustar sua busca'
                  : 'Crie seu primeiro template de email'
                }
              </p>
              {!search && (
                <Button onClick={() => setShowCreateDialog(true)} className="rounded-xl">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Template
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-[24px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Assunto</TableHead>
                  <TableHead>Variáveis</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Atualizado</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{template.display_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {template.name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {template.category && (
                        <Badge
                          variant="secondary"
                          className={CATEGORY_COLORS[template.category] || ''}
                        >
                          {CATEGORY_LABELS[template.category] || template.category}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate text-sm">{template.subject}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {template.variables?.slice(0, 3).map((v, i) => (
                          <Badge key={i} variant="outline" className="text-xs font-mono">
                            {v}
                          </Badge>
                        ))}
                        {template.variables && template.variables.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.variables.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={template.enabled}
                        onCheckedChange={(checked) => toggleEnabled(template.id, checked)}
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(template.updated_at), 'dd/MM/yy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem
                            onClick={() => setPreviewTemplate(template)}
                            className="gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setEditingTemplate(template)}
                            className="gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeletingTemplateId(template.id)}
                            className="gap-2 text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Dialogs */}
        <EmailTemplateDialog
          open={showCreateDialog || !!editingTemplate}
          onOpenChange={(open) => {
            if (!open) {
              setShowCreateDialog(false);
              setEditingTemplate(null);
            }
          }}
          template={editingTemplate}
        />

        <EmailTemplatePreviewDialog
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />

        {/* Delete Confirmation */}
        <AlertDialog open={!!deletingTemplateId} onOpenChange={() => setDeletingTemplateId(null)}>
          <AlertDialogContent className="rounded-[24px]">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover este template? Esta ação não pode ser desfeita.
                Emails que dependem deste template deixarão de funcionar.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="rounded-xl bg-destructive hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
