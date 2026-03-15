import { useState, useRef, useCallback, useMemo, useEffect, type DragEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PieceEditModal } from '@/components/content/PieceEditModal';
import {
  Lightbulb,
  FileText,
  Video,
  CheckCircle2,
  Rocket,
  Archive,
  Plus,
  Clock,
  Image,
  ExternalLink,
  Filter,
  Copy,
  Megaphone,
  Save,
  Loader2,
  Send,
  Linkedin,
  Twitter,
  MessageSquare,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useContentPieces, useUpdatePieceStatus, useUpdatePiece, useDeletePiece, useReorderPieces, type ContentPiece } from '@/hooks/useAdminContentFactory';
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
  medium_video: { label: 'YT Médio', color: '#EA580C', bg: '#FFEDD5' },
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

const PLATFORM_ICONS: Record<string, { label: string; color: string; icon: typeof Linkedin }> = {
  linkedin: { label: 'LinkedIn', color: '#0A66C2', icon: Linkedin },
  x: { label: 'X', color: '#000000', icon: Twitter },
  threads: { label: 'Threads', color: '#000000', icon: MessageSquare },
  instagram: { label: 'Instagram', color: '#E4405F', icon: Linkedin },
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
  { id: 'medium_video', label: 'YT Médio' },
  { id: 'long_video', label: 'YouTube' },
  { id: 'carousel', label: 'Carrossel' },
] as const;

// ── Main Component ───────────────────────────────────────────────────

