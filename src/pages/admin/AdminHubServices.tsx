import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import {
  useAdminHubServices,
  useCreateHubService,
  useUpdateHubService,
  useDeleteHubService,
  useToggleHubServiceVisibility,
} from '@/hooks/useAdminHubServices';
import { HubServiceForm, HubServiceFormSubmitData } from '@/components/admin/hub/HubServiceForm';
import { iconMap } from '@/components/admin/hub/IconSelector';
import { typeConfig } from '@/components/admin/hub/ServiceTypeSelector';
import { HubService, SERVICE_TYPE_LABELS, ServiceType } from '@/types/hub';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Copy,
  Check,
  HelpCircle,
  BookOpen,
  ChevronRight,
  Wrench,
  Search,
  LayoutGrid,
  List as ListIcon,
  MoreVertical,
  ExternalLink,
} from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// --- Inline components ---

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label} copiado!`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="group flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted border border-border hover:bg-accent hover:border-border/80 transition-all text-xs text-muted-foreground"
      title={`Copiar ${label}: ${text}`}
    >
      {copied ? (
        <Check className="w-3 h-3 text-emerald-600" />
      ) : (
        <Copy className="w-3 h-3 text-muted-foreground group-hover:text-foreground" />
      )}
      <span className="font-mono text-[10px] uppercase tracking-wider">{label}</span>
    </button>
  );
}

type TabId = 'all' | 'visible' | 'hidden';

function FilterTabs({
  activeTab,
  onChange,
  tabs,
}: {
  activeTab: TabId;
  onChange: (id: TabId) => void;
  tabs: { id: TabId; label: string; count: number }[];
}) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl w-fit border border-border/50">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'relative px-4 py-2 text-sm font-medium rounded-lg transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary',
            activeTab === tab.id
              ? 'bg-background text-foreground shadow-sm border border-border/50'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
        >
          <span className="flex items-center gap-2">
            {tab.label}
            <span
              className={cn(
                'px-1.5 py-0.5 text-[10px] rounded-full font-medium',
                activeTab === tab.id
                  ? 'bg-muted text-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {tab.count}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

// --- Main Component ---

export default function AdminHubServices() {
  const { data: services, isLoading } = useAdminHubServices();
  const createMutation = useCreateHubService();
  const updateMutation = useUpdateHubService();
  const deleteMutation = useDeleteHubService();
  const toggleVisibilityMutation = useToggleHubServiceVisibility();

  const [formOpen, setFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<HubService | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const filteredServices = useMemo(() => {
    if (!services) return [];
    return services.filter((service) => {
      const matchesSearch =
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (service.category || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab =
        activeTab === 'all'
          ? true
          : activeTab === 'visible'
            ? service.is_visible_in_hub
            : !service.is_visible_in_hub;
      return matchesSearch && matchesTab;
    });
  }, [services, searchQuery, activeTab]);

  const stats = useMemo(() => {
    if (!services) return { all: 0, visible: 0, hidden: 0 };
    return {
      all: services.length,
      visible: services.filter((s) => s.is_visible_in_hub).length,
      hidden: services.filter((s) => !s.is_visible_in_hub).length,
    };
  }, [services]);

  const handleCreate = () => {
    setEditingService(null);
    setFormOpen(true);
  };

  const handleEdit = (service: HubService) => {
    setEditingService(service);
    setFormOpen(true);
  };

  const handleFormSubmit = (data: HubServiceFormSubmitData) => {
    if (editingService) {
      updateMutation.mutate(
        { id: editingService.id, ...data },
        { onSuccess: () => setFormOpen(false) }
      );
    } else {
      createMutation.mutate(data, { onSuccess: () => setFormOpen(false) });
    }
  };

  const handleDelete = () => {
    if (deleteConfirmId) {
      deleteMutation.mutate(deleteConfirmId, {
        onSuccess: () => setDeleteConfirmId(null),
      });
    }
  };

  const handleToggleVisibility = (service: HubService) => {
    toggleVisibilityMutation.mutate({
      id: service.id,
      is_visible_in_hub: !service.is_visible_in_hub,
    });
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'BRL',
    }).format(price);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-muted/30 p-4 sm:p-6 lg:p-10">
        <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
            <div className="space-y-1 sm:space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                Produtos & Serviços
              </h1>
              <p className="text-muted-foreground max-w-2xl text-sm sm:text-base leading-relaxed">
                Gerencie o catálogo de produtos, estratégias de preços e visibilidade na plataforma.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <HelpCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">Documentação</span>
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      Documentação — Produtos
                    </SheetTitle>
                    <SheetDescription>
                      Catálogo de serviços do Hub, campos importantes e integração Ticto
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-6 text-sm">
                    <section className="space-y-2">
                      <h3 className="font-semibold text-base flex items-center gap-2">
                        <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                          1
                        </span>
                        Propósito
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Gerencia o catálogo de produtos/serviços exibidos no Hub. Define o que
                        aparece na loja, os preços, o tipo de serviço e a ligação com a Ticto
                        (gateway de pagamento). Cada produto pode liberar uma rota específica do
                        Hub ao ser comprado.
                      </p>
                    </section>
                    <div className="border-t" />
                    <section className="space-y-3">
                      <h3 className="font-semibold text-base flex items-center gap-2">
                        <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                          2
                        </span>
                        Campos importantes
                      </h3>
                      <div className="rounded-lg border overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="text-left px-3 py-2 font-medium">Campo</th>
                              <th className="text-left px-3 py-2 font-medium">Descrição</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {[
                              [
                                'display_order',
                                'Ordem de exibição no Hub — menor número aparece primeiro.',
                              ],
                              [
                                'ticto_product_id',
                                'ID do produto na Ticto. Essencial para o webhook de pagamento reconhecer o produto.',
                              ],
                              [
                                'route',
                                'Rota interna do Hub que será liberada ao usuário após a compra.',
                              ],
                              [
                                'redirect_url',
                                'URL para onde o usuário é redirecionado após confirmar a compra.',
                              ],
                              [
                                'ribbon',
                                'Badge de destaque exibido no card (ex: "Mais Popular", "Novo").',
                              ],
                              [
                                'is_visible_in_hub',
                                'Controla se o produto aparece na loja do Hub para os usuários.',
                              ],
                              [
                                'service_type',
                                'Tipo de serviço: assinatura, ferramenta IA, sessão, etc.',
                              ],
                            ].map(([f, d], i) => (
                              <tr key={i}>
                                <td className="px-3 py-2 font-mono text-[10px]">{f}</td>
                                <td className="px-3 py-2 text-muted-foreground">{d}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                    <div className="border-t" />
                    <section className="space-y-3">
                      <h3 className="font-semibold text-base flex items-center gap-2">
                        <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                          3
                        </span>
                        Como usar
                      </h3>
                      <ul className="space-y-2 text-muted-foreground">
                        {[
                          {
                            item: 'Novo Produto',
                            detail:
                              'Abre o formulário completo de cadastro. Preencha pelo menos nome, tipo e Ticto Product ID.',
                          },
                          {
                            item: 'Editar',
                            detail: 'Abre o formulário com os dados atuais para edição.',
                          },
                          {
                            item: 'Excluir',
                            detail:
                              'Remove o produto permanentemente após confirmação. Não desfazível.',
                          },
                          {
                            item: 'Toggle Visibilidade',
                            detail:
                              'Use o switch para alternar rapidamente a visibilidade sem abrir o formulário.',
                          },
                        ].map((i, idx) => (
                          <li key={idx} className="flex gap-3">
                            <ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                            <div>
                              <span className="font-medium text-foreground">{i.item}: </span>
                              {i.detail}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </section>
                    <div className="border-t" />
                    <section className="space-y-3">
                      <h3 className="font-semibold text-base flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-primary" />
                        Troubleshooting
                      </h3>
                      <div className="space-y-3">
                        {[
                          {
                            p: 'Pagamento processado mas acesso não liberado',
                            c: 'O ticto_product_id não bate com o ID no webhook da Ticto.',
                            f: 'Compare o ID no painel da Ticto com o cadastrado aqui. Devem ser idênticos.',
                          },
                          {
                            p: 'Produto não aparece no Hub',
                            c: 'is_visible_in_hub está desativado.',
                            f: 'Edite o produto e ative a visibilidade.',
                          },
                          {
                            p: 'Checkout não redireciona corretamente',
                            c: 'redirect_url em branco ou incorreta.',
                            f: 'Preencha a URL de redirecionamento no formulário do produto.',
                          },
                        ].map((item, i) => (
                          <div key={i} className="rounded-lg border p-3 space-y-1">
                            <p className="font-medium text-destructive text-xs">{item.p}</p>
                            <p className="text-muted-foreground text-xs">
                              <span className="font-medium text-foreground">Causa:</span> {item.c}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              <span className="font-medium text-foreground">Fix:</span> {item.f}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                </SheetContent>
              </Sheet>
              <Button onClick={handleCreate} className="gap-2 shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4" />
                Novo Produto
              </Button>
            </div>
          </div>

          {/* Controls Section */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-card p-2 rounded-2xl border border-border shadow-sm">
            <FilterTabs
              activeTab={activeTab}
              onChange={setActiveTab}
              tabs={[
                { id: 'all', label: 'Todos', count: stats.all },
                { id: 'visible', label: 'Ativos', count: stats.visible },
                { id: 'hidden', label: 'Ocultos', count: stats.hidden },
              ]}
            />

            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-64 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground"
                />
              </div>

              <div className="flex items-center bg-muted rounded-lg p-1 border border-border">
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-1.5 rounded-md transition-all',
                    viewMode === 'list'
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <ListIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-1.5 rounded-md transition-all',
                    viewMode === 'grid'
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground">
                {services?.length === 0
                  ? 'Nenhum produto cadastrado'
                  : 'Nenhum produto encontrado'}
              </h3>
              <p className="text-muted-foreground mt-1">
                {services?.length === 0
                  ? 'Clique em "Novo Produto" para começar.'
                  : 'Tente ajustar sua busca ou filtros.'}
              </p>
            </div>
          ) : (
            <div
              className={cn(
                'grid gap-4 transition-all',
                viewMode === 'grid'
                  ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                  : 'grid-cols-1'
              )}
            >
              {filteredServices.map((service) => {
                const Icon = iconMap[service.icon_name] || iconMap.FileCheck;
                const serviceType = service.service_type as ServiceType;
                const typeConf = typeConfig[serviceType] || typeConfig.ai_tool;

                return (
                  <div
                    key={service.id}
                    className={cn(
                      'group bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all duration-200 rounded-2xl overflow-hidden animate-in fade-in-0 zoom-in-[0.98]',
                      viewMode === 'list'
                        ? 'p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6'
                        : 'p-5 sm:p-6 flex flex-col gap-5 sm:gap-6'
                    )}
                  >
                    {/* Icon & Identity */}
                    <div
                      className={cn(
                        'flex items-center gap-3 sm:gap-4',
                        viewMode === 'list' ? 'flex-1 min-w-0 sm:min-w-[240px]' : 'w-full'
                      )}
                    >
                      <div
                        className={cn(
                          'relative flex-shrink-0 flex items-center justify-center rounded-2xl transition-colors',
                          viewMode === 'list' ? 'w-11 h-11 sm:w-12 sm:h-12' : 'w-13 sm:w-14 h-13 sm:h-14',
                          service.is_visible_in_hub
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        <Icon
                          className={
                            viewMode === 'list' ? 'w-5 h-5 sm:w-6 sm:h-6' : 'w-6 h-6 sm:w-7 sm:h-7'
                          }
                        />
                        {service.is_visible_in_hub && (
                          <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            className={cn(
                              'font-bold truncate text-sm sm:text-base',
                              service.is_visible_in_hub
                                ? 'text-foreground'
                                : 'text-muted-foreground'
                            )}
                          >
                            {service.name}
                          </h3>
                          {service.ribbon && (
                            <Badge
                              variant={
                                service.ribbon === 'POPULAR'
                                  ? 'default'
                                  : service.ribbon === 'NOVO'
                                    ? 'secondary'
                                    : 'outline'
                              }
                              className="text-[10px] font-bold px-2 py-0 hidden sm:inline-flex"
                            >
                              {service.ribbon}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                          {service.category && (
                            <>
                              <span className="font-medium">{service.category}</span>
                              <span className="w-1 h-1 rounded-full bg-border" />
                            </>
                          )}
                          <Badge
                            variant="outline"
                            className={cn('text-[10px] font-medium px-1.5 py-0', typeConf.color)}
                          >
                            {SERVICE_TYPE_LABELS[serviceType] || 'IA'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Meta Data (Price & IDs) */}
                    <div
                      className={cn(
                        'flex items-center gap-4 sm:gap-6',
                        viewMode === 'list'
                          ? 'flex-[2] justify-center sm:justify-start'
                          : 'w-full justify-between border-t border-border pt-4'
                      )}
                    >
                      <div className="flex flex-col">
                        <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5 sm:mb-1">
                          Preço
                        </span>
                        <div className="flex items-center gap-2">
                          {service.anchor_price && service.anchor_price > service.price && (
                            <span className="text-sm text-muted-foreground line-through font-mono">
                              {formatPrice(service.anchor_price, service.currency)}
                            </span>
                          )}
                          <span className="text-base sm:text-lg font-bold text-foreground font-mono">
                            {formatPrice(service.price, service.currency)}
                          </span>
                        </div>
                      </div>

                      <div className="h-8 w-px bg-border hidden sm:block" />

                      <div className="flex flex-col gap-1.5 sm:gap-2">
                        {service.ticto_product_id && (
                          <CopyButton
                            text={service.ticto_product_id}
                            label="Ticto"
                          />
                        )}
                        {service.stripe_price_id && (
                          <CopyButton
                            text={service.stripe_price_id}
                            label="Stripe"
                          />
                        )}
                        {!service.ticto_product_id && !service.stripe_price_id && (
                          <span className="text-xs text-muted-foreground">Sem IDs</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div
                      className={cn(
                        'flex items-center gap-3 sm:gap-4',
                        viewMode === 'list'
                          ? 'w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-border pt-3 sm:pt-0'
                          : 'w-full justify-between items-center'
                      )}
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span
                          className={cn(
                            'text-xs sm:text-sm font-medium transition-colors',
                            service.is_visible_in_hub
                              ? 'text-primary'
                              : 'text-muted-foreground'
                          )}
                        >
                          {service.is_visible_in_hub ? 'Ativo' : 'Oculto'}
                        </span>
                        <Switch
                          checked={service.is_visible_in_hub}
                          onCheckedChange={() => handleToggleVisibility(service)}
                        />
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleEdit(service)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          {service.landing_page_url && (
                            <DropdownMenuItem asChild>
                              <a
                                href={service.landing_page_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Ver Landing Page
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteConfirmId(service.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      <HubServiceForm
        open={formOpen}
        onOpenChange={setFormOpen}
        service={editingService}
        onSubmit={handleFormSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Produto</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O produto será removido permanentemente do
              catálogo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Remover'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
