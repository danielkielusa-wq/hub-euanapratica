import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResumeUploadCardProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
}

export function ResumeUploadCard({ file, onFileChange }: ResumeUploadCardProps) {
  const [showDocWarning, setShowDocWarning] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const uploadedFile = acceptedFiles[0];
      const fileName = uploadedFile.name.toLowerCase();
      
      // Check for legacy .doc format
      if (fileName.endsWith('.doc') && !fileName.endsWith('.docx')) {
        setShowDocWarning(true);
      } else {
        setShowDocWarning(false);
      }
      
      onFileChange(uploadedFile);
    }
  }, [onFileChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDocWarning(false);
    onFileChange(null);
  };

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          "relative h-80 rounded-[32px] border-2 border-dashed transition-all duration-200 cursor-pointer",
          "flex flex-col items-center justify-center gap-4 p-6",
          isDragActive 
            ? "border-primary bg-primary/5" 
            : "border-border bg-background hover:border-primary hover:bg-primary/5",
          file && "border-solid border-primary/50 bg-primary/5"
        )}
      >
        <input {...getInputProps()} />
        
        {file ? (
          <>
            <div className="flex items-center justify-center w-16 h-16 rounded-[20px] bg-primary/10">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">{file.name}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={removeFile}
              className="absolute top-4 right-4 p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </>
        ) : (
          <>
            <div className={cn(
              "flex items-center justify-center w-16 h-16 rounded-[20px] transition-colors",
              isDragActive ? "bg-primary/10" : "bg-muted group-hover:bg-primary/10"
            )}>
              <Upload className={cn(
                "w-8 h-8 transition-colors",
                isDragActive ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            
            <div className="text-center">
              <p className="font-semibold text-foreground">Seu Currículo</p>
              <p className="text-sm text-muted-foreground mt-1">
                Arraste e solte seu arquivo<br />
                (PDF/DOCX) aqui ou clique para enviar.
              </p>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Formato preferencial: PDF
              </span>
            </div>
          </>
        )}
      </div>

      {/* Warning for legacy .doc files */}
      {showDocWarning && (
        <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-2xl">
          <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-destructive">Arquivo .doc detectado</p>
            <p className="text-destructive/80 mt-1">
              Arquivos .doc (formato legado) podem não ser processados corretamente. 
              Recomendamos converter para PDF para melhores resultados.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
