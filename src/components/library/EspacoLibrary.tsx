import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMaterialsByEspaco, useCreateMaterialWithOwner, useDeleteMaterial } from '@/hooks/useMaterials';
import { useFolders, useCreateFolder } from '@/hooks/useFolders';
import { useDownloadFile } from '@/hooks/useDownloads';
import { useFavoriteIds, useToggleFavorite } from '@/hooks/useFavorites';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  User,
  GraduationCap,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatFileSize, isPreviewable, getFileTypeFromName } from '@/lib/file-utils';
import { FileIcon } from './FileIcon';
import { FavoriteButton } from './FavoriteButton';
import { MaterialPreview } from './MaterialPreview';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Material, FileType } from '@/types/library';

interface EspacoLibraryProps {
  espacoId: string;
  espacoName: string;
  userRole: 'student' | 'mentor' | 'admin';
}

export function EspacoLibrary({ espacoId, espacoName, userRole }: EspacoLibraryProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('mentor');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Material | null>(null);
  
  // Form states
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLink, setUploadLink] = useState('');
  const [uploadType, setUploadType] = useState<'file' | 'link'>('file');
  const [isUploading, setIsUploading] = useState(false);

  const { data: folders } = useFolders(espacoId);
  const { data: mentorMaterials, isLoading: mentorLoading } = useMaterialsByEspaco(espacoId, 'space_all');
  const { data: studentMaterials, isLoading: studentLoading } = useMaterialsByEspaco(espacoId, 'mentor_and_owner', user?.id);
  const { data: allStudentMaterials } = useMaterialsByEspaco(espacoId, 'mentor_and_owner', undefined);
  
  const { data: favoriteIds } = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();
  const downloadFile = useDownloadFile();
  const createMaterial = useCreateMaterialWithOwner();
  const deleteMaterial = useDeleteMaterial();
  const createFolder = useCreateFolder();

  const isLoading = activeTab === 'mentor' ? mentorLoading : studentLoading;

  const handleUpload = async () => {
    if (!user || !folders?.length) {
      // Criar pasta padrão se não existir
      if (!folders?.length) {
        await createFolder.mutateAsync({
          name: 'Materiais',
          espaco_id: espacoId,
        });
      }
      return;
    }

    if (!uploadTitle.trim()) {
      toast.error('Informe o título do material');
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
      } else {
        fileUrl = uploadLink;
        fileType = 'link';
      }

      const visibilityScope = userRole === 'student' ? 'mentor_and_owner' : 'space_all';
      const ownerRole = userRole;

      await createMaterial.mutateAsync({
        folder_id: folders[0].id,
        filename,
        title: uploadTitle,
        description: uploadDescription || null,
        file_url: fileUrl,
        file_size: fileSize,
        file_type: fileType,
        owner_user_id: user.id,
        owner_role: ownerRole,
        visibility_scope: visibilityScope as 'space_all' | 'mentor_and_owner',
      });

      setUploadTitle('');
      setUploadDescription('');
      setUploadFile(null);
      setUploadLink('');
      setUploadDialogOpen(false);
      toast.success('Material enviado com sucesso!');
    } catch (error) {
      toast.error('Erro ao enviar material');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = (material: Material) => {
    if (material.file_type === 'link') {
      window.open(material.file_url, '_blank');
    } else {
      downloadFile.mutate(material);
    }
  };

  const handlePreview = (material: Material) => {
    setPreviewMaterial(material);
    setPreviewOpen(true);
  };

  const handleDelete = async (material: Material) => {
    await deleteMaterial.mutateAsync({ id: material.id, file_url: material.file_url });
    setDeleteConfirm(null);
    toast.success('Material removido');
  };

  const canUpload = userRole !== 'student' || (userRole === 'student' && activeTab === 'student');
  const canDelete = (material: Material) => {
    if (userRole === 'admin') return true;
    if (userRole === 'mentor' && material.owner_role === 'mentor') return true;
    if (userRole === 'student' && material.owner_user_id === user?.id) return true;
    return false;
  };

  const ensureFolder = async () => {
    if (!folders?.length) {
      await createFolder.mutateAsync({
        name: 'Materiais',
        espaco_id: espacoId,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Biblioteca do Espaço</h2>
          <p className="text-sm text-muted-foreground">
            Materiais disponíveis para {espacoName}
          </p>
        </div>
        {canUpload && (
          <Button onClick={() => { ensureFolder(); setUploadDialogOpen(true); }}>
            <Upload className="h-4 w-4 mr-2" />
            {userRole === 'student' ? 'Enviar Material' : 'Adicionar Material'}
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="mentor" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            Materiais do Programa
          </TabsTrigger>
          <TabsTrigger value="student" className="gap-2">
            <User className="h-4 w-4" />
            {userRole === 'student' ? 'Meus Uploads' : 'Uploads dos Alunos'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mentor" className="mt-4">
          <MaterialsList
            materials={mentorMaterials || []}
            isLoading={mentorLoading}
            emptyMessage="Nenhum material do programa disponível ainda"
            favoriteIds={favoriteIds}
            onToggleFavorite={(material) => toggleFavorite.mutate({ materialId: material.id, isFavorite: favoriteIds?.includes(material.id) || false })}
            onDownload={handleDownload}
            onPreview={handlePreview}
            onDelete={(m) => canDelete(m) && setDeleteConfirm(m)}
            canDelete={canDelete}
            showOwner={false}
          />
        </TabsContent>

        <TabsContent value="student" className="mt-4">
          {userRole === 'student' && (
            <Button 
              variant="outline" 
              className="mb-4"
              onClick={() => { ensureFolder(); setUploadDialogOpen(true); }}
            >
              <Upload className="h-4 w-4 mr-2" />
              Enviar Novo Material
            </Button>
          )}
          <MaterialsList
            materials={userRole === 'student' ? (studentMaterials || []) : (allStudentMaterials || [])}
            isLoading={studentLoading}
            emptyMessage={userRole === 'student' ? "Você ainda não enviou materiais" : "Nenhum upload de aluno neste espaço"}
            favoriteIds={favoriteIds}
            onToggleFavorite={(material) => toggleFavorite.mutate({ materialId: material.id, isFavorite: favoriteIds?.includes(material.id) || false })}
            onDownload={handleDownload}
            onPreview={handlePreview}
            onDelete={(m) => canDelete(m) && setDeleteConfirm(m)}
            canDelete={canDelete}
            showOwner={userRole !== 'student'}
          />
        </TabsContent>
      </Tabs>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {userRole === 'student' ? 'Enviar Material' : 'Adicionar Material'}
            </DialogTitle>
            <DialogDescription>
              {userRole === 'student' 
                ? 'Envie materiais que serão visíveis apenas para você e os mentores do espaço.'
                : 'Adicione materiais que serão visíveis para todos os alunos deste espaço.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={uploadType} onValueChange={(v) => setUploadType(v as 'file' | 'link')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="file">Arquivo</SelectItem>
                  <SelectItem value="link">Link Externo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Nome do material"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
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
                <Label htmlFor="link">URL do Link *</Label>
                <Input
                  id="link"
                  value={uploadLink}
                  onChange={(e) => setUploadLink(e.target.value)}
                  placeholder="https://..."
                  type="url"
                />
              </div>
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

      {/* Preview Modal */}
      <MaterialPreview
        material={previewMaterial}
        isOpen={previewOpen}
        onClose={() => { setPreviewOpen(false); setPreviewMaterial(null); }}
        onDownload={() => previewMaterial && handleDownload(previewMaterial)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover material?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O material "{deleteConfirm?.title || deleteConfirm?.filename}" será removido permanentemente.
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

interface MaterialsListProps {
  materials: Material[];
  isLoading: boolean;
  emptyMessage: string;
  favoriteIds?: string[];
  onToggleFavorite: (material: Material) => void;
  onDownload: (material: Material) => void;
  onPreview: (material: Material) => void;
  onDelete: (material: Material) => void;
  canDelete: (material: Material) => boolean;
  showOwner: boolean;
}

function MaterialsList({
  materials,
  isLoading,
  emptyMessage,
  favoriteIds,
  onToggleFavorite,
  onDownload,
  onPreview,
  onDelete,
  canDelete,
  showOwner,
}: MaterialsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  if (materials.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {materials.map((material) => (
        <Card key={material.id} className="hover:shadow-sm transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="shrink-0 p-2 bg-muted rounded-lg">
                <FileIcon fileType={material.file_type} size={24} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-medium truncate">
                      {material.title || material.filename}
                    </h4>
                    {material.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {material.description}
                      </p>
                    )}
                  </div>
                  <FavoriteButton
                    isFavorite={favoriteIds?.includes(material.id) || false}
                    onToggle={() => onToggleFavorite(material)}
                    size="sm"
                  />
                </div>

                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                  {material.file_type !== 'link' && material.file_size && (
                    <span>{formatFileSize(material.file_size)}</span>
                  )}
                  <span>
                    {format(new Date(material.uploaded_at), "dd MMM yyyy", { locale: ptBR })}
                  </span>
                  {showOwner && material.owner_profile && (
                    <div className="flex items-center gap-1">
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={material.owner_profile.profile_photo_url || undefined} />
                        <AvatarFallback className="text-[8px]">
                          {material.owner_profile.full_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{material.owner_profile.full_name}</span>
                    </div>
                  )}
                  {material.visibility_scope === 'mentor_and_owner' && (
                    <Badge variant="secondary" className="text-xs">
                      Privado
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-3">
                  {material.file_type === 'link' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDownload(material)}
                      className="gap-1"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Abrir Link
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDownload(material)}
                        className="gap-1"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Baixar
                      </Button>
                      {isPreviewable(material.file_type) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onPreview(material)}
                          className="gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Visualizar
                        </Button>
                      )}
                    </>
                  )}
                  {canDelete(material) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(material)}
                      className="gap-1 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
