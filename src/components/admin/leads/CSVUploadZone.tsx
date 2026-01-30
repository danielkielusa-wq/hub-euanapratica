import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CSVUploadZoneProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

export function CSVUploadZone({ onFileSelect, isLoading }: CSVUploadZoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    maxFiles: 1,
    disabled: isLoading
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-[24px] p-12 text-center cursor-pointer transition-all duration-200",
        "hover:border-primary/50 hover:bg-primary/5",
        isDragActive && "border-primary bg-primary/10",
        isLoading && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-4">
        {isDragActive ? (
          <FileSpreadsheet className="w-12 h-12 text-primary animate-pulse" />
        ) : (
          <Upload className="w-12 h-12 text-muted-foreground" />
        )}
        <div className="space-y-2">
          <p className="text-lg font-medium text-foreground">
            {isDragActive ? 'Solte o arquivo aqui' : 'Arraste o CSV ou clique para selecionar'}
          </p>
          <p className="text-sm text-muted-foreground">
            Formato esperado: Nome, email, telefone, Area, Atuação, etc.
          </p>
        </div>
      </div>
    </div>
  );
}
