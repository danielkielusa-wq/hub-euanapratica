import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileSpreadsheet, Users, Loader2, Download } from 'lucide-react';
import { CSVUploadZone } from '@/components/admin/leads/CSVUploadZone';
import { ImportPreview } from '@/components/admin/leads/ImportPreview';
import { ImportSummaryModal } from '@/components/admin/leads/ImportSummaryModal';
import { LeadsTable } from '@/components/admin/leads/LeadsTable';
import { useLeadImport } from '@/hooks/useLeadImport';

export default function AdminLeadsImport() {
  const { parseFile, importLeads, reset, isImporting, parsedLeads, importResult } = useLeadImport();
  const [showSummary, setShowSummary] = useState(false);
  const [activeTab, setActiveTab] = useState('import');

  const handleFileSelect = async (file: File) => {
    await parseFile(file);
  };

  const handleImport = async () => {
    const result = await importLeads(parsedLeads);
    if (result) {
      setShowSummary(true);
    }
  };

  const handleCloseSummary = () => {
    setShowSummary(false);
    reset();
    setActiveTab('list');
  };

  const handleDownloadTemplate = () => {
    const headers = [
      'Nome',
      'email',
      'telefone',
      'Area',
      'Atuação',
      'trabalha internacional',
      'experiencia',
      'Englishlevel',
      'objetivo',
      'VisaStatus',
      'timeline',
      'FamilyStatus',
      'incomerange',
      'investment range',
      'impediment',
      'impedmentother',
      'main concern',
      'relatorio'
    ];

    const csvContent = [
      headers.join(','),
      headers.map(() => '').join(',')
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template-leads.csv';
    link.click();
  };

  const validLeadsCount = parsedLeads.filter(l => l.isValid).length;

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Importar Leads</h1>
            <p className="text-sm text-muted-foreground">
              Importe leads via CSV e gere relatÃ³rios de diagnÃ³stico
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="rounded-[12px]">
            <TabsTrigger value="import" className="gap-2 rounded-[8px]">
              <Upload className="w-4 h-4" />
              Importar
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2 rounded-[8px]">
              <Users className="w-4 h-4" />
              Leads Importados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-6 mt-6">
            {/* Upload Card */}
            <Card className="rounded-[24px]">
              <CardHeader>
                <CardTitle>Upload de CSV</CardTitle>
                <CardDescription>
                  FaÃ§a upload de um arquivo CSV com os dados dos leads. O sistema irÃ¡ criar usuÃ¡rios 
                  automaticamente para emails novos e vincular relatÃ³rios a usuÃ¡rios existentes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {parsedLeads.length === 0 ? (
                  <CSVUploadZone onFileSelect={handleFileSelect} isLoading={isImporting} />
                ) : (
                  <>
                    <ImportPreview leads={parsedLeads} />
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={reset} className="rounded-[12px]">
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleImport} 
                        disabled={isImporting || validLeadsCount === 0}
                        className="rounded-[12px] gap-2"
                      >
                        {isImporting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Importando...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            Importar {validLeadsCount} leads
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* CSV Format Info */}
            <Card className="rounded-[24px]">
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle className="text-base">Formato do CSV</CardTitle>
                <Button variant="outline" onClick={handleDownloadTemplate} className="gap-2 rounded-[12px]">
                  <Download className="w-4 h-4" />
                  Baixar template
                </Button>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>Colunas obrigatÃ³rias:</strong> Nome, email, relatorio</p>
                  <p><strong>Colunas opcionais:</strong> telefone, Area, AtuaÃ§Ã£o, trabalha internacional, 
                    experiencia, Englishlevel, objetivo, VisaStatus, timeline, FamilyStatus, 
                    incomerange, investment range, impediment, impedmentother, main concern</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list" className="mt-6">
            <Card className="rounded-[24px]">
              <CardHeader>
                <CardTitle>Leads Importados</CardTitle>
                <CardDescription>
                  Lista dos Ãºltimos 50 leads importados. Clique no Ã­cone de link para copiar a URL do relatÃ³rio.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LeadsTable />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Summary Modal */}
        <ImportSummaryModal 
          result={importResult} 
          open={showSummary} 
          onClose={handleCloseSummary} 
        />
      </div>
    </DashboardLayout>
  );
}
