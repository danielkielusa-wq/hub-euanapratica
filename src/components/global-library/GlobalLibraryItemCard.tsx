import {
  FileText,
  File,
  Video,
  Link as LinkIcon,
  Image as ImageIcon,
  Star,
  Download,
} from 'lucide-react';
import { LibraryItem } from '@/types/global-library';

interface GlobalLibraryItemCardProps {
  item: LibraryItem;
  isFavorite: boolean;
  onDownload: () => void;
  onPreview: () => void;
  onToggleFavorite: () => void;
}

type ResourceType = 'pdf' | 'doc' | 'docx' | 'video' | 'link' | 'image' | string;

function FileIcon({ type }: { type: ResourceType }) {
  switch (type) {
    case 'pdf':
      return (
        <div className="p-2 bg-red-50 text-red-600 rounded-lg">
          <FileText className="w-5 h-5" />
        </div>
      );
    case 'doc':
    case 'docx':
    case 'xlsx':
    case 'xls':
    case 'pptx':
      return (
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
          <File className="w-5 h-5" />
        </div>
      );
    case 'video':
    case 'mp4':
    case 'mov':
    case 'avi':
      return (
        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
          <Video className="w-5 h-5" />
        </div>
      );
    case 'link':
      return (
        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
          <LinkIcon className="w-5 h-5" />
        </div>
      );
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'webp':
      return (
        <div className="p-2 bg-pink-50 text-pink-600 rounded-lg">
          <ImageIcon className="w-5 h-5" />
        </div>
      );
    default:
      return (
        <div className="p-2 bg-gray-50 text-gray-600 rounded-lg">
          <File className="w-5 h-5" />
        </div>
      );
  }
}

function formatFileSize(bytes: number | null): string | null {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function GlobalLibraryItemCard({
  item,
  isFavorite,
  onDownload,
  onPreview,
  onToggleFavorite,
}: GlobalLibraryItemCardProps) {
  const isLink = item.item_type === 'link';
  const resourceType = isLink ? 'link' : (item.file_type?.toLowerCase() || 'file');
  const fileSize = formatFileSize(item.file_size);

  const handleCardClick = () => {
    if (isLink) {
      onDownload();
    } else {
      onPreview();
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm group cursor-pointer flex flex-col h-full hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
    >
      <div className="flex justify-between items-start mb-3">
        <FileIcon type={resourceType} />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className={`transition-colors ${
            isFavorite ? 'text-amber-400' : 'text-gray-300 hover:text-amber-400'
          }`}
        >
          <Star className="w-4 h-4 fill-current" />
        </button>
      </div>

      <div className="flex-1">
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-indigo-600 transition-colors">
          {item.title}
        </h3>
        {item.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">
            {item.description}
          </p>
        )}
      </div>

      {item.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-gray-50 text-gray-500 text-[10px] uppercase tracking-wide font-medium rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-auto">
        <div className="flex items-center text-xs text-gray-400 gap-2">
          {fileSize && <span>{fileSize}</span>}
          {isLink && <span>URL Externa</span>}
          {(fileSize || isLink) && (
            <span className="w-1 h-1 rounded-full bg-gray-300" />
          )}
          <span>{formatDate(item.created_at)}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload();
          }}
          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
