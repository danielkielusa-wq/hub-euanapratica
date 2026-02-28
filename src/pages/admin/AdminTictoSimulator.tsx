import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Play, Copy, Check, AlertCircle, CheckCircle2, Clock, Loader2, HelpCircle, BookOpen, ChevronRight, Wrench, ShoppingBag, Video } from "lucide-react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAdminHubServices } from "@/hooks/useAdminHubServices";
import { useSearchUsers } from "@/hooks/useAdminUsers";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Live } from "@/types/live";

// Payment status options with their behaviors
const PAYMENT_STATUSES = [
  { value: "paid", label: "Pago", description: "Libera acesso", color: "bg-green-500" },
  { value: "completed", label: "Completo", description: "Libera acesso", color: "bg-green-500" },
  { value: "approved", label: "Aprovado", description: "Libera acesso", color: "bg-green-500" },
  { value: "authorized", label: "Autorizado", description: "Libera acesso", color: "bg-green-500" },
  { value: "venda_realizada", label: "Venda Realizada", description: "Libera acesso", color: "bg-green-500" },
  { value: "waiting_payment", label: "Aguardando Pagamento", description: "Apenas registra log", color: "bg-yellow-500" },
  { value: "refunded", label: "Reembolsado", description: "Revoga acesso", color: "bg-red-500" },
  { value: "chargedback", label: "Chargeback", description: "Revoga acesso", color: "bg-red-500" },
  { value: "cancelled", label: "Cancelado", description: "Revoga acesso", color: "bg-red-500" },
];

interface SimulationResult {
  success: boolean;
  status: number;
  responseTime: string;
  simulatedPayload: Record<string, unknown>;
  webhookResponse: Record<string, unknown>;
}

type ProductType = "service" | "live";

