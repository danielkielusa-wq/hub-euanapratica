import { useState, useMemo } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday as isTodayFn,
  addMonths, subMonths, format,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DndContext, DragOverlay,
  useDraggable, useDroppable,
  PointerSensor, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Copy, Check, Clock, Zap, Target, Eye, Hash, Image, Youtube,
  GripVertical, X, CalendarDays,
} from 'lucide-react';
import {
  useContentScripts, useUpdateScript,
  useContentSocialPosts, useUpdateSocialPost,
  type ContentScript,
  type ContentSocialPost,
} from '@/hooks/useAdminContentStudio';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// ── Constants ────────────────────────────────────────────────────────────

const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

const PLATFORM_COLORS: Record<string, string> = {
  youtube: 'bg-red-100 text-red-700 border-red-200',
  instagram_reels: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  tiktok: 'bg-pink-100 text-pink-700 border-pink-200',
  stories: 'bg-amber-100 text-amber-700 border-amber-200',
};

const PLATFORM_LABELS: Record<string, string> = {
  youtube: 'YouTube',
  instagram_reels: 'Reels',
  tiktok: 'TikTok',
  stories: 'Stories',
};

const STATUS_BORDER: Record<string, string> = {
  draft: 'border-l-gray-400',
  review: 'border-l-blue-400',
  approved: 'border-l-green-400',
  recorded: 'border-l-emerald-500',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  review: 'Review',
  approved: 'Aprovado',
  recorded: 'Gravado',
};

const SOCIAL_BORDER: Record<string, string> = {
  linkedin: 'border-l-blue-500',
  x: 'border-l-gray-800',
};

const SOCIAL_BADGE: Record<string, { label: string; className: string }> = {
  linkedin: { label: 'LI', className: 'bg-blue-100 text-blue-700' },
  x: { label: 'X', className: 'bg-gray-800 text-white' },
};

// ── DraggableScriptPill ──────────────────────────────────────────────────

function DraggableScriptPill({
  script,
  onClick,
}: {
  script: ContentScript;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: script.id,
    data: { script },
  });

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        'w-full text-left px-2 py-1 rounded-md text-[11px] font-medium truncate',
        'border-l-[3px] bg-white border border-gray-200 shadow-sm',
        'hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing',
        STATUS_BORDER[script.status] || 'border-l-gray-300',
        isDragging && 'opacity-30',
      )}
      title={script.title}
    >
      <div className="flex items-center gap-1">
        <GripVertical className="w-3 h-3 text-gray-400 shrink-0" />
        <span className="truncate">{script.title}</span>
      </div>
      <div className="flex items-center gap-1 mt-0.5">
        <span className={cn('text-[9px] px-1 rounded', PLATFORM_COLORS[script.platform] || 'bg-gray-100')}>
          {PLATFORM_LABELS[script.platform] || script.platform}
        </span>
        {script.virality_score != null && script.virality_score !== 50 && (
          <span className="text-[9px] text-orange-600 flex items-center">
            <Zap className="w-2.5 h-2.5" />{script.virality_score}
          </span>
        )}
      </div>
    </button>
  );
}

// ── DraggableSocialPill ──────────────────────────────────────────────────

function DraggableSocialPill({
  post,
  onClick,
}: {
  post: ContentSocialPost;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `social-${post.id}`,
    data: { socialPost: post },
  });

  const badge = SOCIAL_BADGE[post.platform] || { label: '?', className: 'bg-gray-100' };

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        'w-full text-left px-2 py-1 rounded-md text-[10px] font-medium truncate',
        'border-l-[3px] bg-white border border-gray-200 shadow-sm',
        'hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing',
        SOCIAL_BORDER[post.platform] || 'border-l-gray-400',
        isDragging && 'opacity-30',
      )}
      title={post.content.slice(0, 80)}
    >
      <div className="flex items-center gap-1">
        <GripVertical className="w-2.5 h-2.5 text-gray-400 shrink-0" />
        <span className={cn('text-[8px] px-1 rounded font-bold shrink-0', badge.className)}>
          {badge.label}
        </span>
        <span className="truncate">{post.content.slice(0, 40)}</span>
      </div>
    </button>
  );
}

