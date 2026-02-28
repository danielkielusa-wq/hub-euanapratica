import { useState, useEffect } from 'react';
import { LibraryFolder } from '@/types/global-library';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

interface FolderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder?: LibraryFolder | null;
  parentId?: string | null;
  allFolders: LibraryFolder[];
  onSave: (data: {
    name: string;
    description?: string;
    icon?: string;
    parent_id?: string | null;
    access_level: 'public' | 'restricted';
  }) => void;
  isPending: boolean;
}

export function FolderFormDialog({
  open,
  onOpenChange,
  folder,
  parentId,
  allFolders,
  onSave,
  isPending,
}: FolderFormDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string>('none');
  const [accessLevel, setAccessLevel] = useState<'public' | 'restricted'>('public');

  const isEditing = !!folder;

  useEffect(() => {
    if (open) {
      if (folder) {
        setName(folder.name);
        setDescription(folder.description || '');
        setIcon(folder.icon || '');
        setSelectedParentId(folder.parent_id || 'none');
        setAccessLevel(folder.access_level);
      } else {
        setName('');
        setDescription('');
        setIcon('');
        setSelectedParentId(parentId || 'none');
        setAccessLevel('public');
      }
    }
  }, [open, folder, parentId]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      icon: icon.trim() || undefined,
      parent_id: selectedParentId === 'none' ? null : selectedParentId,
      access_level: accessLevel,
    });
  };

  // Flatten folders for parent selector (exclude self and descendants when editing)
  const getAvailableParents = (): LibraryFolder[] => {
    if (!folder) return allFolders;

    const excludeIds = new Set<string>();
    const collectDescendants = (id: string) => {
      excludeIds.add(id);
      allFolders.filter(f => f.parent_id === id).forEach(f => collectDescendants(f.id));
    };
    collectDescendants(folder.id);

    return allFolders.filter(f => !excludeIds.has(f.id));
  };

  const availableParents = getAvailableParents();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Pasta' : 'Nova Pasta'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Edite as informacoes da pasta'
              : 'Crie uma nova pasta na biblioteca'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-[1fr_80px] gap-3">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Modelos de Curriculo"
              />
            </div>
            <div className="space-y-2">
              <Label>Icone</Label>
              <Input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="📁"
                className="text-center text-lg"
                maxLength={4}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descricao (opcional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descricao do conteudo desta pasta"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Pasta Pai</Label>
            <Select value={selectedParentId} onValueChange={setSelectedParentId}>
              <SelectTrigger>
                <SelectValue placeholder="Raiz (nenhuma)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Raiz (nenhuma)</SelectItem>
                {availableParents.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.icon ? `${f.icon} ` : ''}{f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nivel de Acesso</Label>
            <Select value={accessLevel} onValueChange={(v) => setAccessLevel(v as 'public' | 'restricted')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Publico (todos os usuarios)</SelectItem>
                <SelectItem value="restricted">Restrito (apenas assinantes Pro/VIP)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || isPending}>
            {isPending ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar Pasta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
