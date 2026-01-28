import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import {
  useAdminHubServices,
  useCreateHubService,
  useUpdateHubService,
  useDeleteHubService,
} from '@/hooks/useAdminHubServices';
import { HubServiceForm } from '@/components/admin/hub/HubServiceForm';
import { iconMap } from '@/components/admin/hub/IconSelector';
import { typeConfig } from '@/components/admin/hub/ServiceTypeSelector';
import { HubService, SERVICE_TYPE_LABELS, ServiceType } from '@/types/hub';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Plus, Pencil, Trash2, Loader2, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminHubServices() {
  const { data: services, isLoading } = useAdminHubServices();
  const createMutation = useCreateHubService();
  const updateMutation = useUpdateHubService();
  const deleteMutation = useDeleteHubService();

  const [formOpen, setFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<HubService | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCreate = () => {
    setEditingService(null);
    setFormOpen(true);
  };

  const handleEdit = (service: HubService) => {
    setEditingService(service);
    setFormOpen(true);
  };

  const handleFormSubmit = (data: any) => {
    if (editingService) {
      updateMutation.mutate(
        { id: editingService.id, ...data },
        { onSuccess: () => setFormOpen(false) }
      );
    } else {
      createMutation.mutate(data, { onSuccess: () => setFormOpen(false) });
    }
  };

  const handleDelete = () => {
    if (deleteConfirmId) {
      deleteMutation.mutate(deleteConfirmId, {
        onSuccess: () => setDeleteConfirmId(null),
      });
    }
  };

  const copyStripeId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success('Stripe ID copiado!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'BRL',
    }).format(price);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-muted/30 p-6 lg:p-10">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Gestão de Produtos
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Administre o catálogo de serviços do Hub e as regras de checkout.
              </p>
            </div>
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Criar Serviço
            </Button>
          </div>

          {/* Table */}
          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !services?.length ? (
              <div className="py-20 text-center text-muted-foreground">
                Nenhum produto cadastrado. Clique em "Criar Serviço" para começar.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-16">Ord.</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Modalidade</TableHead>
                    <TableHead>Preço / Stripe ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => {
                    const Icon = iconMap[service.icon_name] || iconMap.FileCheck;
                    const serviceType = service.service_type as ServiceType;
                    const typeConf = typeConfig[serviceType] || typeConfig.ai_tool;

                    return (
                      <TableRow key={service.id}>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {service.display_order}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                              <Icon className="h-5 w-5 text-foreground" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{service.name}</span>
                                {service.ribbon && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] font-bold"
                                  >
                                    {service.ribbon}
                                  </Badge>
                                )}
                              </div>
                              {service.category && (
                                <span className="text-xs text-muted-foreground">
                                  {service.category}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn('text-xs font-medium', typeConf.color)}
                          >
                            {SERVICE_TYPE_LABELS[serviceType] || 'IA'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {formatPrice(service.price, service.currency)}
                            </div>
                            {service.ticto_product_id ? (
                              <button
                                onClick={() => copyStripeId(service.ticto_product_id!)}
                                className="flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {copiedId === service.ticto_product_id ? (
                                  <Check className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                                Ticto: {service.ticto_product_id.slice(0, 12)}...
                              </button>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Sem Ticto ID
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={service.is_visible_in_hub ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {service.is_visible_in_hub ? 'Visível' : 'Oculto'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(service)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteConfirmId(service.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>

      {/* Form Modal */}
      <HubServiceForm
        open={formOpen}
        onOpenChange={setFormOpen}
        service={editingService}
        onSubmit={handleFormSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Produto</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O produto será removido permanentemente
              do catálogo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Remover'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
