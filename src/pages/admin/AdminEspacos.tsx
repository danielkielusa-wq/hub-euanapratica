import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { EspacoCard } from '@/components/admin/espacos/EspacoCard';
import { EspacoFiltersComponent } from '@/components/admin/espacos/EspacoFilters';
import { EspacoForm } from '@/components/admin/espacos/EspacoForm';
import {
  useAdminEspacos,
  useCreateEspacoAdmin,
  useUpdateEspacoAdmin,
  useDeleteEspaco,
  useDuplicateEspaco
} from '@/hooks/useAdminEspacos';
import type { EspacoFilters, EspacoExtended, EspacoCategory, EspacoVisibility } from '@/types/admin';
import { Plus, Loader2 } from 'lucide-react';
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

export default function AdminEspacos() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<EspacoFilters>({});
  const [formOpen, setFormOpen] = useState(false);
  const [editingEspaco, setEditingEspaco] = useState<EspacoExtended | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: espacos, isLoading } = useAdminEspacos(filters);
  const createMutation = useCreateEspacoAdmin();
  const updateMutation = useUpdateEspacoAdmin();
  const deleteMutation = useDeleteEspaco();
  const duplicateMutation = useDuplicateEspaco();

  const handleCreate = (data: any) => {
    createMutation.mutate(data, {
      onSuccess: () => setFormOpen(false)
    });
  };

  const handleEdit = (espaco: EspacoExtended) => {
    setEditingEspaco(espaco);
    setFormOpen(true);
  };

  const handleUpdate = (data: any) => {
    if (!editingEspaco) return;
    updateMutation.mutate({ id: editingEspaco.id, ...data }, {
      onSuccess: () => {
        setFormOpen(false);
        setEditingEspaco(null);
      }
    });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, {
      onSuccess: () => setDeleteId(null)
    });
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingEspaco(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestão de Espaços</h1>
            <p className="text-muted-foreground">
              Gerencie espaços, imersões e programas educacionais
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Espaço
          </Button>
        </div>

        <EspacoFiltersComponent filters={filters} onChange={setFilters} />

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : espacos && espacos.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {espacos.map((espaco) => (
              <EspacoCard
                key={espaco.id}
                espaco={espaco}
                onView={(id) => navigate(`/admin/espacos/${id}`)}
                onEdit={handleEdit}
                onDuplicate={(id) => duplicateMutation.mutate(id)}
                onDelete={(id) => setDeleteId(id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum espaço encontrado.</p>
            <Button variant="outline" className="mt-4" onClick={() => setFormOpen(true)}>
              Criar primeiro espaço
            </Button>
          </div>
        )}
      </div>

      <EspacoForm
        open={formOpen}
        onOpenChange={handleCloseForm}
        onSubmit={editingEspaco ? handleUpdate : handleCreate}
        isLoading={createMutation.isPending || updateMutation.isPending}
        initialData={editingEspaco ? {
          name: editingEspaco.name,
          description: editingEspaco.description || '',
          category: editingEspaco.category,
          visibility: editingEspaco.visibility,
          max_students: editingEspaco.max_students,
          mentor_id: editingEspaco.mentor_id || '',
          start_date: editingEspaco.start_date || '',
          end_date: editingEspaco.end_date || '',
          status: editingEspaco.status || 'active'
        } : undefined}
        mode={editingEspaco ? 'edit' : 'create'}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Espaço</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este espaço? Esta ação não pode ser desfeita.
              Espaços com alunos matriculados não podem ser excluídos.
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
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
