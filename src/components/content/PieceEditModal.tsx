import { useState, useMemo } from 'react';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Copy, Video, Save, Loader2, Send, ExternalLink,
  Lightbulb, FileText, CheckCircle2, Rocket, Archive, Trash2,
} from 'lucide-react';
import { useUpdatePiece, useUpdatePieceStatus, type ContentPiece } from '@/hooks/useAdminContentFactory';

// ── Shared constants ────────────────────────────────────────────────

export const PIPELINE_COLUMNS = [
  { id: 'draft', label: 'Rascunho', color: '#6366F1', icon: Lightbulb },
  { id: 'approved', label: 'Roteiro OK', color: '#8B5CF6', icon: FileText },
  { id: 'in_production', label: 'Produção', color: '#F59E0B', icon: Video },
  { id: 'recorded', label: 'Pronto', color: '#10B981', icon: CheckCircle2 },
  { id: 'published', label: 'Publicado', color: '#06B6D4', icon: Rocket },
  { id: 'discarded', label: 'Descartado', color: '#6B7280', icon: Archive },
] as const;

export const PIECE_FORMAT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  short: { label: 'Short', color: '#7C3AED', bg: '#EDE9FE' },
  medium_video: { label: 'YT Médio', color: '#EA580C', bg: '#FFEDD5' },
  long_video: { label: 'YouTube', color: '#DC2626', bg: '#FEE2E2' },
  carousel: { label: 'Carrossel', color: '#2563EB', bg: '#DBEAFE' },
  stories: { label: 'Stories', color: '#EC4899', bg: '#FCE7F3' },
};

export const PIECE_TONE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  polemic: { label: 'Polêmico', color: '#DC2626', bg: '#FEE2E2' },
  educational: { label: 'Educativo', color: '#2563EB', bg: '#DBEAFE' },
  storytelling: { label: 'Storytelling', color: '#7C3AED', bg: '#EDE9FE' },
  roast: { label: 'Roast', color: '#EA580C', bg: '#FFEDD5' },
  data_story: { label: 'Dados', color: '#0891B2', bg: '#CFFAFE' },
  myth_busting: { label: 'Mitos', color: '#4F46E5', bg: '#E0E7FF' },
};

const PLATFORM_ICONS: Record<string, { label: string; color: string }> = {
  linkedin: { label: 'Li', color: '#0A66C2' },
  x: { label: 'X', color: '#000000' },
  threads: { label: 'Th', color: '#000000' },
  instagram: { label: 'Ig', color: '#E4405F' },
};

export function viralityColor(score: number): string {
  if (score >= 80) return '#EF4444';
  if (score >= 60) return '#F59E0B';
  if (score >= 40) return '#10B981';
  return '#D1D5DB';
}

// ── Types ───────────────────────────────────────────────────────────

export interface PubSummary {
  platform: string;
  status: string;
  platform_post_url: string | null;
}

// ── Component ───────────────────────────────────────────────────────

interface PieceEditModalProps {
  piece: ContentPiece;
  publications?: PubSummary[];
  onClose: () => void;
  onStatusChange: (status: string) => void;
  onDelete?: (id: string) => void;
}

