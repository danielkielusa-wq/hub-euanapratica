import { FileType } from '@/types/library';
import { getFileIcon, FILE_TYPE_COLORS } from '@/lib/file-utils';
import { cn } from '@/lib/utils';

interface FileIconProps {
  fileType: FileType;
  className?: string;
  size?: number;
}

export function FileIcon({ fileType, className, size = 20 }: FileIconProps) {
  const Icon = getFileIcon(fileType);
  const colorClass = FILE_TYPE_COLORS[fileType];

  return (
    <Icon 
      className={cn(colorClass, className)} 
      size={size} 
    />
  );
}
