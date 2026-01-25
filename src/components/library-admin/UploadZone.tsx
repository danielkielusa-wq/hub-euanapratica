import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { validateFile, formatFileSize, ALLOWED_MIME_TYPES } from '@/lib/file-utils';
import { FileIcon } from '@/components/library/FileIcon';
import { getFileTypeFromMime } from '@/lib/file-utils';
import { UploadProgress } from '@/types/library';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  uploads: UploadProgress[];
  onRemoveFile: (file: File) => void;
  disabled?: boolean;
}

export function UploadZone({ onFilesSelected, uploads, onRemoveFile, disabled }: UploadZoneProps) {
  const [errors, setErrors] = useState<string[]>([]);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    const newErrors: string[] = [];
    const validFiles: File[] = [];

    // Check accepted files
    acceptedFiles.forEach(file => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        newErrors.push(`${file.name}: ${validation.error}`);
      }
    });

    // Check rejected files
    rejectedFiles.forEach(({ file, errors }) => {
      newErrors.push(`${file.name}: Arquivo não aceito`);
    });

    setErrors(newErrors);

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  }, [onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/zip': ['.zip'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled,
  });

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        {isDragActive ? (
          <p className="text-lg font-medium">Solte os arquivos aqui...</p>
        ) : (
          <>
            <p className="text-lg font-medium">Arraste arquivos ou clique para selecionar</p>
            <p className="text-sm text-muted-foreground mt-1">
              PDF, Word, Excel, PowerPoint, ZIP, PNG, JPG (máx. 50MB)
            </p>
          </>
        )}
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center gap-2 text-destructive mb-2">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">Erros de validação</span>
          </div>
          <ul className="text-sm space-y-1">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => setErrors([])}
          >
            Limpar
          </Button>
        </div>
      )}

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Arquivos ({uploads.length})</h4>
          {uploads.map((upload, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-muted rounded-lg"
            >
              <FileIcon fileType={getFileTypeFromMime(upload.file.type)} size={20} />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium truncate">{upload.file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(upload.file.size)}
                  </span>
                </div>
                
                {upload.status === 'uploading' && (
                  <Progress value={upload.progress} className="h-1" />
                )}
                
                {upload.status === 'error' && (
                  <p className="text-xs text-destructive">{upload.error}</p>
                )}
              </div>

              {upload.status === 'completed' ? (
                <Check className="h-5 w-5 text-green-500 shrink-0" />
              ) : upload.status === 'error' ? (
                <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
              ) : upload.status === 'pending' ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => onRemoveFile(upload.file)}
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