export function PieceEditModal({ piece, publications, onClose, onStatusChange, onDelete }: PieceEditModalProps) {
  const updatePiece = useUpdatePiece();
  const { toast } = useToast();

  const [title, setTitle] = useState(piece.title || '');
  const [pieceFormat, setPieceFormat] = useState(piece.format);
  const [tone, setTone] = useState(piece.tone);
  const [growthFn, setGrowthFn] = useState(piece.growth_function || '');
  const [audienceStage, setAudienceStage] = useState(piece.audience_stage || '');
  const [cta, setCta] = useState(piece.cta || '');
  const [productionDate, setProductionDate] = useState(piece.production_date?.slice(0, 10) || '');
  const [scheduledFor, setScheduledFor] = useState(piece.scheduled_for?.slice(0, 10) || '');
  const [scriptSections, setScriptSections] = useState(piece.script_sections || []);
  const [isSaving, setIsSaving] = useState(false);

  const isDirty = title !== (piece.title || '')
    || pieceFormat !== piece.format
    || tone !== piece.tone
    || growthFn !== (piece.growth_function || '')
    || audienceStage !== (piece.audience_stage || '')
    || cta !== (piece.cta || '')
    || productionDate !== (piece.production_date?.slice(0, 10) || '')
    || scheduledFor !== (piece.scheduled_for?.slice(0, 10) || '')
    || scriptSections !== piece.script_sections;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updatePiece.mutateAsync({
        id: piece.id,
        title: title || null,
        format: pieceFormat,
        tone,
        growth_function: growthFn || null,
        audience_stage: audienceStage || null,
        cta: cta || null,
        production_date: productionDate || null,
        scheduled_for: scheduledFor || null,
        script_sections: scriptSections,
      });
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    toast({ title: 'Copiado!' });
  };

  const fmtBadge = PIECE_FORMAT_CONFIG[piece.format];

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

  const updateSection = (index: number, field: 'heading' | 'content' | 'camera_note', value: string) => {
    const updated = [...scriptSections];
    updated[index] = { ...updated[index], [field]: value || null };
    setScriptSections(updated);
  };

  return (
    <div className="flex flex-col h-full max-h-[90vh]">
      {/* Header */}
      <DialogHeader className="px-5 py-4 border-b border-border/50 flex-shrink-0">
        <div className="flex items-center gap-2 mb-1">
          {fmtBadge && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: fmtBadge.bg, color: fmtBadge.color }}>
              {fmtBadge.label}
            </span>
          )}
          {piece.virality_score > 0 && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: viralityColor(piece.virality_score) + '20', color: viralityColor(piece.virality_score) }}>
              {piece.virality_score}%
            </span>
          )}
        </div>
        <DialogTitle className="text-lg font-bold leading-snug">
          {title || piece.hook_variations?.[0]?.text?.slice(0, 80) || 'Sem título'}
        </DialogTitle>
      </DialogHeader>

      {/* Body */}
      <ScrollArea className="flex-1">
        <div className="px-6 py-5 space-y-5">

          {/* Status selector */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Status</label>
            <div className="flex flex-wrap gap-1.5">
              {PIPELINE_COLUMNS.filter(c => c.id !== 'discarded').map(col => {
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

          {/* Editable fields: Title */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Título</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título do conteúdo"
              className="text-sm"
            />
          </div>

          {/* Format + Tone + Growth + Audience */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Formato</label>
              <Select value={pieceFormat} onValueChange={setPieceFormat}>
                <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PIECE_FORMAT_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tom</label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PIECE_TONE_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Growth Function</label>
              <Select value={growthFn || '_none'} onValueChange={(v) => setGrowthFn(v === '_none' ? '' : v)}>
                <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none" className="text-xs">—</SelectItem>
                  <SelectItem value="discovery" className="text-xs">Discovery</SelectItem>
                  <SelectItem value="conversion" className="text-xs">Conversion</SelectItem>
                  <SelectItem value="retention" className="text-xs">Retention</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Audience Stage</label>
              <Select value={audienceStage || '_none'} onValueChange={(v) => setAudienceStage(v === '_none' ? '' : v)}>
                <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none" className="text-xs">—</SelectItem>
                  <SelectItem value="cold" className="text-xs">Cold</SelectItem>
                  <SelectItem value="warm" className="text-xs">Warm</SelectItem>
                  <SelectItem value="hot" className="text-xs">Hot</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates: Production + Publication */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                <Video className="w-3 h-3" /> Data de Gravação
              </label>
              <Input
                type="date"
                value={productionDate}
                onChange={(e) => setProductionDate(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                <Send className="w-3 h-3" /> Data de Publicação
              </label>
              <Input
                type="date"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="text-xs h-9"
              />
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

          {/* Hooks (read-only with copy) */}
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

          {/* Script sections (editable) */}
          {scriptSections?.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Roteiro ({scriptSections.length} seções)
                </label>
                <button
                  onClick={() => {
                    const full = scriptSections.map(s => `## ${s.heading}\n${s.content}`).join('\n\n');
                    copyToClipboard(full);
                  }}
                  className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                >
                  <Copy className="w-3 h-3" /> Copiar tudo
                </button>
              </div>
              <div className="space-y-3">
                {scriptSections.map((section, i) => (
                  <div key={i} className="p-4 rounded-lg bg-muted/30 space-y-2.5">
                    <Input
                      value={section.heading}
                      onChange={(e) => updateSection(i, 'heading', e.target.value)}
                      className="text-sm font-semibold h-9"
                      placeholder="Título da seção"
                    />
                    <Textarea
                      value={section.content}
                      onChange={(e) => updateSection(i, 'content', e.target.value)}
                      className="text-sm min-h-[140px] resize-y leading-relaxed"
                      placeholder="Conteúdo"
                    />
                    {section.camera_note !== undefined && (
                      <div className="flex items-center gap-1">
                        <Video className="w-3 h-3 text-blue-500 flex-shrink-0" />
                        <Input
                          value={section.camera_note || ''}
                          onChange={(e) => updateSection(i, 'camera_note', e.target.value)}
                          className="text-[11px] h-7 text-blue-600"
                          placeholder="Nota de câmera"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA (editable) */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">CTA</label>
            <Textarea
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              className="text-sm min-h-[80px] resize-y leading-relaxed"
              placeholder="Call to action"
            />
          </div>

          {/* Social posts (read-only with copy) */}
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
        {onDelete && (
          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => { onDelete(piece.id); onClose(); }}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Excluir
          </Button>
        )}
        <Button
          size="sm"
          className="text-xs flex-1"
          onClick={handleSave}
          disabled={!isDirty || isSaving}
        >
          {isSaving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
          Salvar alterações
        </Button>
      </div>
    </div>
  );
}
