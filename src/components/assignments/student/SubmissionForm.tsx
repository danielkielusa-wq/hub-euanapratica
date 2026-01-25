import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Upload, FileText, X, Loader2, Check, AlertCircle, Save } from 'lucide-react';
import { formatFileSize } from '@/lib/file-utils';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useSaveDraft, useSubmitAssignment, useUploadSubmissionFile } from '@/hooks/useSubmissions';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import type { Assignment, Submission, SubmissionType } from '@/types/assignments';

interface SubmissionFormProps {
  assignment: Assignment;
  existingSubmission?: Submission | null;
  onSubmitSuccess?: () => void;
}

interface SubmissionData {
  file_url?: string;
  file_name?: string;
  file_size?: number;
  text_content?: string;
}

export function SubmissionForm({ assignment, existingSubmission, onSubmitSuccess }: SubmissionFormProps) {
  const { user } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState<SubmissionData>({
    file_url: existingSubmission?.file_url || undefined,
    file_name: existingSubmission?.file_name || undefined,
    file_size: existingSubmission?.file_size || undefined,
    text_content: existingSubmission?.text_content || ''
  });

  // Mutations
  const saveDraft = useSaveDraft();
  const submitAssignment = useSubmitAssignment();
  const uploadFile = useUploadSubmissionFile();

  // Auto-save
  const handleAutoSave = useCallback(async (data: SubmissionData) => {
    if (!user?.id) return;
    await saveDraft.mutateAsync({
      assignment_id: assignment.id,
      ...data
    });
  }, [assignment.id, saveDraft, user?.id]);

  const { status: autoSaveStatus, lastSaved } = useAutoSave({
    data: formData,
    onSave: handleAutoSave,
    delay: 30000, // 30 seconds
    enabled: !!user?.id && (!!formData.text_content || !!formData.file_url)
  });

  // File validation
  const validateFile = (file: File): string | null => {
    // Check size
    if (file.size > assignment.max_file_size) {
      return `Arquivo muito grande. Máximo: ${formatFileSize(assignment.max_file_size)}`;
    }

    // Check type
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext && !assignment.allowed_file_types.includes(ext)) {
      return `Tipo de arquivo não permitido. Permitidos: ${assignment.allowed_file_types.join(', ')}`;
    }

    return null;
  };

  // Dropzone
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file || !user?.id) return;

    const error = validateFile(file);
    if (error) {
      return;
    }

    setSelectedFile(file);
    setIsUploading(true);
    setUploadProgress(0);

    // Simulate progress (actual upload doesn't give progress)
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90));
    }, 100);

    try {
      const result = await uploadFile.mutateAsync({
        file,
        assignmentId: assignment.id,
        userId: user.id
      });

      setUploadProgress(100);
      setFormData(prev => ({
        ...prev,
        file_url: result.url,
        file_name: result.name,
        file_size: result.size
      }));
    } catch (error) {
      console.error('Upload error:', error);
      setSelectedFile(null);
    } finally {
      clearInterval(progressInterval);
      setIsUploading(false);
    }
  }, [assignment.id, assignment.max_file_size, assignment.allowed_file_types, uploadFile, user?.id]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/zip': ['.zip']
    }
  });

  // Handle file removal
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFormData(prev => ({
      ...prev,
      file_url: undefined,
      file_name: undefined,
      file_size: undefined
    }));
  };

  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      text_content: e.target.value
    }));
  };

  // Handle submit
  const handleSubmit = async () => {
    setConfirmOpen(false);
    
    await submitAssignment.mutateAsync({
      assignment_id: assignment.id,
      ...formData
    });

    onSubmitSuccess?.();
  };

  // Check if form is valid
  const isValid = () => {
    if (assignment.submission_type === 'file') {
      return !!formData.file_url;
    }
    if (assignment.submission_type === 'text') {
      return !!formData.text_content?.trim();
    }
    // 'both' - at least one
    return !!formData.file_url || !!formData.text_content?.trim();
  };

  // Show file upload
  const showFileUpload = assignment.submission_type === 'file' || assignment.submission_type === 'both';
  // Show text editor
  const showTextEditor = assignment.submission_type === 'text' || assignment.submission_type === 'both';

  return (
    <div className="space-y-6">
      {/* Auto-save indicator */}
      <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
        {autoSaveStatus === 'saving' && (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Salvando...
          </>
        )}
        {autoSaveStatus === 'saved' && lastSaved && (
          <>
            <Check className="h-4 w-4 text-green-500" />
            Rascunho salvo
          </>
        )}
        {autoSaveStatus === 'error' && (
          <>
            <AlertCircle className="h-4 w-4 text-destructive" />
            Erro ao salvar
          </>
        )}
      </div>

      {/* File upload section */}
      {showFileUpload && (
        <div className="space-y-2">
          <Label>Arquivo</Label>
          
          {formData.file_url && formData.file_name ? (
            // Show uploaded file
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{formData.file_name}</p>
                      {formData.file_size && (
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(formData.file_size)}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={handleRemoveFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Show dropzone
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                isDragActive 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50"
              )}
            >
              <input {...getInputProps()} />
              
              {isUploading ? (
                <div className="space-y-4">
                  <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
                  <Progress value={uploadProgress} className="max-w-xs mx-auto" />
                  <p className="text-sm text-muted-foreground">Enviando arquivo...</p>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm font-medium">
                    {isDragActive ? 'Solte o arquivo aqui' : 'Arraste um arquivo ou clique para selecionar'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Formatos aceitos: {assignment.allowed_file_types.join(', ').toUpperCase()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tamanho máximo: {formatFileSize(assignment.max_file_size)}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Text editor section */}
      {showTextEditor && (
        <div className="space-y-2">
          <Label htmlFor="text-content">
            Texto da Entrega
            {assignment.submission_type === 'both' && (
              <span className="text-muted-foreground font-normal ml-2">(opcional se enviar arquivo)</span>
            )}
          </Label>
          <Textarea
            id="text-content"
            value={formData.text_content || ''}
            onChange={handleTextChange}
            placeholder="Digite sua resposta aqui..."
            rows={10}
            className="resize-none"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => handleAutoSave(formData)}
          disabled={saveDraft.isPending}
        >
          {saveDraft.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Rascunho
        </Button>

        <Button
          onClick={() => setConfirmOpen(true)}
          disabled={!isValid() || submitAssignment.isPending}
        >
          {submitAssignment.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          Enviar Tarefa
        </Button>
      </div>

      {/* Confirmation dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Entrega</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja enviar esta tarefa? 
              {assignment.allow_late_submission 
                ? ' Você poderá reenviar se necessário.'
                : ' Após o envio, não será possível fazer alterações.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>
              Confirmar Envio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
