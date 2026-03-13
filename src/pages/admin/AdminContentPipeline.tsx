import { useState, useRef, useCallback, useMemo, type DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Lightbulb,
  FileText,
  Video,
  Scissors,
  CheckCircle2,
  Rocket,
  Archive,
  Plus,
  Clock,
  Image,
  ExternalLink,
  ArrowRight,
  Filter,
  Copy,
  ChevronRight,
  Megaphone,
  X,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useContentPieces, useUpdatePieceStatus, type ContentPiece } from '@/hooks/useAdminContentFactory';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

// ── Column config ────────────────────────────────────────────────────

const COLUMNS = [
  { id: 'draft', label: 'Rascunho', color: '#6366F1', icon: Lightbulb, emptyLabel: 'Sem ideias novas' },
  { id: 'approved', label: 'Roteiro OK', color: '#8B5CF6', icon: FileText, emptyLabel: 'Nenhum roteiro aprovado' },
  { id: 'in_production', label: 'Produção', color: '#F59E0B', icon: Video, emptyLabel: 'Nada em produção' },
  { id: 'recorded', label: 'Pronto', color: '#10B981', icon: CheckCircle2, emptyLabel: 'Nenhum pronto' },
  { id: 'published', label: 'Publicado', color: '#06B6D4', icon: Rocket, emptyLabel: 'Nenhum publicado' },
  { id: 'discarded', label: 'Descartado', color: '#6B7280', icon: Archive, emptyLabel: 'Nenhum descartado' },
] as const;

// ── Format / Tone badges ─────────────────────────────────────────────

const FORMAT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  short: { label: 'Short', color: '#7C3AED', bg: '#EDE9FE' },
  long_video: { label: 'YouTube', color: '#DC2626', bg: '#FEE2E2' },
  carousel: { label: 'Carrossel', color: '#2563EB', bg: '#DBEAFE' },
  stories: { label: 'Stories', color: '#EC4899', bg: '#FCE7F3' },
};

const TONE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  polemic: { label: 'Polêmico', color: '#DC2626', bg: '#FEE2E2' },
  educational: { label: 'Educativo', color: '#2563EB', bg: '#DBEAFE' },
  storytelling: { label: 'Storytelling', color: '#7C3AED', bg: '#EDE9FE' },
  roast: { label: 'Roast', color: '#EA580C', bg: '#FFEDD5' },
  data_story: { label: 'Dados', color: '#0891B2', bg: '#CFFAFE' },
  myth_busting: { label: 'Mitos', color: '#4F46E5', bg: '#E0E7FF' },
};

// ── Platform badge ───────────────────────────────────────────────────

const PLATFORM_ICONS: Record<string, { label: string; color: string }> = {
  linkedin: { label: 'Li', color: '#0A66C2' },
  x: { label: 'X', color: '#000000' },
  threads: { label: 'Th', color: '#000000' },
  instagram: { label: 'Ig', color: '#E4405F' },
};

// ── Publication status per piece ─────────────────────────────────────

interface PubSummary {
  platform: string;
  status: string;
  platform_post_url: string | null;
}

function usePublicationsByPiece() {
  return useQuery<Record<string, PubSummary[]>>({
    queryKey: ['content-pipeline-publications'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('content_publications')
        .select('piece_id, platform, status, platform_post_url')
        .order('platform');
      if (error) throw error;
      const map: Record<string, PubSummary[]> = {};
      for (const row of data || []) {
        if (!map[row.piece_id]) map[row.piece_id] = [];
        map[row.piece_id].push({ platform: row.platform, status: row.status, platform_post_url: row.platform_post_url });
      }
      return map;
    },
    staleTime: 30 * 1000,
  });
}

// ── Asset count per piece ────────────────────────────────────────────

function useAssetCountsByPiece() {
  return useQuery<Record<string, number>>({
    queryKey: ['content-pipeline-asset-counts'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('content_assets')
        .select('piece_id');
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const row of data || []) {
        map[row.piece_id] = (map[row.piece_id] || 0) + 1;
      }
      return map;
    },
    staleTime: 60 * 1000,
  });
}

// ── Virality dot color ───────────────────────────────────────────────

