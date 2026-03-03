import { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Folder,
  Search,
  LayoutGrid,
  List as ListIcon,
  Lock,
  FileText,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import {
  useGlobalLibraryFolderTree,
  useGlobalLibraryBreadcrumb,
  useGlobalLibraryItems,
  useGlobalLibraryFavoriteIds,
  useToggleGlobalLibraryFavorite,
  useRecordGlobalLibraryDownload,
  useSearchGlobalLibrary,
} from '@/hooks/useGlobalLibrary';
import { useDownloadFile } from '@/hooks/useFileUpload';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { useAuth } from '@/contexts/AuthContext';
import { GlobalFolderTree } from '@/components/global-library/GlobalFolderTree';
import { GlobalLibraryItemCard } from '@/components/global-library/GlobalLibraryItemCard';
import { GlobalLibraryFilters } from '@/components/global-library/GlobalLibraryFilters';
import { MaterialPreview } from '@/components/library/MaterialPreview';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LibraryFilters, LibraryFolder, LibraryItem } from '@/types/global-library';
import { Material } from '@/types/library';

function findFolderInTree(folders: LibraryFolder[], id: string): LibraryFolder | undefined {
  for (const f of folders) {
    if (f.id === id) return f;
    if (f.children?.length) {
      const found = findFolderInTree(f.children, id);
      if (found) return found;
    }
  }
}

