import { useEffect, useState } from 'react';
import { LibraryFolder } from '@/types/global-library';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Globe, Lock } from 'lucide-react';

interface FolderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder: LibraryFolder | null;
  parentId: string | null;
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

const FOLDER_ICONS = ['📁', '📂', '🎯', '📄', '💼', '🗣️', '🤝', '🌎', '🛂', '🧰', '⭐', '🔥', '💡', '📝', '🎓'];

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
  const [icon, setIcon] = useState('');
  const [description, setDescription] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [accessLevel, setAccessLevel] = useState<'public' | 'restricted'>('restricted');

  useEffect(() => {
    if (open) {
      setName(folder?.name ?? '');
      setIcon(folder?.icon ?? '');
      setDescription(folder?.description ?? '');
      setSelectedParentId(folder?.parent_id ?? parentId);
      setAccessLevel(folder?.access_level ?? 'restricted');
    }
  }, [open, folder, parentId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      icon: icon.trim() || undefined,
      description: description.trim() || undefined,
      parent_id: selectedParentId || null,
      access_level: accessLevel,
    });
  };

  // Flatten folders for parent select (exclude current folder and its descendants)
  const flatFolders = allFolders.filter((f) => f.id !== folder?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {folder ? 'Editar pasta' : 'Nova pasta'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="folder-name">Nome *</Label>
            <Input
              id="folder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Currículo Internacional"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Ícone</Label>
            <div className="flex gap-2 flex-wrap">
              {FOLDER_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(icon === emoji ? '' : emoji)}
                  className={`text-xl p-1 rounded hover:bg-muted transition-colors ${
                    icon === emoji ? 'bg-primary/10 ring-2 ring-primary/30' : ''
                  }`}
                >
                  {emoji}
                </button>
              ))}
              <Input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="ou cole um emoji"
                className="w-36 h-9"
                maxLength={2}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="folder-description">Descrição</Label>
            <Textarea
              id="folder-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcional"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Pasta pai</Label>
            <Select
              value={selectedParentId ?? 'none'}
              onValueChange={(v) => setSelectedParentId(v === 'none' ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Raiz (sem pasta pai)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Raiz (sem pasta pai)</SelectItem>
                {flatFolders.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.icon ? `${f.icon} ` : ''}{f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Acesso</Label>
            <RadioGroup
              value={accessLevel}
              onValueChange={(v) => setAccessLevel(v as 'public' | 'restricted')}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="public" id="access-public" />
                <Label htmlFor="access-public" className="flex items-center gap-1.5 cursor-pointer font-normal">
                  <Globe className="h-4 w-4 text-green-500" />
                  Público (todos os planos)
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="restricted" id="access-restricted" />
                <Label htmlFor="access-restricted" className="flex items-center gap-1.5 cursor-pointer font-normal">
                  <Lock className="h-4 w-4 text-amber-500" />
                  Restrito (Pro / VIP)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!name.trim() || isPending}>
              {isPending ? 'Salvando...' : folder ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
