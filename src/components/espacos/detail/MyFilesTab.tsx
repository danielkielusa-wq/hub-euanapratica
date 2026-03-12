import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePersonalMaterials, useCreateMaterialWithOwner, useUpdateMaterial, useDeleteMaterial } from '@/hooks/useMaterials';
import { usePersonalFolderTree, useCreateFolder, useUpdateFolder } from '@/hooks/useFolders';
import { useDownloadFile } from '@/hooks/useDownloads';
import { useFavoriteIds, useToggleFavorite } from '@/hooks/useFavorites';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  Upload,
  Download,
  Trash2,
  Eye,
  Loader2,
  FolderOpen,
  ExternalLink,
  Search,
  LayoutGrid,
  List as ListIcon,
  Star,
  Filter,
  FileText,
  Link as LinkIcon,
  FolderPlus,
  Folder as FolderIcon,
  ChevronDown,
  X,
  Pencil,
  Lock,
  Check,
  StickyNote,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatFileSize, isPreviewable, getFileTypeFromName, FILE_TYPE_COLORS } from '@/lib/file-utils';
import { FileIcon } from '@/components/library/FileIcon';
import { MaterialPreview } from '@/components/library/MaterialPreview';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Material, FileType, Folder } from '@/types/library';

interface MyFilesTabProps {
  espacoId: string;
  espacoName?: string;
}

type ViewMode = 'grid' | 'list';
type FilterType = 'all' | 'file' | 'link' | 'note' | 'favorites';