function viralityColor(score: number): string {
  if (score >= 80) return '#EF4444';
  if (score >= 60) return '#F59E0B';
  if (score >= 40) return '#10B981';
  return '#D1D5DB';
}

// ── Filters ──────────────────────────────────────────────────────────

const FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'short', label: 'Shorts' },
  { id: 'long_video', label: 'YouTube' },
  { id: 'carousel', label: 'Carrossel' },
] as const;

// ── Main Component ───────────────────────────────────────────────────

export default function AdminContentPipeline() {
  const navigate = useNavigate();
  const { data: pieces, isLoading } = useContentPieces();
  const { data: pubMap } = usePublicationsByPiece();
  const { data: assetCounts } = useAssetCountsByPiece();
  const updateStatus = useUpdatePieceStatus();

  const [formatFilter, setFormatFilter] = useState('all');
  const [showDiscarded, setShowDiscarded] = useState(false);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const dragRef = useRef<{ id: string; from: string } | null>(null);

  const selectedPiece = useMemo(() => {
    if (!selectedPieceId || !pieces) return null;
    return pieces.find(p => p.id === selectedPieceId) || null;
  }, [selectedPieceId, pieces]);

  // Filter pieces
  const filteredPieces = useMemo(() => {
    if (!pieces) return [];
    let list = [...pieces];
    if (formatFilter !== 'all') list = list.filter(p => p.format === formatFilter);
    return list;
  }, [pieces, formatFilter]);

  // Group by status
  const grouped = useMemo(() => {
    const map: Record<string, ContentPiece[]> = {};
    for (const col of COLUMNS) map[col.id] = [];
    for (const piece of filteredPieces) {
      const col = map[piece.status];
      if (col) col.push(piece);
      else if (map['draft']) map['draft'].push(piece);
    }
    return map;
  }, [filteredPieces]);

  // Visible columns (hide discarded unless toggled or has items)
  const visibleColumns = useMemo(() => {
    return COLUMNS.filter(col => {
      if (col.id === 'discarded') return showDiscarded || (grouped['discarded']?.length || 0) > 0;
      return true;
    });
  }, [showDiscarded, grouped]);

  // ── Drag handlers (native HTML5, like Idea Kanban) ──

  const onDragStart = useCallback((e: DragEvent, id: string, from: string) => {
    dragRef.current = { id, from };
    e.dataTransfer.effectAllowed = 'move';
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  }, []);

  const onDragEnd = useCallback((e: DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) e.currentTarget.style.opacity = '1';
    dragRef.current = null;
    setDragOverCol(null);
  }, []);

  const onDragOver = useCallback((e: DragEvent, col: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(col);
  }, []);

  const onDragLeave = useCallback((e: DragEvent, col: string) => {
    const zone = e.currentTarget as HTMLElement;
    if (!zone.contains(e.relatedTarget as Node)) {
      setDragOverCol(prev => prev === col ? null : prev);
    }
  }, []);

  const onDrop = useCallback((e: DragEvent, toCol: string) => {
    e.preventDefault();
    setDragOverCol(null);
    const drag = dragRef.current;
    if (!drag || drag.from === toCol) return;
    updateStatus.mutate({ id: drag.id, status: toCol });
    dragRef.current = null;
  }, [updateStatus]);

  // ── Loading state ──

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #6366F1, #06B6D4)' }} />
        <div className="flex items-center justify-center h-96">
          <div className="animate-pulse text-muted-foreground">Carregando pipeline...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Gradient bar */}
      <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #6366F1, #8B5CF6, #F59E0B, #10B981, #06B6D4)' }} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Content Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filteredPieces.length} conteúdos · Arraste entre colunas para atualizar o status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDiscarded(v => !v)}
            className="text-xs"
          >
            <Archive className="w-3.5 h-3.5 mr-1" />
            {showDiscarded ? 'Ocultar' : 'Mostrar'} descartados
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/admin/content-factory')}
            className="text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Novo conteúdo
          </Button>
        </div>
      </div>

      {/* Format filter tabs */}
      <div className="flex items-center gap-1 px-4 sm:px-6 pb-3 border-b border-border/50 overflow-x-auto">
        <Filter className="w-3.5 h-3.5 text-muted-foreground mr-1 flex-shrink-0" />
        {FILTERS.map(f => {
          const active = formatFilter === f.id;
          const count = f.id === 'all'
            ? filteredPieces.length
            : (pieces || []).filter(p => p.format === f.id).length;
          return (
            <button
              key={f.id}
              onClick={() => setFormatFilter(f.id)}
              className={`px-3 py-1.5 text-xs rounded-full transition-colors whitespace-nowrap ${
                active
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {f.label}
              <span className={`ml-1 ${active ? 'opacity-80' : 'opacity-50'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Kanban columns */}
      <div className="overflow-x-auto px-4 sm:px-6 pb-8 mt-3">
        <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
          {visibleColumns.map(col => {
            const cards = grouped[col.id] || [];
            const isOver = dragOverCol === col.id;
            const Icon = col.icon;

            return (
              <div key={col.id} className="flex-shrink-0" style={{ width: 260 }}>
                {/* Column header */}
                <div
                  className="rounded-xl px-3 py-2 flex items-center justify-between mb-3"
                  style={{ background: col.color }}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-white" />
                    <span className="text-white font-semibold text-sm">{col.label}</span>
                  </div>
                  <span className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center text-white text-xs font-bold">
                    {cards.length}
                  </span>
                </div>

                {/* Drop zone */}
                <div
                  className="flex flex-col gap-2.5 min-h-[100px] rounded-xl p-1 transition-colors"
                  style={{ backgroundColor: isOver ? col.color + '20' : 'transparent' }}
                  onDragOver={(e) => onDragOver(e, col.id)}
                  onDragLeave={(e) => onDragLeave(e, col.id)}
                  onDrop={(e) => onDrop(e, col.id)}
                >
                  {cards.length === 0 ? (
                    <div className="flex items-center justify-center h-[100px] rounded-xl border border-dashed border-border/50 text-xs text-muted-foreground">
                      {col.emptyLabel}
                    </div>
                  ) : (
                    cards.map(piece => (
                      <PipelineCard
                        key={piece.id}
                        piece={piece}
                        publications={pubMap?.[piece.id]}
                        assetCount={assetCounts?.[piece.id] || 0}
                        colColor={col.color}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                        onClick={() => setSelectedPieceId(piece.id)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Detail Sheet */}
      <Sheet open={!!selectedPieceId} onOpenChange={(open) => { if (!open) setSelectedPieceId(null); }}>
        <SheetContent side="right" className="w-full sm:w-[480px] sm:max-w-[480px] p-0 overflow-hidden">
          {selectedPiece && (
            <PieceDetailDrawer
              piece={selectedPiece}
              publications={pubMap?.[selectedPiece.id]}
              onStatusChange={(status) => {
                updateStatus.mutate({ id: selectedPiece.id, status });
              }}
              onOpenFactory={() => {
                setSelectedPieceId(null);
                navigate('/admin/content-factory');
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}

// ── Piece Detail Drawer ──────────────────────────────────────────────

interface PieceDetailDrawerProps {
  piece: ContentPiece;
  publications?: PubSummary[];
  onStatusChange: (status: string) => void;
  onOpenFactory: () => void;
}

function PieceDetailDrawer({ piece, publications, onStatusChange, onOpenFactory }: PieceDetailDrawerProps) {
  const title = piece.title || piece.hook_variations?.[0]?.text?.slice(0, 80) || 'Sem título';
  const fmt = FORMAT_CONFIG[piece.format];
  const tone = TONE_CONFIG[piece.tone];
  const colConfig = COLUMNS.find(c => c.id === piece.status);

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
  };

  // Deduplicate publications
  const dedupedPubs = useMemo(() => {
    if (!publications) return [];
    const STATUS_PRIORITY: Record<string, number> = { published: 3, publishing: 2, scheduled: 1 };
    const byPlatform = new Map<string, PubSummary>();
    for (const pub of publications) {
      const existing = byPlatform.get(pub.platform);
      if (!existing || (STATUS_PRIORITY[pub.status] || 0) > (STATUS_PRIORITY[existing.status] || 0)) {
        byPlatform.set(pub.platform, pub);
      }
    }
    return Array.from(byPlatform.values());
  }, [publications]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/50 flex-shrink-0">
        <div className="flex items-center gap-2 mb-2">
          {fmt && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: fmt.bg, color: fmt.color }}>
              {fmt.label}
            </span>
          )}
          {tone && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: tone.bg, color: tone.color }}>
              {tone.label}
            </span>
          )}
          {piece.virality_score > 0 && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: viralityColor(piece.virality_score) + '20', color: viralityColor(piece.virality_score) }}>
              {piece.virality_score}%
            </span>
          )}
        </div>
        <h2 className="font-bold text-lg text-foreground leading-snug">{title}</h2>
      </div>

      {/* Body */}
      <ScrollArea className="flex-1">
        <div className="px-5 py-4 space-y-5">

          {/* Status selector */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Status</label>
            <div className="flex flex-wrap gap-1.5">
              {COLUMNS.filter(c => c.id !== 'discarded').map(col => {
                const active = piece.status === col.id;
                const Icon = col.icon;
                return (
                  <button
                    key={col.id}
                    onClick={() => onStatusChange(col.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      active
                        ? 'text-white shadow-sm'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                    style={active ? { background: col.color } : undefined}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {col.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Publications */}
          {dedupedPubs.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Publicações</label>
              <div className="space-y-1.5">
                {dedupedPubs.map(pub => {
                  const pl = PLATFORM_ICONS[pub.platform] || { label: pub.platform, color: '#6B7280' };
                  const isPublished = pub.status === 'published';
                  return (
                    <div key={pub.platform} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs" style={{ color: pl.color }}>{pl.label}</span>
                        <span className={`text-xs ${isPublished ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                          {pub.status}
                        </span>
                      </div>
                      {pub.platform_post_url && (
                        <a href={pub.platform_post_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                          <ExternalLink className="w-3 h-3" /> Ver post
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Hooks */}
          {piece.hook_variations?.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Hooks ({piece.hook_variations.length})
              </label>
              <div className="space-y-1.5">
                {piece.hook_variations.map((hook, i) => (
                  <div key={i} className="group relative p-2.5 rounded-lg bg-muted/30 text-sm leading-relaxed">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{hook.style}</span>
                    <p className="mt-0.5">{hook.text}</p>
                    <button
                      onClick={() => copyToClipboard(hook.text)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Script sections */}
          {piece.script_sections?.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Roteiro ({piece.script_sections.length} seções)
                </label>
                <button
                  onClick={() => {
                    const full = piece.script_sections.map(s => `## ${s.heading}\n${s.content}`).join('\n\n');
                    copyToClipboard(full);
                  }}
                  className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                >
                  <Copy className="w-3 h-3" /> Copiar tudo
                </button>
              </div>
              <div className="space-y-2">
                {piece.script_sections.map((section, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-muted/30">
                    <p className="text-xs font-semibold text-foreground mb-1">{section.heading}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">{section.content}</p>
                    {section.camera_note && (
                      <p className="text-[10px] text-blue-500 mt-1 flex items-center gap-1">
                        <Video className="w-3 h-3" /> {section.camera_note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          {piece.cta && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">CTA</label>
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <p className="text-sm text-emerald-700 dark:text-emerald-300">{piece.cta}</p>
              </div>
            </div>
          )}

          {/* Social posts */}
          {piece.social_posts?.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Posts sociais ({piece.social_posts.length})
              </label>
              <div className="space-y-2">
                {piece.social_posts.map((post, i) => {
                  const pl = PLATFORM_ICONS[post.platform] || { label: post.platform, color: '#6B7280' };
                  return (
                    <div key={i} className="group relative p-2.5 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-bold" style={{ color: pl.color }}>{post.platform}</span>
                        <span className="text-[10px] text-muted-foreground">{post.char_count} chars</span>
                      </div>
                      <p className="text-xs leading-relaxed line-clamp-6">{post.content}</p>
                      {post.hashtags?.length > 0 && (
                        <p className="text-[10px] text-primary mt-1">{post.hashtags.join(' ')}</p>
                      )}
                      <button
                        onClick={() => copyToClipboard(post.content + (post.hashtags?.length ? '\n\n' + post.hashtags.join(' ') : ''))}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer actions */}
      <div className="px-5 py-3 border-t border-border/50 flex items-center gap-2 flex-shrink-0">
        <Button variant="outline" size="sm" className="text-xs flex-1" onClick={onOpenFactory}>
          <Megaphone className="w-3.5 h-3.5 mr-1" />
          Abrir no Content Factory
        </Button>
      </div>
    </div>
  );
}

// ── Pipeline Card ────────────────────────────────────────────────────

interface PipelineCardProps {
  piece: ContentPiece;
  publications?: PubSummary[];
  assetCount: number;
  colColor: string;
  onDragStart: (e: DragEvent, id: string, from: string) => void;
  onDragEnd: (e: DragEvent) => void;
  onClick: () => void;
}

function PipelineCard({ piece, publications, assetCount, colColor, onDragStart, onDragEnd, onClick }: PipelineCardProps) {
  const dragRefLocal = useRef(false);

  const title = piece.title || piece.hook_variations?.[0]?.text?.slice(0, 60) || 'Sem título';
  const fmt = FORMAT_CONFIG[piece.format];
  const tone = TONE_CONFIG[piece.tone];
  const timeAgo = formatDistanceToNow(new Date(piece.created_at), { addSuffix: true, locale: ptBR });

  return (
    <div
      draggable
      onDragStart={(e) => { dragRefLocal.current = true; onDragStart(e, piece.id, piece.status); }}
      onDragEnd={(e) => { dragRefLocal.current = false; onDragEnd(e); }}
      onClick={() => { if (!dragRefLocal.current) onClick(); }}
      className="bg-card rounded-[14px] border border-border/50 shadow-sm p-3 cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* Title */}
      <h3 className="font-semibold text-[13px] text-foreground leading-snug line-clamp-2 mb-1.5">
        {title}
      </h3>

      {/* Format + Tone badges */}
      <div className="flex flex-wrap gap-1 mb-2">
        {fmt && (
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: fmt.bg, color: fmt.color }}
          >
            {fmt.label}
          </span>
        )}
        {tone && (
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
            style={{ background: tone.bg, color: tone.color }}
          >
            {tone.label}
          </span>
        )}
      </div>

      {/* Platform publication badges (deduplicated — one per platform, best status wins) */}
      {publications && publications.length > 0 && (() => {
        // Deduplicate: keep best status per platform (published > scheduled > others)
        const STATUS_PRIORITY: Record<string, number> = { published: 3, publishing: 2, scheduled: 1 };
        const byPlatform = new Map<string, PubSummary>();
        for (const pub of publications) {
          const existing = byPlatform.get(pub.platform);
          if (!existing || (STATUS_PRIORITY[pub.status] || 0) > (STATUS_PRIORITY[existing.status] || 0)) {
            byPlatform.set(pub.platform, pub);
          }
        }
        return (
        <div className="flex gap-1 mb-2">
          {Array.from(byPlatform.values()).map(pub => {
            const pl = PLATFORM_ICONS[pub.platform] || { label: pub.platform[0].toUpperCase(), color: '#6B7280' };
            const isPublished = pub.status === 'published';
            const isFailed = pub.status === 'failed';
            return (
              <Tooltip key={pub.platform}>
                <TooltipTrigger asChild>
                  <span
                    className="inline-flex items-center justify-center w-6 h-5 rounded text-[9px] font-bold"
                    style={{
                      background: isPublished ? pl.color + '18' : isFailed ? '#FEE2E2' : '#F3F4F6',
                      color: isPublished ? pl.color : isFailed ? '#DC2626' : '#9CA3AF',
                      border: `1px solid ${isPublished ? pl.color + '40' : isFailed ? '#FECACA' : '#E5E7EB'}`,
                    }}
                  >
                    {pl.label}
                  </span>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  {pub.platform}: {pub.status}
                  {pub.platform_post_url && ' (link disponível)'}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        );
      })()}

      {/* Footer: time + assets + virality */}
      <div className="flex items-center justify-between pt-1.5 border-t border-border/30">
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {timeAgo}
        </span>
        <div className="flex items-center gap-2">
          {assetCount > 0 && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Image className="w-3 h-3" />
              {assetCount}
            </span>
          )}
          {piece.virality_score > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ background: viralityColor(piece.virality_score) }}
                />
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                Viralidade: {piece.virality_score}%
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}
