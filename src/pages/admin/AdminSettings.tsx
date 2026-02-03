import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Settings, FileCheck, Users, Hash, Zap, Trash2, Plus } from 'lucide-react';
import { useAppConfigs } from '@/hooks/useAppConfigs';
import { useCommunityCategories } from '@/hooks/useCommunityCategories';
import { useGamificationRules } from '@/hooks/useGamification';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminSettings() {
  const { configs, isLoading, isSaving, updateConfig, getConfigValue } = useAppConfigs();
  
  const [resumePrompt, setResumePrompt] = useState('');
  const [hasResumeChanges, setHasResumeChanges] = useState(false);
  const [leadPrompt, setLeadPrompt] = useState('');
  const [hasLeadChanges, setHasLeadChanges] = useState(false);

  useEffect(() => {
    const resumeValue = getConfigValue('resume_analyzer_prompt');
    if (resumeValue) setResumePrompt(resumeValue);
    const leadValue = getConfigValue('lead_report_formatter_prompt');
    if (leadValue) setLeadPrompt(leadValue);
  }, [configs]);

  useEffect(() => {
    const originalValue = getConfigValue('resume_analyzer_prompt');
    setHasResumeChanges(resumePrompt !== originalValue && resumePrompt !== '');
  }, [resumePrompt, configs]);

  useEffect(() => {
    const originalValue = getConfigValue('lead_report_formatter_prompt');
    setHasLeadChanges(leadPrompt !== originalValue && leadPrompt !== '');
  }, [leadPrompt, configs]);

  const handleSaveResume = async () => {
    await updateConfig('resume_analyzer_prompt', resumePrompt);
    setHasResumeChanges(false);
  };

  const handleSaveLead = async () => {
    await updateConfig('lead_report_formatter_prompt', leadPrompt);
    setHasLeadChanges(false);
  };

  const resumeConfig = configs.find(c => c.key === 'resume_analyzer_prompt');
  const leadConfig = configs.find(c => c.key === 'lead_report_formatter_prompt');

  const { categories, createCategory, updateCategory, deleteCategory, isLoading: categoriesLoading } = useCommunityCategories();
  const { rules, updateRule, isLoading: rulesLoading } = useGamificationRules();
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const slug = newCategoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    await createCategory({ name: newCategoryName, slug, icon_name: 'hash' });
    setNewCategoryName('');
  };

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Configurações da Plataforma</h1>
            <p className="text-sm text-muted-foreground">Gerencie as configurações globais do sistema</p>
          </div>
        </div>

        <Tabs defaultValue="prompts" className="space-y-6">
          <TabsList className="rounded-xl">
            <TabsTrigger value="prompts" className="gap-2 rounded-lg"><FileCheck className="h-4 w-4" />Prompts IA</TabsTrigger>
            <TabsTrigger value="community" className="gap-2 rounded-lg"><Users className="h-4 w-4" />Comunidade</TabsTrigger>
          </TabsList>

          <TabsContent value="prompts" className="space-y-6">
            <Card className="rounded-[24px]">
              <CardHeader>
                <div className="flex items-center gap-2"><FileCheck className="w-5 h-5 text-primary" /><CardTitle>Analisador de Currículos</CardTitle></div>
                <CardDescription>Prompt usado pela IA para analisar currículos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? <Skeleton className="h-64 w-full rounded-xl" /> : (
                  <>
                    <Textarea value={resumePrompt} onChange={(e) => setResumePrompt(e.target.value)} className="min-h-[300px] font-mono text-sm rounded-xl" />
                    {resumeConfig?.updated_at && <p className="text-xs text-muted-foreground">Última atualização: {format(new Date(resumeConfig.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>}
                    <div className="flex justify-end"><Button onClick={handleSaveResume} disabled={!hasResumeChanges || isSaving} className="rounded-[12px] gap-2"><Save className="w-4 h-4" />{isSaving ? 'Salvando...' : 'Salvar'}</Button></div>
                  </>
                )}
              </CardContent>
            </Card>
            <Card className="rounded-[24px]">
              <CardHeader>
                <div className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" /><CardTitle>Formatador de Relatórios de Leads</CardTitle></div>
                <CardDescription>Prompt para formatar relatórios de diagnóstico.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? <Skeleton className="h-64 w-full rounded-xl" /> : (
                  <>
                    <Textarea value={leadPrompt} onChange={(e) => setLeadPrompt(e.target.value)} className="min-h-[300px] font-mono text-sm rounded-xl" />
                    {leadConfig?.updated_at && <p className="text-xs text-muted-foreground">Última atualização: {format(new Date(leadConfig.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>}
                    <div className="flex justify-end"><Button onClick={handleSaveLead} disabled={!hasLeadChanges || isSaving} className="rounded-[12px] gap-2"><Save className="w-4 h-4" />{isSaving ? 'Salvando...' : 'Salvar'}</Button></div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="community" className="space-y-6">
            <Card className="rounded-[24px]">
              <CardHeader>
                <div className="flex items-center gap-2"><Hash className="w-5 h-5 text-primary" /><CardTitle>Categorias da Comunidade</CardTitle></div>
                <CardDescription>Adicione, remova ou ative/desative categorias.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Nova categoria..." className="rounded-xl" />
                  <Button onClick={handleAddCategory} className="rounded-xl gap-2"><Plus className="h-4 w-4" />Adicionar</Button>
                </div>
                {categoriesLoading ? <Skeleton className="h-32 w-full rounded-xl" /> : (
                  <div className="space-y-2">
                    {categories.map(cat => (
                      <div key={cat.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                        <div className="flex items-center gap-3"><Hash className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{cat.name}</span></div>
                        <div className="flex items-center gap-2">
                          <Switch checked={cat.is_active} onCheckedChange={(checked) => updateCategory(cat.id, { is_active: checked })} />
                          <Button variant="ghost" size="icon" onClick={() => deleteCategory(cat.id)} className="text-destructive h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="rounded-[24px]">
              <CardHeader>
                <div className="flex items-center gap-2"><Zap className="w-5 h-5 text-primary" /><CardTitle>Regras de Gamificação</CardTitle></div>
                <CardDescription>Configure pontos por ação.</CardDescription>
              </CardHeader>
              <CardContent>
                {rulesLoading ? <Skeleton className="h-32 w-full rounded-xl" /> : (
                  <div className="space-y-3">
                    {rules.map(rule => (
                      <div key={rule.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                        <div><p className="font-medium">{rule.description || rule.action_type}</p><p className="text-xs text-muted-foreground">{rule.action_type}</p></div>
                        <div className="flex items-center gap-2">
                          <Input type="number" value={rule.points} onChange={(e) => updateRule(rule.id, parseInt(e.target.value) || 0)} className="w-20 rounded-xl text-center" />
                          <span className="text-sm text-muted-foreground">pts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
