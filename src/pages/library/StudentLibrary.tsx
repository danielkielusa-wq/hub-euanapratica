import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Library, FolderOpen, FileText, ArrowLeft } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useFolderTree, useFolderBreadcrumb, useFolder } from '@/hooks/useFolders';
import { useMaterials } from '@/hooks/useMaterials';
import { useFavoriteIds, useToggleFavorite } from '@/hooks/useFavorites';
import { useRecordDownload } from '@/hooks/useDownloads';
import { useDownloadFile } from '@/hooks/useFileUpload';
import { FolderTree } from '@/components/library/FolderTree';
import { MaterialCard } from '@/components/library/MaterialCard';
import { MaterialFiltersBar } from '@/components/library/MaterialFilters';
import { MaterialPreview } from '@/components/library/MaterialPreview';
import { BreadcrumbNav } from '@/components/library/BreadcrumbNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MaterialFilters, Material } from '@/types/library';
import { useAuth } from '@/contexts/AuthContext';

export default function StudentLibrary() {
  const { folderId } = useParams<{ folderId?: string }>();
  const { user } = useAuth();
  const [filters, setFilters] = useState<MaterialFilters>({});
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);

  const { data: folderTree, isLoading: foldersLoading } = useFolderTree();
  const { data: currentFolder } = useFolder(folderId || '');
  const breadcrumb = useFolderBreadcrumb(folderId || null);
  const { data: materials, isLoading: materialsLoading } = useMaterials(folderId, filters);
  const favoriteIds = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();
  const recordDownload = useRecordDownload();
  const { downloadFile } = useDownloadFile();

  // Filter materials by favorites if needed
  const displayMaterials = useMemo(() => {
    if (!materials) return [];
    if (filters.favoritesOnly) {
      return materials.filter(m => favoriteIds.data?.includes(m.id));
    }
    return materials;
  }, [materials, filters.favoritesOnly, favoriteIds.data]);

  const handleDownload = async (material: Material) => {
    await recordDownload.mutateAsync(material.id);
    
    if (material.file_type === 'link') {
      window.open(material.file_url, '_blank');
    } else {
      await downloadFile(material.file_url, material.filename);
    }
  };

  const handlePreview = (material: Material) => {
    setPreviewMaterial(material);
  };

  const handleToggleFavorite = (material: Material) => {
    toggleFavorite.mutate({
      materialId: material.id,
      isFavorite: favoriteIds.data?.includes(material.id) || false,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Library className="h-6 w-6" />
              Biblioteca de Materiais
            </h1>
            <p className="text-muted-foreground mt-1">
              Acesse todos os materiais das suas turmas
            </p>
          </div>
        </div>

        {/* Breadcrumb */}
        {folderId && (
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/biblioteca">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar
              </Link>
            </Button>
            <BreadcrumbNav folders={breadcrumb} currentFolder={currentFolder} />
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
                <FolderTree
                  folders={folderTree || []}
                  currentFolderId={folderId}
                />
              )}
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="space-y-4">
            {/* Filters */}
            <MaterialFiltersBar filters={filters} onChange={setFilters} />

            {/* Materials Grid */}
            {materialsLoading ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <Skeleton className="h-12 w-12 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : displayMaterials.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-medium text-lg">
                    {folderId ? 'Nenhum material nesta pasta' : 'Selecione uma pasta'}
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    {folderId
                      ? 'Esta pasta ainda não possui materiais disponíveis.'
                      : 'Navegue pelas pastas à esquerda para ver os materiais.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {displayMaterials.map(material => (
                  <MaterialCard
                    key={material.id}
                    material={material}
                    isFavorite={favoriteIds.data?.includes(material.id) || false}
                    onDownload={() => handleDownload(material)}
                    onPreview={() => handlePreview(material)}
                    onToggleFavorite={() => handleToggleFavorite(material)}
                    showFolder={!folderId}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Preview Modal */}
        <MaterialPreview
          material={previewMaterial}
          isOpen={!!previewMaterial}
          onClose={() => setPreviewMaterial(null)}
          onDownload={() => previewMaterial && handleDownload(previewMaterial)}
        />
      </div>
    </DashboardLayout>
  );
}
