import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Mail, Plus, Edit, Trash2, MoreVertical, Search, Eye, Send, HelpCircle, BookOpen, ChevronRight, Wrench } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAdminEmailTemplates, type EmailTemplate } from '@/hooks/useAdminEmailTemplates';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EmailTemplateDialog } from '@/components/admin/email-templates/EmailTemplateDialog';
import { EmailTemplatePreviewDialog } from '@/components/admin/email-templates/EmailTemplatePreviewDialog';
import { SendTestEmailDialog } from '@/components/admin/email-templates/SendTestEmailDialog';

const CATEGORY_LABELS: Record<string, string> = {
  subscription: 'Assinatura',
  booking: 'Agendamento',
  espaco: 'Espaço',
  system: 'Sistema',
};

const CATEGORY_COLORS: Record<string, string> = {
  subscription: 'bg-blue-100 text-blue-700',
  booking: 'bg-green-100 text-green-700',
  espaco: 'bg-purple-100 text-purple-700',
  system: 'bg-gray-100 text-gray-700',
};

export default function AdminEmailTemplates() {
  const { templates, isLoading, toggleEnabled, deleteTemplate } = useAdminEmailTemplates();

  const [search, setSearch] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [testEmailTemplate, setTestEmailTemplate] = useState<EmailTemplate | null>(null);

  const filteredTemplates = templates.filter(t =>
    t.display_name.toLowerCase().includes(search.toLowerCase()) ||
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.subject.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deletingTemplateId) return;
    await deleteTemplate(deletingTemplateId);
    setDeletingTemplateId(null);
  };

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Templates de Email</h1>
              <p className="text-sm text-muted-foreground">
                Gerencie os templates de email do sistema
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-[12px] gap-2">
                  <HelpCircle className="w-4 h-4" />
                  Documentação
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Documentação — Templates de Email
                  </SheetTitle>
                  <SheetDescription>Variáveis, templates do sistema e troubleshooting</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-6 text-sm">
                  <section className="space-y-2">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
                      Propósito
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Gerencia os templates HTML enviados pelo sistema via Resend. Cada template é editado no editor visual Unlayer. As variáveis <code className="bg-muted px-1 rounded text-xs">{'{{nome}}'}</code> são substituídas pela Edge Function antes do envio.
                    </p>
                  </section>
                  <div className="border-t" />
                  <section className="space-y-3">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</span>
                      Como usar
                    </h3>
                    <ul className="space-y-2 text-muted-foreground">
                      {[
                        { item: "Novo Template", detail: "Abre o editor Unlayer para criar um template do zero." },
                        { item: "Editar (⋮ → Editar)", detail: "Reabre o editor visual com o design salvo. Alterações são salvas ao clicar em Salvar." },
                        { item: "Visualizar (⋮ → Visualizar)", detail: "Exibe o HTML renderizado com variáveis de exemplo preenchidas." },
                        { item: "Enviar Teste (⋮ → Enviar Teste)", detail: "Envia um email real para o endereço informado. O assunto é prefixado com [TESTE]." },
                        { item: "Toggle de Status", detail: "Desabilita o template sem excluí-lo. Templates desabilitados não são enviados pelo sistema." },
                      ].map((i, idx) => (
                        <li key={idx} className="flex gap-3">
                          <ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                          <div><span className="font-medium text-foreground">{i.item}: </span>{i.detail}</div>
                        </li>
                      ))}
                    </ul>
                  </section>
                  <div className="border-t" />
                  <section className="space-y-3">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">3</span>
                      Templates do sistema (12 seeds)
                    </h3>
                    <div className="rounded-lg border overflow-hidden">
                      <table className="w-full text-xs">
                        <thead><tr className="bg-muted/50"><th className="text-left px-3 py-2 font-medium">Nome (slug)</th><th className="text-left px-3 py-2 font-medium">Acionado por</th></tr></thead>
                        <tbody className="divide-y">
                          {[
                            ["onboarding_welcome", "Conclusão do onboarding (Onboarding.tsx → send-welcome-email)"],
                            ["subscription_activated", "Assinatura ativada via Ticto webhook"],
                            ["subscription_cancelled", "Assinatura cancelada"],
                            ["subscription_*", "Outros eventos de assinatura"],
                            ["booking_confirmation", "Confirmação de agendamento"],
                            ["booking_reminder / reminder_1h", "Lembretes 24h e 1h antes"],
                            ["booking_rescheduled", "Reagendamento de sessão"],
                            ["booking_cancelled / no_show", "Cancelamento ou não comparecimento"],
                            ["espaco_invitation", "Convite para o Espaço"],
                          ].map(([n, d], i) => (
                            <tr key={i}><td className="px-3 py-2 font-mono text-[10px] text-foreground">{n}</td><td className="px-3 py-2 text-muted-foreground">{d}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                  <div className="border-t" />
                  <section className="space-y-2">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">4</span>
                      Variáveis
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Sintaxe: <code className="bg-muted px-1 rounded text-xs">{'{{nomeVariavel}}'}</code>. As variáveis são substituídas por regex na Edge Function antes do envio. Declare as variáveis usadas no campo "Variáveis" ao criar/editar o template — isso serve como documentação para quem editar a Edge Function.
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Blocos condicionais HTML (ex: seção de link de reunião) devem ser pré-renderizados na Edge Function e passados como variável (ex: <code className="bg-muted px-1 rounded">{'{{meetingLinkSection}}'}</code>).
                    </p>
                  </section>
                  <div className="border-t" />
                  <section className="space-y-3">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-primary" />
                      Troubleshooting
                    </h3>
                    <div className="space-y-3">
                      {[
                        { p: "Email não enviado pelo sistema", c: "Template desabilitado ou nome (slug) incorreto na Edge Function.", f: "Ative o toggle e confirme que o slug no código corresponde ao campo \"name\" do template." },
                        { p: "Variável não substituída (aparece {{nome}} no email)", c: "A Edge Function não está passando a variável correta.", f: "Verifique o código da Edge Function — o objeto variables deve incluir a chave correspondente." },
                        { p: "Email com layout quebrado", c: "HTML inválido gerado pelo editor ou variável com conteúdo que quebra a estrutura.", f: "Use \"Visualizar\" para inspecionar o HTML. Escapeie caracteres especiais nas variáveis." },
                        { p: "Erro 500 ao enviar (Edge Function)", c: "Falha no Resend (chave inválida, template malformado) ou erro interno.", f: "Verifique os logs em Supabase → Edge Functions → send-[nome] → Logs. Use \"Enviar Teste\" para isolar o problema." },
                      ].map((item, i) => (
                        <div key={i} className="rounded-lg border p-3 space-y-1">
                          <p className="font-medium text-destructive text-xs">{item.p}</p>
                          <p className="text-muted-foreground text-xs"><span className="font-medium text-foreground">Causa:</span> {item.c}</p>
                          <p className="text-muted-foreground text-xs"><span className="font-medium text-foreground">Fix:</span> {item.f}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </SheetContent>
            </Sheet>
            <Button
              className="rounded-[12px] gap-2"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="w-4 h-4" />
              Novo Template
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>
        </div>

        {/* Templates Table */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <Card className="rounded-[24px] border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Mail className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {search ? 'Nenhum template encontrado' : 'Nenhum template criado'}
              </h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                {search
                  ? 'Tente ajustar sua busca'
                  : 'Crie seu primeiro template de email'
                }
              </p>
              {!search && (
                <Button onClick={() => setShowCreateDialog(true)} className="rounded-xl">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Template
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-[24px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Assunto</TableHead>
                  <TableHead>Variáveis</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Atualizado</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{template.display_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {template.name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {template.category && (
                        <Badge
                          variant="secondary"
                          className={CATEGORY_COLORS[template.category] || ''}
                        >
                          {CATEGORY_LABELS[template.category] || template.category}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate text-sm">{template.subject}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {template.variables?.slice(0, 3).map((v, i) => (
                          <Badge key={i} variant="outline" className="text-xs font-mono">
                            {v}
                          </Badge>
                        ))}
                        {template.variables && template.variables.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.variables.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={template.enabled}
                        onCheckedChange={(checked) => toggleEnabled(template.id, checked)}
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(template.updated_at), 'dd/MM/yy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem
                            onClick={() => setPreviewTemplate(template)}
                            className="gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setTestEmailTemplate(template)}
                            className="gap-2"
                          >
                            <Send className="w-4 h-4" />
                            Enviar Teste
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setEditingTemplate(template)}
                            className="gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeletingTemplateId(template.id)}
                            className="gap-2 text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Dialogs */}
        <EmailTemplateDialog
          open={showCreateDialog || !!editingTemplate}
          onOpenChange={(open) => {
            if (!open) {
              setShowCreateDialog(false);
              setEditingTemplate(null);
            }
          }}
          template={editingTemplate}
        />

        <EmailTemplatePreviewDialog
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onSendTest={(t) => {
            setPreviewTemplate(null);
            setTestEmailTemplate(t);
          }}
        />

        <SendTestEmailDialog
          template={testEmailTemplate}
          onClose={() => setTestEmailTemplate(null)}
        />

        {/* Delete Confirmation */}
        <AlertDialog open={!!deletingTemplateId} onOpenChange={() => setDeletingTemplateId(null)}>
          <AlertDialogContent className="rounded-[24px]">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover este template? Esta ação não pode ser desfeita.
                Emails que dependem deste template deixarão de funcionar.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="rounded-xl bg-destructive hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
