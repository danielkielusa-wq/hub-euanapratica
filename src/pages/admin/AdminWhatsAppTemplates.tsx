import { useState } from 'react';
import { Loader2, Plus, MessageSquare, Pencil, Trash2, MoreHorizontal, ToggleLeft, ToggleRight } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { WhatsAppTemplateDialog } from '@/components/admin/whatsapp/WhatsAppTemplateDialog';
import {
  useWhatsAppTemplatesAll,
  useCreateWhatsAppTemplate,
  useUpdateWhatsAppTemplate,
  useDeleteWhatsAppTemplate,
  useToggleWhatsAppTemplate,
} from '@/hooks/useAdminWhatsAppTemplates';
import type { WhatsAppTemplateRow } from '@/hooks/useAdminWhatsAppTemplates';

const CATEGORY_LABELS: Record<string, string> = {
  lead: 'Lead',
  followup: 'Follow-up',
  booking: 'Agendamento',
  subscription: 'Assinatura',
  other: 'Outro',
};

const CATEGORY_COLORS: Record<string, string> = {
  lead: 'bg-blue-50 text-blue-700 border-blue-200',
  followup: 'bg-amber-50 text-amber-700 border-amber-200',
  booking: 'bg-purple-50 text-purple-700 border-purple-200',
  subscription: 'bg-green-50 text-green-700 border-green-200',
  other: 'bg-gray-50 text-gray-600 border-gray-200',
};

export default function AdminWhatsAppTemplates() {
  const { data: templates = [], isLoading } = useWhatsAppTemplatesAll();
  const createTemplate = useCreateWhatsAppTemplate();
  const updateTemplate = useUpdateWhatsAppTemplate();
  const deleteTemplate = useDeleteWhatsAppTemplate();
  const toggleTemplate = useToggleWhatsAppTemplate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplateRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WhatsAppTemplateRow | null>(null);

  const handleCreate = () => {
    setEditingTemplate(null);
    setDialogOpen(true);
  };

  const handleEdit = (template: WhatsAppTemplateRow) => {
    setEditingTemplate(template);
    setDialogOpen(true);
  };

  const handleSubmit = (data: any) => {
    if (data.id) {
      updateTemplate.mutate(data, { onSuccess: () => setDialogOpen(false) });
    } else {
      createTemplate.mutate(data, { onSuccess: () => setDialogOpen(false) });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Templates WhatsApp</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {templates.length} {templates.length === 1 ? 'template' : 'templates'}
            </p>
          </div>
          <Button size="sm" className="h-8 text-xs rounded-xl gap-1.5" onClick={handleCreate}>
            <Plus className="w-3.5 h-3.5" />
            Novo Template
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : templates.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm text-gray-500">Nenhum template criado.</p>
            <p className="text-xs text-gray-400 mt-1">Clique em "Novo Template" para começar.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {templates.map((template) => (
              <Card key={template.id} variant="glass" className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-800 truncate">
                          {template.display_name}
                        </h3>
                        {template.category && (
                          <Badge
                            variant="outline"
                            className={`text-[10px] border ${CATEGORY_COLORS[template.category] || CATEGORY_COLORS.other}`}
                          >
                            {CATEGORY_LABELS[template.category] || template.category}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 font-mono mb-2">{template.name}</p>

                      {/* Body preview */}
                      <p className="text-xs text-gray-600 line-clamp-3 whitespace-pre-wrap leading-relaxed">
                        {template.body}
                      </p>

                      {/* Variables */}
                      {template.variables && template.variables.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {template.variables.map((v: string) => (
                            <Badge key={v} variant="outline" className="text-[9px] font-mono text-gray-500">
                              {v}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {template.description && (
                        <p className="text-[10px] text-gray-400 mt-1.5">{template.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Switch
                        checked={template.enabled}
                        onCheckedChange={(checked) =>
                          toggleTemplate.mutate({ id: template.id, enabled: checked })
                        }
                        className="scale-75"
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(template)}>
                            <Pencil className="w-3.5 h-3.5 mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => setDeleteTarget(template)}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Template dialog */}
        <WhatsAppTemplateDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          template={editingTemplate}
          onSubmit={handleSubmit}
          isPending={createTemplate.isPending || updateTemplate.isPending}
        />

        {/* Delete confirmation */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir template?</AlertDialogTitle>
              <AlertDialogDescription>
                O template "{deleteTarget?.display_name}" será permanentemente excluído. Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={() => {
                  if (deleteTarget) {
                    deleteTemplate.mutate(deleteTarget.id);
                    setDeleteTarget(null);
                  }
                }}
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
