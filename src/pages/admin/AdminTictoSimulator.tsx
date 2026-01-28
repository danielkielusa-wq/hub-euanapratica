import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Copy, Check, AlertCircle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAdminHubServices } from "@/hooks/useAdminHubServices";
import { useSearchUsers } from "@/hooks/useAdminUsers";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

export default function AdminTictoSimulator() {
  const navigate = useNavigate();
  const { data: services, isLoading: servicesLoading } = useAdminHubServices();
  
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [email, setEmail] = useState("");
  const [emailSearch, setEmailSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("paid");
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Search users for autocomplete
  const { data: searchResults } = useSearchUsers(emailSearch);

  const selectedService = useMemo(() => 
    services?.find(s => s.id === selectedServiceId),
    [services, selectedServiceId]
  );

  const selectedStatusInfo = useMemo(() =>
    PAYMENT_STATUSES.find(s => s.value === selectedStatus),
    [selectedStatus]
  );

  // Generate preview payload
  const previewPayload = useMemo(() => ({
    status: selectedStatus,
    token: "[TICTO_SECRET_KEY]",
    item: {
      product_id: selectedService?.ticto_product_id || "SIMULATED_ID",
      product_name: selectedService?.name || "Produto não selecionado",
    },
    customer: {
      name: "Simulação Admin",
      email: email || "email@exemplo.com",
    },
    order: {
      hash: `SIM_${Date.now()}`,
      paid_amount: Math.round((selectedService?.price || 0) * 100),
    },
  }), [selectedService, email, selectedStatus]);

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
          product_id: selectedService?.ticto_product_id || "SIMULATED_ID",
          product_name: selectedService?.name || "Simulated Product",
          status: selectedStatus,
          amount: Math.round((selectedService?.price || 0) * 100),
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
      console.error("Simulation error:", error);
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
            <div>
              <h1 className="text-2xl font-bold">Simulador de Callbacks Ticto</h1>
              <p className="text-muted-foreground">
                Teste o fluxo de pagamento sem transações reais
              </p>
            </div>
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
              {/* Product Selector */}
              <div className="space-y-2">
                <Label>Produto</Label>
                <Select
                  value={selectedServiceId}
                  onValueChange={setSelectedServiceId}
                  disabled={servicesLoading}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione um produto..." />
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
            disabled={isSimulating || !email}
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

                {result.success && (
                  <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                    <p className="text-sm text-primary">
                      ✓ A simulação foi executada com sucesso. Verifique o Hub do usuário para confirmar se o acesso foi liberado/revogado conforme esperado.
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
