import { useState, useEffect } from 'react';
import { ExternalLink, X, Play } from 'lucide-react';

interface LinkPreviewData {
  url: string;
  title: string;
  description?: string;
  thumbnail?: string;
  domain: string;
  isYouTube: boolean;
  videoId?: string;
}

interface LinkPreviewProps {
  url: string;
  onRemove?: () => void;
}

// Extract YouTube video ID from various URL formats
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

export function LinkPreview({ url, onRemove }: LinkPreviewProps) {
  const [preview, setPreview] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const domain = getDomain(url);
    const videoId = extractYouTubeId(url);

    if (videoId) {
      // YouTube: use oEmbed API (supports CORS)
      setLoading(true);
      fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          setPreview({
            url,
            title: data?.title || 'YouTube Video',
            description: data?.author_name ? `por ${data.author_name}` : undefined,
            thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            domain: 'youtube.com',
            isYouTube: true,
            videoId,
          });
        })
        .catch(() => {
          setPreview({
            url,
            title: 'YouTube Video',
            thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            domain: 'youtube.com',
            isYouTube: true,
            videoId,
          });
        })
        .finally(() => setLoading(false));
    } else {
      // Generic URL: show domain + favicon
      setPreview({
        url,
        title: domain,
        domain,
        isYouTube: false,
      });
      setLoading(false);
    }
  }, [url]);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 p-3 animate-pulse">
        <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
      </div>
    );
  }

  if (!preview) return null;

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50 relative group">
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 z-10 p-1 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-3.5 h-3.5 text-gray-500" />
        </button>
      )}

      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        {/* Thumbnail */}
        {preview.thumbnail && (
          <div className="relative w-full aspect-video bg-gray-200">
            <img
              src={preview.thumbnail}
              alt={preview.title}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            {preview.isYouTube && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                  <Play className="w-6 h-6 text-white ml-1" fill="white" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info */}
        <div className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <img
              src={`https://www.google.com/s2/favicons?domain=${preview.domain}&sz=16`}
              alt=""
              className="w-4 h-4"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
              {preview.domain}
            </span>
          </div>
          <p className="text-sm font-bold text-gray-900 leading-tight line-clamp-2">
            {preview.title}
          </p>
          {preview.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-1">
              {preview.description}
            </p>
          )}
          <div className="flex items-center gap-1 mt-2 text-brand-600">
            <ExternalLink className="w-3 h-3" />
            <span className="text-[10px] font-bold">Abrir link</span>
          </div>
        </div>
      </a>
    </div>
  );
}

// Utility: extract first URL from text
const URL_REGEX = /https?:\/\/[^\s<>\"')\]]+/g;

export function extractFirstUrl(text: string): string | null {
  const match = text.match(URL_REGEX);
  return match ? match[0] : null;
}