// ── DroppableDayCell ─────────────────────────────────────────────────────

function DroppableDayCell({
  date,
  currentMonth,
  scripts,
  socialPosts,
  onScriptClick,
  onSocialPostClick,
}: {
  date: Date;
  currentMonth: Date;
  scripts: ContentScript[];
  socialPosts: ContentSocialPost[];
  onScriptClick: (script: ContentScript) => void;
  onSocialPostClick: (post: ContentSocialPost) => void;
}) {
  const dateStr = format(date, 'yyyy-MM-dd');
  const { setNodeRef, isOver } = useDroppable({ id: `day-${dateStr}`, data: { date: dateStr } });
  const isCurrentMonth = isSameMonth(date, currentMonth);
  const isCurrentDay = isTodayFn(date);
  const isYoutubeDay = date.getDay() === 2 || date.getDay() === 4; // Tue/Thu

  // Combine items for overflow counting
  const allItems: Array<{ type: 'script'; data: ContentScript } | { type: 'social'; data: ContentSocialPost }> = [
    ...scripts.map((s) => ({ type: 'script' as const, data: s })),
    ...socialPosts.map((p) => ({ type: 'social' as const, data: p })),
  ];
  const visible = allItems.slice(0, 3);
  const overflow = allItems.length - 3;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col p-1.5 min-h-[100px] lg:min-h-[120px] border rounded-lg transition-colors',
        isCurrentMonth ? 'border-gray-100' : 'border-gray-50 bg-gray-50/50',
        !isCurrentMonth && 'opacity-50',
        isOver && 'bg-purple-50 border-purple-300',
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className={cn(
            'flex items-center justify-center w-6 h-6 text-xs font-medium',
            isCurrentDay && 'bg-purple-600 text-white rounded-full',
            !isCurrentDay && isCurrentMonth && 'text-gray-700',
            !isCurrentMonth && 'text-gray-400',
          )}
        >
          {date.getDate()}
        </span>
        {isYoutubeDay && isCurrentMonth && (
          <span className="text-[9px] text-red-500 font-medium">YT</span>
        )}
      </div>
      <div className="flex flex-col gap-1 flex-1">
        {visible.map((item) =>
          item.type === 'script' ? (
            <DraggableScriptPill key={item.data.id} script={item.data} onClick={() => onScriptClick(item.data)} />
          ) : (
            <DraggableSocialPill key={`social-${item.data.id}`} post={item.data} onClick={() => onSocialPostClick(item.data)} />
          )
        )}
        {overflow > 0 && (
          <span className="text-[10px] text-gray-500 pl-1">+{overflow} mais</span>
        )}
      </div>
    </div>
  );
}

// ── UnscheduledZone ──────────────────────────────────────────────────────

function UnscheduledZone({
  scripts,
  socialPosts,
  onScriptClick,
  onSocialPostClick,
}: {
  scripts: ContentScript[];
  socialPosts: ContentSocialPost[];
  onScriptClick: (script: ContentScript) => void;
  onSocialPostClick: (post: ContentSocialPost) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'unscheduled-zone' });
  const total = scripts.length + socialPosts.length;

  if (total === 0) return null;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'border-2 border-dashed rounded-xl p-4 transition-colors',
        isOver ? 'border-purple-300 bg-purple-50' : 'border-gray-200',
      )}
    >
      <h3 className="text-sm font-medium mb-2 text-muted-foreground">
        Sem data ({total})
      </h3>
      <div className="flex flex-wrap gap-2">
        {scripts.slice(0, 20).map((s) => (
          <div key={s.id} className="w-[200px]">
            <DraggableScriptPill script={s} onClick={() => onScriptClick(s)} />
          </div>
        ))}
        {socialPosts.slice(0, 20).map((p) => (
          <div key={`social-${p.id}`} className="w-[200px]">
            <DraggableSocialPill post={p} onClick={() => onSocialPostClick(p)} />
          </div>
        ))}
        {total > 40 && (
          <span className="text-xs text-muted-foreground self-center">
            +{total - 40} itens
          </span>
        )}
      </div>
    </div>
  );
}

