/**
 * PublishSheet — Select platforms, edit text, pick images, schedule/publish.
 */

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Loader2, Linkedin, Twitter, Send, Clock, AlertCircle, CheckCircle2, XCircle,
} from 'lucide-react';
import {
  useSocialAccounts,
  useContentPublications,
  useCreatePublication,
  useCancelPublication,
  useRetryPublication,
} from '@/hooks/useContentPublishing';
import { useContentAssets, type ContentAsset } from '@/hooks/useContentAssets';
import type { ContentPiece } from '@/hooks/useAdminContentFactory';

interface Props {
  open: boolean;
  onClose: () => void;
  piece: ContentPiece;
}

const PUB_STATUS: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-700', icon: Clock },
  scheduled: { label: 'Agendado', color: 'bg-blue-100 text-blue-700', icon: Clock },
  publishing: { label: 'Publicando...', color: 'bg-amber-100 text-amber-700', icon: Loader2 },
  published: { label: 'Publicado', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  failed: { label: 'Falhou', color: 'bg-red-100 text-red-700', icon: XCircle },
  cancelled: { label: 'Cancelado', color: 'bg-gray-100 text-gray-500', icon: XCircle },
};

export function PublishSheet({ open, onClose, piece }: Props) {
  const { data: accounts = [] } = useSocialAccounts();
  const { data: assets = [] } = useContentAssets(piece.id);
  const { data: publications = [] } = useContentPublications(piece.id);
  const createPub = useCreatePublication();
  const cancelPub = useCancelPublication();
  const retryPub = useRetryPublication();

  const slides = assets.filter((a) => a.type === 'slide');
  const linkedinAccount = accounts.find((a) => a.platform === 'linkedin');
  const xAccount = accounts.find((a) => a.platform === 'x');

  // Check if there's already an active publication for each platform
  const linkedinActive = publications.some(
    (p) => p.platform === 'linkedin' && ['scheduled', 'publishing', 'published'].includes(p.status),
  );
  const xActive = publications.some(
    (p) => p.platform === 'x' && ['scheduled', 'publishing', 'published'].includes(p.status),
  );

  // Form state
  const [enableLinkedin, setEnableLinkedin] = useState(!!linkedinAccount);
  const [enableX, setEnableX] = useState(!!xAccount);
  const [linkedinText, setLinkedinText] = useState(
    () => piece.social_posts?.find((p) => p.platform === 'linkedin')?.content || piece.title || '',
  );
  const [xText, setXText] = useState(
    () => piece.social_posts?.find((p) => p.platform === 'x')?.content || piece.title || '',
  );
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>(
    () => slides.map((s) => s.id),
  );
  const [scheduleMode, setScheduleMode] = useState<'now' | 'schedule'>('now');
  const [scheduledAt, setScheduledAt] = useState('');

  const toggleAsset = (id: string) => {
    setSelectedAssetIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handlePublish = (platform: 'linkedin' | 'x') => {
    const text = platform === 'linkedin' ? linkedinText : xText;
    createPub.mutate({
      piece_id: piece.id,
      platform,
      post_text: text,
      media_asset_ids: selectedAssetIds,
      scheduled_at: scheduleMode === 'schedule' ? scheduledAt : null,
      publish_now: scheduleMode === 'now',
    });
  };

  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent className="w-[560px] sm:w-[640px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-orange-500" />
            Publicar Conteudo
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-5">
          {/* Platform toggles */}
          <div className="space-y-3">
            {/* LinkedIn */}
            <div className={`p-3 rounded-lg border ${enableLinkedin && linkedinAccount ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={enableLinkedin}
                    onCheckedChange={(v) => setEnableLinkedin(!!v)}
                    disabled={!linkedinAccount}
                  />
                  <Linkedin className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">LinkedIn</span>
                  {!linkedinAccount && (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">Nao conectado</Badge>
                  )}
                </div>
              </div>
              {enableLinkedin && linkedinAccount && (
                <Textarea
                  value={linkedinText}
                  onChange={(e) => setLinkedinText(e.target.value)}
                  rows={4}
                  placeholder="Texto do post no LinkedIn..."
                  className="text-sm resize-y"
                />
              )}
            </div>

            {/* X */}
            <div className={`p-3 rounded-lg border ${enableX && xAccount ? 'border-gray-300 bg-gray-50/30' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={enableX}
                    onCheckedChange={(v) => setEnableX(!!v)}
                    disabled={!xAccount}
                  />
                  <Twitter className="w-4 h-4" />
                  <span className="text-sm font-medium">X (Twitter)</span>
                  {!xAccount && (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">Nao conectado</Badge>
                  )}
                  {enableX && selectedAssetIds.length > 4 && (
                    <Badge variant="secondary" className="text-[10px]">Thread ({Math.ceil(selectedAssetIds.length / 4)} tweets)</Badge>
                  )}
                </div>
              </div>
              {enableX && xAccount && (
                <Textarea
                  value={xText}
                  onChange={(e) => setXText(e.target.value)}
                  rows={3}
                  placeholder="Texto do tweet..."
                  className="text-sm resize-y"
                  maxLength={280}
                />
              )}
            </div>
          </div>

          {/* Image selection */}
          {slides.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">
                Imagens ({selectedAssetIds.length}/{slides.length} selecionadas)
              </label>
              <div className="grid grid-cols-5 gap-2">
                {slides.map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => toggleAsset(asset.id)}
                    className={`relative rounded-lg border-2 overflow-hidden transition-all ${
                      selectedAssetIds.includes(asset.id)
                        ? 'border-orange-400 ring-2 ring-orange-200'
                        : 'border-transparent opacity-50'
                    }`}
                  >
                    <img
                      src={asset.public_url || ''}
                      alt={`Slide ${asset.position}`}
                      className="w-full aspect-square object-cover"
                    />
                    <span className="absolute bottom-0.5 right-0.5 text-[9px] bg-black/60 text-white px-1 rounded">
                      {asset.position}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Schedule */}
          <div className="flex items-center gap-3">
            <Button
              variant={scheduleMode === 'now' ? 'default' : 'outline'}
              size="sm"
              className="text-xs gap-1"
              onClick={() => setScheduleMode('now')}
            >
              <Send className="w-3 h-3" /> Publicar agora
            </Button>
            <Button
              variant={scheduleMode === 'schedule' ? 'default' : 'outline'}
              size="sm"
              className="text-xs gap-1"
              onClick={() => setScheduleMode('schedule')}
            >
              <Clock className="w-3 h-3" /> Agendar
            </Button>
            {scheduleMode === 'schedule' && (
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="h-8 text-xs w-52"
              />
            )}
          </div>

          {/* Publish buttons */}
          <div className="flex gap-2">
            {enableLinkedin && linkedinAccount && (
              <Button
                className="flex-1 gap-1.5"
                onClick={() => handlePublish('linkedin')}
                disabled={createPub.isPending || !linkedinText.trim() || linkedinActive}
              >
                {createPub.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Linkedin className="w-4 h-4" />}
                {linkedinActive ? 'Ja publicado/agendado' : scheduleMode === 'now' ? 'Publicar LinkedIn' : 'Agendar LinkedIn'}
              </Button>
            )}
            {enableX && xAccount && (
              <Button
                variant="outline"
                className="flex-1 gap-1.5"
                onClick={() => handlePublish('x')}
                disabled={createPub.isPending || !xText.trim() || xActive}
              >
                {createPub.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Twitter className="w-4 h-4" />}
                {xActive ? 'Ja publicado/agendado' : scheduleMode === 'now' ? 'Publicar X' : 'Agendar X'}
              </Button>
            )}
          </div>

          {/* Existing publications for this piece */}
          {publications.length > 0 && (
            <div className="border-t pt-4">
              <label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">
                Publicacoes ({publications.length})
              </label>
              <div className="space-y-2">
                {publications.map((pub) => {
                  const cfg = PUB_STATUS[pub.status] || PUB_STATUS.draft;
                  const Icon = cfg.icon;
                  return (
                    <div key={pub.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        {pub.platform === 'linkedin' ? <Linkedin className="w-3.5 h-3.5 text-blue-600" /> : <Twitter className="w-3.5 h-3.5" />}
                        <Badge className={`text-[10px] ${cfg.color}`}>
                          <Icon className={`w-2.5 h-2.5 mr-1 ${pub.status === 'publishing' ? 'animate-spin' : ''}`} />
                          {cfg.label}
                        </Badge>
                        {pub.platform_post_url && (
                          <a
                            href={pub.platform_post_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-blue-600 underline"
                          >
                            Ver post
                          </a>
                        )}
                        {pub.error_message && (
                          <span className="text-[10px] text-red-600 truncate max-w-48" title={pub.error_message}>
                            {pub.error_message}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {pub.status === 'failed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px] px-2"
                            onClick={() => retryPub.mutate(pub.id)}
                            disabled={retryPub.isPending}
                          >
                            Retry
                          </Button>
                        )}
                        {(pub.status === 'scheduled' || pub.status === 'draft') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px] px-2 text-red-600"
                            onClick={() => cancelPub.mutate(pub.id)}
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
