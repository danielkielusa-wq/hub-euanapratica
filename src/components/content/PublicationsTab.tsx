/**
 * PublicationsTab — List all publications across all content pieces.
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2, Linkedin, Twitter, CheckCircle2, XCircle, Clock, ExternalLink, RefreshCw,
} from 'lucide-react';
import {
  useAllPublications,
  useCancelPublication,
  useRetryPublication,
  type ContentPublication,
} from '@/hooks/useContentPublishing';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-700', icon: Clock },
  scheduled: { label: 'Agendado', color: 'bg-blue-100 text-blue-700', icon: Clock },
  publishing: { label: 'Publicando', color: 'bg-amber-100 text-amber-700', icon: Loader2 },
  published: { label: 'Publicado', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  failed: { label: 'Falhou', color: 'bg-red-100 text-red-700', icon: XCircle },
  cancelled: { label: 'Cancelado', color: 'bg-gray-100 text-gray-500', icon: XCircle },
};

export function PublicationsTab() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [platformFilter, setPlatformFilter] = useState<string>('');

  const { data: publications = [], isLoading } = useAllPublications({
    status: statusFilter || undefined,
    platform: platformFilter || undefined,
  });
  const cancelPub = useCancelPublication();
  const retryPub = useRetryPublication();

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue placeholder="Todas plataformas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
            <SelectItem value="x">X (Twitter)</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">
          {publications.length} publicacoes
        </span>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : publications.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          Nenhuma publicacao encontrada.
        </div>
      ) : (
        <div className="space-y-2">
          {publications.map((pub) => (
            <PublicationRow
              key={pub.id}
              pub={pub}
              onRetry={() => retryPub.mutate(pub.id)}
              onCancel={() => cancelPub.mutate(pub.id)}
              retrying={retryPub.isPending}
              cancelling={cancelPub.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PublicationRow({
  pub,
  onRetry,
  onCancel,
  retrying,
  cancelling,
}: {
  pub: ContentPublication;
  onRetry: () => void;
  onCancel: () => void;
  retrying: boolean;
  cancelling: boolean;
}) {
  const cfg = STATUS_CONFIG[pub.status] || STATUS_CONFIG.draft;
  const Icon = cfg.icon;
  const PlatformIcon = pub.platform === 'linkedin' ? Linkedin : Twitter;
  const createdAt = new Date(pub.created_at);
  const publishedAt = pub.published_at ? new Date(pub.published_at) : null;

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <PlatformIcon className={`w-4 h-4 shrink-0 ${pub.platform === 'linkedin' ? 'text-blue-600' : 'text-gray-700'}`} />
              <Badge className={`text-[10px] ${cfg.color}`}>
                <Icon className={`w-2.5 h-2.5 mr-1 ${pub.status === 'publishing' ? 'animate-spin' : ''}`} />
                {cfg.label}
              </Badge>
              {pub.media_asset_ids?.length > 0 && (
                <Badge variant="secondary" className="text-[10px]">{pub.media_asset_ids.length} imgs</Badge>
              )}
              <span className="text-[10px] text-muted-foreground">
                {createdAt.toLocaleDateString('pt-BR')} {createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <p className="text-sm truncate">{pub.post_text}</p>

            {pub.scheduled_at && pub.status === 'scheduled' && (
              <p className="text-[10px] text-blue-600">
                Agendado: {new Date(pub.scheduled_at).toLocaleString('pt-BR')}
              </p>
            )}
            {publishedAt && (
              <p className="text-[10px] text-green-600">
                Publicado: {publishedAt.toLocaleString('pt-BR')}
              </p>
            )}
            {pub.error_message && (
              <p className="text-[10px] text-red-600">{pub.error_message}</p>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {pub.platform_post_url && (
              <a
                href={pub.platform_post_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </a>
            )}
            {pub.status === 'failed' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs px-2 gap-1"
                onClick={onRetry}
                disabled={retrying}
              >
                {retrying ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Retry
              </Button>
            )}
            {(pub.status === 'scheduled' || pub.status === 'draft') && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs px-2 text-red-600 hover:text-red-700"
                onClick={onCancel}
                disabled={cancelling}
              >
                Cancelar
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
