import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResumeUploadCardProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
}

export function ResumeUploadCard({ file, onFileChange }: ResumeUploadCardProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileChange(acceptedFiles[0]);
    }
  }, [onFileChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileChange(null);
  };

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative h-80 rounded-[32px] border-2 border-dashed transition-all duration-200 cursor-pointer",
        "flex flex-col items-center justify-center gap-4 p-6",
        isDragActive 
          ? "border-primary bg-primary/5" 
          : "border-gray-200 bg-white hover:border-primary hover:bg-primary/5",
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
            <p className="font-semibold text-gray-900">{file.name}</p>
            <p className="text-sm text-gray-500 mt-1">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <button
            onClick={removeFile}
            className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </>
      ) : (
        <>
          <div className={cn(
            "flex items-center justify-center w-16 h-16 rounded-[20px] transition-colors",
            isDragActive ? "bg-primary/10" : "bg-gray-50 group-hover:bg-primary/10"
          )}>
            <Upload className={cn(
              "w-8 h-8 transition-colors",
              isDragActive ? "text-primary" : "text-gray-400"
            )} />
          </div>
          
          <div className="text-center">
            <p className="font-semibold text-gray-900">Seu Currículo</p>
            <p className="text-sm text-gray-500 mt-1">
              Arraste e solte seu arquivo<br />
              (PDF/DOCX) aqui ou clique para enviar.
            </p>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100">
            <FileText className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Formato preferencial: PDF
            </span>
          </div>
        </>
      )}
    </div>
  );
}
