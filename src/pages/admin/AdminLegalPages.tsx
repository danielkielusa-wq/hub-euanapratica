import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, FileText, Eye, Code, ExternalLink } from 'lucide-react';
import { useAppConfigs } from '@/hooks/useAppConfigs';

const LEGAL_PAGES = [
  {
    key: 'legal_termos_assinatura',
    label: 'Termos de Assinatura',
    description: 'Termos que regem a assinatura e uso da plataforma.',
    publicUrl: '/termos-assinatura',
  },
  {
    key: 'legal_politica_privacidade',
    label: 'Política de Privacidade',
    description: 'Como coletamos, usamos e protegemos dados pessoais.',
    publicUrl: '/politica-privacidade',
  },
  {
    key: 'legal_politica_cancelamento',
    label: 'Política de Cancelamento',
    description: 'Regras de cancelamento, reembolso e reativação.',
    publicUrl: '/politica-cancelamento',
  },
] as const;

export default function AdminLegalPages() {
  const { configs, isLoading, isSaving, updateConfig, getConfigValue } = useAppConfigs();

  const [values, setValues] = useState<Record<string, string>>({});
  const [originals, setOriginals] = useState<Record<string, string>>({});
  const [previewMode, setPreviewMode] = useState<Record<string, boolean>>({});

  // Load values from configs
  useEffect(() => {
    if (configs.length === 0) return;

    const loaded: Record<string, string> = {};
    for (const page of LEGAL_PAGES) {
      loaded[page.key] = getConfigValue(page.key);
    }
    setValues(loaded);
    setOriginals(loaded);
  }, [configs]);

  const hasChanges = (key: string) => values[key] !== originals[key];

  const handleSave = async (key: string) => {
    await updateConfig(key, values[key]);
    setOriginals((prev) => ({ ...prev, [key]: values[key] }));
  };

  const togglePreview = (key: string) => {
    setPreviewMode((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 md:p-8 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 space-y-6 max-w-5xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Páginas Legais
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Edite o conteúdo HTML das páginas legais exibidas publicamente na plataforma.
          </p>
        </div>

        <Tabs defaultValue={LEGAL_PAGES[0].key}>
          <TabsList className="w-full justify-start">
            {LEGAL_PAGES.map((page) => (
              <TabsTrigger key={page.key} value={page.key} className="text-xs sm:text-sm">
                {page.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {LEGAL_PAGES.map((page) => (
            <TabsContent key={page.key} value={page.key}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{page.label}</CardTitle>
                      <CardDescription>{page.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => togglePreview(page.key)}
                        className="gap-1.5"
                      >
                        {previewMode[page.key] ? (
                          <>
                            <Code className="h-4 w-4" />
                            Editar
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4" />
                            Preview
                          </>
                        )}
                      </Button>
                      <a
                        href={page.publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="sm" className="gap-1.5">
                          <ExternalLink className="h-4 w-4" />
                          Ver página
                        </Button>
                      </a>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {previewMode[page.key] ? (
                    <div className="border rounded-lg p-6 min-h-[500px] bg-white">
                      <div
                        className="prose prose-sm max-w-none text-muted-foreground [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_p]:leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: values[page.key] || '' }}
                      />
                    </div>
                  ) : (
                    <Textarea
                      value={values[page.key] || ''}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, [page.key]: e.target.value }))
                      }
                      className="min-h-[500px] font-mono text-sm"
                      placeholder="Cole o conteúdo HTML aqui..."
                    />
                  )}

                  <div className="flex justify-end">
                    <Button
                      onClick={() => handleSave(page.key)}
                      disabled={!hasChanges(page.key) || isSaving}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {isSaving ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