export function MyFilesTab({ espacoId, espacoName }: MyFilesTabProps) {
  const { user } = useAuth();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Material | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [mobileFoldersOpen, setMobileFoldersOpen] = useState(false);

  // Upload form states
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLink, setUploadLink] = useState('');
  const [uploadType, setUploadType] = useState<'file' | 'link' | 'note'>('file');
  const [uploadNoteContent, setUploadNoteContent] = useState('');
  const [uploadFolderId, setUploadFolderId] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Edit state
  const [editMaterial, setEditMaterial] = useState<Material | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLink, setEditLink] = useState('');
  const [editFolderId, setEditFolderId] = useState<string>('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Rename folder state
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameFolderValue, setRenameFolderValue] = useState('');

  const { data: folderTree } = usePersonalFolderTree(espacoId);
  const { data: myFiles, isLoading } = usePersonalMaterials(espacoId);

  const { data: favoriteIds } = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();
  const downloadFile = useDownloadFile();
  const createMaterial = useCreateMaterialWithOwner();
  const updateMaterial = useUpdateMaterial();
  const deleteMaterial = useDeleteMaterial();
  const createFolder = useCreateFolder();
  const updateFolder = useUpdateFolder();

  const flatFolders = useMemo(() => {
    const flat: Folder[] = [];
    const walk = (items: Folder[]) => {
      for (const f of items) {
        flat.push(f);
        if (f.children?.length) walk(f.children);
      }
    };
    if (folderTree) walk(folderTree);
    return flat;
  }, [folderTree]);

  const filteredMaterials = useMemo(() => {
    let filtered = myFiles || [];

    if (selectedFolderId) {
      filtered = filtered.filter(m => m.folder_id === selectedFolderId);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        (m.title || '').toLowerCase().includes(q) ||
        m.filename.toLowerCase().includes(q) ||
        (m.description || '').toLowerCase().includes(q)
      );
    }

    if (filterType === 'file') {
      filtered = filtered.filter(m => m.file_type !== 'link' && m.file_type !== 'note');
    } else if (filterType === 'link') {
      filtered = filtered.filter(m => m.file_type === 'link');
    } else if (filterType === 'note') {
      filtered = filtered.filter(m => m.file_type === 'note');
    } else if (filterType === 'favorites') {
      filtered = filtered.filter(m => favoriteIds?.includes(m.id));
    }

    return filtered;
  }, [myFiles, selectedFolderId, searchQuery, filterType, favoriteIds]);

  const handleUpload = async () => {
    if (!user) return;

    if (!uploadTitle.trim()) {
      toast.error('Informe o titulo do material');
      return;
    }

    if (uploadType === 'file' && !uploadFile) {
      toast.error('Selecione um arquivo');
      return;
    }

    if (uploadType === 'link' && !uploadLink.trim()) {
      toast.error('Informe o link');
      return;
    }

    if (uploadType === 'note' && !uploadNoteContent.trim()) {
      toast.error('Escreva o conteúdo da nota');
      return;
    }

    let folderId = uploadFolderId;
    if (!folderId) {
      if (flatFolders.length > 0) {
        folderId = flatFolders[0].id;
      } else {
        const newFolder = await createFolder.mutateAsync({
          name: 'Meus Arquivos',
          espaco_id: espacoId,
          owner_user_id: user.id,
        });
        folderId = newFolder.id;
      }
    }

    setIsUploading(true);

    try {
      let fileUrl = '';
      let fileSize: number | null = null;
      let fileType: FileType = 'link';
      let filename = uploadTitle;

      if (uploadType === 'file' && uploadFile) {
        const filePath = `${espacoId}/${Date.now()}_${uploadFile.name}`;

        const { error: uploadError } = await supabase.storage
          .from('materials')
          .upload(filePath, uploadFile);

        if (uploadError) throw uploadError;

        fileUrl = filePath;
        fileSize = uploadFile.size;
        fileType = getFileTypeFromName(uploadFile.name) as FileType;
        filename = uploadFile.name;
      } else if (uploadType === 'note') {
        fileUrl = '';
        fileType = 'note';
      } else {
        fileUrl = uploadLink;
        fileType = 'link';
      }

      await createMaterial.mutateAsync({
        folder_id: folderId,
        filename,
        title: uploadTitle,
        description: uploadType === 'note' ? uploadNoteContent.trim() : (uploadDescription || null),
        file_url: fileUrl,
        file_size: fileSize,
        file_type: fileType,
        owner_user_id: user.id,
        owner_role: 'mentor',
        visibility_scope: 'mentor_and_owner',
      });

      setUploadTitle('');
      setUploadDescription('');
      setUploadNoteContent('');
      setUploadFile(null);
      setUploadLink('');
      setUploadFolderId('');
      setUploadDialogOpen(false);
      toast.success('Arquivo enviado com sucesso!');
    } catch (error) {
      toast.error('Erro ao enviar arquivo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('Informe o nome da pasta');
      return;
    }
    if (!user) return;
    await createFolder.mutateAsync({
      name: newFolderName.trim(),
      espaco_id: espacoId,
      owner_user_id: user.id,
    });
    setNewFolderName('');
    setFolderDialogOpen(false);
    toast.success('Pasta criada!');
  };

  const handleRenameFolder = async (folderId: string) => {
    if (!renameFolderValue.trim()) return;
    try {
      await updateFolder.mutateAsync({ id: folderId, name: renameFolderValue.trim() });
      setRenamingFolderId(null);
      toast.success('Pasta renomeada!');
    } catch {
      toast.error('Erro ao renomear pasta');
    }
  };

  const handleDownload = (material: Material) => {
    if (material.file_type === 'link') {
      window.open(material.file_url, '_blank');
    } else {
      downloadFile.mutate(material);
    }
  };

  const handlePreview = async (material: Material) => {
    if (material.file_type === 'link') {
      window.open(material.file_url, '_blank');
      return;
    }

    let previewUrl = material.file_url;
    if (!material.file_url.startsWith('http://') && !material.file_url.startsWith('https://')) {
      const { data } = await supabase.storage
        .from('materials')
        .createSignedUrl(material.file_url, 3600);
      if (data?.signedUrl) {
        previewUrl = data.signedUrl;
      }
    }

    setPreviewMaterial({ ...material, file_url: previewUrl });
    setPreviewOpen(true);
  };

  const handleDelete = async (material: Material) => {
    await deleteMaterial.mutateAsync({ id: material.id, file_url: material.file_url });
    setDeleteConfirm(null);
    toast.success('Arquivo removido');
  };

  const handleOpenEdit = (material: Material) => {
    setEditMaterial(material);
    setEditTitle(material.title || material.filename);
    setEditDescription(material.description || '');
    setEditLink(material.file_type === 'link' ? material.file_url : '');
    setEditFolderId(material.folder_id || '');
  };

  const handleSaveEdit = async () => {
    if (!editMaterial) return;
    if (!editTitle.trim()) {
      toast.error('Informe o titulo');
      return;
    }
    if (editMaterial.file_type === 'link' && !editLink.trim()) {
      toast.error('Informe a URL');
      return;
    }

    setIsSavingEdit(true);
    try {
      const updates: Record<string, any> = {
        id: editMaterial.id,
        title: editTitle.trim(),
        description: editDescription.trim() || null,
      };
      if (editMaterial.file_type === 'link') {
        updates.file_url = editLink.trim();
      }
      if (editFolderId && editFolderId !== editMaterial.folder_id) {
        updates.folder_id = editFolderId;
      }
      await updateMaterial.mutateAsync(updates);
      setEditMaterial(null);
      toast.success('Arquivo atualizado!');
    } catch {
      toast.error('Erro ao atualizar arquivo');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const selectedFolderName = selectedFolderId
    ? flatFolders.find(f => f.id === selectedFolderId)?.name
    : null;

  const FILE_ICON_BG: Record<string, string> = {
    pdf: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
    docx: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
    xlsx: 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400',
    pptx: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400',
    png: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
    jpg: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
    zip: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400',
    link: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    note: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-semibold">Meus Arquivos</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            Seus arquivos pessoais — visíveis apenas para você
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setFolderDialogOpen(true)}>
            <FolderPlus className="h-4 w-4 mr-1" />
            Pasta
          </Button>
          <Button size="sm" onClick={() => setUploadDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        </div>
      </div>

      {/* Search + View Toggle */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar arquivos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="hidden sm:flex border rounded-lg p-0.5">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
            >
              <ListIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          {(['all', 'favorites', 'file', 'link', 'note'] as FilterType[]).map((f) => {
            const config: Record<FilterType, { label: string; icon?: typeof Star }> = {
              all: { label: 'Todos' },
              favorites: { label: 'Favoritos', icon: Star },
              file: { label: 'Documentos', icon: FileText },
              link: { label: 'Links', icon: LinkIcon },
              note: { label: 'Notas', icon: StickyNote },
            };
            const { label, icon: Icon } = config[f];
            const isActive = filterType === f;
            return (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border',
                  isActive
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'bg-background text-muted-foreground border-border hover:bg-muted'
                )}
              >
                {Icon && <Icon className={cn('w-3 h-3', isActive && 'fill-current')} />}
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex gap-4">
        {/* Folder sidebar — desktop */}
        {flatFolders.length > 0 && (
          <div className="hidden lg:flex w-56 shrink-0 flex-col border rounded-xl overflow-hidden bg-card">
            <div className="p-3 border-b">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <FolderIcon className="w-3 h-3" />
                Pastas
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <button
                onClick={() => setSelectedFolderId(null)}
                className={cn(
                  'w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                  !selectedFolderId ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'
                )}
              >
                <FolderOpen className="w-4 h-4 shrink-0" />
                Todas
              </button>
              {flatFolders.map((folder) => (
                <div key={folder.id} className="group/folder relative">
                  {renamingFolderId === folder.id ? (
                    <div className="flex items-center gap-1 px-2 py-1">
                      <Input
                        value={renameFolderValue}
                        onChange={(e) => setRenameFolderValue(e.target.value)}
                        className="h-7 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameFolder(folder.id);
                          if (e.key === 'Escape') setRenamingFolderId(null);
                        }}
                      />
                      <button onClick={() => handleRenameFolder(folder.id)} className="p-1 text-primary hover:bg-primary/10 rounded">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setRenamingFolderId(null)} className="p-1 text-muted-foreground hover:bg-muted rounded">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedFolderId(folder.id === selectedFolderId ? null : folder.id)}
                      className={cn(
                        'w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                        selectedFolderId === folder.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'
                      )}
                    >
                      <FolderIcon className="w-4 h-4 shrink-0" />
                      <span className="truncate flex-1">{folder.name}</span>
                      <Pencil
                        className="w-3 h-3 shrink-0 opacity-0 group-hover/folder:opacity-100 text-muted-foreground hover:text-primary transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenamingFolderId(folder.id);
                          setRenameFolderValue(folder.name);
                        }}
                      />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="p-3 bg-muted/50 border-t">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                  {filteredMaterials.length}
                </div>
                <div>
                  <p className="text-xs font-medium">{selectedFolderName || 'Todos'}</p>
                  <p className="text-[10px] text-muted-foreground">{filteredMaterials.length} itens</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Mobile folder selector */}
          {flatFolders.length > 0 && (
            <div className="lg:hidden mb-3">
              <button
                onClick={() => setMobileFoldersOpen(!mobileFoldersOpen)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-card rounded-lg border text-sm font-medium"
              >
                <span className="flex items-center gap-2 text-muted-foreground">
                  <FolderIcon className="w-4 h-4" />
                  {selectedFolderName || 'Todas as pastas'}
                </span>
                {mobileFoldersOpen ? <X className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {mobileFoldersOpen && (
                <div className="mt-1 bg-card rounded-lg border p-2 max-h-48 overflow-y-auto">
                  <button
                    onClick={() => { setSelectedFolderId(null); setMobileFoldersOpen(false); }}
                    className={cn('w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm', !selectedFolderId ? 'bg-primary/10 text-primary' : 'hover:bg-muted')}
                  >
                    <FolderOpen className="w-4 h-4" /> Todas
                  </button>
                  {flatFolders.map((folder) => (
                    <div key={folder.id} className="group/folder relative">
                      {renamingFolderId === folder.id ? (
                        <div className="flex items-center gap-1 px-2 py-1">
                          <Input
                            value={renameFolderValue}
                            onChange={(e) => setRenameFolderValue(e.target.value)}
                            className="h-7 text-sm"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameFolder(folder.id);
                              if (e.key === 'Escape') setRenamingFolderId(null);
                            }}
                          />
                          <button onClick={() => handleRenameFolder(folder.id)} className="p-1 text-primary hover:bg-primary/10 rounded">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setRenamingFolderId(null)} className="p-1 text-muted-foreground hover:bg-muted rounded">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setSelectedFolderId(folder.id); setMobileFoldersOpen(false); }}
                          className={cn('w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm', selectedFolderId === folder.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted')}
                        >
                          <FolderIcon className="w-4 h-4" />
                          <span className="truncate flex-1">{folder.name}</span>
                          <Pencil
                            className="w-3 h-3 shrink-0 opacity-0 group-hover/folder:opacity-100 text-muted-foreground hover:text-primary transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenamingFolderId(folder.id);
                              setRenameFolderValue(folder.name);
                            }}
                          />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {isLoading ? (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3' : 'space-y-3'}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-card p-4 rounded-xl border">
                  <div className="flex justify-between items-start mb-3">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <Skeleton className="h-4 w-4" />
                  </div>
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-full mb-3" />
                  <Skeleton className="h-px w-full mb-3" />
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-6 w-6 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                {searchQuery ? <Search className="w-8 h-8 text-muted-foreground" /> : <FolderOpen className="w-8 h-8 text-muted-foreground" />}
              </div>
              <p className="text-base font-medium text-foreground">
                {searchQuery ? 'Nenhum resultado encontrado' : 'Nenhum arquivo pessoal'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery ? 'Tente outro termo de busca.' : 'Clique em "Adicionar" para enviar o primeiro arquivo.'}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-baseline justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">
                  {selectedFolderName || 'Arquivos Pessoais'}
                </h3>
                <span className="text-xs text-muted-foreground">{filteredMaterials.length} itens</span>
              </div>

              <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3' : 'space-y-2'}>
                {filteredMaterials.map((material) => {
                  const isLink = material.file_type === 'link';
                  const isFav = favoriteIds?.includes(material.id) || false;

                  const isNote = material.file_type === 'note';

                  const handleClick = () => {
                    if (isNote) { handleOpenEdit(material); return; }
                    if (isLink) handleDownload(material);
                    else if (isPreviewable(material.file_type)) handlePreview(material);
                    else handleDownload(material);
                  };

                  if (viewMode === 'grid') {
                    return (
                      <div
                        key={material.id}
                        onClick={handleClick}
                        className="bg-card p-4 rounded-xl border shadow-sm group cursor-pointer flex flex-col h-full hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className={cn('p-2 rounded-lg', FILE_ICON_BG[material.file_type] || 'bg-muted text-muted-foreground')}>
                            <FileIcon fileType={material.file_type} size={20} />
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleFavorite.mutate({ materialId: material.id, isFavorite: isFav }); }}
                            className={cn('transition-colors', isFav ? 'text-amber-400' : 'text-muted-foreground/30 hover:text-amber-400')}
                          >
                            <Star className="w-4 h-4 fill-current" />
                          </button>
                        </div>

                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors text-sm">
                            {material.title || material.filename}
                          </h3>
                          {material.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                              {material.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t mt-auto">
                          <div className="flex items-center text-[11px] text-muted-foreground gap-2">
                            {isNote && <span>Nota</span>}
                            {!isLink && !isNote && material.file_size && <span>{formatFileSize(material.file_size)}</span>}
                            {isLink && <span>Link</span>}
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                            <span>{format(new Date(material.uploaded_at), 'dd MMM yyyy', { locale: ptBR })}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleOpenEdit(material); }}
                              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirm(material); }}
                              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            {!isNote && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDownload(material); }}
                                className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              >
                                {isLink ? <ExternalLink className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // List view
                  return (
                    <div key={material.id} className="bg-card p-3 rounded-xl border hover:shadow-sm transition-shadow flex items-center gap-3 group">
                      <div className={cn('p-2 rounded-lg shrink-0', FILE_ICON_BG[material.file_type] || 'bg-muted text-muted-foreground')}>
                        <FileIcon fileType={material.file_type} size={18} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {material.title || material.filename}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                          {isNote && <span>Nota</span>}
                          {!isLink && !isNote && material.file_size && <span>{formatFileSize(material.file_size)}</span>}
                          {isLink && <span>Link</span>}
                          <span>{format(new Date(material.uploaded_at), 'dd MMM yyyy', { locale: ptBR })}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => toggleFavorite.mutate({ materialId: material.id, isFavorite: isFav })}
                          className={cn('p-1.5 rounded-lg transition-colors', isFav ? 'text-amber-400' : 'text-muted-foreground/30 hover:text-amber-400')}
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleOpenEdit(material)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {!isLink && !isNote && isPreviewable(material.file_type) && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePreview(material)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {!isNote && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(material)}>
                            {isLink ? <ExternalLink className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setDeleteConfirm(material)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Arquivo</DialogTitle>
            <DialogDescription>
              Seus arquivos pessoais são visíveis apenas para você. Os alunos não têm acesso.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={uploadType} onValueChange={(v) => setUploadType(v as 'file' | 'link' | 'note')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="file">Arquivo</SelectItem>
                  <SelectItem value="link">Link Externo</SelectItem>
                  <SelectItem value="note">Nota</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {flatFolders.length > 1 && (
              <div className="space-y-2">
                <Label>Pasta</Label>
                <Select value={uploadFolderId} onValueChange={setUploadFolderId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma pasta" />
                  </SelectTrigger>
                  <SelectContent>
                    {flatFolders.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="myfiles-title">Titulo *</Label>
              <Input
                id="myfiles-title"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Nome do arquivo"
              />
            </div>

            {uploadType === 'note' ? (
              <div className="space-y-2">
                <Label htmlFor="myfiles-noteContent">Conteúdo da Nota *</Label>
                <Textarea
                  id="myfiles-noteContent"
                  value={uploadNoteContent}
                  onChange={(e) => setUploadNoteContent(e.target.value)}
                  placeholder="Escreva suas observações aqui..."
                  rows={5}
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="myfiles-description">Descrição</Label>
                  <Textarea
                    id="myfiles-description"
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    placeholder="Descrição opcional"
                    rows={2}
                  />
                </div>

                {uploadType === 'file' ? (
                  <div className="space-y-2">
                    <Label>Arquivo *</Label>
                    <Input
                      type="file"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      accept=".pdf,.docx,.xlsx,.pptx,.zip,.png,.jpg,.jpeg"
                    />
                    {uploadFile && (
                      <p className="text-sm text-muted-foreground">
                        {uploadFile.name} ({formatFileSize(uploadFile.size)})
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="myfiles-link">URL do Link *</Label>
                    <Input
                      id="myfiles-link"
                      value={uploadLink}
                      onChange={(e) => setUploadLink(e.target.value)}
                      placeholder="https://..."
                      type="url"
                    />
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)} disabled={isUploading}>
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={isUploading}>
              {isUploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Folder Dialog */}
      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nova Pasta</DialogTitle>
            <DialogDescription>Crie uma pasta para organizar seus arquivos.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="myfiles-folderName">Nome da pasta</Label>
            <Input
              id="myfiles-folderName"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Ex: Anotações, Rascunhos, Templates..."
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFolderDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateFolder} disabled={createFolder.isPending}>
              {createFolder.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <MaterialPreview
        material={previewMaterial}
        isOpen={previewOpen}
        onClose={() => { setPreviewOpen(false); setPreviewMaterial(null); }}
        onDownload={() => previewMaterial && handleDownload(previewMaterial)}
      />

      {/* Edit Dialog */}
      <Dialog open={!!editMaterial} onOpenChange={(open) => !open && setEditMaterial(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editMaterial?.file_type === 'note' ? 'Editar Nota' : 'Editar Arquivo'}</DialogTitle>
            <DialogDescription>
              {editMaterial?.file_type === 'note'
                ? 'Altere o título ou conteúdo da nota.'
                : `Altere o título, descrição${editMaterial?.file_type === 'link' ? ' ou URL' : ''} do arquivo.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="myfiles-editTitle">Titulo *</Label>
              <Input
                id="myfiles-editTitle"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder={editMaterial?.file_type === 'note' ? 'Título da nota' : 'Nome do arquivo'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="myfiles-editDescription">{editMaterial?.file_type === 'note' ? 'Conteúdo da Nota *' : 'Descrição'}</Label>
              <Textarea
                id="myfiles-editDescription"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder={editMaterial?.file_type === 'note' ? 'Escreva suas observações aqui...' : 'Descrição opcional'}
                rows={editMaterial?.file_type === 'note' ? 5 : 2}
              />
            </div>
            {editMaterial?.file_type === 'link' && (
              <div className="space-y-2">
                <Label htmlFor="myfiles-editLink">URL do Link *</Label>
                <Input
                  id="myfiles-editLink"
                  value={editLink}
                  onChange={(e) => setEditLink(e.target.value)}
                  placeholder="https://..."
                  type="url"
                />
              </div>
            )}
            {flatFolders.length > 1 && (
              <div className="space-y-2">
                <Label>Pasta</Label>
                <Select value={editFolderId} onValueChange={setEditFolderId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma pasta" />
                  </SelectTrigger>
                  <SelectContent>
                    {flatFolders.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMaterial(null)} disabled={isSavingEdit}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSavingEdit}>
              {isSavingEdit && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover arquivo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O arquivo "{deleteConfirm?.title || deleteConfirm?.filename}" será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
