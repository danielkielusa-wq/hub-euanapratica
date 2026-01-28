import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OnboardingProfile } from '@/types/onboarding';
import { useResumeUpload } from '@/hooks/useOnboarding';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, X, Loader2, CheckCircle2, ExternalLink } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';

interface LinkedInResumeStepProps {
  data: Partial<OnboardingProfile>;
  onChange: (field: keyof OnboardingProfile, value: string | null) => void;
  errors: Record<string, string>;
}

export function LinkedInResumeStep({ data, onChange, errors }: LinkedInResumeStepProps) {
  const { user } = useAuth();
  const { uploadResume, isUploading, error: uploadError } = useResumeUpload();
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file || !user?.id) return;

    setUploadedFileName(file.name);
    const path = await uploadResume(file);
    if (path) {
      onChange('resume_url', path);
      
      // Save immediately to profile
      try {
        await supabase
          .from('profiles')
          .update({ resume_url: path })
          .eq('id', user.id);
      } catch (error) {
        console.error('Error saving resume to profile:', error);
      }
    } else {
      setUploadedFileName(null);
    }
  }, [uploadResume, onChange, user?.id]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    disabled: isUploading,
  });

  const removeResume = () => {
    onChange('resume_url', null);
    setUploadedFileName(null);
  };

  const hasResume = data.resume_url || uploadedFileName;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
          LinkedIn e currículo
        </h1>
        <p className="text-muted-foreground text-base">
          Esses dados ajudam nas mentorias e oportunidades.
        </p>
      </div>

      {/* Form */}
      <div className="space-y-8">
        {/* LinkedIn */}
        <div className="space-y-2">
          <Label htmlFor="linkedin_url" className="text-sm font-medium flex items-center gap-2">
            URL do LinkedIn
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </Label>
          <Input
            id="linkedin_url"
            type="url"
            value={data.linkedin_url || ''}
            onChange={(e) => onChange('linkedin_url', e.target.value)}
            placeholder="https://linkedin.com/in/seu-perfil"
            className={errors.linkedin_url ? 'border-destructive' : ''}
          />
          {errors.linkedin_url && (
            <p className="text-xs text-destructive">{errors.linkedin_url}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Se ainda não tiver LinkedIn, você pode adicionar depois.
          </p>
        </div>

        {/* Resume Upload */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Currículo (de preferência em inglês)
          </Label>

          {!hasResume ? (
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
                isDragActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                  : 'border-border hover:border-blue-400 hover:bg-muted/50'
              )}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-3">
                {isUploading ? (
                  <>
                    <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                    <p className="text-sm text-muted-foreground">Enviando...</p>
                  </>
                ) : (
                  <>
                    <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Upload className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Clique para enviar seu currículo
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        ou arraste o arquivo aqui
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      PDF, DOC ou DOCX (máx. 10MB)
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="border rounded-xl p-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {uploadedFileName || 'Currículo enviado'}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-green-600">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Arquivo enviado com sucesso</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={removeResume}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  title="Remover arquivo"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          )}

          {uploadError && (
            <p className="text-xs text-destructive">{uploadError}</p>
          )}

          <p className="text-xs text-muted-foreground">
            Você poderá atualizar esses dados depois no seu Perfil.
          </p>
        </div>
      </div>
    </div>
  );
}
