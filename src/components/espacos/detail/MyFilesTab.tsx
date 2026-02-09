import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  Cloud, 
  Eye, 
  Trash2, 
  FileText, 
  Loader2,
  FolderOpen
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatFileSize, getFileTypeFromName } from '@/lib/file-utils';
import { FileIcon } from '@/components/library/FileIcon';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useMaterialsByEspaco, useCreateMaterialWithOwner, useDeleteMaterial } from '@/hooks/useMaterials';
import { useFolders, useCreateFolder } from '@/hooks/useFolders';
import type { FileType, Material } from '@/types/library';
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

interface MyFilesTabProps {
  espacoId: string;
}

export function MyFilesTab({ espacoId }: MyFilesTabProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Material | null>(null);

  const { data: folders } = useFolders(espacoId);
  const { data: myFiles, isLoading } = useMaterialsByEspaco(espacoId, 'mentor_and_owner', user?.id);
  const createMaterial = useCreateMaterialWithOwner();
  const deleteMaterial = useDeleteMaterial();
  const createFolder = useCreateFolder();

  const ensureFolder = async () => {
    if (!folders?.length) {
      await createFolder.mutateAsync({
        name: 'Materiais',
        espaco_id: espacoId,
      });
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) return;
    
    setIsUploading(true);
    
    try {
      await ensureFolder();
      
      for (const file of acceptedFiles) {
        const filePath = `${espacoId}/${Date.now()}_${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('materials')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const fileType = getFileTypeFromName(file.name) as FileType;
        const folderList = await supabase
          .from('folders')
          .select('id')
          .eq('espaco_id', espacoId)
          .limit(1);

        if (folderList.data?.[0]) {
          await createMaterial.mutateAsync({
            folder_id: folderList.data[0].id,
            filename: file.name,
            title: file.name.replace(/\.[^/.]+$/, ''),
            file_url: filePath,
            file_size: file.size,
            file_type: fileType,
            owner_user_id: user.id,
            owner_role: 'student',
            visibility_scope: 'mentor_and_owner',
          });
        }
      }
      
      toast.success(`${acceptedFiles.length} arquivo(s) enviado(s) com sucesso!`);
    } catch (error) {
      toast.error('Erro ao enviar arquivo(s)');
    } finally {
      setIsUploading(false);
    }
  }, [user, espacoId, createMaterial]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/zip': ['.zip'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    disabled: isUploading,
  });

  const handleDelete = async (material: Material) => {
    await deleteMaterial.mutateAsync({ id: material.id, file_url: material.file_url });
    setDeleteConfirm(null);
    toast.success('Arquivo removido');
  };

  const handleView = (material: Material) => {
    if (material.file_type === 'link') {
      window.open(material.file_url, '_blank');
    } else {
      // Get signed URL and open
      supabase.storage
        .from('materials')
        .createSignedUrl(material.file_url, 3600)
        .then(({ data, error }) => {
          if (data?.signedUrl) {
            window.open(data.signedUrl, '_blank');
          }
        });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">Seus Arquivos</h2>
        <p className="text-sm text-muted-foreground">
          Materiais enviados por você, visíveis apenas para você e os mentores.
        </p>
      </div>

      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-[20px] p-8 text-center cursor-pointer transition-all
          ${isDragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-amber-300 dark:border-amber-500/50 hover:border-primary hover:bg-muted/50'
          }
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center">
          {isUploading ? (
            <Loader2 className="h-12 w-12 text-muted-foreground mb-3 animate-spin" />
          ) : (
            <Cloud className="h-12 w-12 text-amber-500 dark:text-amber-400 mb-3" />
          )}
          <p className="text-foreground font-medium mb-1">
            {isDragActive ? 'Solte o arquivo aqui' : 'Clique para enviar ou arraste'}
          </p>
          <p className="text-sm text-muted-foreground">
            PDF, DOC, DOCX, XLS, XLSX, ZIP, PNG, JPG (max 50MB)
          </p>
        </div>
      </div>

      {/* Files List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 rounded-[16px] bg-muted animate-pulse" />
          ))}
        </div>
      ) : !myFiles || myFiles.length === 0 ? (
        <Card className="rounded-[20px] border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Você ainda não enviou nenhum arquivo</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {myFiles.map((material) => (
            <Card key={material.id} className="rounded-[16px] border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <FileIcon fileType={material.file_type} size={20} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate">
                      {material.title || material.filename}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {material.file_size && (
                        <span>{formatFileSize(material.file_size)}</span>
                      )}
                      <span>•</span>
                      <span>{format(new Date(material.uploaded_at), "dd MMM yyyy", { locale: ptBR })}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => handleView(material)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteConfirm(material)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