export default function AdminTictoSimulator() {
  const navigate = useNavigate();
  const { data: services, isLoading: servicesLoading } = useAdminHubServices();

  const [productType, setProductType] = useState<ProductType>("service");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedLiveId, setSelectedLiveId] = useState<string>("");
  const [email, setEmail] = useState("");
  const [emailSearch, setEmailSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("paid");
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch paid lives for the live selector
  const { data: lives, isLoading: livesLoading } = useQuery({
    queryKey: ['admin-paid-lives'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lives')
        .select('id, title, slug, price, ticto_product_id, access_type, status, scheduled_at')
        .eq('access_type', 'paid')
        .order('scheduled_at', { ascending: false });
      if (error) throw error;
      return data as Pick<Live, 'id'|'title'|'slug'|'price'|'ticto_product_id'|'access_type'|'status'|'scheduled_at'>[];
    },
  });

  // Search users for autocomplete
  const { data: searchResults } = useSearchUsers(emailSearch);

  const selectedService = useMemo(() =>
    services?.find(s => s.id === selectedServiceId),
    [services, selectedServiceId]
  );

  const selectedLive = useMemo(() =>
    lives?.find(l => l.id === selectedLiveId),
    [lives, selectedLiveId]
  );

  // Unified product for payload/simulation
  const selectedProduct = useMemo(() => {
    if (productType === 'service' && selectedService) {
      return { name: selectedService.name, ticto_product_id: selectedService.ticto_product_id, price: selectedService.price };
    }
    if (productType === 'live' && selectedLive) {
      return { name: selectedLive.title, ticto_product_id: selectedLive.ticto_product_id, price: selectedLive.price };
    }
    return null;
  }, [productType, selectedService, selectedLive]);

  const selectedStatusInfo = useMemo(() =>
    PAYMENT_STATUSES.find(s => s.value === selectedStatus),
    [selectedStatus]
  );

  const handleProductTypeChange = (type: ProductType) => {
    setProductType(type);
    setSelectedServiceId("");
    setSelectedLiveId("");
    setResult(null);
  };

  // Generate preview payload
  const previewPayload = useMemo(() => ({
    status: selectedStatus,
    token: "[TICTO_SECRET_KEY]",
    item: {
      product_id: selectedProduct?.ticto_product_id || "SIMULATED_ID",
      product_name: selectedProduct?.name || "Produto não selecionado",
    },
    customer: {
      name: "Simulação Admin",
      email: email || "email@exemplo.com",
    },
    order: {
      hash: `SIM_${Date.now()}`,
      paid_amount: Math.round((selectedProduct?.price || 0) * 100),
    },
  }), [selectedProduct, email, selectedStatus]);

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(previewPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Payload copiado!");
  };

  const handleSimulate = async () => {
    if (!email) {
      toast.error("Informe um e-mail para simular");
      return;
    }

    setIsSimulating(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("simulate-ticto-callback", {
        body: {
          email,
          product_id: selectedProduct?.ticto_product_id || "SIMULATED_ID",
          product_name: selectedProduct?.name || "Simulated Product",
          status: selectedStatus,
          amount: Math.round((selectedProduct?.price || 0) * 100),
        },
      });

      if (error) throw error;

      setResult(data as SimulationResult);
      
      if (data?.success) {
        toast.success("Simulação executada com sucesso!");
      } else {
        toast.error("Simulação retornou erro");
      }
    } catch (error) {
      toast.error("Erro ao executar simulação");
      setResult({
        success: false,
        status: 500,
        responseTime: "N/A",
        simulatedPayload: previewPayload,
        webhookResponse: { error: error instanceof Error ? error.message : "Unknown error" },
      });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-muted/30 p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin/dashboard")}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Simulador de Callbacks Ticto</h1>
              <p className="text-muted-foreground">
                Teste o fluxo de pagamento sem transações reais
              </p>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 shrink-0">
                  <HelpCircle className="h-4 w-4" />
                  Documentação
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Documentação do Simulador
                  </SheetTitle>
                  <SheetDescription>
                    Guia de uso, comportamentos e troubleshooting
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6 text-sm">
                  {/* Propósito */}
                  <section className="space-y-2">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
                      Propósito
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Este simulador dispara um webhook falso diretamente na Edge Function <code className="bg-muted px-1 rounded text-xs">ticto-callback</code>, como se a Ticto tivesse notificado o sistema sobre um evento de pagamento.
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      Use-o para testar o fluxo completo de liberação/revogação de acesso a um produto <strong>sem realizar uma transação real</strong> — útil para onboarding de novos produtos, debug de integrações e validação de RLS.
                    </p>
                  </section>

                  <Separator />

                  {/* Como executar */}
                  <section className="space-y-3">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</span>
                      Como executar
                    </h3>
                    <ol className="space-y-2 text-muted-foreground">
                      {[
                        { step: "Escolha o tipo", detail: "Selecione Serviço (produtos do Hub) ou Live (lives pagas)." },
                        { step: "Selecione o produto", detail: "Escolha o serviço ou live a testar. O Ticto Product ID será usado no payload." },
                        { step: "Informe o e-mail", detail: "Digite ou busque o e-mail do usuário que receberá (ou perderá) o acesso." },
                        { step: "Escolha o status", detail: "Selecione o evento de pagamento a simular (veja tabela abaixo)." },
                        { step: "Clique em Simular", detail: "O sistema chamará a Edge Function e exibirá a resposta do webhook." },
                        { step: "Valide o resultado", detail: "Para serviços, verifique user_hub_services. Para lives, verifique live_registrations ou a tela do mentor." },
                      ].map((item, i) => (
                        <li key={i} className="flex gap-3">
                          <ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                          <div>
                            <span className="font-medium text-foreground">{item.step}: </span>
                            {item.detail}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </section>

                  <Separator />

                  {/* Comportamentos por status */}
                  <section className="space-y-3">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">3</span>
                      Comportamentos por status
                    </h3>
                    <div className="rounded-lg border overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left px-3 py-2 font-medium">Status</th>
                            <th className="text-left px-3 py-2 font-medium">Efeito</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          <tr>
                            <td className="px-3 py-2">
                              <div className="flex flex-wrap gap-1">
                                {["paid", "completed", "approved", "authorized", "venda_realizada"].map(s => (
                                  <Badge key={s} variant="outline" className="text-[10px] border-green-500 text-green-600">{s}</Badge>
                                ))}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">
                              Serviço: libera <code className="bg-muted/70 px-1 rounded text-[10px]">user_hub_services</code><br />
                              Live: upsert <code className="bg-muted/70 px-1 rounded text-[10px]">live_registrations</code> (paid)
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2">
                              <Badge variant="outline" className="text-[10px] border-yellow-500 text-yellow-600">waiting_payment</Badge>
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">Registra log, sem alterar acesso</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2">
                              <div className="flex flex-wrap gap-1">
                                {["refunded", "chargedback", "cancelled"].map(s => (
                                  <Badge key={s} variant="outline" className="text-[10px] border-red-500 text-red-600">{s}</Badge>
                                ))}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">
                              Serviço: revoga <code className="bg-muted/70 px-1 rounded text-[10px]">user_hub_services</code><br />
                              Live: marca <code className="bg-muted/70 px-1 rounded text-[10px]">live_registrations</code> (refunded)
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <Separator />

                  {/* Troubleshooting */}
                  <section className="space-y-3">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-primary" />
                      Troubleshooting
                    </h3>
                    <div className="space-y-3">
                      {[
                        {
                          problema: "Status 401 / FunctionsFetchError",
                          causa: "A Edge Function pode estar sem verify_jwt = false no config.toml, ou o token de admin expirou.",
                          fix: "Recarregue a página para renovar o token. Se persistir, verifique o config.toml.",
                        },
                        {
                          problema: "Simulação retorna sucesso mas o acesso não foi liberado",
                          causa: "O produto não tem Ticto Product ID configurado, ou o e-mail do usuário não existe na base.",
                          fix: "Verifique o ticto_product_id do produto em Admin → Serviços. Certifique-se de que o usuário está cadastrado.",
                        },
                        {
                          problema: "Produto não aparece na lista",
                          causa: "Produtos sem ticto_product_id podem não aparecer ou não funcionar corretamente.",
                          fix: "Cadastre o ID do produto Ticto em Admin → Serviços antes de simular.",
                        },
                        {
                          problema: "Status 500 na resposta do webhook",
                          causa: "Erro interno na Edge Function (ex: falha no banco, RLS, FK).",
                          fix: "Verifique os logs em Supabase → Edge Functions → ticto-callback → Logs.",
                        },
                      ].map((item, i) => (
                        <div key={i} className="rounded-lg border p-3 space-y-1">
                          <p className="font-medium text-destructive text-xs">{item.problema}</p>
                          <p className="text-muted-foreground text-xs"><span className="font-medium text-foreground">Causa:</span> {item.causa}</p>
                          <p className="text-muted-foreground text-xs"><span className="font-medium text-foreground">Fix:</span> {item.fix}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <Separator />

                  <p className="text-xs text-muted-foreground pb-4">
                    Esta simulação <strong>não gera cobranças reais</strong> e <strong>não notifica o usuário por e-mail</strong>. Para serviços, a tabela <code className="bg-muted px-1 rounded">user_hub_services</code> é afetada. Para lives pagas, a tabela <code className="bg-muted px-1 rounded">live_registrations</code> é afetada.
                  </p>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Configuration Card */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Configuração da Simulação</CardTitle>
              <CardDescription>
                Selecione o produto, usuário e status para simular
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Product Type Toggle */}
              <div className="space-y-3">
                <Label>Tipo de Produto</Label>
                <div className="flex gap-1 bg-muted/50 p-1 rounded-full w-fit">
                  <button
                    onClick={() => handleProductTypeChange("service")}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                      productType === "service"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Serviço
                  </button>
                  <button
                    onClick={() => handleProductTypeChange("live")}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                      productType === "live"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Video className="h-4 w-4" />
                    Live
                  </button>
                </div>
              </div>

              {/* Product Selector — conditional on type */}
              <div className="space-y-2">
                <Label>Produto</Label>
                {productType === "service" ? (
                  <>
                    <Select
                      value={selectedServiceId}
                      onValueChange={setSelectedServiceId}
                      disabled={servicesLoading}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Selecione um serviço..." />
                      </SelectTrigger>
                      <SelectContent>
                        {services?.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            <div className="flex items-center gap-2">
                              <span>{service.name}</span>
                              {service.ticto_product_id && (
                                <Badge variant="secondary" className="text-xs">
                                  ID: {service.ticto_product_id}
                                </Badge>
                              )}
                              {service.price > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  R$ {service.price.toFixed(2)}
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedService && (
                      <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
                        <p><strong>Descrição:</strong> {selectedService.description || "Sem descrição"}</p>
                        <p><strong>Tipo:</strong> {selectedService.service_type}</p>
                        <p><strong>Rota:</strong> {selectedService.route || "Não definida"}</p>
                        <p><strong>URL Redirecionamento:</strong> {selectedService.redirect_url || "Não definida"}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <Select
                      value={selectedLiveId}
                      onValueChange={setSelectedLiveId}
                      disabled={livesLoading}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Selecione uma live paga..." />
                      </SelectTrigger>
                      <SelectContent>
                        {lives?.map((live) => (
                          <SelectItem key={live.id} value={live.id}>
                            <div className="flex items-center gap-2">
                              <span>{live.title}</span>
                              {live.ticto_product_id && (
                                <Badge variant="secondary" className="text-xs">
                                  ID: {live.ticto_product_id}
                                </Badge>
                              )}
                              {live.price > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  R$ {Number(live.price).toFixed(2)}
                                </Badge>
                              )}
                              <Badge variant="outline" className={cn("text-xs", {
                                "border-green-500 text-green-600": live.status === "scheduled",
                                "border-amber-500 text-amber-600": live.status === "live",
                                "border-muted-foreground": live.status === "completed" || live.status === "draft",
                              })}>
                                {live.status}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                        {lives?.length === 0 && (
                          <div className="px-4 py-3 text-sm text-muted-foreground">
                            Nenhuma live paga encontrada
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    {selectedLive && (
                      <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
                        <p><strong>Slug:</strong> /live/{selectedLive.slug}</p>
                        <p><strong>Data:</strong> {new Date(selectedLive.scheduled_at).toLocaleString("pt-BR")}</p>
                        <p><strong>Status:</strong> {selectedLive.status}</p>
                        <p><strong>Preço:</strong> R$ {Number(selectedLive.price).toFixed(2)}</p>
                        <p><strong>Ticto Product ID:</strong> {selectedLive.ticto_product_id || "Não configurado"}</p>
                      </div>
                    )}
                    {selectedLive && !selectedLive.ticto_product_id && (
                      <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        Esta live não tem Ticto Product ID configurado. O webhook não conseguirá identificá-la.
                      </div>
                    )}
                  </>
                )}
              </div>

              <Separator />

              {/* Email Input with Autocomplete */}
              <div className="space-y-2">
                <Label>E-mail do Usuário</Label>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="Digite o e-mail do usuário..."
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailSearch(e.target.value);
                    }}
                    className="h-12"
                  />
                  {searchResults && searchResults.length > 0 && emailSearch.length >= 2 && (
                    <div className="absolute z-10 w-full mt-1 bg-popover border rounded-lg shadow-lg">
                      <ScrollArea className="max-h-48">
                        {searchResults.map((user) => (
                          <button
                            key={user.id}
                            className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-3"
                            onClick={() => {
                              setEmail(user.email);
                              setEmailSearch("");
                            }}
                          >
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                              {user.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{user.full_name}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </button>
                        ))}
                      </ScrollArea>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Digite para buscar usuários cadastrados ou insira um e-mail manualmente
                </p>
              </div>

              <Separator />

              {/* Status Selector */}
              <div className="space-y-2">
                <Label>Status do Pagamento</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center gap-3">
                          <div className={cn("h-2 w-2 rounded-full", status.color)} />
                          <span>{status.label}</span>
                          <span className="text-xs text-muted-foreground">
                            ({status.description})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedStatusInfo && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className={cn("h-3 w-3 rounded-full", selectedStatusInfo.color)} />
                    <span className="font-medium">{selectedStatusInfo.label}:</span>
                    <span className="text-muted-foreground">{selectedStatusInfo.description}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payload Preview Card */}
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Payload a ser enviado</CardTitle>
                <CardDescription>
                  Prévia do JSON que será enviado ao webhook
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleCopyPayload}>
                {copied ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                {copied ? "Copiado!" : "Copiar"}
              </Button>
            </CardHeader>
            <CardContent>
              <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm font-mono">
                {JSON.stringify(previewPayload, null, 2)}
              </pre>
            </CardContent>
          </Card>

          {/* Simulate Button */}
          <Button
            onClick={handleSimulate}
            disabled={isSimulating || !email || (productType === "live" && selectedLive && !selectedLive.ticto_product_id)}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
          >
            {isSimulating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Simulando...
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Simular Callback
              </>
            )}
          </Button>

          {/* Result Card */}
          {result && (
            <Card className={cn(
              "rounded-2xl border-2",
              result.success ? "border-primary/50" : "border-destructive/50"
            )}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    )}
                    Resultado da Simulação
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={result.success ? "default" : "destructive"}>
                      Status: {result.status}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {result.responseTime}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Resposta do Webhook:</h4>
                  <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm font-mono">
                    {JSON.stringify(result.webhookResponse, null, 2)}
                  </pre>
                </div>

                {result.success && productType === "live" && (result.webhookResponse as Record<string, unknown>)?.type !== "live_purchase" && (
                  <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg space-y-2">
                    <p className="text-sm font-medium text-amber-800">
                      ⚠ O webhook retornou sucesso mas NÃO processou como compra de live.
                    </p>
                    <p className="text-xs text-amber-700">Possíveis causas:</p>
                    <ul className="text-xs text-amber-700 list-disc pl-4 space-y-1">
                      <li>A Edge Function <code className="bg-amber-100 px-1 rounded">ticto-webhook</code> precisa ser re-deployed com o código de lives</li>
                      <li>O e-mail <strong>{email}</strong> não foi encontrado na tabela <code className="bg-amber-100 px-1 rounded">profiles</code></li>
                      <li>O Ticto Product ID <strong>{selectedProduct?.ticto_product_id || "N/A"}</strong> não corresponde a nenhuma live na tabela</li>
                      <li>Existe um <code className="bg-amber-100 px-1 rounded">hub_service</code> com o mesmo product_id (tem prioridade sobre lives)</li>
                    </ul>
                    <p className="text-xs text-amber-700 mt-2">
                      Verifique os logs da Edge Function no Supabase Dashboard para mais detalhes.
                    </p>
                  </div>
                )}

                {result.success && productType === "live" && (result.webhookResponse as Record<string, unknown>)?.type === "live_purchase" && (
                  <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                    <p className="text-sm text-primary">
                      ✓ Compra de live processada com sucesso! Verifique <code className="bg-primary/20 px-1 rounded">live_registrations</code> ou a tela do mentor.
                    </p>
                  </div>
                )}

                {result.success && productType === "service" && (
                  <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                    <p className="text-sm text-primary">
                      ✓ Simulação executada. Verifique o Hub do usuário ou user_hub_services para confirmar se o acesso foi liberado/revogado.
                    </p>
                  </div>
                )}

                {!result.success && (
                  <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                    <p className="text-sm text-destructive">
                      ✗ A simulação retornou erro. Verifique os logs da Edge Function para mais detalhes.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
