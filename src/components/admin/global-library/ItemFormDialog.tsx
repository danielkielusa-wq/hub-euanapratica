import { useEffect, useRef, useState } from 'react';
import { LibraryItem } from '@/types/global-library';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Upload, Link, X, FileUp } from 'lucide-react';

interface ItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: LibraryItem | null;
  folderId: string;
  onSaveFile: (data: { title: string; description?: string; tags: string[]; files: File[] }) => void;
  onSaveLink: (data: { title: string; description?: string; link_url: string; tags: string[] }) => void;
  onUpdate: (data: { id: string; title: string; description?: string; link_url?: string; tags: string[] }) => void;
  isPending: boolean;
}

export function ItemFormDialog({
  open,
  onOpenChange,
  item,
  folderId: _folderId,
  onSaveFile,
  onSaveLink,
  onUpdate,
  isPending,
}: ItemFormDialogProps) {
  const [tab, setTab] = useState<'file' | 'link'>('file');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const isEdit = !!item;

  useEffect(() => {
    if (open) {
      setTitle(item?.title ?? '');
      setDescription(item?.description ?? '');
      setLinkUrl(item?.link_url ?? '');
      setTags(item?.tags ?? []);
      setTagInput('');
      setFiles([]);
      setTab(item?.item_type === 'link' ? 'link' : 'file');
    }
  }, [open, item]);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      if (!title && e.target.files[0]) {
        setTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      onUpdate({
        id: item.id,
        title: title.trim(),
        description: description.trim() || undefined,
        link_url: item.item_type === 'link' ? linkUrl.trim() : undefined,
        tags,
      });
      return;
    }
    if (tab === 'file') {
      if (!files.length) return;
      onSaveFile({ title: title.trim(), description: description.trim() || undefined, tags, files });
    } else {
      if (!linkUrl.trim() || !title.trim()) return;
      onSaveLink({ title: title.trim(), description: description.trim() || undefined, link_url: linkUrl.trim(), tags });
    }
  };

  const canSubmit = isEdit
    ? !!title.trim()
    : tab === 'file'
    ? files.length > 0
    : !!title.trim() && !!linkUrl.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar item' : 'Novo item'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit && (
            <Tabs value={tab} onValueChange={(v) => setTab(v as 'file' | 'link')}>
              <TabsList className="w-full">
                <TabsTrigger value="file" className="flex-1">
                  <Upload className="h-4 w-4 mr-2" />
                  Arquivo
                </TabsTrigger>
                <TabsTrigger value="link" className="flex-1">
                  <Link className="h-4 w-4 mr-2" />
                  Link
                </TabsTrigger>
              </TabsList>

              <TabsContent value="file" className="mt-4 space-y-4">
                <div
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileRef.current?.click()}
                >
                  <FileUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {files.length > 0
                      ? files.map((f) => f.name).join(', ')
                      : 'Clique para selecionar arquivo(s)'}
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.png,.jpg,.jpeg"
                  />
                </div>
                {isPending && files.length > 0 && (
                  <Progress value={50} className="h-1.5" />
                )}
              </TabsContent>

              <TabsContent value="link" className="mt-4">
                <div className="space-y-2">
                  <Label htmlFor="link-url">URL *</Label>
                  <Input
                    id="link-url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://..."
                    type="url"
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}

          {isEdit && item?.item_type === 'link' && (
            <div className="space-y-2">
              <Label htmlFor="edit-link-url">URL</Label>
              <Input
                id="edit-link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                type="url"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="item-title">Título {(!isEdit && tab === 'link') ? '*' : ''}</Label>
            <Input
              id="item-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome do material"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-description">Descrição</Label>
            <Textarea
              id="item-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcional"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Digite e pressione Enter"
                className="flex-1"
              />
              <Button type="button" variant="outline" size="sm" onClick={addTag}>
                Adicionar
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSubmit || isPending}>
              {isPending ? 'Salvando...' : isEdit ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
