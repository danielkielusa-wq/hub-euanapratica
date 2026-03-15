/**
 * AssetGeneratorSheet — Two-step flow:
 * 1. Generate carousel content (LLM) if not exists
 * 2. Edit slides inline → choose template → generate PNGs
 */

import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2, Download, Trash2, Image, RefreshCw, Sparkles, Pencil, Check, X, ZoomIn, Settings2, GripVertical,
} from 'lucide-react';
import { SlidePreviewFrame, type TemplateConfig } from './SlideRenderer';
import {
  useVisualTemplates,
  useContentAssets,
  useGenerateAssets,
  useDeleteAssets,
  useGenerateCarousel,
  type VisualTemplate,
} from '@/hooks/useContentAssets';
import type { ContentPiece, CarouselSlide } from '@/hooks/useAdminContentFactory';

// ── Sortable slide item ──────────────────────────────────────────────────

interface SortableSlideProps {
  id: string;
  cs: CarouselSlide;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onStopEdit: () => void;
  onUpdate: (updates: Partial<CarouselSlide>) => void;
}

function SortableSlideItem({ id, cs, index, isEditing, onEdit, onStopEdit, onUpdate }: SortableSlideProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 rounded-lg border transition-colors ${
        isDragging ? 'shadow-lg ring-2 ring-orange-300 z-50 bg-white' :
        isEditing ? 'border-orange-300 bg-orange-50/30' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-muted shrink-0 mt-0.5"
        >
          <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <Badge variant="outline" className="text-[9px] shrink-0 mt-0.5">
          {cs.slide_number}. {cs.slide_type}
        </Badge>
        {isEditing ? (
          <div className="flex-1 space-y-2">
            <Input
              value={cs.headline}
              onChange={(e) => onUpdate({ headline: e.target.value })}
              className="h-7 text-xs font-semibold"
              placeholder="Headline..."
            />
            <Textarea
              value={cs.body}
              onChange={(e) => onUpdate({ body: e.target.value })}
              rows={2}
              className="text-xs resize-y"
              placeholder="Body..."
            />
            {(cs.slide_type === 'data' || cs.accent_text) && (
              <Input
                value={cs.accent_text}
                onChange={(e) => onUpdate({ accent_text: e.target.value })}
                className="h-7 text-xs"
                placeholder="Dado/destaque..."
              />
            )}
            <div className="flex gap-1 justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2"
                onClick={onStopEdit}
              >
                <Check className="w-3 h-3 text-green-600" />
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="flex-1 cursor-pointer min-w-0"
            onClick={onEdit}
          >
            <p className="text-xs font-semibold truncate">{cs.headline}</p>
            {cs.body && (
              <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{cs.body}</p>
            )}
            {cs.accent_text && (
              <span className="text-[10px] text-orange-600 font-medium">{cs.accent_text}</span>
            )}
          </div>
        )}
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 shrink-0"
            onClick={onEdit}
          >
            <Pencil className="w-3 h-3 text-muted-foreground" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  piece: ContentPiece;
}

export function AssetGeneratorSheet({ open, onClose, piece }: Props) {
  const { data: templates = [], isLoading: templatesLoading } = useVisualTemplates();
  const { data: assets = [], isLoading: assetsLoading } = useContentAssets(piece.id);
  const generateAssets = useGenerateAssets();
  const deleteAssets = useDeleteAssets();
  const generateCarousel = useGenerateCarousel();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [editingSlides, setEditingSlides] = useState<CarouselSlide[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [zoomSlide, setZoomSlide] = useState<number | null>(null);

  // Customization options
  const [numSlides, setNumSlides] = useState(8);
  const [style, setStyle] = useState('');
  const [ctaType, setCtaType] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [showConfig, setShowConfig] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setEditingSlides((prev) => {
      const oldIndex = prev.findIndex((_, i) => `slide-${i}` === active.id);
      const newIndex = prev.findIndex((_, i) => `slide-${i}` === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex);
      // Renumber slide_number after reorder
      return reordered.map((s, i) => ({ ...s, slide_number: i + 1 }));
    });
  };

  // Sync carousel_slides from piece into local editing state
  useEffect(() => {
    if (piece.carousel_slides?.length) {
      setEditingSlides(piece.carousel_slides);
    }
  }, [piece.carousel_slides]);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId)
    || templates.find((t) => t.is_default)
    || templates[0];
  const effectiveTemplateId = selectedTemplate?.id || '';

  const slides = assets.filter((a) => a.type === 'slide');
  const thumbnail = assets.find((a) => a.type === 'thumbnail');
  const hasAssets = slides.length > 0;
  const hasCarouselContent = editingSlides.length > 0;

  const handleGenerateCarousel = () => {
    generateCarousel.mutate({
      pieceId: piece.id,
      numSlides,
      style: style || undefined,
      ctaType: ctaType || undefined,
      aspectRatio: aspectRatio || undefined,
    }, {
      onSuccess: (data) => {
        setEditingSlides(data.carousel_slides);
        setShowConfig(false);
      },
    });
  };

  const handleGeneratePNGs = () => {
    if (!selectedTemplate || editingSlides.length === 0) return;
    const templateConfig: TemplateConfig = {
      html_template: selectedTemplate.html_template,
      css: selectedTemplate.css,
      colors: selectedTemplate.colors,
      fonts: selectedTemplate.fonts,
    };
    generateAssets.mutate({
      pieceId: piece.id,
      templateId: effectiveTemplateId,
      template: templateConfig,
      carouselSlides: editingSlides,
      title: piece.title || '',
      onProgress: (current, total) => setProgress({ current, total }),
    }, {
      onSettled: () => setProgress(null),
    });
  };

  const updateSlide = (index: number, updates: Partial<CarouselSlide>) => {
    setEditingSlides((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...updates } : s)),
    );
  };

  const handleDownloadAll = async () => {
    for (const asset of slides) {
      if (!asset.public_url) continue;
      const a = document.createElement('a');
      a.href = asset.public_url;
      a.download = `slide-${asset.position}.png`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      await new Promise((r) => setTimeout(r, 300));
    }
  };

  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent className="w-[560px] sm:w-[700px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Image className="w-5 h-5 text-orange-500" />
            Gerar Visuais
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-5">
          {/* Step 1: Configure + Generate carousel content */}
          {((!hasCarouselContent && !hasAssets) || showConfig) && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center mb-3">
                  <Sparkles className="w-7 h-7 text-orange-500" />
                </div>
                <h3 className="text-sm font-semibold">Gerar Conteudo de Carrossel</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Configure e a IA transforma o roteiro em slides otimizados.
                </p>
              </div>

              {/* Slide count slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-muted-foreground">Quantidade de slides</label>
                  <span className="text-sm font-bold text-orange-600">{numSlides}</span>
                </div>
                <Slider
                  value={[numSlides]}
                  onValueChange={([v]) => setNumSlides(v)}
                  min={4}
                  max={15}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground">4 (rapido)</span>
                  <span className="text-[10px] text-muted-foreground">15 (detalhado)</span>
                </div>
              </div>

              {/* Style + CTA + Aspect ratio */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Estilo visual</label>
                  <Select value={style || '_auto'} onValueChange={(v) => setStyle(v === '_auto' ? '' : v)}>
                    <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_auto" className="text-xs">Auto (IA decide)</SelectItem>
                      <SelectItem value="profissional" className="text-xs">Profissional</SelectItem>
                      <SelectItem value="provocativo" className="text-xs">Provocativo</SelectItem>
                      <SelectItem value="minimalista" className="text-xs">Minimalista</SelectItem>
                      <SelectItem value="dados_e_stats" className="text-xs">Dados & Stats</SelectItem>
                      <SelectItem value="storytelling" className="text-xs">Storytelling</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">CTA final</label>
                  <Select value={ctaType || '_auto'} onValueChange={(v) => setCtaType(v === '_auto' ? '' : v)}>
                    <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_auto" className="text-xs">Auto (do roteiro)</SelectItem>
                      <SelectItem value="seguir perfil" className="text-xs">Seguir perfil</SelectItem>
                      <SelectItem value="comentar opiniao" className="text-xs">Comentar opiniao</SelectItem>
                      <SelectItem value="salvar para depois" className="text-xs">Salvar para depois</SelectItem>
                      <SelectItem value="compartilhar com alguem" className="text-xs">Compartilhar</SelectItem>
                      <SelectItem value="link na bio" className="text-xs">Link na bio</SelectItem>
                      <SelectItem value="enviar DM" className="text-xs">Enviar DM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Formato</label>
                <div className="flex gap-2">
                  {([
                    { value: '1:1', label: '1:1', desc: 'Instagram' },
                    { value: '4:5', label: '4:5', desc: 'LinkedIn' },
                    { value: '9:16', label: '9:16', desc: 'Stories' },
                  ] as const).map(ar => (
                    <button
                      key={ar.value}
                      onClick={() => setAspectRatio(ar.value)}
                      className={`flex-1 py-2 rounded-lg border text-center transition-colors ${
                        aspectRatio === ar.value
                          ? 'border-orange-400 bg-orange-50 text-orange-700'
                          : 'border-gray-200 hover:border-gray-300 text-muted-foreground'
                      }`}
                    >
                      <span className="text-sm font-bold block">{ar.label}</span>
                      <span className="text-[10px]">{ar.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                {showConfig && hasCarouselContent && (
                  <Button
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => setShowConfig(false)}
                  >
                    Voltar
                  </Button>
                )}
                <Button
                  className="flex-1 gap-1.5"
                  onClick={handleGenerateCarousel}
                  disabled={generateCarousel.isPending}
                >
                  {generateCarousel.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {generateCarousel.isPending ? 'Gerando conteudo...' : hasCarouselContent ? `Regenerar ${numSlides} Slides` : `Gerar ${numSlides} Slides`}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Edit slides + choose template + generate PNGs */}
          {hasCarouselContent && !showConfig && (
            <>
              {/* Editable slides */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Slides ({editingSlides.length})
                  </label>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] gap-1"
                      onClick={() => setShowConfig(true)}
                    >
                      <Settings2 className="w-3 h-3" />
                      Configuracoes
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] gap-1 text-orange-600"
                      onClick={handleGenerateCarousel}
                      disabled={generateCarousel.isPending}
                    >
                      {generateCarousel.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      Regenerar conteudo
                    </Button>
                  </div>
                </div>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={editingSlides.map((_, i) => `slide-${i}`)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {editingSlides.map((cs, i) => (
                        <SortableSlideItem
                          key={`slide-${i}`}
                          id={`slide-${i}`}
                          cs={cs}
                          index={i}
                          isEditing={editingIndex === i}
                          onEdit={() => setEditingIndex(i)}
                          onStopEdit={() => setEditingIndex(null)}
                          onUpdate={(updates) => updateSlide(i, updates)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>

              {/* Template selector */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">Template</label>
                {templatesLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <div className="flex gap-2 flex-wrap">
                    {templates.filter((t) => t.type === 'carousel').map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTemplateId(t.id)}
                        className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                          (effectiveTemplateId === t.id) ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded mb-1 mx-auto"
                          style={{ background: t.colors?.bg || '#ccc' }}
                        />
                        {t.display_name}
                        {t.is_default && <Badge variant="secondary" className="text-[8px] ml-1">Padrao</Badge>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Preview strip */}
              {selectedTemplate && editingSlides.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">
                    Preview ({editingSlides.length} slides) — clique para ampliar
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {editingSlides.map((cs, i) => (
                      <div
                        key={i}
                        className="shrink-0 cursor-pointer group relative"
                        onClick={() => setZoomSlide(i)}
                      >
                        <SlidePreviewFrame
                          template={{
                            html_template: selectedTemplate.html_template,
                            css: selectedTemplate.css,
                            colors: selectedTemplate.colors,
                            fonts: selectedTemplate.fonts,
                          }}
                          slide={{
                            headline: cs.headline,
                            body: cs.body,
                            slideNumber: cs.slide_number,
                            totalSlides: editingSlides.length,
                            slideType: cs.slide_type,
                            accentText: cs.accent_text,
                            footnote: cs.footnote,
                          }}
                          scale={0.18}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg flex items-center justify-center">
                          <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-[10px] text-muted-foreground text-center mt-1">
                          {cs.slide_number}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Zoom dialog */}
              {zoomSlide !== null && selectedTemplate && (
                <Dialog open onOpenChange={() => setZoomSlide(null)}>
                  <DialogContent className="max-w-[620px] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">
                        Slide {editingSlides[zoomSlide].slide_number}/{editingSlides.length}
                        <Badge variant="outline" className="ml-2 text-[10px]">
                          {editingSlides[zoomSlide].slide_type}
                        </Badge>
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          disabled={zoomSlide === 0}
                          onClick={() => setZoomSlide((v) => (v !== null && v > 0 ? v - 1 : v))}
                        >
                          ← Anterior
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          disabled={zoomSlide === editingSlides.length - 1}
                          onClick={() => setZoomSlide((v) => (v !== null && v < editingSlides.length - 1 ? v + 1 : v))}
                        >
                          Proximo →
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <SlidePreviewFrame
                        template={{
                          html_template: selectedTemplate.html_template,
                          css: selectedTemplate.css,
                          colors: selectedTemplate.colors,
                          fonts: selectedTemplate.fonts,
                        }}
                        slide={{
                          headline: editingSlides[zoomSlide].headline,
                          body: editingSlides[zoomSlide].body,
                          slideNumber: editingSlides[zoomSlide].slide_number,
                          totalSlides: editingSlides.length,
                          slideType: editingSlides[zoomSlide].slide_type,
                          accentText: editingSlides[zoomSlide].accent_text,
                          footnote: editingSlides[zoomSlide].footnote,
                        }}
                        scale={0.53}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {/* Progress bar */}
              {progress && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                    <span className="text-sm">Gerando slide {progress.current}/{progress.total}...</span>
                  </div>
                  <Progress value={(progress.current / progress.total) * 100} className="h-2" />
                </div>
              )}

              {/* Generated assets */}
              {hasAssets && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      Slides gerados ({slides.length})
                    </label>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={handleDownloadAll}>
                        <Download className="w-3 h-3" /> Baixar todos
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1 text-red-600 hover:text-red-700"
                        onClick={() => deleteAssets.mutate(piece.id)}
                        disabled={deleteAssets.isPending}
                      >
                        <Trash2 className="w-3 h-3" /> Limpar
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {slides.map((asset) => (
                      <div key={asset.id} className="relative group">
                        <img
                          src={asset.public_url || ''}
                          alt={`Slide ${asset.position}`}
                          className="w-full aspect-square rounded-lg border object-cover"
                        />
                        <span className="absolute bottom-1 right-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                          {asset.position}
                        </span>
                        <a
                          href={asset.public_url || ''}
                          download={`slide-${asset.position}.png`}
                          target="_blank"
                          rel="noopener"
                          className="absolute top-1 right-1 p-1 bg-black/60 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Download className="w-3 h-3 text-white" />
                        </a>
                      </div>
                    ))}
                  </div>

                  {thumbnail && (
                    <div className="mt-3">
                      <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Thumbnail</label>
                      <img
                        src={thumbnail.public_url || ''}
                        alt="Thumbnail"
                        className="w-48 aspect-square rounded-lg border object-cover"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 pt-2 border-t">
                {!hasAssets ? (
                  <Button
                    className="gap-1.5 flex-1"
                    onClick={handleGeneratePNGs}
                    disabled={generateAssets.isPending || !selectedTemplate || editingSlides.length === 0}
                  >
                    {generateAssets.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Image className="w-4 h-4" />
                    )}
                    Gerar {editingSlides.length} Slides PNG
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="gap-1.5 flex-1"
                    onClick={handleGeneratePNGs}
                    disabled={generateAssets.isPending}
                  >
                    {generateAssets.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Regenerar PNGs
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
