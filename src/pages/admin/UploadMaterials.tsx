import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FolderPlus, ArrowLeft } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { UploadZone } from '@/components/library-admin/UploadZone';
import { useFolders, useCreateFolder } from '@/hooks/useFolders';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useEspacos } from '@/hooks/useEspacos';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { AccessLevel } from '@/types/library';

export default function UploadMaterials() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: espacos } = useEspacos();
  const { data: folders } = useFolders();
  const createFolder = useCreateFolder();
  const { uploads, uploadMultiple, clearUploads, removeUpload, isUploading } = useFileUpload();

  const [selectedEspaco, setSelectedEspaco] = useState<string>('');
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('restricted');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  
  // New folder dialog
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');

  const espacoFolders = folders?.filter(f => f.espaco_id === selectedEspaco) || [];

  const handleFilesSelected = (files: File[]) => {
    setPendingFiles(prev => [...prev, ...files]);
  };

  const handleRemoveFile = (file: File) => {
    setPendingFiles(prev => prev.filter(f => f !== file));
    removeUpload(file);
  };

  const handleUpload = async () => {
    if (!selectedFolder) {
      toast({
        title: 'Selecione uma pasta',
        description: 'Escolha a pasta de destino antes de fazer upload.',
        variant: 'destructive',
      });
      return;
    }

    if (pendingFiles.length === 0) {
      toast({
        title: 'Nenhum arquivo',
        description: 'Adicione arquivos para fazer upload.',
        variant: 'destructive',
      });
      return;
    }

    const results = await uploadMultiple(pendingFiles, {
      folderId: selectedFolder,
      accessLevel,
    });

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    if (successCount > 0) {
      toast({
        title: 'Upload concluído',
        description: `${successCount} arquivo(s) enviado(s) com sucesso.${errorCount > 0 ? ` ${errorCount} falharam.` : ''}`,
      });
    }

    if (successCount > 0 && errorCount === 0) {
      setPendingFiles([]);
    }
  };

  const handleCreateFolder = async () => {
    if (!selectedEspaco || !newFolderName.trim()) return;

    try {
      const result = await createFolder.mutateAsync({
        name: newFolderName.trim(),
        description: newFolderDesc.trim() || undefined,
        espaco_id: selectedEspaco,
      });

      setSelectedFolder(result.id);
      setNewFolderOpen(false);
      setNewFolderName('');
      setNewFolderDesc('');

      toast({
        title: 'Pasta criada',
        description: `A pasta "${newFolderName}" foi criada com sucesso.`,
      });
    } catch (error) {
      toast({
        title: 'Erro ao criar pasta',
        description: 'Não foi possível criar a pasta. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Upload className="h-6 w-6" />
              Upload de Materiais
            </h1>
            <p className="text-muted-foreground">
              Adicione novos materiais à biblioteca
            </p>
          </div>
        </div>

        {/* Destination Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Destino</CardTitle>
            <CardDescription>
              Selecione o espaço e a pasta onde os materiais serão salvos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Espaço/Turma</Label>
                <Select value={selectedEspaco} onValueChange={(v) => {
                  setSelectedEspaco(v);
                  setSelectedFolder('');
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o espaço" />
                  </SelectTrigger>
                  <SelectContent>
                    {espacos?.map(espaco => (
                      <SelectItem key={espaco.id} value={espaco.id}>
                        {espaco.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Pasta/Módulo</Label>
                <div className="flex gap-2">
                  <Select 
                    value={selectedFolder} 
                    onValueChange={setSelectedFolder}
                    disabled={!selectedEspaco}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={selectedEspaco ? "Selecione a pasta" : "Selecione um espaço primeiro"} />
                    </SelectTrigger>
                    <SelectContent>
                      {espacoFolders.map(folder => (
                        <SelectItem key={folder.id} value={folder.id}>
                          {folder.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" disabled={!selectedEspaco}>
                        <FolderPlus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nova Pasta</DialogTitle>
                        <DialogDescription>
                          Crie uma nova pasta para organizar os materiais
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Nome da Pasta</Label>
                          <Input
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="Ex: Módulo 1 - Introdução"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Descrição (opcional)</Label>
                          <Textarea
                            value={newFolderDesc}
                            onChange={(e) => setNewFolderDesc(e.target.value)}
                            placeholder="Descrição do conteúdo desta pasta"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setNewFolderOpen(false)}>
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleCreateFolder}
                          disabled={!newFolderName.trim() || createFolder.isPending}
                        >
                          Criar Pasta
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nível de Acesso</Label>
              <Select value={accessLevel} onValueChange={(v) => setAccessLevel(v as AccessLevel)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restricted">Restrito (apenas matriculados)</SelectItem>
                  <SelectItem value="public">Público (todos os alunos)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Upload Zone */}
        <Card>
          <CardHeader>
            <CardTitle>Arquivos</CardTitle>
            <CardDescription>
              Arraste arquivos ou clique para selecionar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UploadZone
              onFilesSelected={handleFilesSelected}
              uploads={uploads.length > 0 ? uploads : pendingFiles.map(f => ({ file: f, progress: 0, status: 'pending' as const }))}
              onRemoveFile={handleRemoveFile}
              disabled={isUploading}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleUpload}
            disabled={!selectedFolder || pendingFiles.length === 0 || isUploading}
          >
            {isUploading ? 'Enviando...' : `Enviar ${pendingFiles.length} arquivo(s)`}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
