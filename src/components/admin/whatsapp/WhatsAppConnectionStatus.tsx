import { RefreshCw, Wifi, WifiOff, QrCode } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWhatsAppStatus } from '@/hooks/useAdminWhatsApp';

export function WhatsAppConnectionStatus() {
  const { data: status, isLoading, refetch, isRefetching } = useWhatsAppStatus();

  const connected = status?.connected ?? false;

  return (
    <Card variant="glass">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            {connected ? (
              <Wifi className="w-4 h-4 text-green-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            WhatsApp
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`text-[10px] ${
                connected
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-red-50 text-red-600 border-red-200'
              }`}
            >
              {connected ? 'Conectado' : 'Desconectado'}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg"
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <p className="text-xs text-gray-400">Verificando conexão...</p>
        ) : status?.error ? (
          <div className="text-xs text-red-500">
            <p>Erro ao verificar: {status.error}</p>
            <p className="text-gray-400 mt-1">Verifique se a Evolution API está online.</p>
          </div>
        ) : connected ? (
          <div className="space-y-1">
            {status?.instance && (
              <p className="text-xs text-gray-500">
                Instância: <span className="font-mono text-gray-700">{status.instance}</span>
              </p>
            )}
            {status?.state && (
              <p className="text-xs text-gray-500">
                Estado: <span className="text-green-600">{status.state}</span>
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">
              Escaneie o QR Code abaixo com o WhatsApp para conectar.
            </p>
            {status?.qrCode ? (
              <div className="flex justify-center p-3 bg-white rounded-xl border">
                <img
                  src={status.qrCode}
                  alt="QR Code WhatsApp"
                  className="w-48 h-48"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 bg-gray-50 rounded-xl border border-dashed">
                <div className="text-center">
                  <QrCode className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-[10px] text-gray-400">QR Code não disponível</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] rounded-lg mt-2"
                    onClick={() => refetch()}
                  >
                    Gerar QR Code
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
