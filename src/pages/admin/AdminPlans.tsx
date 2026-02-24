import { RefreshCw, Settings2, Save, Eye, HelpCircle, BookOpen, ChevronRight, Wrench } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PlanCard } from '@/components/admin/plans/PlanCard';
import { useAdminPlans } from '@/hooks/useAdminPlans';

export default function AdminPlans() {
  const { plans, isLoading, isSaving, updatePlan, refetch } = useAdminPlans();

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-muted/30 p-6 md:p-8">
        <div className="max-w-7xl mx-auto animate-fade-in pb-20">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black text-foreground tracking-tight">Gestão de Planos</h1>
              <p className="text-muted-foreground mt-1">
                Configure preços, limites e benefícios de cada nível de assinatura.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={refetch}
                className="gap-2 rounded-xl"
              >
                <RefreshCw className="w-4 h-4" />
                Atualizar
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 rounded-xl">
                    <HelpCircle className="w-4 h-4" />
                    Documentação
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      Documentação — Planos
                    </SheetTitle>
                    <SheetDescription>Configuração de níveis de assinatura, limites e benefícios</SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-6 text-sm">
                    <section className="space-y-2">
                      <h3 className="font-semibold text-base flex items-center gap-2">
                        <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
                        Propósito
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Configura os níveis de assinatura do sistema (ex: Básico, Pro, Premium). Cada plano define preço, limites de uso e a lista de benefícios exibida na página de assinatura.
                      </p>
                      <p className="text-muted-foreground leading-relaxed">
                        Os planos são armazenados na tabela <code className="bg-muted px-1 rounded text-xs">subscription_plans</code> e referenciados pelas assinaturas ativas.
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
                          { item: "Edição inline", detail: "Clique em qualquer campo do card para editar diretamente. Não há formulário separado." },
                          { item: "Salvar por card", detail: "Cada plano tem seu próprio botão \"Salvar\". As alterações são independentes entre planos." },
                          { item: "Atualizar", detail: "Recarrega todos os planos do banco. Use se suspeitar que os dados estão desatualizados." },
                          { item: "Benefícios", detail: "Lista de itens exibidos na página de assinatura. Adicione/remova conforme necessário." },
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
                        Campos por plano
                      </h3>
                      <div className="rounded-lg border overflow-hidden">
                        <table className="w-full text-xs">
                          <thead><tr className="bg-muted/50"><th className="text-left px-3 py-2 font-medium">Campo</th><th className="text-left px-3 py-2 font-medium">Descrição</th></tr></thead>
                          <tbody className="divide-y">
                            {[
                              ["Nome / Descrição", "Exibidos ao usuário na página de assinatura e no Hub."],
                              ["Preço", "Valor cobrado no ciclo. Alterações não afetam assinaturas ativas existentes."],
                              ["Limites", "Ex: sessões/mês, consultas de IA, etc. Validados nas Edge Functions."],
                              ["Relatório Diagnóstico", "Controla se assinantes deste plano veem o relatório completo (recomendações, plano de ação, checkpoints). Leads sem plano ou com plano sem esse toggle ativo veem versão limitada."],
                              ["Ticto Product ID", "ID do plano no gateway Ticto — usado pelo webhook de pagamento."],
                              ["is_active", "Controla se o plano aparece como opção na página de assinatura."],
                            ].map(([f, d], i) => (
                              <tr key={i}><td className="px-3 py-2 font-medium text-foreground">{f}</td><td className="px-3 py-2 text-muted-foreground">{d}</td></tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                    <div className="border-t" />
                    <section className="space-y-3">
                      <h3 className="font-semibold text-base flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-primary" />
                        Troubleshooting
                      </h3>
                      <div className="space-y-3">
                        {[
                          { p: "Alteração não persiste após Salvar", c: "Erro de RLS, validação ou falha de rede.", f: "Observe o toast de erro. Verifique os logs em Supabase → Database → Logs." },
                          { p: "Plano não aparece na página de assinatura", c: "is_active desativado ou plano não retornado pela query.", f: "Ative o campo is_active no card do plano e clique em Salvar." },
                          { p: "Preço alterado mas assinatura ativa ainda cobra o valor antigo", c: "Comportamento esperado — assinaturas ativas usam o preço do momento da contratação.", f: "Para alterar cobranças recorrentes, é necessário atualizar via gateway (Ticto)." },
                          { p: "Lead vê relatório completo mesmo sem assinatura", c: "O user_id na career_evaluations pode estar vinculado a uma conta com plano ativo ou compra de consultoria.", f: "Verifique user_subscriptions e user_hub_services do usuário no Supabase. Desative o toggle 'Relatório Diagnóstico' no plano se necessário." },
                          { p: "Admin não consegue ver relatório completo", c: "Falha no check de auth ou RLS bloqueando acesso admin.", f: "Verifique que o admin está logado na plataforma antes de acessar o link público do relatório. O sistema detecta admin automaticamente." },
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
            </div>
          </div>

          {/* Plans Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-[700px] rounded-[32px]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {plans.map(plan => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onSave={updatePlan}
                  isSaving={isSaving === plan.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
