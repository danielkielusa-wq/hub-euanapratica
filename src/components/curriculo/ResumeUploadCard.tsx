import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, X, AlertTriangle, FileType, Lock } from 'lucide-react';

interface ResumeUploadCardProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
  onBlockedAction?: () => void;
}

export function ResumeUploadCard({
  file,
  onFileChange,
  disabled = false,
  onBlockedAction
}: ResumeUploadCardProps) {
  const [showDocWarning, setShowDocWarning] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    if (disabled) {
      onBlockedAction?.();
      return;
    }

    // Handle rejected files — on Windows, DOCX MIME type can mismatch
    const f = acceptedFiles[0] || fileRejections[0]?.file;
    if (!f) return;

    const fileName = f.name.toLowerCase();
    const validExt = fileName.endsWith('.pdf') || fileName.endsWith('.docx') || fileName.endsWith('.doc');
    if (!validExt) return;

    if (fileName.endsWith('.doc') && !fileName.endsWith('.docx')) {
      setShowDocWarning(true);
    } else {
      setShowDocWarning(false);
    }

    onFileChange(f);
  }, [onFileChange, disabled, onBlockedAction]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'application/octet-stream': ['.docx', '.doc'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled,
    useFsAccessApi: false,
  });

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDocWarning(false);
    onFileChange(null);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        {/* Disabled overlay */}
        {disabled && (
          <div
            className="absolute inset-0 bg-white/70 backdrop-blur-sm rounded-2xl z-10
                       flex items-center justify-center cursor-pointer transition-all
                       hover:bg-white/80"
            onClick={() => onBlockedAction?.()}
          >
            <div className="text-center p-4">
              <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-500">
                Limite de créditos atingido
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Clique para fazer upgrade
              </p>
            </div>
          </div>
        )}

        <div
          {...getRootProps()}
          className={`
            relative rounded-2xl border-2 border-dashed transition-all duration-200 flex flex-col min-h-[280px] lg:min-h-[400px]
            ${disabled
              ? 'border-gray-200 bg-gray-50/50 cursor-not-allowed opacity-60'
              : isDragActive
                ? 'border-[#7367F0] bg-indigo-50/30 ring-4 ring-indigo-100'
                : file
                  ? 'border-solid border-[#7367F0]/50 bg-indigo-50/10'
                  : 'border-gray-300 bg-white hover:border-[#7367F0] hover:bg-gray-50/50'
            }
          `}
        >
          <input {...getInputProps()} />

          {file ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mb-3 sm:mb-4 animate-in zoom-in duration-300">
                <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
              </div>
              <h3 className="text-base sm:text-xl font-bold text-gray-800 mb-1 text-center break-all px-2">{file.name}</h3>
              <p className="text-sm text-gray-500 mb-4 sm:mb-6">
                {(file.size / 1024 / 1024).toFixed(2)} MB &bull; Pronto para análise
              </p>
              {!disabled && (
                <button
                  onClick={removeFile}
                  className="text-red-500 hover:text-red-700 text-sm font-bold flex items-center gap-1 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <X className="w-4 h-4" /> Remover arquivo
                </button>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 text-center cursor-pointer">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4 sm:mb-6 transition-transform duration-300">
                <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-[#7367F0]" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Seu Currículo</h3>
              <p className="text-sm text-gray-500 max-w-xs mb-6 sm:mb-8 leading-relaxed">
                Arraste e solte seu arquivo (PDF ou DOCX) aqui ou clique para buscar no computador.
              </p>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full uppercase tracking-wide">
                <FileType className="w-3 h-3" /> PDF Preferencial
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Warning for legacy .doc files */}
      {showDocWarning && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-red-600">Arquivo .doc detectado</p>
            <p className="text-red-500/80 mt-1">
              Arquivos .doc (formato legado) podem não ser processados corretamente.
              Recomendamos converter para PDF para melhores resultados.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
