import { useState } from 'react';
import {
  BookOpen,
  FolderPlus,
  Plus,
  FolderOpen,
  BarChart3,
  FileText,
  Download,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import {
  useLibraryFolderTree,
  useLibraryFolders,
  useLibraryItems,
  useCreateLibraryFolder,
  useUpdateLibraryFolder,
  useDeleteLibraryFolder,
  useCreateLibraryItem,
  useUpdateLibraryItem,
  useDeleteLibraryItem,
  useLibraryStats,
} from '@/hooks/useAdminGlobalLibrary';
import { useGlobalLibraryUpload } from '@/hooks/useGlobalLibraryUpload';
import { AdminFolderTree } from '@/components/admin/global-library/AdminFolderTree';
import { FolderFormDialog } from '@/components/admin/global-library/FolderFormDialog';
import { ItemFormDialog } from '@/components/admin/global-library/ItemFormDialog';
import { LibraryItemCard } from '@/components/admin/global-library/LibraryItemCard';
import { LibraryFolder, LibraryItem } from '@/types/global-library';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
import { toast } from 'sonner';

export default function AdminGlobalLibrary() {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Folder dialog state
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<LibraryFolder | null>(null);
  const [parentIdForNewFolder, setParentIdForNewFolder] = useState<string | null>(null);

  // Item dialog state
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LibraryItem | null>(null);

  // Delete confirmation
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<LibraryFolder | null>(null);
  const [deleteItemTarget, setDeleteItemTarget] = useState<LibraryItem | null>(null);

  // Data
  const { data: folderTree, isLoading: foldersLoading } = useLibraryFolderTree();
  const { data: allFolders } = useLibraryFolders();
  const { data: items, isLoading: itemsLoading } = useLibraryItems(selectedFolderId || undefined);
  const { data: stats } = useLibraryStats();

  // Mutations
  const createFolder = useCreateLibraryFolder();
  const updateFolder = useUpdateLibraryFolder();
  const deleteFolder = useDeleteLibraryFolder();
  const createItem = useCreateLibraryItem();
  const updateItem = useUpdateLibraryItem();
  const deleteItem = useDeleteLibraryItem();
  const { uploadMultiple, isUploading } = useGlobalLibraryUpload();

  // ── Folder handlers ──

  const handleCreateFolder = () => {
    setEditingFolder(null);
    setParentIdForNewFolder(null);
    setFolderDialogOpen(true);
  };

  const handleCreateSubfolder = (parentId: string) => {
    setEditingFolder(null);
    setParentIdForNewFolder(parentId);
    setFolderDialogOpen(true);
  };

  const handleEditFolder = (folder: LibraryFolder) => {
    setEditingFolder(folder);
    setParentIdForNewFolder(null);
    setFolderDialogOpen(true);
  };

  const handleSaveFolder = async (data: {
    name: string;
    description?: string;
    icon?: string;
    parent_id?: string | null;
    access_level: 'public' | 'restricted';
  }) => {
    try {
      if (editingFolder) {
        await updateFolder.mutateAsync({ id: editingFolder.id, ...data });
        toast.success('Pasta atualizada!');
      } else {
        const result = await createFolder.mutateAsync(data);
        setSelectedFolderId(result.id);
        toast.success('Pasta criada!');
      }
      setFolderDialogOpen(false);
    } catch (error) {
      toast.error('Erro ao salvar pasta');
    }
  };

  const handleConfirmDeleteFolder = async () => {
    if (!deleteFolderTarget) return;
    try {
      await deleteFolder.mutateAsync(deleteFolderTarget.id);
      if (selectedFolderId === deleteFolderTarget.id) {
        setSelectedFolderId(null);
      }
      toast.success('Pasta excluida!');
    } catch (error) {
      toast.error('Erro ao excluir pasta');
    } finally {
      setDeleteFolderTarget(null);
    }
  };

  // ── Item handlers ──

  const handleCreateItem = () => {
    if (!selectedFolderId) {
      toast.error('Selecione uma pasta primeiro');
      return;
    }
    setEditingItem(null);
    setItemDialogOpen(true);
  };

  const handleEditItem = (item: LibraryItem) => {
    setEditingItem(item);
    setItemDialogOpen(true);
  };

  const handleSaveFile = async (data: {
    title: string;
    description?: string;
    tags: string[];
    files: File[];
  }) => {
    if (!selectedFolderId) return;
    try {
      await uploadMultiple(data.files, {
        folderId: selectedFolderId,
        title: data.title,
        description: data.description,
        tags: data.tags,
      });
      toast.success(`${data.files.length} arquivo(s) enviado(s)!`);
      setItemDialogOpen(false);
    } catch (error) {
      toast.error('Erro ao enviar arquivo(s)');
    }
  };

  const handleSaveLink = async (data: {
    title: string;
    description?: string;
    link_url: string;
    tags: string[];
  }) => {
    if (!selectedFolderId) return;
    try {
      await createItem.mutateAsync({
        folder_id: selectedFolderId,
        title: data.title,
        description: data.description,
        item_type: 'link',
        link_url: data.link_url,
        tags: data.tags,
      });
      toast.success('Link adicionado!');
      setItemDialogOpen(false);
    } catch (error) {
      toast.error('Erro ao adicionar link');
    }
  };

  const handleUpdateItem = async (data: {
    id: string;
    title: string;
    description?: string;
    link_url?: string;
    tags: string[];
  }) => {
    try {
      await updateItem.mutateAsync(data);
      toast.success('Item atualizado!');
      setItemDialogOpen(false);
    } catch (error) {
      toast.error('Erro ao atualizar item');
    }
  };

  const handleConfirmDeleteItem = async () => {
    if (!deleteItemTarget) return;
    try {
      await deleteItem.mutateAsync({
        id: deleteItemTarget.id,
        file_url: deleteItemTarget.file_url,
      });
      toast.success('Item excluido!');
    } catch (error) {
      toast.error('Erro ao excluir item');
    } finally {
      setDeleteItemTarget(null);
    }
  };

  const selectedFolder = allFolders?.find(f => f.id === selectedFolderId);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              Biblioteca Global
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie templates, ebooks, links e materiais para os estudantes
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCreateFolder}>
              <FolderPlus className="h-4 w-4 mr-2" />
              Nova Pasta
            </Button>
            <Button onClick={handleCreateItem} disabled={!selectedFolderId}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Item
            </Button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FolderOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalFolders}</p>
                  <p className="text-xs text-muted-foreground">Pastas</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalItems}</p>
                  <p className="text-xs text-muted-foreground">Itens</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Download className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalDownloads}</p>
                  <p className="text-xs text-muted-foreground">Downloads</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Layout */}
        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          {/* Sidebar - Folder Tree */}
          <Card className="h-fit lg:sticky lg:top-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Pastas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {foldersLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-8 w-5/6" />
                </div>
              ) : (
                <AdminFolderTree
                  folders={folderTree || []}
                  currentFolderId={selectedFolderId}
                  onFolderSelect={(folder) => setSelectedFolderId(folder.id)}
                  onCreateSubfolder={handleCreateSubfolder}
                  onEditFolder={handleEditFolder}
                  onDeleteFolder={setDeleteFolderTarget}
                />
              )}
            </CardContent>
          </Card>

          {/* Main Content - Items */}
          <div className="space-y-4">
            {selectedFolderId ? (
              <>
                {/* Folder header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      {selectedFolder?.icon && (
                        <span>{selectedFolder.icon}</span>
                      )}
                      {selectedFolder?.name || 'Pasta'}
                    </h2>
                    {selectedFolder?.description && (
                      <p className="text-sm text-muted-foreground">
                        {selectedFolder.description}
                      </p>
                    )}
                  </div>
                  <Button onClick={handleCreateItem} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>

                {/* Items */}
                {itemsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Card key={i}>
                        <CardContent className="p-4">
                          <div className="flex gap-3">
                            <Skeleton className="h-10 w-10 rounded-lg" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-3/4" />
                              <Skeleton className="h-3 w-1/2" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : items && items.length > 0 ? (
                  <div className="space-y-3">
                    {items.map((item) => (
                      <LibraryItemCard
                        key={item.id}
                        item={item}
                        onEdit={handleEditItem}
                        onDelete={setDeleteItemTarget}
                      />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="font-medium text-lg">Pasta vazia</h3>
                      <p className="text-muted-foreground mt-1">
                        Adicione arquivos ou links a esta pasta.
                      </p>
                      <Button className="mt-4" onClick={handleCreateItem}>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Item
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <FolderOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                  <h3 className="font-medium text-lg">Selecione uma pasta</h3>
                  <p className="text-muted-foreground mt-1">
                    Clique em uma pasta na arvore a esquerda para gerenciar seus itens.
                  </p>
                  {(!folderTree || folderTree.length === 0) && (
                    <Button className="mt-4" onClick={handleCreateFolder}>
                      <FolderPlus className="h-4 w-4 mr-2" />
                      Criar Primeira Pasta
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Folder Dialog */}
        <FolderFormDialog
          open={folderDialogOpen}
          onOpenChange={setFolderDialogOpen}
          folder={editingFolder}
          parentId={parentIdForNewFolder}
          allFolders={allFolders || []}
          onSave={handleSaveFolder}
          isPending={createFolder.isPending || updateFolder.isPending}
        />

        {/* Item Dialog */}
        {selectedFolderId && (
          <ItemFormDialog
            open={itemDialogOpen}
            onOpenChange={setItemDialogOpen}
            item={editingItem}
            folderId={selectedFolderId}
            onSaveFile={handleSaveFile}
            onSaveLink={handleSaveLink}
            onUpdate={handleUpdateItem}
            isPending={createItem.isPending || updateItem.isPending || isUploading}
          />
        )}

        {/* Delete Folder Confirmation */}
        <AlertDialog
          open={!!deleteFolderTarget}
          onOpenChange={(open) => !open && setDeleteFolderTarget(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir pasta?</AlertDialogTitle>
              <AlertDialogDescription>
                A pasta "{deleteFolderTarget?.name}" e todos os seus itens e subpastas serao
                excluidos permanentemente. Esta acao nao pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDeleteFolder}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Item Confirmation */}
        <AlertDialog
          open={!!deleteItemTarget}
          onOpenChange={(open) => !open && setDeleteItemTarget(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir item?</AlertDialogTitle>
              <AlertDialogDescription>
                O item "{deleteItemTarget?.title}" sera excluido permanentemente.
                {deleteItemTarget?.item_type === 'file' && ' O arquivo tambem sera removido do storage.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDeleteItem}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
