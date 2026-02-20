import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Image as ImageIcon,
  Hash,
  X,
  Loader2,
  Send,
} from 'lucide-react';
import { CommunityCategory } from '@/types/community';
import { UserGamification } from '@/types/community';
import { useCommunityImageUpload } from '@/hooks/useCommunityImageUpload';
import { LinkPreview, extractFirstUrl } from './LinkPreview';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

interface InlinePostCreatorProps {
  categories: CommunityCategory[];
  userStats: UserGamification | null;
  onSubmit: (title: string, content: string, categoryId?: string, imageUrl?: string) => Promise<any>;
}

export function InlinePostCreator({ categories, userStats, onSubmit }: InlinePostCreatorProps) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Image upload
  const { upload, uploading } = useCommunityImageUpload();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Link preview
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null);
  const [linkDismissed, setLinkDismissed] = useState(false);
  const linkDetectTimer = useRef<ReturnType<typeof setTimeout>>();

  // Auto-resize textarea
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  // Avatar
  const userInitials = userStats?.profiles?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

  // Detect URLs in content (debounced)
  useEffect(() => {
    if (linkDetectTimer.current) clearTimeout(linkDetectTimer.current);
    if (linkDismissed) return;

    linkDetectTimer.current = setTimeout(() => {
      const url = extractFirstUrl(content);
      setDetectedUrl(url);
    }, 500);

    return () => {
      if (linkDetectTimer.current) clearTimeout(linkDetectTimer.current);
    };
  }, [content, linkDismissed]);

  const handleExpand = useCallback(() => {
    setExpanded(true);
    setTimeout(() => titleRef.current?.focus(), 50);
  }, []);

  const handleCollapse = useCallback(() => {
    setExpanded(false);
    setTitle('');
    setContent('');
    setCategoryId('');
    setImagePreview(null);
    setUploadedImageUrl(null);
    setDetectedUrl(null);
    setLinkDismissed(false);
  }, []);

  const handleImageSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);

    // Expand if not already
    if (!expanded) {
      setExpanded(true);
      setTimeout(() => titleRef.current?.focus(), 50);
    }

    // Upload to Supabase
    const publicUrl = await upload(file);
    if (publicUrl) {
      setUploadedImageUrl(publicUrl);
    } else {
      // Upload failed, remove preview
      setImagePreview(null);
      URL.revokeObjectURL(localUrl);
    }

    // Reset input so the same file can be selected again
    e.target.value = '';
  }, [expanded, upload]);

  const removeImage = useCallback(() => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setUploadedImageUrl(null);
  }, [imagePreview]);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast({ title: 'Preencha o título e o conteúdo', variant: 'destructive' });
      return;
    }
    if (uploading) {
      toast({ title: 'Aguarde o envio da imagem', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onSubmit(
        title.trim(),
        content.trim(),
        categoryId || undefined,
        uploadedImageUrl || undefined,
      );
      if (result) {
        handleCollapse();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHashtagClick = useCallback(() => {
    if (!expanded) {
      setExpanded(true);
      setTimeout(() => titleRef.current?.focus(), 50);
    }
    // Focus content area and prepend #
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const val = textareaRef.current.value;
        if (!val.endsWith('#') && !val.endsWith(' ')) {
          setContent(prev => prev + (prev ? ' ' : '') + '#');
        } else if (!val.endsWith('#')) {
          setContent(prev => prev + '#');
        }
      }
    }, 100);
  }, [expanded]);

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.max(80, el.scrollHeight) + 'px';
    }
  }, []);

  // Hidden file input
  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      className="hidden"
      onChange={handleFileChange}
    />
  );

  // --- Collapsed state ---
  if (!expanded) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {fileInput}
        <div className="flex gap-4 mb-4">
          <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs overflow-hidden flex-shrink-0">
            {userStats?.profiles?.profile_photo_url ? (
              <img src={userStats.profiles.profile_photo_url} className="w-full h-full object-cover" alt="" />
            ) : (
              userInitials
            )}
          </div>
          <div
            className="flex-1 relative cursor-pointer"
            onClick={handleExpand}
          >
            <input
              type="text"
              placeholder="Compartilhe algo..."
              className="w-full bg-gray-50 border-none rounded-full py-2.5 px-5 text-sm outline-none cursor-pointer"
              readOnly
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleImageSelect}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors"
          >
            <ImageIcon className="w-5 h-5 text-blue-500" />
            <span className="text-xs font-semibold hidden sm:inline">Imagem</span>
          </button>
          <button
            onClick={handleHashtagClick}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors"
          >
            <Hash className="w-5 h-5 text-red-500" />
            <span className="text-xs font-semibold hidden sm:inline">Hashtag</span>
          </button>
        </div>
      </div>
    );
  }

  // --- Expanded state ---
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all">
      {fileInput}
      <div className="flex gap-4">
        <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs overflow-hidden flex-shrink-0">
          {userStats?.profiles?.profile_photo_url ? (
            <img src={userStats.profiles.profile_photo_url} className="w-full h-full object-cover" alt="" />
          ) : (
            userInitials
          )}
        </div>
        <div className="flex-1 space-y-3">
          {/* Title */}
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Qual é sua dúvida ou tema?"
            className="w-full text-sm font-bold text-gray-900 placeholder-gray-400 outline-none border-b border-gray-100 pb-2"
          />

          {/* Content */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              autoResize();
            }}
            placeholder="Descreva sua questão, compartilhe sua experiência..."
            className="w-full text-sm text-gray-700 placeholder-gray-400 outline-none resize-none min-h-[80px]"
          />

          {/* Image preview */}
          {imagePreview && (
            <div className="relative rounded-xl overflow-hidden border border-gray-200">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full max-h-64 object-cover"
              />
              <button
                onClick={removeImage}
                className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              {uploading && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>
          )}

          {/* Link preview */}
          {detectedUrl && !linkDismissed && (
            <LinkPreview
              url={detectedUrl}
              onRemove={() => setLinkDismissed(true)}
            />
          )}

          {/* Category + Actions row */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-50">
            <div className="flex items-center gap-3">
              <button
                onClick={handleImageSelect}
                className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 transition-colors"
                disabled={uploading}
              >
                <ImageIcon className="w-5 h-5 text-blue-500" />
              </button>
              <button
                onClick={handleHashtagClick}
                className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 transition-colors"
              >
                <Hash className="w-5 h-5 text-red-500" />
              </button>

              {/* Compact category selector */}
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="h-8 w-auto min-w-[130px] text-xs rounded-lg border-gray-200 bg-gray-50">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id} className="text-xs">
                      #{category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCollapse}
                className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!title.trim() || !content.trim() || isSubmitting || uploading}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-colors"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Publicar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
