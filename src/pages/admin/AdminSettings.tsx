import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Save, Settings, FileCheck } from 'lucide-react';
import { useAppConfigs } from '@/hooks/useAppConfigs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminSettings() {
  const { configs, isLoading, isSaving, updateConfig, getConfigValue } = useAppConfigs();
  const [resumePrompt, setResumePrompt] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize prompt from configs
  useEffect(() => {
    const value = getConfigValue('resume_analyzer_prompt');
    if (value) {
      setResumePrompt(value);
    }
  }, [configs]);

  // Track changes
  useEffect(() => {
    const originalValue = getConfigValue('resume_analyzer_prompt');
    setHasChanges(resumePrompt !== originalValue && resumePrompt !== '');
  }, [resumePrompt, configs]);

  const handleSave = async () => {
    await updateConfig('resume_analyzer_prompt', resumePrompt);
    setHasChanges(false);
  };

  const resumeConfig = configs.find(c => c.key === 'resume_analyzer_prompt');

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Configurações da Plataforma</h1>
            <p className="text-sm text-muted-foreground">Gerencie as configurações globais do sistema</p>
          </div>
        </div>

        {/* Resume Analyzer Prompt Card */}
        <Card className="rounded-[24px]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-primary" />
              <CardTitle>Analisador de Currículos - Prompt de IA</CardTitle>
            </div>
            <CardDescription>
              Este prompt é usado pela IA para analisar currículos no Currículo USA. 
              Edite-o para ajustar como a análise é feita.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <>
                <Skeleton className="h-64 w-full rounded-xl" />
                <Skeleton className="h-4 w-48" />
              </>
            ) : (
              <>
                <Textarea
                  value={resumePrompt}
                  onChange={(e) => setResumePrompt(e.target.value)}
                  placeholder="Digite o prompt de IA..."
                  className="min-h-[300px] font-mono text-sm rounded-xl"
                />
                
                {resumeConfig?.updated_at && (
                  <p className="text-xs text-muted-foreground">
                    Última atualização: {format(new Date(resumeConfig.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={handleSave}
                    disabled={!hasChanges || isSaving}
                    className="rounded-[12px] gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
