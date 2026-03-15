import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2, Linkedin, Twitter, MessageSquare, Send, Clock,
  Check, X, RotateCcw, Image, ExternalLink, Copy, ChevronDown,
} from 'lucide-react';
import {
  useGenerateSocialPost,
  useSocialAccounts,
  useCreatePublication,
  useContentPublications,
  useCancelPublication,
} from '@/hooks/useContentPublishing';
import { useContentAssets } from '@/hooks/useContentAssets';
import type { ContentPiece } from '@/hooks/useAdminContentFactory';

interface PublishPopoverProps {
  piece: ContentPiece;
  platform: 'linkedin' | 'x' | 'threads';
  mediaAssets?: { id: string; public_url: string | null; position: number }[];
  sharedTexts?: Record<string, string>;
  onTextGenerated?: (platform: string, text: string) => void;
}

export function PublishPopover({ piece, platform, mediaAssets = [], sharedTexts, onTextGenerated }: PublishPopoverProps) {
  const [open, setOpen] = useState(false);
  const [postText, setPostText] = useState('');
  const [generated, setGenerated] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<'now' | 'schedule'>('now');
  const [scheduledAt, setScheduledAt] = useState('');
  const [suggestedTime, setSuggestedTime] = useState('');
  const [selectedVisualIds, setSelectedVisualIds] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();
  const generatePost = useGenerateSocialPost();
  const createPub = useCreatePublication();
  const cancelPub = useCancelPublication();
  const { data: accounts = [] } = useSocialAccounts();
  const { data: publications = [], refetch: refetchPubs } = useContentPublications(piece.id);
  const publishedPub = publications.find(p => p.platform === platform && p.status === 'published');
  const isPublished = !!publishedPub;
  const scheduledPub = publications.find(p => p.platform === platform && p.status === 'scheduled');
  const isScheduled = !!scheduledPub;
  const [showPreview, setShowPreview] = useState(false);

  // Fetch own assets (always when dialog open)
  const { data: ownAssets = [] } = useContentAssets(open ? piece.id : undefined);
  const ownSlides = ownAssets.filter(a => a.type === 'slide');
  const visuals = mediaAssets.length > 0 ? mediaAssets : ownSlides.map(a => ({ id: a.id, public_url: a.public_url, position: a.position }));

  // Initialize selection when visuals load
  useEffect(() => {
    if (open && visuals.length > 0 && selectedVisualIds.size === 0) {
      setSelectedVisualIds(new Set(visuals.map(v => v.id)));
    }
  }, [open, visuals.length]);

  // Pre-fill scheduledAt when switching to schedule mode with a suggested time
  useEffect(() => {
    if (scheduleMode === 'schedule' && suggestedTime && !scheduledAt) {
      setScheduledAt(suggestedTime);
    }
  }, [scheduleMode, suggestedTime]);

  const toggleVisual = (id: string) => {
    setSelectedVisualIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedVisuals = visuals.filter(v => selectedVisualIds.has(v.id));
  const selectedIds = selectedVisuals.map(v => v.id);

  const formatDatetimeLocal = (d: Date): string => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const getNextOptimalSlot = (_llmSuggestion?: string | null): string => {
    const peakHours: Record<string, number[]> = {
      linkedin: [8, 9, 10],
      x: [12, 13],
      threads: [12, 13, 19, 20],
    };
    const hours = peakHours[platform] || [9, 10];
    const now = new Date();
    for (let dayOffset = 0; dayOffset <= 1; dayOffset++) {
      for (const hour of hours) {
        const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, hour, 0, 0);
        if (target.getTime() > now.getTime()) {
          return formatDatetimeLocal(target);
        }
      }
    }
    const fallback = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, hours[0], 0, 0);
    return formatDatetimeLocal(fallback);
  };

  const applySuggestedTime = (post: { best_posting_time?: string | null }) => {
    const slot = getNextOptimalSlot(post.best_posting_time);
    setSuggestedTime(slot);
    if (!scheduledAt) setScheduledAt(slot);
  };

  const account = accounts.find(a => a.platform === platform);
  const isLinkedin = platform === 'linkedin';
  const isThreads = platform === 'threads';
  const PlatformIcon = isLinkedin ? Linkedin : isThreads ? MessageSquare : Twitter;
  const platformLabel = isLinkedin ? 'LinkedIn' : isThreads ? 'Threads' : 'X';
  const maxChars = isLinkedin ? 3000 : isThreads ? 500 : 280;

  const handleOpen = () => {
    setOpen(true);
    if (!generated) {
      const existingPub = publications.find(p => p.platform === platform && (p.status === 'scheduled' || p.status === 'draft'));
      if (existingPub) {
        setPostText(existingPub.post_text || '');
        setGenerated(true);
        if (existingPub.scheduled_at) {
          setScheduleMode('schedule');
          const d = new Date(existingPub.scheduled_at);
          const pad = (n: number) => String(n).padStart(2, '0');
          setScheduledAt(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
        }
        return;
      }
      const crossPostSource = platform === 'threads' ? sharedTexts?.['x'] : undefined;
      if (crossPostSource) {
        setPostText(crossPostSource);
        setGenerated(true);
        const slot = getNextOptimalSlot();
        setSuggestedTime(slot);
        setScheduleMode('schedule');
        setScheduledAt(slot);
        return;
      }
      generatePost.mutate(
        { pieceId: piece.id, platform },
        {
          onSuccess: (post) => {
            const fullText = post.hashtags?.length
              ? `${post.content}\n\n${post.hashtags.join(' ')}`
              : post.content;
            setPostText(fullText);
            setGenerated(true);
            onTextGenerated?.(platform, fullText);
            applySuggestedTime(post);
          },
        },
      );
    }
  };

  const handleRegenerate = () => {
    setGenerated(false);
    generatePost.mutate(
      { pieceId: piece.id, platform },
      {
        onSuccess: (post) => {
          const fullText = post.hashtags?.length
            ? `${post.content}\n\n${post.hashtags.join(' ')}`
            : post.content;
          setPostText(fullText);
          setGenerated(true);
          onTextGenerated?.(platform, fullText);
          applySuggestedTime(post);
        },
      },
    );
  };

  const handlePublish = () => {
    if (!postText.trim()) return;
    createPub.mutate(
      {
        piece_id: piece.id,
        platform,
        post_text: postText,
        media_asset_ids: (isLinkedin || isThreads) ? selectedIds : selectedIds.slice(0, 1),
        publish_now: scheduleMode === 'now',
        scheduled_at: scheduleMode === 'schedule' ? scheduledAt || null : null,
      },
      {
        onSuccess: (data: any) => {
          if (platform === 'x' && scheduleMode === 'schedule') {
            const threadsHours = [12, 13, 19, 20];
            const now = new Date();
            let threadsSlot: Date | null = null;
            for (let dayOff = 0; dayOff <= 1 && !threadsSlot; dayOff++) {
              for (const h of threadsHours) {
                const t = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOff, h, 0, 0);
                if (t.getTime() > now.getTime()) { threadsSlot = t; break; }
              }
            }
            if (!threadsSlot) threadsSlot = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12, 0, 0);
            createPub.mutate({
              piece_id: piece.id,
              platform: 'threads',
              post_text: postText,
              media_asset_ids: selectedIds,
              scheduled_at: threadsSlot.toISOString(),
            });
          }

          setOpen(false);
          setGenerated(false);
          setPostText('');
          setScheduleMode('now');
          setScheduledAt('');
          setSuggestedTime('');
          setSelectedVisualIds(new Set());
          const postUrl = data?.postUrl;
          if (postUrl) {
            navigator.clipboard.writeText(postUrl).catch(() => {});
          }
        },
      },
    );
  };

  return (
    <>
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          className={`h-8 gap-1 text-xs ${
            isPublished
              ? 'border-green-300 text-green-700 bg-green-50/50'
              : isScheduled
              ? 'border-orange-300 text-orange-700 bg-orange-50/50'
              : isLinkedin ? 'hover:border-blue-300 hover:text-blue-700'
              : isThreads ? 'hover:border-purple-300 hover:text-purple-700'
              : 'hover:border-gray-400'
          }`}
          onClick={isPublished ? () => setShowPreview(!showPreview) : handleOpen}
        >
          {isPublished ? (
            <Check className="w-3 h-3 text-green-600" />
          ) : isScheduled ? (
            <Clock className="w-3 h-3 text-orange-500" />
          ) : (
            <PlatformIcon className={`w-3 h-3 ${isLinkedin ? 'text-blue-600' : isThreads ? 'text-purple-600' : ''}`} />
          )}
          {platformLabel}
          {isPublished && (
            <ChevronDown className={`w-3 h-3 transition-transform ${showPreview ? 'rotate-180' : ''}`} />
          )}
          {isScheduled && scheduledPub?.scheduled_at && (
            <>
              <span className="text-[10px] text-orange-600 font-normal">
                {new Date(scheduledPub.scheduled_at).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
              </span>
              <span
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  cancelPub.mutate(scheduledPub.id, {
                    onSuccess: () => {
                      queryClient.invalidateQueries({ queryKey: ['content-publications', piece.id] });
                      refetchPubs();
                    },
                  });
                }}
                className="ml-0.5 rounded-full hover:bg-red-100 p-0.5 transition-colors"
              >
                <X className="w-3 h-3 text-red-500" />
              </span>
            </>
          )}
        </Button>

        {/* Published post preview popover */}
        {showPreview && publishedPub && (
          <div className="absolute top-full left-0 mt-1 z-50 w-80 bg-white rounded-lg border shadow-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <PlatformIcon className={`w-3.5 h-3.5 ${isLinkedin ? 'text-blue-600' : isThreads ? 'text-purple-600' : ''}`} />
                <span className="text-xs font-medium">{platformLabel}</span>
                <span className="text-[10px] text-emerald-600">publicado</span>
              </div>
              <div className="flex items-center gap-1">
                {publishedPub.platform_post_url && (
                  <a
                    href={publishedPub.platform_post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded hover:bg-muted transition-colors"
                    title="Ver post na plataforma"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-primary" />
                  </a>
                )}
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(publishedPub.post_text || '');
                  }}
                  className="p-1 rounded hover:bg-muted transition-colors"
                  title="Copiar texto"
                >
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-1 rounded hover:bg-muted transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-foreground whitespace-pre-line line-clamp-[12] max-h-48 overflow-y-auto">
              {publishedPub.post_text}
            </p>
            {publishedPub.published_at && (
              <p className="text-[10px] text-muted-foreground">
                {new Date(publishedPub.published_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        )}
      </div>

      {open && (
        <Dialog open onOpenChange={(v) => { if (!v) setOpen(false); }}>
          <DialogContent className="max-w-3xl w-[95vw] sm:w-full p-0 gap-0 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <div className="flex items-center gap-2">
                <PlatformIcon className={`w-5 h-5 ${isLinkedin ? 'text-blue-600' : isThreads ? 'text-purple-600' : ''}`} />
                <span className="text-base font-semibold">Publicar no {platformLabel}</span>
                {!account && (
                  <Badge variant="outline" className="text-[10px] text-amber-600">Nao conectado</Badge>
                )}
              </div>
              {generated && (
                <button
                  onClick={handleRegenerate}
                  disabled={generatePost.isPending}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {generatePost.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  {platform === 'threads' && sharedTexts?.['x'] && !generatePost.data ? 'Gerar versao Threads' : 'Regenerar texto'}
                </button>
              )}
            </div>

            {/* Loading */}
            {generatePost.isPending && !generated && (
              <div className="flex items-center justify-center py-16 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                <span className="text-sm text-muted-foreground">Gerando post otimizado para {platformLabel}...</span>
              </div>
            )}

            {/* Error */}
            {generatePost.isError && !generated && !generatePost.isPending && (
              <div className="text-center py-12 space-y-3">
                <p className="text-sm text-red-600">Erro ao gerar post</p>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={handleRegenerate}>
                  <RotateCcw className="w-3.5 h-3.5" /> Tentar novamente
                </Button>
              </div>
            )}

            {/* Content: text + visuals side by side */}
            {(generated || postText) && (
              <div className="flex flex-col sm:flex-row">
                {/* Left: text editor */}
                <div className="flex-1 p-3 sm:p-5 space-y-3 min-w-0">
                  <Textarea
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    rows={isLinkedin ? 12 : isThreads ? 8 : 5}
                    className="text-sm resize-y"
                    placeholder={`Texto do post para ${platformLabel}...`}
                  />
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${postText.length > maxChars ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                      {postText.length}/{maxChars} chars
                    </span>
                  </div>

                  {/* Schedule */}
                  <div className="flex items-center gap-2 pt-2 border-t flex-wrap">
                    <button
                      onClick={() => setScheduleMode('now')}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors ${
                        scheduleMode === 'now' ? 'bg-orange-100 text-orange-700 font-medium' : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" /> Agora
                    </button>
                    <button
                      onClick={() => setScheduleMode('schedule')}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors ${
                        scheduleMode === 'schedule' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" /> Agendar
                    </button>
                    {scheduleMode === 'schedule' && (
                      <input
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                        className="text-xs border rounded px-2 py-1.5 h-8 w-full sm:w-auto sm:flex-1"
                      />
                    )}
                  </div>
                  {suggestedTime && scheduleMode === 'now' && (
                    <button
                      onClick={() => { setScheduleMode('schedule'); setScheduledAt(suggestedTime); }}
                      className="flex items-center gap-1.5 text-[11px] text-orange-600 hover:text-orange-700 transition-colors"
                    >
                      <Clock className="w-3 h-3" />
                      Agendar no horario ideal: {new Date(suggestedTime).toLocaleString('pt-BR', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                    </button>
                  )}

                  {/* Publish button */}
                  <Button
                    className="w-full gap-2"
                    onClick={handlePublish}
                    disabled={createPub.isPending || !postText.trim() || !account || (scheduleMode === 'schedule' && !scheduledAt)}
                  >
                    {createPub.isPending
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : scheduleMode === 'now' ? <Send className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    {scheduleMode === 'now' ? 'Publicar agora' : 'Agendar publicacao'}
                  </Button>
                </div>

                {/* Right: visual selection */}
                {visuals.length === 0 && piece.carousel_slides?.length > 0 && (
                  <div className="w-full sm:w-64 border-t sm:border-t-0 sm:border-l p-3 sm:p-4 bg-muted/20 shrink-0 flex flex-col items-center justify-center gap-2">
                    <Image className="w-6 h-6 text-muted-foreground/50" />
                    <p className="text-xs text-muted-foreground text-center">
                      Gere os visuais (PNGs) primeiro para anexar slides ao post.
                    </p>
                  </div>
                )}
                {visuals.length > 0 && (
                  <div className="w-full sm:w-64 border-t sm:border-t-0 sm:border-l p-3 sm:p-4 bg-muted/20 space-y-3 shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Image className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">
                          {selectedVisualIds.size}/{visuals.length} visuais
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          if (selectedVisualIds.size === visuals.length) setSelectedVisualIds(new Set());
                          else setSelectedVisualIds(new Set(visuals.map(v => v.id)));
                        }}
                        className="text-[10px] text-muted-foreground hover:text-foreground"
                      >
                        {selectedVisualIds.size === visuals.length ? 'Nenhum' : 'Todos'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {visuals.map((asset) => {
                        const isSelected = selectedVisualIds.has(asset.id);
                        return (
                          <button
                            key={asset.id}
                            type="button"
                            onClick={() => toggleVisual(asset.id)}
                            className="relative group"
                          >
                            <img
                              src={asset.public_url || ''}
                              alt={`Slide ${asset.position}`}
                              className={`w-full aspect-square rounded-lg border-2 object-cover transition-all ${
                                isSelected ? 'border-orange-400 opacity-100' : 'border-transparent opacity-40 grayscale'
                              }`}
                            />
                            <div className={`absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold ${
                              isSelected ? 'bg-orange-500' : 'bg-gray-400'
                            }`}>
                              {isSelected ? asset.position : ''}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {platform === 'x' && (
                      <p className="text-[10px] text-muted-foreground">
                        Apenas 1 imagem sera enviada no X (capa)
                      </p>
                    )}
                    {isThreads && (
                      <p className="text-[10px] text-muted-foreground">
                        Threads suporta carousel (2-20 imagens)
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