export default function AdminContentPipeline() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: pieces, isLoading } = useContentPieces();
  const { data: pubMap } = usePublicationsByPiece();
  const { data: assetCounts } = useAssetCountsByPiece();
  const updateStatus = useUpdatePieceStatus();
  const reorderPieces = useReorderPieces();
  const deletePiece = useDeletePiece();

  const [formatFilter, setFormatFilter] = useState('all');
  const [showDiscarded, setShowDiscarded] = useState(false);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{ col: string; index: number } | null>(null);
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const dragRef = useRef<{ id: string; from: string } | null>(null);

  // Auto-open modal from ?piece=ID query param (e.g. from calendar invite link)
  const [deepLinkPiece, setDeepLinkPiece] = useState<ContentPiece | null>(null);
  const deepLinkPieceId = useRef<string | null>(null);

  // Capture piece param on mount (before any re-renders clear it)
  if (deepLinkPieceId.current === null) {
    deepLinkPieceId.current = new URLSearchParams(window.location.search).get('piece') || '';
  }

  useEffect(() => {
    const targetId = deepLinkPieceId.current;
    if (!targetId || isLoading) return;

    // Run once: clear the ref so this doesn't fire again
    deepLinkPieceId.current = '';

    // Clean URL without triggering React Router re-render
    window.history.replaceState(null, '', window.location.pathname);

    // Try local array first
    const found = pieces?.find(p => p.id === targetId);
    if (found) {
      setSelectedPieceId(targetId);
      return;
    }

    // Fetch individually if not in local array (e.g. filtered out)
    (supabase as any)
      .from('content_pieces')
      .select('*')
      .eq('id', targetId)
      .single()
      .then(({ data }: any) => {
        if (data) {
          setDeepLinkPiece(data);
          setSelectedPieceId(targetId);
        }
      });
  }, [pieces, isLoading]);

  const selectedPiece = useMemo(() => {
    if (!selectedPieceId) return null;
    return pieces?.find(p => p.id === selectedPieceId) || deepLinkPiece || null;
  }, [selectedPieceId, pieces, deepLinkPiece]);

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

  // ── Drag handlers ──

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
    setDropIndicator(null);
  }, []);

  const onDragOverCol = useCallback((e: DragEvent, col: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(col);
  }, []);

  const onDragLeaveCol = useCallback((e: DragEvent, col: string) => {
    const zone = e.currentTarget as HTMLElement;
    if (!zone.contains(e.relatedTarget as Node)) {
      setDragOverCol(prev => prev === col ? null : prev);
      setDropIndicator(prev => prev?.col === col ? null : prev);
    }
  }, []);

  // Calculate drop index from mouse position over cards
  const onDragOverCard = useCallback((e: DragEvent, col: string, cardIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const insertIndex = e.clientY < midY ? cardIndex : cardIndex + 1;
    setDropIndicator({ col, index: insertIndex });
    setDragOverCol(col);
  }, []);

  const onDrop = useCallback((e: DragEvent, toCol: string) => {
    e.preventDefault();
    setDragOverCol(null);
    const indicator = dropIndicator;
    setDropIndicator(null);
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;

    const colCards = [...(grouped[toCol] || [])];
    const isSameCol = drag.from === toCol;

    if (isSameCol && !indicator) return; // no-op

    // Remove dragged piece from source list if same column
    const draggedPiece = filteredPieces.find(p => p.id === drag.id);
    if (!draggedPiece) return;

    let targetCards: ContentPiece[];
    if (isSameCol) {
      targetCards = colCards.filter(p => p.id !== drag.id);
    } else {
      targetCards = [...colCards];
    }

    // Insert at position
    const insertAt = indicator?.col === toCol ? indicator.index : targetCards.length;
    // Adjust insert index if same column and removing shifted indices
    let adjustedInsert = insertAt;
    if (isSameCol) {
      const oldIndex = colCards.findIndex(p => p.id === drag.id);
      if (oldIndex < insertAt) adjustedInsert = Math.max(0, insertAt - 1);
    }
    targetCards.splice(adjustedInsert, 0, draggedPiece);

    // Build sort_order updates
    const updates = targetCards.map((p, i) => ({
      id: p.id,
      sort_order: i,
      ...(p.id === drag.id && !isSameCol ? { status: toCol } : {}),
    }));

    reorderPieces.mutate(updates);
  }, [dropIndicator, grouped, filteredPieces, reorderPieces]);

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
      <div className="min-h-screen bg-muted/40">
      {/* Gradient bar */}
      <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #6366F1, #8B5CF6, #F59E0B, #10B981, #06B6D4)' }} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-white dark:bg-card border-b border-border/50">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Content Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filteredPieces.length} conteúdos · Arraste para mover entre colunas ou reordenar
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
      <div className="flex items-center gap-1 px-4 sm:px-6 py-3 bg-white dark:bg-card border-b border-border/50 overflow-x-auto">
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
                  className="flex flex-col gap-0 min-h-[100px] rounded-xl p-1 transition-colors"
                  style={{ backgroundColor: isOver ? col.color + '20' : 'transparent' }}
                  onDragOver={(e) => onDragOverCol(e, col.id)}
                  onDragLeave={(e) => onDragLeaveCol(e, col.id)}
                  onDrop={(e) => onDrop(e, col.id)}
                >
                  {cards.length === 0 ? (
                    <div className="flex items-center justify-center h-[100px] rounded-xl border border-dashed border-border/50 text-xs text-muted-foreground">
                      {col.emptyLabel}
                    </div>
                  ) : (
                    cards.map((piece, cardIdx) => (
                      <div key={piece.id}>
                        {/* Drop indicator line above card */}
                        {dropIndicator?.col === col.id && dropIndicator.index === cardIdx && (
                          <div className="h-0.5 rounded-full mx-1 my-1" style={{ background: col.color }} />
                        )}
                        <div
                          className="py-1"
                          onDragOver={(e) => onDragOverCard(e, col.id, cardIdx)}
                        >
                          <PipelineCard
                            piece={piece}
                            publications={pubMap?.[piece.id]}
                            assetCount={assetCounts?.[piece.id] || 0}
                            colColor={col.color}
                            onDragStart={onDragStart}
                            onDragEnd={onDragEnd}
                            onClick={() => setSelectedPieceId(piece.id)}
                          />
                        </div>
                        {/* Drop indicator line after last card */}
                        {dropIndicator?.col === col.id && dropIndicator.index === cardIdx + 1 && cardIdx === cards.length - 1 && (
                          <div className="h-0.5 rounded-full mx-1 my-1" style={{ background: col.color }} />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!selectedPieceId} onOpenChange={(open) => { if (!open) { setSelectedPieceId(null); setDeepLinkPiece(null); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          {selectedPiece && (
            <PieceEditModal
              piece={selectedPiece}
              publications={pubMap?.[selectedPiece.id]}
              onClose={() => setSelectedPieceId(null)}
              onStatusChange={(status) => {
                updateStatus.mutate({ id: selectedPiece.id, status });
              }}
              onDelete={(id) => deletePiece.mutate(id)}
            />
          )}
        </DialogContent>
      </Dialog>

      </div>
    </DashboardLayout>
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
      className="bg-white dark:bg-card rounded-[14px] border border-border/50 shadow-sm p-3 cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
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

      {/* Date indicators */}
      {(piece.production_date || piece.scheduled_for) && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {piece.production_date && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded">
                  <Video className="w-3 h-3" />
                  {format(new Date(piece.production_date + 'T12:00:00'), 'dd/MM')}
                </span>
              </TooltipTrigger>
              <TooltipContent className="text-xs">Gravação: {format(new Date(piece.production_date + 'T12:00:00'), 'dd/MM/yyyy')}</TooltipContent>
            </Tooltip>
          )}
          {piece.scheduled_for && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-0.5 text-[10px] text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30 px-1.5 py-0.5 rounded">
                  <Send className="w-3 h-3" />
                  {format(new Date(piece.scheduled_for.slice(0, 10) + 'T12:00:00'), 'dd/MM')}
                </span>
              </TooltipTrigger>
              <TooltipContent className="text-xs">Publicação: {format(new Date(piece.scheduled_for.slice(0, 10) + 'T12:00:00'), 'dd/MM/yyyy')}</TooltipContent>
            </Tooltip>
          )}
        </div>
      )}

      {/* Platform publication badges (deduplicated — one per platform, best status wins) */}
      {publications && publications.length > 0 && (() => {
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
            const pl = PLATFORM_ICONS[pub.platform];
            if (!pl) return null;
            const PlatIcon = pl.icon;
            const isPublished = pub.status === 'published';
            const isScheduled = pub.status === 'scheduled';
            const isFailed = pub.status === 'failed';
            return (
              <Tooltip key={pub.platform}>
                <TooltipTrigger asChild>
                  <span
                    className="inline-flex items-center justify-center w-6 h-5 rounded"
                    style={{
                      background: isPublished ? pl.color + '18' : isFailed ? '#FEE2E2' : '#F3F4F6',
                      border: `1px solid ${isPublished ? pl.color + '40' : isFailed ? '#FECACA' : '#E5E7EB'}`,
                    }}
                  >
                    <PlatIcon
                      className="w-3 h-3"
                      style={{
                        color: isPublished ? pl.color : isFailed ? '#DC2626' : '#D1D5DB',
                      }}
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  {pl.label}: {isPublished ? 'publicado' : isScheduled ? 'agendado' : pub.status}
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
