import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Link as LinkIcon, X, FileText } from 'lucide-react';
import { LibraryItem, LibraryItemType } from '@/types/global-library';
import { formatFileSize, ALLOWED_MIME_TYPES } from '@/lib/file-utils';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: LibraryItem | null;
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
  folderId,
  onSaveFile,
  onSaveLink,
  onUpdate,
  isPending,
}: ItemFormDialogProps) {
  const [itemType, setItemType] = useState<LibraryItemType>('file');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  const isEditing = !!item;

  useEffect(() => {
    if (open) {
      if (item) {
        setItemType(item.item_type);
        setTitle(item.title);
        setDescription(item.description || '');
        setLinkUrl(item.link_url || '');
        setTags(item.tags || []);
        setFiles([]);
      } else {
        setItemType('file');
        setTitle('');
        setDescription('');
        setLinkUrl('');
        setTags([]);
        setFiles([]);
        setTagInput('');
      }
    }
  }, [open, item]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
    if (!title && acceptedFiles.length === 1) {
      setTitle(acceptedFiles[0].name.replace(/\.[^/.]+$/, ''));
    }
  }, [title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_MIME_TYPES.reduce((acc, mime) => ({ ...acc, [mime]: [] }), {}),
    maxSize: 50 * 1024 * 1024,
  });

  const handleAddTag = () => {
    const newTag = tagInput.trim().toLowerCase();
    if (newTag && !tags.includes(newTag)) {
      setTags(prev => [...prev, newTag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = () => {
    if (isEditing) {
      onUpdate({
        id: item!.id,
        title: title.trim(),
        description: description.trim() || undefined,
        link_url: itemType === 'link' ? linkUrl.trim() : undefined,
        tags,
      });
    } else if (itemType === 'file') {
      if (files.length === 0) return;
      onSaveFile({
        title: title.trim(),
        description: description.trim() || undefined,
        tags,
        files,
      });
    } else {
      if (!linkUrl.trim()) return;
      onSaveLink({
        title: title.trim(),
        description: description.trim() || undefined,
        link_url: linkUrl.trim(),
        tags,
      });
    }
  };

  const isValid = () => {
    if (!title.trim()) return false;
    if (isEditing) return true;
    if (itemType === 'file') return files.length > 0;
    if (itemType === 'link') return !!linkUrl.trim();
    return false;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Editar Item' : 'Novo Item'}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? 'Edite as informacoes do item'
              : 'Adicione um arquivo ou link a esta pasta'}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-6">
          {/* Item Type */}
          {!isEditing && (
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={itemType} onValueChange={(v) => setItemType(v as LibraryItemType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="file">Arquivo (upload)</SelectItem>
                  <SelectItem value="link">Link (URL externa)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* File Upload */}
          {itemType === 'file' && !isEditing && (
            <div className="space-y-2">
              <Label>Arquivo</Label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary/30'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {isDragActive
                    ? 'Solte os arquivos aqui...'
                    : 'Arraste arquivos ou clique para selecionar'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, DOCX, XLSX, PPTX, ZIP, PNG, JPG (max 50MB)
                </p>
              </div>

              {files.length > 0 && (
                <div className="space-y-2 mt-2">
                  {files.map((file, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate flex-1">{file.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatFileSize(file.size)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Link URL */}
          {itemType === 'link' && (
            <div className="space-y-2">
              <Label>URL</Label>
              <div className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://exemplo.com/recurso"
                  type="url"
                />
              </div>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label>Titulo</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titulo do item"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Descricao (opcional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descricao breve do conteudo"
              rows={2}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags (opcional)</Label>
            <div className="flex items-center gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={handleAddTag}
                placeholder="Digite e pressione Enter"
                className="flex-1"
              />
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-0.5 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid() || isPending}>
            {isPending
              ? 'Salvando...'
              : isEditing
              ? 'Salvar'
              : itemType === 'file'
              ? `Enviar ${files.length > 1 ? `${files.length} arquivos` : 'arquivo'}`
              : 'Adicionar Link'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
