/**
 * SocialAccountsSettings — Connect/disconnect LinkedIn and X accounts.
 */

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Linkedin, Twitter, MessageSquare, Link2, Unlink, AlertCircle } from 'lucide-react';
import {
  useSocialAccounts,
  useDisconnectAccount,
  useInitOAuth,
} from '@/hooks/useContentPublishing';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SocialAccountsSettings({ open, onClose }: Props) {
  const { data: accounts = [], isLoading } = useSocialAccounts();
  const disconnectAccount = useDisconnectAccount();
  const initOAuth = useInitOAuth();

  const linkedinAccount = accounts.find((a) => a.platform === 'linkedin');
  const xAccount = accounts.find((a) => a.platform === 'x');
  const threadsAccount = accounts.find((a) => a.platform === 'threads');

  const isTokenExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-orange-500" />
            Contas Sociais
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* LinkedIn */}
              <AccountCard
                platform="linkedin"
                icon={<Linkedin className="w-5 h-5" />}
                label="LinkedIn"
                account={linkedinAccount || null}
                isExpired={linkedinAccount ? isTokenExpired(linkedinAccount.token_expires_at) : false}
                onConnect={() => initOAuth.mutate('linkedin')}
                onDisconnect={() => linkedinAccount && disconnectAccount.mutate(linkedinAccount.id)}
                isConnecting={initOAuth.isPending}
                isDisconnecting={disconnectAccount.isPending}
              />

              {/* X/Twitter */}
              <AccountCard
                platform="x"
                icon={<Twitter className="w-5 h-5" />}
                label="X (Twitter)"
                account={xAccount || null}
                isExpired={xAccount ? isTokenExpired(xAccount.token_expires_at) : false}
                onConnect={() => initOAuth.mutate('x')}
                onDisconnect={() => xAccount && disconnectAccount.mutate(xAccount.id)}
                isConnecting={initOAuth.isPending}
                isDisconnecting={disconnectAccount.isPending}
              />

              {/* Threads */}
              <AccountCard
                platform="threads"
                icon={<MessageSquare className="w-5 h-5" />}
                label="Threads"
                account={threadsAccount || null}
                isExpired={threadsAccount ? isTokenExpired(threadsAccount.token_expires_at) : false}
                onConnect={() => initOAuth.mutate('threads')}
                onDisconnect={() => threadsAccount && disconnectAccount.mutate(threadsAccount.id)}
                isConnecting={initOAuth.isPending}
                isDisconnecting={disconnectAccount.isPending}
              />

              {/* Info */}
              <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground space-y-2 mt-6">
                <p className="font-medium text-foreground">Como configurar:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Configure <code className="bg-muted px-1 rounded">linkedin_oauth</code> em <a href="/admin/configuracoes-apis" className="underline">Configuracoes APIs</a></li>
                  <li>Configure <code className="bg-muted px-1 rounded">x_oauth</code> em <a href="/admin/configuracoes-apis" className="underline">Configuracoes APIs</a></li>
                  <li>Configure <code className="bg-muted px-1 rounded">threads_oauth</code> em <a href="/admin/configuracoes-apis" className="underline">Configuracoes APIs</a></li>
                  <li>Registre as Redirect URIs nos developer portals de cada plataforma</li>
                  <li>Clique em "Conectar" para autorizar</li>
                </ol>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AccountCard({
  platform,
  icon,
  label,
  account,
  isExpired,
  onConnect,
  onDisconnect,
  isConnecting,
  isDisconnecting,
}: {
  platform: string;
  icon: React.ReactNode;
  label: string;
  account: {
    account_name: string | null;
    token_expires_at: string | null;
    created_at: string;
  } | null;
  isExpired: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  isConnecting: boolean;
  isDisconnecting: boolean;
}) {
  const isConnected = !!account;

  return (
    <div className={`p-4 rounded-lg border ${isConnected ? 'border-green-200 bg-green-50/30' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${platform === 'linkedin' ? 'bg-blue-100 text-blue-600' : platform === 'threads' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-700'}`}>
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold">{label}</h3>
            {isConnected ? (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">@{account.account_name || 'conectado'}</span>
                {isExpired ? (
                  <Badge variant="destructive" className="text-[10px] gap-1">
                    <AlertCircle className="w-2.5 h-2.5" /> Token expirado
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700">Ativo</Badge>
                )}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">Nao conectado</span>
            )}
          </div>
        </div>

        {isConnected ? (
          <div className="flex gap-1.5">
            {isExpired && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1"
                onClick={onConnect}
                disabled={isConnecting}
              >
                {isConnecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link2 className="w-3 h-3" />}
                Reconectar
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={onDisconnect}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlink className="w-3 h-3" />}
              Desconectar
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={onConnect}
            disabled={isConnecting}
          >
            {isConnecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link2 className="w-3 h-3" />}
            Conectar
          </Button>
        )}
      </div>

      {isConnected && account.token_expires_at && !isExpired && (
        <p className="text-[10px] text-muted-foreground mt-2">
          Token expira em: {new Date(account.token_expires_at).toLocaleDateString('pt-BR')}
        </p>
      )}
    </div>
  );
}
