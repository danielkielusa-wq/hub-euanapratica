import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Upload,
  List,
  History,
  Sparkles,
  Trash2,
  Loader2,
  FileJson,
  AlertCircle,
  Settings,
  RotateCcw,
  Save,
  TrendingUp,
} from 'lucide-react';
import { JSONUploadZone } from '@/components/admin/jobs/JSONUploadZone';
import { JobImportPreview } from '@/components/admin/jobs/JobImportPreview';
import {
  useAdminJobs,
  useAdminJobImports,
  useImportJobs,
  useDeleteJob,
  useBulkDeleteJobs,
  useEnrichJobs,
  parseJobsJSON,
  parseJobsCSV,
} from '@/hooks/useAdminJobs';
import type { AdminJob } from '@/hooks/useAdminJobs';
import { useAppConfigs } from '@/hooks/useAppConfigs';
import { useAdminApis } from '@/hooks/useAdminApis';
import { useHubServices } from '@/hooks/useHubServices';
import { toast } from 'sonner';

export default function AdminPrimeJobs() {
  const [parsedJobs, setParsedJobs] = useState<any[]>([]);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());

  const { jobs, isLoading: jobsLoading, refetch } = useAdminJobs();
  const { data: imports, isLoading: importsLoading } = useAdminJobImports();
  const importMutation = useImportJobs();
  const deleteJob = useDeleteJob();
  const bulkDelete = useBulkDeleteJobs();
  const enrichJobs = useEnrichJobs();

  const handleFileSelect = async (file: File) => {
    setParseError('');
    setParsedJobs([]);
    setFileName(file.name);

    try {
      const text = await file.text();
      const isCSV = file.name.toLowerCase().endsWith('.csv');
      const { jobs, error } = isCSV ? parseJobsCSV(text) : parseJobsJSON(text);

      if (error) {
        setParseError(error);
        return;
      }

      setParsedJobs(jobs);
    } catch {
      setParseError('Erro ao ler o arquivo');
    }
  };

  const handleImport = () => {
    if (parsedJobs.length === 0) return;
    importMutation.mutate(
      { jobs: parsedJobs, fileName },
      {
        onSuccess: () => {
          setParsedJobs([]);
          setFileName('');
          refetch();
        },
      }
    );
  };

  const toggleSelectJob = (jobId: string) => {
    setSelectedJobIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });
  };

  const selectAllJobs = () => {
    if (selectedJobIds.size === jobs.length) {
      setSelectedJobIds(new Set());
    } else {
      setSelectedJobIds(new Set(jobs.map((j) => j.id)));
    }
  };

  const handleEnrich = () => {
    const ids = Array.from(selectedJobIds);
    if (ids.length === 0) {
      toast.info('Selecione vagas para enriquecer');
      return;
    }
    enrichJobs.mutate(ids, {
      onSuccess: () => {
        setSelectedJobIds(new Set());
        refetch();
      },
    });
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selectedJobIds);
    if (ids.length === 0) {
      toast.info('Selecione vagas para desativar');
      return;
    }
    if (!confirm(`Deletar ${ids.length} vagas selecionadas? Esta ação não pode ser desfeita.`)) return;
    bulkDelete.mutate(ids, {
      onSuccess: () => {
        setSelectedJobIds(new Set());
        refetch();
      },
    });
  };

  const handleEnrichAll = () => {
    const unenriched = jobs.filter((j) => j.is_active && !j.ai_enrichment).map((j) => j.id);
    if (unenriched.length === 0) {
      toast.info('Todas as vagas ativas já foram enriquecidas');
      return;
    }
    enrichJobs.mutate(unenriched, {
      onSuccess: () => refetch(),
    });
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Prime Jobs Admin</h1>
            <p className="text-gray-500 font-medium mt-1">
              Importar, gerenciar e enriquecer vagas com IA
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Badge variant="outline" className="font-bold">
              {jobs.filter((j) => j.is_active).length} ativas
            </Badge>
            <Badge variant="outline" className="font-bold text-purple-600 border-purple-200">
              {jobs.filter((j) => j.ai_enrichment).length} enriquecidas
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="import" className="space-y-6">
          <TabsList className="bg-gray-100 rounded-xl p-1">
            <TabsTrigger value="import" className="rounded-lg font-bold">
              <Upload size={16} className="mr-2" /> Importar
            </TabsTrigger>
            <TabsTrigger value="list" className="rounded-lg font-bold">
              <List size={16} className="mr-2" /> Vagas ({jobs.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg font-bold">
              <History size={16} className="mr-2" /> Histórico
            </TabsTrigger>
            <TabsTrigger value="config" className="rounded-lg font-bold">
              <Settings size={16} className="mr-2" /> Configurações
            </TabsTrigger>
            <TabsTrigger value="upsell" className="rounded-lg font-bold">
              <TrendingUp size={16} className="mr-2" /> Upsell
            </TabsTrigger>
          </TabsList>

          {/* TAB: Import */}
          <TabsContent value="import" className="space-y-6">
            <JSONUploadZone
              onFileSelect={handleFileSelect}
              isLoading={importMutation.isPending}
            />

            {parseError && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <AlertCircle size={18} />
                {parseError}
              </div>
            )}

            {parsedJobs.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileJson size={20} className="text-brand-600" />
                    <span className="font-bold text-gray-900">{fileName}</span>
                    <Badge variant="secondary">{parsedJobs.length} vagas</Badge>
                  </div>
                  <Button
                    onClick={handleImport}
                    disabled={importMutation.isPending}
                    className="bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl"
                  >
                    {importMutation.isPending ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Importando...
                      </>
                    ) : (
                      <>
                        <Upload size={16} className="mr-2" />
                        Importar Todas
                      </>
                    )}
                  </Button>
                </div>

                <JobImportPreview jobs={parsedJobs} />
              </div>
            )}
          </TabsContent>

          {/* TAB: Jobs List */}
          <TabsContent value="list" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  onClick={selectAllJobs}
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                >
                  {selectedJobIds.size === jobs.length ? 'Desselecionar' : 'Selecionar Todas'}
                </Button>
                {selectedJobIds.size > 0 && (
                  <span className="text-sm text-gray-500 font-bold">
                    {selectedJobIds.size} selecionadas
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleBulkDelete}
                  disabled={selectedJobIds.size === 0 || bulkDelete.isPending}
                  variant="outline"
                  size="sm"
                  className="rounded-lg text-red-600 border-red-200 hover:bg-red-50"
                >
                  {bulkDelete.isPending ? (
                    <Loader2 size={14} className="mr-2 animate-spin" />
                  ) : (
                    <Trash2 size={14} className="mr-2" />
                  )}
                  Deletar ({selectedJobIds.size})
                </Button>
                <Button
                  onClick={handleEnrich}
                  disabled={selectedJobIds.size === 0 || enrichJobs.isPending}
                  variant="outline"
                  size="sm"
                  className="rounded-lg text-purple-600 border-purple-200 hover:bg-purple-50"
                >
                  {enrichJobs.isPending ? (
                    <Loader2 size={14} className="mr-2 animate-spin" />
                  ) : (
                    <Sparkles size={14} className="mr-2" />
                  )}
                  Enriquecer Selecionadas
                </Button>
                <Button
                  onClick={handleEnrichAll}
                  disabled={enrichJobs.isPending}
                  variant="outline"
                  size="sm"
                  className="rounded-lg text-purple-600 border-purple-200 hover:bg-purple-50"
                >
                  <Sparkles size={14} className="mr-2" />
                  Enriquecer Todas (sem enrichment)
                </Button>
              </div>
            </div>

            {jobsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-[24px] border border-dashed border-gray-200">
                <Upload className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-bold">Nenhuma vaga importada</p>
                <p className="text-sm text-gray-400 mt-1">Use a aba "Importar" para adicionar vagas</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={selectedJobIds.size === jobs.length && jobs.length > 0}
                          onChange={selectAllJobs}
                          className="rounded"
                        />
                      </th>
                      <th className="px-4 py-3 font-bold text-xs text-gray-500 uppercase tracking-wide">Título</th>
                      <th className="px-4 py-3 font-bold text-xs text-gray-500 uppercase tracking-wide">Empresa</th>
                      <th className="px-4 py-3 font-bold text-xs text-gray-500 uppercase tracking-wide">Salário</th>
                      <th className="px-4 py-3 font-bold text-xs text-gray-500 uppercase tracking-wide">Categoria</th>
                      <th className="px-4 py-3 font-bold text-xs text-gray-500 uppercase tracking-wide">IA</th>
                      <th className="px-4 py-3 font-bold text-xs text-gray-500 uppercase tracking-wide">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {jobs.map((job) => (
                      <JobRow
                        key={job.id}
                        job={job}
                        isSelected={selectedJobIds.has(job.id)}
                        onToggleSelect={() => toggleSelectJob(job.id)}
                        onDelete={() => {
                          if (confirm(`Deletar "${job.title}"?`)) deleteJob.mutate(job.id, { onSuccess: () => refetch() });
                        }}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          {/* TAB: Import History */}
          <TabsContent value="history" className="space-y-4">
            {importsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : !imports || imports.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-[24px] border border-dashed border-gray-200">
                <History className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-bold">Nenhuma importação ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {imports.map((imp) => (
                  <div
                    key={imp.id}
                    className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <FileJson size={20} className="text-brand-600" />
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{imp.file_name}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(imp.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold">
                      <Badge variant="secondary">{imp.total_jobs} total</Badge>
                      <Badge className="bg-green-50 text-green-700 border-green-200">{imp.inserted} novas</Badge>
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200">{imp.updated} atualizadas</Badge>
                      {imp.skipped > 0 && (
                        <Badge variant="destructive">{imp.skipped} erros</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TAB: Configurações */}
          <TabsContent value="config">
            <EnrichmentConfigTab />
          </TabsContent>

          {/* TAB: Upsell */}
          <TabsContent value="upsell">
            <UpsellConfigTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

// ── Sub-component: Enrichment Config Tab ─────────────────────

const DEFAULT_PROMPT = `You are an AI assistant for "EUA Na Prática", a Brazilian platform that helps professionals find remote USD-paying jobs at American companies.

Analyze the following job listing and provide enrichment data specifically useful for Brazilian professionals. Consider:

1. **Timezone compatibility with Brazil** (BRT = UTC-3). Calculate overlap hours between the job's required schedule and typical Brazilian work hours (9am-6pm BRT). Score 1-10 where 10 = perfect overlap.
2. **English proficiency level** required using CEFR scale (A1-C2). Consider if the role is client-facing, requires writing, or is more technical/async.
3. **Salary purchasing power in Brazil**. Use USD to BRL rate of approximately 5.8. Compare the monthly BRL equivalent to the Brazilian market average for similar roles.
4. **Key skills** needed — list the most important 3-6 skills for this role.
5. **Skills gap hint** — what a Brazilian professional might lack and how to compensate.
6. **Application tips** — 2-4 specific tips for a Brazilian applying to this company/role. Write in Portuguese (pt-BR).
7. **Resume keywords** — terms to include in a resume for ATS optimization (for our ResumePass tool).
8. **Career path insight** — where this role could lead in 2-3 years. Write in Portuguese (pt-BR).

IMPORTANT:
- Write application_tips, missing_skills_hint, and career_path_insight in Portuguese (pt-BR).
- compatibility_score must be an integer from 1 to 10.
- monthly_brl must be a number (no formatting).

Return ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "timezone_analysis": {
    "overlap_with_brazil": "string (e.g., '6-8 hours overlap')",
    "preferred_hours": "string (e.g., 'EST 9am-5pm = BRT 11am-7pm')",
    "compatibility_score": number_1_to_10
  },
  "english_level_required": "string (e.g., 'Advanced (C1)')",
  "english_level_notes": "string explaining why this level is needed",
  "salary_brl_context": {
    "monthly_brl": number,
    "comparison": "string comparing to Brazilian market (in Portuguese)"
  },
  "key_skills": ["skill1", "skill2", "skill3"],
  "missing_skills_hint": "string with advice for common gaps (in Portuguese)",
  "application_tips": ["tip1 em português", "tip2 em português", "tip3 em português"],
  "resume_pass_keywords": ["keyword1", "keyword2", "keyword3"],
  "career_path_insight": "string describing 2-3 year career trajectory (in Portuguese)"
}`;

function EnrichmentConfigTab() {
  const { getConfigValue, updateConfig, isLoading: configLoading, isSaving } = useAppConfigs();
  const { apis, isLoading: apisLoading } = useAdminApis();

  const [selectedApiKey, setSelectedApiKey] = useState('openai_api');
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_PROMPT);
  const [maxTokens, setMaxTokens] = useState(1500);
  const [loaded, setLoaded] = useState(false);

  // Load saved config
  useEffect(() => {
    if (configLoading || loaded) return;
    const raw = getConfigValue('enrichment_config');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setSelectedApiKey(parsed.api_key || 'openai_api');
        setSystemPrompt(parsed.system_prompt || DEFAULT_PROMPT);
        setMaxTokens(parsed.max_tokens || 1500);
      } catch {
        // Use defaults
      }
    }
    setLoaded(true);
  }, [configLoading, getConfigValue, loaded]);

  // Filter APIs to show only LLM-compatible ones
  const llmApis = apis.filter((api) => {
    if (!api.is_active || !api.base_url) return false;
    const url = api.base_url.toLowerCase();
    return (
      url.includes('openai.com') ||
      url.includes('anthropic.com') ||
      url.includes('openrouter.ai') ||
      url.includes('googleapis.com') ||
      url.includes('azure.com')
    );
  });

  const selectedApi = apis.find((a) => a.api_key === selectedApiKey);
  const modelName = selectedApi?.parameters?.model || 'default';

  const handleSave = async () => {
    try {
      const config = {
        api_key: selectedApiKey,
        system_prompt: systemPrompt,
        max_tokens: maxTokens,
      };
      await updateConfig('enrichment_config', JSON.stringify(config));
      toast.success('Configuração de enrichment salva!');
    } catch {
      toast.error('Erro ao salvar configuração');
    }
  };

  const handleReset = () => {
    setSystemPrompt(DEFAULT_PROMPT);
    setSelectedApiKey('openai_api');
    setMaxTokens(1500);
    toast.info('Valores resetados para o padrão. Clique em Salvar para aplicar.');
  };

  if (configLoading || apisLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* LLM Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900">LLM / API para Enrichment</h3>
            <p className="text-sm text-gray-500 mt-1">
              Escolha qual modelo de IA será usado para enriquecer as vagas
            </p>
          </div>
          {selectedApi && (
            <Badge variant="outline" className="text-purple-600 border-purple-200 font-bold">
              Modelo: {modelName}
            </Badge>
          )}
        </div>

        <select
          value={selectedApiKey}
          onChange={(e) => setSelectedApiKey(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          {llmApis.map((api) => (
            <option key={api.api_key} value={api.api_key}>
              {api.name} — {api.parameters?.model || 'modelo padrão'}
            </option>
          ))}
          {llmApis.length === 0 && (
            <option disabled>Nenhuma API LLM configurada</option>
          )}
        </select>

        {llmApis.length === 0 && (
          <p className="text-sm text-amber-600">
            Configure pelo menos uma API LLM em{' '}
            <a href="/admin/configuracoes-apis" className="underline font-bold">
              APIs Externas
            </a>
          </p>
        )}
      </div>

      {/* Prompt Editor */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900">System Prompt</h3>
            <p className="text-sm text-gray-500 mt-1">
              Instruções enviadas ao LLM para gerar o enrichment de cada vaga
            </p>
          </div>
          <span className="text-xs text-gray-400 font-mono">
            {systemPrompt.length} caracteres
          </span>
        </div>

        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={20}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y"
          placeholder="Cole o system prompt aqui..."
        />
      </div>

      {/* Max Tokens */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <h3 className="font-bold text-gray-900">Max Tokens</h3>
          <p className="text-sm text-gray-500 mt-1">
            Limite de tokens na resposta do LLM (recomendado: 1500)
          </p>
        </div>
        <input
          type="number"
          value={maxTokens}
          onChange={(e) => setMaxTokens(Number(e.target.value) || 1500)}
          min={500}
          max={8000}
          className="w-32 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button
          onClick={handleReset}
          variant="outline"
          className="rounded-xl text-gray-500"
        >
          <RotateCcw size={14} className="mr-2" />
          Resetar Padrão
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl"
        >
          {isSaving ? (
            <Loader2 size={14} className="mr-2 animate-spin" />
          ) : (
            <Save size={14} className="mr-2" />
          )}
          Salvar Configuração
        </Button>
      </div>
    </div>
  );
}

// ── Sub-component: Upsell Config Tab ─────────────────────────

function UpsellConfigTab() {
  const { getConfigValue, updateConfig, isLoading: configLoading, isSaving } = useAppConfigs();
  const { data: allServices = [], isLoading: servicesLoading } = useHubServices();

  const [enabled, setEnabled] = useState(false);
  const [eligibleIds, setEligibleIds] = useState<string[]>([]);
  const [sidebarId, setSidebarId] = useState('');
  const [postApplyId, setPostApplyId] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (configLoading || loaded) return;
    const raw = getConfigValue('prime_jobs_upsell_config');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setEnabled(parsed.enabled ?? false);
        setEligibleIds(parsed.eligible_service_ids ?? []);
        setSidebarId(parsed.sidebar_service_id ?? '');
        setPostApplyId(parsed.post_apply_service_id ?? '');
      } catch { /* use defaults */ }
    }
    setLoaded(true);
  }, [configLoading, getConfigValue, loaded]);

  const toggleEligible = (id: string) => {
    setEligibleIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    try {
      const config = {
        enabled,
        eligible_service_ids: eligibleIds,
        sidebar_service_id: sidebarId || null,
        post_apply_service_id: postApplyId || null,
      };
      await updateConfig('prime_jobs_upsell_config', JSON.stringify(config));
      toast.success('Configuração de upsell salva!');
    } catch {
      toast.error('Erro ao salvar configuração');
    }
  };

  if (configLoading || servicesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enable toggle */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900">Ativar Upsell em Vagas</h3>
            <p className="text-sm text-gray-500 mt-1">
              Exibe recomendações de serviços contextualmente na tela de detalhe da vaga
            </p>
          </div>
          <button
            onClick={() => setEnabled((v) => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-brand-600' : 'bg-gray-200'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
        </div>
      </div>

      {/* Eligible services */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <h3 className="font-bold text-gray-900">Serviços Elegíveis</h3>
          <p className="text-sm text-gray-500 mt-1">
            Serviços que podem aparecer no bloco de upsell contextual (matching via IA Insights)
          </p>
        </div>
        {allServices.length === 0 ? (
          <p className="text-sm text-amber-600">
            Nenhum serviço visível no hub. Adicione em{' '}
            <a href="/admin/hub" className="underline font-bold">Hub</a>.
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {allServices.map((service) => (
              <label
                key={service.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={eligibleIds.includes(service.id)}
                  onChange={() => toggleEligible(service.id)}
                  className="rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-900 truncate">{service.name}</p>
                  {service.price_display && (
                    <p className="text-xs text-brand-600 font-bold">{service.price_display}</p>
                  )}
                </div>
                {service.service_type && (
                  <Badge variant="outline" className="text-xs shrink-0">{service.service_type}</Badge>
                )}
              </label>
            ))}
          </div>
        )}
        {eligibleIds.length > 0 && (
          <p className="text-xs text-gray-400 font-medium">{eligibleIds.length} serviço(s) selecionado(s)</p>
        )}
      </div>

      {/* Sidebar service */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <h3 className="font-bold text-gray-900">Serviço do Sidebar</h3>
          <p className="text-sm text-gray-500 mt-1">
            Card fixo exibido na barra lateral da vaga, independente do matching contextual
          </p>
        </div>
        <select
          value={sidebarId}
          onChange={(e) => setSidebarId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="">Nenhum</option>
          {allServices.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}{service.price_display ? ` — ${service.price_display}` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Post-apply service */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <h3 className="font-bold text-gray-900">Serviço Pós-Aplicação</h3>
          <p className="text-sm text-gray-500 mt-1">
            Modal exibido após o candidato se inscrever na vaga
          </p>
        </div>
        <select
          value={postApplyId}
          onChange={(e) => setPostApplyId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="">Nenhum</option>
          {allServices.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}{service.price_display ? ` — ${service.price_display}` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl"
        >
          {isSaving ? (
            <Loader2 size={14} className="mr-2 animate-spin" />
          ) : (
            <Save size={14} className="mr-2" />
          )}
          Salvar Configuração de Upsell
        </Button>
      </div>
    </div>
  );
}

// ── Sub-component: Job table row ─────────────────────────────

function JobRow({
  job,
  isSelected,
  onToggleSelect,
  onDelete,
}: {
  job: AdminJob;
  isSelected: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
}) {
  const salaryStr = job.salary_min
    ? `$${job.salary_min.toLocaleString()}${job.salary_max && job.salary_max !== job.salary_min ? ` - $${job.salary_max.toLocaleString()}` : ''}`
    : '—';

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="rounded"
        />
      </td>
      <td className="px-4 py-3 font-bold text-gray-900 max-w-xs truncate">{job.title}</td>
      <td className="px-4 py-3 text-gray-600 max-w-[150px] truncate">{job.company}</td>
      <td className="px-4 py-3 text-gray-600">{salaryStr}</td>
      <td className="px-4 py-3 text-gray-600">{job.job_category || '—'}</td>
      <td className="px-4 py-3">
        {job.ai_enrichment ? (
          <Sparkles size={16} className="text-purple-500" />
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <button
          onClick={onDelete}
          className="text-gray-400 hover:text-red-500 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  );
}
