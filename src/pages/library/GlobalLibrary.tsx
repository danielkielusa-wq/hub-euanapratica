import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BookOpen, FolderOpen, FileText, ArrowLeft } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import {
  useGlobalLibraryFolderTree,
  useGlobalLibraryBreadcrumb,
  useGlobalLibraryItems,
  useGlobalLibraryFavoriteIds,
  useToggleGlobalLibraryFavorite,
  useRecordGlobalLibraryDownload,
} from '@/hooks/useGlobalLibrary';
import { useDownloadFile } from '@/hooks/useFileUpload';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { useAuth } from '@/contexts/AuthContext';
import { GlobalFolderTree } from '@/components/global-library/GlobalFolderTree';
import { GlobalLibraryItemCard } from '@/components/global-library/GlobalLibraryItemCard';
import { GlobalLibraryFilters } from '@/components/global-library/GlobalLibraryFilters';
import { MaterialPreview } from '@/components/library/MaterialPreview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LibraryFilters, LibraryItem } from '@/types/global-library';
import { Material } from '@/types/library';

export default function GlobalLibrary() {
  const { folderId } = useParams<{ folderId?: string }>();
  const { roles } = useAuth();
  const { hasFeature } = usePlanAccess();
  const [filters, setFilters] = useState<LibraryFilters>({});
  const [previewItem, setPreviewItem] = useState<LibraryItem | null>(null);

  const isAdmin = roles?.includes('admin');
  const hasFullAccess = isAdmin || hasFeature('library_full_access');

  const { data: folderTree, isLoading: foldersLoading } = useGlobalLibraryFolderTree(hasFullAccess);
  const breadcrumb = useGlobalLibraryBreadcrumb(folderId || null, hasFullAccess);
  const { data: items, isLoading: itemsLoading } = useGlobalLibraryItems(folderId, filters);
  const favoriteIds = useGlobalLibraryFavoriteIds();
  const toggleFavorite = useToggleGlobalLibraryFavorite();
  const recordDownload = useRecordGlobalLibraryDownload();
  const { downloadFile } = useDownloadFile();

  // Filter by favorites if needed
  const displayItems = useMemo(() => {
    if (!items) return [];
    if (filters.favoritesOnly) {
      return items.filter(item => favoriteIds.data?.includes(item.id));
    }
    return items;
  }, [items, filters.favoritesOnly, favoriteIds.data]);

  const handleDownload = async (item: LibraryItem) => {
    await recordDownload.mutateAsync(item.id);

    if (item.item_type === 'link' && item.link_url) {
      window.open(item.link_url, '_blank');
    } else if (item.file_url && item.filename) {
      await downloadFile(item.file_url, item.filename);
    }
  };

  const handlePreview = (item: LibraryItem) => {
    setPreviewItem(item);
  };

  const handleToggleFavorite = (item: LibraryItem) => {
    toggleFavorite.mutate({
      itemId: item.id,
      isFavorite: favoriteIds.data?.includes(item.id) || false,
    });
  };

  // Convert LibraryItem to Material for MaterialPreview compatibility
  const previewMaterial: Material | null = previewItem
    ? {
        id: previewItem.id,
        folder_id: previewItem.folder_id,
        filename: previewItem.filename || previewItem.title,
        title: previewItem.title,
        description: previewItem.description,
        file_url: previewItem.file_url || '',
        file_size: previewItem.file_size ? Number(previewItem.file_size) : null,
        file_type: (previewItem.file_type as any) || 'pdf',
        access_level: 'public',
        available_at: previewItem.created_at,
        display_order: previewItem.display_order,
        uploaded_by: previewItem.uploaded_by,
        uploaded_at: previewItem.created_at,
        updated_at: previewItem.updated_at,
        owner_user_id: null,
        owner_role: null,
        visibility_scope: 'space_all',
      }
    : null;

  const currentFolder = breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1] : null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              Biblioteca
            </h1>
            <p className="text-muted-foreground mt-1">
              Acesse templates, ebooks, links e materiais de apoio
            </p>
          </div>
        </div>

        {/* Breadcrumb */}
        {folderId && (
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/biblioteca-global">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar
              </Link>
            </Button>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Link to="/biblioteca-global" className="hover:text-foreground">
                Biblioteca
              </Link>
              {breadcrumb.map((folder) => (
                <span key={folder.id} className="flex items-center gap-1">
                  <span>/</span>
                  <Link
                    to={`/biblioteca-global/pasta/${folder.id}`}
                    className={
                      folder.id === folderId
                        ? 'text-foreground font-medium'
                        : 'hover:text-foreground'
                    }
                  >
                    {folder.icon ? `${folder.icon} ` : ''}
                    {folder.name}
                  </Link>
                </span>
              ))}
            </div>
          </div>
        )}

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
                <GlobalFolderTree
                  folders={folderTree || []}
                  currentFolderId={folderId}
                />
              )}
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="space-y-4">
            {/* Filters */}
            <GlobalLibraryFilters filters={filters} onChange={setFilters} />

            {/* Items */}
            {itemsLoading ? (
              <div className="flex flex-col items-center gap-4 w-full sm:grid sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-full max-w-[90%] sm:max-w-none mx-auto sm:mx-0">
                    <Card>
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
                  </div>
                ))}
              </div>
            ) : displayItems.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-medium text-lg">
                    {folderId ? 'Nenhum material nesta pasta' : 'Selecione uma pasta'}
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    {folderId
                      ? 'Esta pasta ainda nao possui materiais disponiveis.'
                      : 'Navegue pelas pastas a esquerda para ver os materiais.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col items-center gap-4 w-full sm:grid sm:grid-cols-2">
                {displayItems.map((item) => (
                  <div key={item.id} className="w-full max-w-[90%] sm:max-w-none mx-auto sm:mx-0">
                    <GlobalLibraryItemCard
                      item={item}
                      isFavorite={favoriteIds.data?.includes(item.id) || false}
                      onDownload={() => handleDownload(item)}
                      onPreview={() => handlePreview(item)}
                      onToggleFavorite={() => handleToggleFavorite(item)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Preview Modal */}
        <MaterialPreview
          material={previewMaterial}
          isOpen={!!previewItem}
          onClose={() => setPreviewItem(null)}
          onDownload={() => previewItem && handleDownload(previewItem)}
        />
      </div>
    </DashboardLayout>
  );
}
