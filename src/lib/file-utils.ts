import { FileType } from '@/types/library';
import { 
  FileText, 
  FileSpreadsheet, 
  Presentation, 
  Image, 
  Archive, 
  Link, 
  File 
} from 'lucide-react';

export const FILE_TYPE_ICONS: Record<FileType, typeof FileText> = {
  pdf: FileText,
  docx: FileText,
  xlsx: FileSpreadsheet,
  pptx: Presentation,
  png: Image,
  jpg: Image,
  zip: Archive,
  link: Link,
};

export const FILE_TYPE_LABELS: Record<FileType, string> = {
  pdf: 'PDF',
  docx: 'Word',
  xlsx: 'Excel',
  pptx: 'PowerPoint',
  png: 'Imagem PNG',
  jpg: 'Imagem JPG',
  zip: 'Arquivo ZIP',
  link: 'Link Externo',
};

export const FILE_TYPE_COLORS: Record<FileType, string> = {
  pdf: 'text-red-500',
  docx: 'text-blue-500',
  xlsx: 'text-green-500',
  pptx: 'text-orange-500',
  png: 'text-purple-500',
  jpg: 'text-purple-500',
  zip: 'text-yellow-600',
  link: 'text-cyan-500',
};

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return '-';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(size < 10 ? 1 : 0)} ${units[unitIndex]}`;
}

export function getFileTypeFromMime(mimeType: string): FileType {
  const mimeMap: Record<string, FileType> = {
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'application/zip': 'zip',
    'image/png': 'png',
    'image/jpeg': 'jpg',
  };
  
  return mimeMap[mimeType] || 'pdf';
}

export function getFileTypeFromExtension(filename: string): FileType {
  const ext = filename.split('.').pop()?.toLowerCase();
  const extMap: Record<string, FileType> = {
    pdf: 'pdf',
    docx: 'docx',
    doc: 'docx',
    xlsx: 'xlsx',
    xls: 'xlsx',
    pptx: 'pptx',
    ppt: 'pptx',
    zip: 'zip',
    png: 'png',
    jpg: 'jpg',
    jpeg: 'jpg',
  };
  
  return extMap[ext || ''] || 'pdf';
}

// Alias for getFileTypeFromExtension
export const getFileTypeFromName = getFileTypeFromExtension;

export function isPreviewable(fileType: FileType): boolean {
  return ['pdf', 'png', 'jpg'].includes(fileType);
}

export function isImageType(fileType: FileType): boolean {
  return ['png', 'jpg'].includes(fileType);
}

export function getFileIcon(fileType: FileType) {
  return FILE_TYPE_ICONS[fileType] || File;
}

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'image/png',
  'image/jpeg',
];

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: `Tipo de arquivo não permitido: ${file.type}. Tipos aceitos: PDF, DOCX, XLSX, PPTX, ZIP, PNG, JPG` 
    };
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `Arquivo muito grande (${formatFileSize(file.size)}). Máximo permitido: 50 MB` 
    };
  }
  
  return { valid: true };
}