// ── ScriptDetailSheet ────────────────────────────────────────────────────

function ScriptDetailSheet({
  script,
  open,
  onOpenChange,
}: {
  script: ContentScript | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const updateScript = useUpdateScript();

  if (!script) return null;

  const copyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const pub = (script.metadata as any)?.publishing as {
    youtube_title?: string;
    description?: string;
    hashtags?: string[];
    thumbnail_ideas?: { text_overlay: string; visual_description: string; style: string }[];
  } | null;

  const copyFullScript = () => {
    const parts = [
      `# ${script.title}`,
      `\n## HOOK\n${script.hook}`,
      ...script.body_sections.map((s) =>
        `\n## ${s.heading}\n${s.content}${s.data_callout ? `\n[DADO: ${s.data_callout}]` : ''}${s.camera_note ? `\n[CÂMERA: ${s.camera_note}]` : ''}`
      ),
      script.cta ? `\n## CTA\n${script.cta}` : '',
      pub?.youtube_title ? `\n---\n## PUBLICAÇÃO\n**Título YouTube:** ${pub.youtube_title}` : '',
      pub?.description ? `**Descrição:**\n${pub.description}` : '',
      pub?.hashtags?.length ? `**Hashtags:** ${pub.hashtags.join(' ')}` : '',
      pub?.thumbnail_ideas?.length
        ? `**Thumbnails:**\n${pub.thumbnail_ideas.map((t, i) => `${i + 1}. [${t.style}] "${t.text_overlay}" — ${t.visual_description}`).join('\n')}`
        : '',
    ].filter(Boolean).join('\n');
    copyText(parts, 'full');
  };

  const durationLabel = script.duration_estimate_seconds
    ? script.duration_estimate_seconds >= 60
      ? `${Math.floor(script.duration_estimate_seconds / 60)}min${script.duration_estimate_seconds % 60 > 0 ? ` ${script.duration_estimate_seconds % 60}s` : ''}`
      : `${script.duration_estimate_seconds}s`
    : null;

  const handleRemoveDate = () => {
    updateScript.mutate({ id: script.id, scheduled_for: null } as any);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-3 border-b">
          <SheetTitle className="text-base leading-tight">{script.title}</SheetTitle>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Badge variant="outline" className={PLATFORM_COLORS[script.platform] || ''}>
              {PLATFORM_LABELS[script.platform] || script.platform}
            </Badge>
            <Badge variant="outline">{script.tone}</Badge>
            {durationLabel && (
              <Badge variant="outline" className="bg-gray-50">
                <Clock className="w-3 h-3 mr-0.5" />{durationLabel}
              </Badge>
            )}
            {script.virality_score != null && (
              <Badge variant="outline" className={cn(
                script.virality_score >= 80 ? 'bg-red-50 text-red-700 border-red-200' :
                script.virality_score >= 60 ? 'bg-orange-50 text-orange-700 border-orange-200' :
                'bg-gray-50 text-gray-600',
              )}>
                <Zap className="w-3 h-3 mr-0.5" />Viral: {script.virality_score}
              </Badge>
            )}
            <Badge variant="outline">{STATUS_LABELS[script.status] || script.status}</Badge>
          </div>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Scheduled date */}
          {script.scheduled_for && (
            <div className="flex items-center justify-between text-sm bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-purple-600" />
                <span className="text-purple-700 font-medium">
                  {format(new Date(script.scheduled_for + 'T12:00:00'), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                </span>
              </div>
              <Button size="sm" variant="ghost" className="h-7 text-xs text-purple-600" onClick={handleRemoveDate}>
                <X className="w-3 h-3 mr-1" />Remover
              </Button>
            </div>
          )}

          {/* Copy all button */}
          <Button variant="outline" className="w-full" onClick={copyFullScript}>
            {copiedField === 'full' ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copiedField === 'full' ? 'Copiado!' : 'Copiar Roteiro Completo'}
          </Button>

          {/* Hook */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-purple-700">HOOK</span>
              <button className="text-xs text-purple-500 hover:text-purple-700" onClick={() => copyText(script.hook, 'hook')}>
                {copiedField === 'hook' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <p className="text-sm font-medium">{script.hook}</p>
          </div>

          {/* Body sections */}
          {script.body_sections.map((section, i) => (
            <div key={i} className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">{section.heading}</h4>
                <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => copyText(section.content, `section-${i}`)}>
                  {copiedField === `section-${i}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <p className="text-sm whitespace-pre-line">{section.content}</p>
              {section.data_callout && (
                <div className="mt-2 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                  <Target className="w-3 h-3 inline mr-1" />{section.data_callout}
                </div>
              )}
              {section.camera_note && (
                <div className="mt-1 px-2 py-1 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                  <Eye className="w-3 h-3 inline mr-1" />{section.camera_note}
                </div>
              )}
            </div>
          ))}

          {/* CTA */}
          {script.cta && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <span className="text-xs font-medium text-green-700 block mb-1">CTA</span>
              <p className="text-sm">{script.cta}</p>
            </div>
          )}

          {/* Virality breakdown */}
          {(script.metadata as any)?.virality_breakdown && (
            <div className="bg-red-50/50 border border-red-200 rounded-lg p-3">
              <span className="text-xs font-medium text-red-700 block mb-2">
                <Zap className="w-3 h-3 inline mr-1" />ANÁLISE DE VIRALIDADE
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-2">
                {Object.entries((script.metadata as any).virality_breakdown as Record<string, number>).map(([key, val]) => (
                  <div key={key} className="text-center">
                    <div className="text-lg font-bold text-red-700">{val}</div>
                    <div className="text-[10px] text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</div>
                  </div>
                ))}
              </div>
              {(script.metadata as any)?.virality_techniques_used?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {((script.metadata as any).virality_techniques_used as string[]).map((t: string) => (
                    <Badge key={t} variant="outline" className="text-[10px] bg-red-50 border-red-200">
                      {t.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              )}
              {(script.metadata as any)?.predicted_top_comments?.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-medium text-muted-foreground">Comentários previstos:</span>
                  {((script.metadata as any).predicted_top_comments as string[]).map((c: string, i: number) => (
                    <p key={i} className="text-xs text-muted-foreground italic">"{c}"</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Publishing metadata */}
          {pub && (
            <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-3 space-y-3">
              <span className="text-xs font-medium text-blue-700 block">
                <Youtube className="w-3 h-3 inline mr-1" />PUBLICAÇÃO
              </span>

              {pub.youtube_title && (
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-medium text-muted-foreground">Título YouTube/Instagram</span>
                    <button className="text-xs text-blue-500 hover:text-blue-700" onClick={() => copyText(pub.youtube_title!, 'yt-title')}>
                      {copiedField === 'yt-title' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <p className="text-sm font-medium">{pub.youtube_title}</p>
                </div>
              )}

              {pub.description && (
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-medium text-muted-foreground">Descrição</span>
                    <button className="text-xs text-blue-500 hover:text-blue-700" onClick={() => copyText(pub.description!, 'desc')}>
                      {copiedField === 'desc' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <p className="text-xs whitespace-pre-line text-muted-foreground">{pub.description}</p>
                </div>
              )}

              {pub.hashtags && pub.hashtags.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-medium text-muted-foreground">
                      <Hash className="w-3 h-3 inline mr-0.5" />Hashtags
                    </span>
                    <button className="text-xs text-blue-500 hover:text-blue-700" onClick={() => copyText(pub.hashtags!.join(' '), 'hashtags')}>
                      {copiedField === 'hashtags' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {pub.hashtags.map((h) => (
                      <Badge key={h} variant="outline" className="text-[10px] bg-blue-50 border-blue-200">{h}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {pub.thumbnail_ideas && pub.thumbnail_ideas.length > 0 && (
                <div>
                  <span className="text-[10px] font-medium text-muted-foreground block mb-1">
                    <Image className="w-3 h-3 inline mr-0.5" />Ideias de Thumbnail
                  </span>
                  <div className="space-y-2">
                    {pub.thumbnail_ideas.map((thumb, i) => (
                      <div key={i} className="bg-white border rounded p-2">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Badge variant="outline" className="text-[10px]">{thumb.style}</Badge>
                          <span className="text-xs font-bold uppercase">{thumb.text_overlay}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">{thumb.visual_description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Created/updated */}
          <div className="text-[10px] text-muted-foreground pt-2 border-t">
            Criado: {format(new Date(script.created_at), "dd/MM/yy HH:mm")} · Atualizado: {format(new Date(script.updated_at), "dd/MM/yy HH:mm")}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── SocialPostDetailSheet ────────────────────────────────────────────────

function SocialPostDetailSheet({
  post,
  open,
  onOpenChange,
}: {
  post: ContentSocialPost | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const updatePost = useUpdateSocialPost();

  const copyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!post) return null;

  const meta = post.metadata as Record<string, any> | null;
  const alternativeHooks = meta?.alternative_hooks as string[] | undefined;
  const isOverLimit = post.platform === 'x' && post.content.length > 280;

  const copyFull = () => {
    const parts = [post.content, post.hashtags.length > 0 ? `\n${post.hashtags.join(' ')}` : ''].filter(Boolean).join('');
    copyText(parts, 'full');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-base">
            <span className={cn('text-xs px-2 py-0.5 rounded font-bold',
              post.platform === 'linkedin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-800 text-white'
            )}>
              {post.platform === 'linkedin' ? 'LinkedIn' : 'X'}
            </span>
            Post Social
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline">{post.tone}</Badge>
            <Badge variant="outline" className={isOverLimit ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50'}>
              {post.content.length} chars{isOverLimit ? ' (excede 280!)' : ''}
            </Badge>
            <Badge variant="outline" className={
              post.status === 'approved' ? 'bg-green-50 text-green-700' :
              post.status === 'published' ? 'bg-emerald-50 text-emerald-700' :
              post.status === 'review' ? 'bg-blue-50 text-blue-700' :
              'bg-gray-50'
            }>
              {post.status}
            </Badge>
          </div>

          {/* Scheduled date */}
          {post.scheduled_for && (
            <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
              <span className="text-sm">
                <CalendarDays className="w-4 h-4 inline mr-1 text-purple-600" />
                {format(new Date(post.scheduled_for + 'T12:00:00'), "dd 'de' MMMM, yyyy", { locale: ptBR })}
              </span>
              <Button
                size="sm" variant="ghost" className="h-6 text-xs text-red-500"
                onClick={() => updatePost.mutate({ id: post.id, scheduled_for: null } as any)}
              >
                <X className="w-3 h-3 mr-0.5" /> Remover
              </Button>
            </div>
          )}

          {/* Copy full button */}
          <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700" onClick={copyFull}>
            {copiedField === 'full' ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
            Copiar Post Completo
          </Button>

          {/* Content */}
          <div className={cn('rounded-lg p-3 border',
            post.platform === 'linkedin'
              ? 'bg-gradient-to-r from-blue-50 to-sky-50 border-blue-200'
              : 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200'
          )}>
            <p className="text-sm whitespace-pre-line">{post.content}</p>
          </div>

          {/* Hashtags */}
          {post.hashtags.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground">Hashtags</span>
                <button className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => copyText(post.hashtags.join(' '), 'hashtags')}
                >
                  {copiedField === 'hashtags' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {post.hashtags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] bg-gray-50">{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          {post.cta && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <span className="text-xs font-medium text-green-700 block mb-1">CTA</span>
              <p className="text-sm">{post.cta}</p>
            </div>
          )}

          {/* Alternative hooks */}
          {alternativeHooks && alternativeHooks.length > 0 && (
            <div>
              <span className="text-xs font-medium text-muted-foreground block mb-2">Hooks Alternativos</span>
              <div className="space-y-1.5">
                {alternativeHooks.map((hook, i) => (
                  <div key={i} className="flex items-start gap-2 bg-muted rounded p-2">
                    <span className="text-[10px] text-muted-foreground shrink-0">#{i + 1}</span>
                    <p className="text-xs flex-1">{hook}</p>
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground shrink-0"
                      onClick={() => copyText(hook, `hook-${i}`)}
                    >
                      {copiedField === `hook-${i}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Engagement tips */}
          {meta?.engagement_tips && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <span className="text-xs font-medium text-amber-700 block mb-1">Dicas de Engajamento</span>
              <p className="text-sm">{meta.engagement_tips}</p>
              {meta.best_posting_time && (
                <p className="text-xs text-amber-600 mt-1">Melhor horário: {meta.best_posting_time}</p>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── ContentCalendar (main) ───────────────────────────────────────────────

export function ContentCalendar() {
  const { data: scripts = [], isLoading } = useContentScripts();
  const { data: socialPosts = [], isLoading: socialLoading } = useContentSocialPosts();
  const updateScript = useUpdateScript();
  const updateSocialPost = useUpdateSocialPost();
  const { toast } = useToast();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedScript, setSelectedScript] = useState<ContentScript | null>(null);
  const [selectedSocialPost, setSelectedSocialPost] = useState<ContentSocialPost | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [socialSheetOpen, setSocialSheetOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // Calendar days for the current month (with leading/trailing)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  // Group scripts by date
  const scriptsByDate = useMemo(() => {
    const map = new Map<string, ContentScript[]>();
    for (const s of scripts) {
      if (s.scheduled_for) {
        const key = s.scheduled_for;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(s);
      }
    }
    return map;
  }, [scripts]);

  // Group social posts by date
  const socialPostsByDate = useMemo(() => {
    const map = new Map<string, ContentSocialPost[]>();
    for (const p of socialPosts) {
      if (p.scheduled_for) {
        const key = p.scheduled_for;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(p);
      }
    }
    return map;
  }, [socialPosts]);

  const unscheduledScripts = useMemo(
    () => scripts.filter((s) => !s.scheduled_for),
    [scripts],
  );

  const unscheduledSocialPosts = useMemo(
    () => socialPosts.filter((p) => !p.scheduled_for),
    [socialPosts],
  );

  // Keep selectedScript in sync with fresh query data
  const freshScript = selectedScript
    ? scripts.find((s) => s.id === selectedScript.id) ?? selectedScript
    : null;

  const freshSocialPost = selectedSocialPost
    ? socialPosts.find((p) => p.id === selectedSocialPost.id) ?? selectedSocialPost
    : null;

  // DnD handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeIdStr = active.id as string;
    const overId = over.id as string;
    const isSocialPost = activeIdStr.startsWith('social-');

    let newDate: string | null = null;
    if (overId.startsWith('day-')) {
      newDate = overId.replace('day-', '');
    } else if (overId === 'unscheduled-zone') {
      newDate = null;
    } else {
      return;
    }

    if (isSocialPost) {
      const postId = activeIdStr.replace('social-', '');
      const post = socialPosts.find((p) => p.id === postId);
      if (!post || post.scheduled_for === newDate) return;

      updateSocialPost.mutate(
        { id: postId, scheduled_for: newDate } as any,
        {
          onSuccess: () => {
            toast({
              title: newDate
                ? `Post movido para ${format(new Date(newDate + 'T12:00:00'), "dd/MM", { locale: ptBR })}`
                : 'Data removida do post',
            });
          },
        },
      );
    } else {
      const script = scripts.find((s) => s.id === activeIdStr);
      if (!script || script.scheduled_for === newDate) return;

      updateScript.mutate(
        { id: activeIdStr, scheduled_for: newDate } as any,
        {
          onSuccess: () => {
            toast({
              title: newDate
                ? `Roteiro movido para ${format(new Date(newDate + 'T12:00:00'), "dd/MM", { locale: ptBR })}`
                : 'Data removida do roteiro',
            });
          },
        },
      );
    }
  };

  const handleScriptClick = (script: ContentScript) => {
    setSelectedScript(script);
    setSheetOpen(true);
  };

  const handleSocialPostClick = (post: ContentSocialPost) => {
    setSelectedSocialPost(post);
    setSocialSheetOpen(true);
  };

  // Determine active drag item
  const activeScript = activeId && !activeId.startsWith('social-')
    ? scripts.find((s) => s.id === activeId)
    : null;
  const activeSocialPost = activeId && activeId.startsWith('social-')
    ? socialPosts.find((p) => p.id === activeId.replace('social-', ''))
    : null;
  const scheduledScriptCount = scripts.length - unscheduledScripts.length;
  const scheduledPostCount = socialPosts.length - unscheduledSocialPosts.length;
  const totalCount = scripts.length + socialPosts.length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {scheduledScriptCount} roteiro(s) · {scheduledPostCount} post(s) agendado(s) · {unscheduledScripts.length + unscheduledSocialPosts.length} sem data · {totalCount} total
      </p>

      {(isLoading || socialLoading) ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" />
        </div>
      ) : totalCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-xl">
          <CalendarDays className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Nenhum roteiro ainda.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Gere roteiros a partir das ideias na aba "Ideias" ou via Pipeline.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Calendar grid */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <CalendarHeader
              currentMonth={currentMonth}
              onPreviousMonth={() => setCurrentMonth((m) => subMonths(m, 1))}
              onNextMonth={() => setCurrentMonth((m) => addMonths(m, 1))}
              onToday={() => setCurrentMonth(new Date())}
            />

            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map((day) => (
                <div key={day} className="text-center text-[10px] font-semibold text-gray-400 py-2 uppercase tracking-wide">
                  {day}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                const dayScripts = scriptsByDate.get(dateStr) || [];
                const daySocialPosts = socialPostsByDate.get(dateStr) || [];
                return (
                  <DroppableDayCell
                    key={dateStr}
                    date={date}
                    currentMonth={currentMonth}
                    scripts={dayScripts}
                    socialPosts={daySocialPosts}
                    onScriptClick={handleScriptClick}
                    onSocialPostClick={handleSocialPostClick}
                  />
                );
              })}
            </div>
          </div>

          {/* Unscheduled zone */}
          <UnscheduledZone
            scripts={unscheduledScripts}
            socialPosts={unscheduledSocialPosts}
            onScriptClick={handleScriptClick}
            onSocialPostClick={handleSocialPostClick}
          />

          {/* Drag overlay */}
          <DragOverlay>
            {activeScript ? (
              <div className="px-2 py-1.5 rounded-md text-[11px] font-medium bg-white border border-purple-300 shadow-lg max-w-[200px] truncate">
                {activeScript.title}
              </div>
            ) : activeSocialPost ? (
              <div className="px-2 py-1.5 rounded-md text-[10px] font-medium bg-white border border-blue-300 shadow-lg max-w-[200px] truncate flex items-center gap-1">
                <span className={cn('text-[8px] px-1 rounded font-bold',
                  activeSocialPost.platform === 'linkedin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-800 text-white'
                )}>
                  {activeSocialPost.platform === 'linkedin' ? 'LI' : 'X'}
                </span>
                {activeSocialPost.content.slice(0, 40)}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Detail sheets */}
      <ScriptDetailSheet
        script={freshScript}
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setSelectedScript(null);
        }}
      />
      <SocialPostDetailSheet
        post={freshSocialPost}
        open={socialSheetOpen}
        onOpenChange={(open) => {
          setSocialSheetOpen(open);
          if (!open) setSelectedSocialPost(null);
        }}
      />
    </div>
  );
}