export default function GlobalLibrary() {
  const { folderId } = useParams<{ folderId?: string }>();
  const { roles } = useAuth();
  const { hasFeature } = usePlanAccess();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<LibraryFilters>({});
  const [previewItem, setPreviewItem] = useState<LibraryItem | null>(null);
  const [previewFileUrl, setPreviewFileUrl] = useState<string>('');
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = roles?.includes('admin');
  const isMentor = roles?.includes('mentor');
  const hasFullAccess = isAdmin || isMentor || hasFeature('library_full_access');

  const { data: folderTree, isLoading: foldersLoading } = useGlobalLibraryFolderTree();
  const breadcrumb = useGlobalLibraryBreadcrumb(folderId || null);

  const currentFolder = folderId && folderTree
    ? findFolderInTree(folderTree, folderId)
    : undefined;

  const isBlockedFromFolder = !!(
    folderId &&
    currentFolder?.access_level === 'restricted' &&
    !hasFullAccess
  );

  const { data: items, isLoading: itemsLoading } = useGlobalLibraryItems(
    isBlockedFromFolder ? undefined : folderId,
    filters
  );
  const isSearching = searchQuery.trim().length >= 2;
  const { data: searchResults, isLoading: searchLoading } = useSearchGlobalLibrary(searchQuery, hasFullAccess);
  const favoriteIds = useGlobalLibraryFavoriteIds();
  const toggleFavorite = useToggleGlobalLibraryFavorite();
  const recordDownload = useRecordGlobalLibraryDownload();
  const { downloadFile, getSignedUrl } = useDownloadFile();

  const displayItems = useMemo(() => {
    // When searching, use global search results (cross-folder)
    if (isSearching) {
      let filtered = searchResults || [];
      if (filters.favoritesOnly) {
        filtered = filtered.filter(item => favoriteIds.data?.includes(item.id));
      }
      if (filters.itemTypes?.length) {
        filtered = filtered.filter(item => filters.itemTypes!.includes(item.item_type));
      }
      return filtered;
    }

    // When browsing a folder, use folder items
    if (!items) return [];
    let filtered = items;

    if (filters.favoritesOnly) {
      filtered = filtered.filter(item => favoriteIds.data?.includes(item.id));
    }

    return filtered;
  }, [items, searchResults, isSearching, filters.favoritesOnly, filters.itemTypes, favoriteIds.data]);

  // Generate signed URL when preview item changes
  useEffect(() => {
    if (previewItem?.file_url && previewItem.item_type === 'file') {
      getSignedUrl(previewItem.file_url).then(setPreviewFileUrl).catch(() => setPreviewFileUrl(''));
    } else {
      setPreviewFileUrl('');
    }
  }, [previewItem, getSignedUrl]);

  const handleDownload = async (item: LibraryItem) => {
    await recordDownload.mutateAsync(item.id);
    if (item.item_type === 'link' && item.link_url) {
      window.open(item.link_url, '_blank');
    } else if (item.file_url && item.filename) {
      await downloadFile(item.file_url, item.filename);
    }
  };

  const handlePreview = (item: LibraryItem) => setPreviewItem(item);

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
        file_url: previewFileUrl || '',
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

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto h-[calc(100vh-5rem)] flex flex-col font-sans">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-200">
                <Folder className="w-6 h-6 text-white fill-white/20" />
              </div>
              Biblioteca
            </h1>
            <p className="text-gray-500 mt-1 ml-14">
              Acesse templates, ebooks, links e materiais de apoio.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Buscar materiais..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>
            <div className="flex bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-1 gap-8 overflow-hidden">

          {/* Sidebar */}
          <div className="w-72 flex-shrink-0 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-50">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Folder className="w-3 h-3" />
                Pastas
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {foldersLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <Skeleton className="h-10 w-3/4 rounded-lg" />
                  <Skeleton className="h-10 w-5/6 rounded-lg" />
                </div>
              ) : (
                <GlobalFolderTree
                  folders={folderTree || []}
                  currentFolderId={folderId}
                  hasFullAccess={hasFullAccess}
                  onRestrictedClick={() => setUpgradeModalOpen(true)}
                />
              )}
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                  {displayItems.length}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-900">Arquivos nesta pasta</p>
                  <p className="text-[10px] text-gray-500">
                    {currentFolder ? currentFolder.name : 'Selecione uma pasta'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0 bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden">

            {/* Filters Toolbar */}
            <div className="p-4 bg-white border-b border-gray-100">
              <GlobalLibraryFilters filters={filters} onChange={setFilters} />
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
              {isBlockedFromFolder && !isSearching ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Lock className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-lg font-medium text-gray-600">Conteúdo exclusivo</p>
                  <p className="text-sm text-gray-500 max-w-sm mt-1">
                    Esta pasta é exclusiva para assinantes Pro e VIP.
                  </p>
                  <Button className="mt-4" onClick={() => navigate('/pricing')}>
                    Ver planos
                  </Button>
                </div>
              ) : !folderId && !isSearching ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                  <Folder className="w-16 h-16 mb-4 text-gray-200" />
                  <p className="text-lg font-medium text-gray-600">Selecione uma pasta</p>
                  <p className="text-sm">Navegue pelas pastas à esquerda para ver os materiais.</p>
                </div>
              ) : (isSearching ? searchLoading : itemsLoading) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <Skeleton className="h-9 w-9 rounded-lg" />
                        <Skeleton className="h-4 w-4 rounded" />
                      </div>
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-full mb-1" />
                      <Skeleton className="h-3 w-1/2 mb-3" />
                      <div className="flex gap-1 mb-4">
                        <Skeleton className="h-4 w-16 rounded-full" />
                        <Skeleton className="h-4 w-12 rounded-full" />
                      </div>
                      <Skeleton className="h-px w-full mb-3" />
                      <div className="flex justify-between">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-6 w-6 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : displayItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-lg font-medium text-gray-600">Nenhum arquivo encontrado</p>
                  <p className="text-sm">Tente mudar os filtros ou buscar por outro termo.</p>
                </div>
              ) : (
                <>
                  <div className="mb-6 flex items-baseline justify-between">
                    <h2 className="text-lg font-bold text-gray-800">
                      {isSearching
                        ? `Resultados para "${searchQuery}"`
                        : `${currentFolder?.icon ? `${currentFolder.icon} ` : ''}${currentFolder?.name || 'Materiais'}`
                      }
                    </h2>
                    <span className="text-xs text-gray-500">{displayItems.length} itens</span>
                  </div>

                  <div
                    className={
                      viewMode === 'grid'
                        ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4'
                        : 'flex flex-col gap-3'
                    }
                  >
                    {displayItems.map((item) => (
                      <GlobalLibraryItemCard
                        key={item.id}
                        item={item}
                        isFavorite={favoriteIds.data?.includes(item.id) || false}
                        onDownload={() => handleDownload(item)}
                        onPreview={() => handlePreview(item)}
                        onToggleFavorite={() => handleToggleFavorite(item)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Preview Modal */}
        <MaterialPreview
          material={previewMaterial}
          isOpen={!!previewItem}
          onClose={() => setPreviewItem(null)}
          onDownload={() => previewItem && handleDownload(previewItem)}
        />

        {/* Upgrade Modal */}
        <Dialog open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen}>
          <DialogContent className="max-w-sm text-center">
            <DialogHeader>
              <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Lock className="h-6 w-6 text-amber-500" />
              </div>
              <DialogTitle>Conteúdo exclusivo Pro / VIP</DialogTitle>
              <DialogDescription>
                Esta pasta contém materiais exclusivos para assinantes.
                Faça upgrade do seu plano para acessar todos os recursos da Biblioteca.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 mt-2">
              <Button onClick={() => { setUpgradeModalOpen(false); navigate('/pricing'); }}>
                Ver planos e preços
              </Button>
              <Button variant="ghost" onClick={() => setUpgradeModalOpen(false)}>
                Agora não
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
