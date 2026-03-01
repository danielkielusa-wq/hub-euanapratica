import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useUpdateProfile, useAvatarUpload } from '@/hooks/useProfile';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { usePaymentHistory } from '@/hooks/usePaymentHistory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PhoneInput } from '@/components/ui/phone-input';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ImageCropDialog } from '@/components/profile/ImageCropDialog';
import {
  Loader2, UserCheck, Lock, Bookmark, Camera, Trash2, Eye, EyeOff,
  Check, X, AlertTriangle, CircleDot,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TIMEZONE_OPTIONS } from '@/lib/timezone';
import { supabase } from '@/integrations/supabase/client';

const roleLabels: Record<string, string> = {
  student: 'Aluno',
  mentor: 'Mentor',
  admin: 'Administrador',
  assistant: 'Assistente',
};

const statusLabels: Record<string, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  suspended: 'Suspenso',
};

const subscriptionStatusLabels: Record<string, string> = {
  active: 'Ativa',
  past_due: 'Pagamento pendente',
  grace_period: 'Período de carência',
  cancelled: 'Cancelada',
  inactive: 'Inativa',
};

const orderStatusLabels: Record<string, { label: string; color: string }> = {
  paid: { label: 'Pago', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  refunded: { label: 'Reembolsado', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
};

/* ────────────────────────────── helper ────────────────────────────── */

function PasswordCheck({ passed, label }: { passed: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      {passed ? <Check className="h-3.5 w-3.5 text-primary" /> : <X className="h-3.5 w-3.5 text-muted-foreground" />}
      <span className={passed ? 'text-primary' : 'text-muted-foreground'}>{label}</span>
    </div>
  );
}

/* ─────────────────────────── main component ──────────────────────── */

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile, isLoading: isProfileLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { uploadAvatar, deleteAvatar, isUploading, uploadProgress } = useAvatarUpload();
  const {
    planName, planAccess, subscriptionStatus, nextBillingDate,
    billingCycle, isPremiumPlan,
  } = usePlanAccess();
  const { data: orders, isLoading: isOrdersLoading } = usePaymentHistory(user?.id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── crop dialog state ── */
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [showCropDialog, setShowCropDialog] = useState(false);

  /* ── edit dialog state ── */
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    phone_country_code: '+55',
    is_whatsapp: false,
    timezone: 'America/Sao_Paulo',
  });

  /* ── change password state ── */
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  /* ── init edit form when profile loads ── */
  useEffect(() => {
    if (profile) {
      setEditForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        phone_country_code: profile.phone_country_code || '+55',
        is_whatsapp: profile.is_whatsapp || false,
        timezone: profile.timezone || 'America/Sao_Paulo',
      });
    }
  }, [profile]);

  /* ═══════════════════════ handlers ═══════════════════════ */

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) { toast.error('Tipo de arquivo não suportado. Use JPEG, PNG, WebP ou GIF.'); return; }
    if (file.size > maxSize) { toast.error('Arquivo muito grande. Máximo de 5MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => { setCropImageSrc(reader.result as string); setShowCropDialog(true); };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCropConfirm = async (croppedBlob: Blob) => {
    setShowCropDialog(false); setCropImageSrc(null);
    try { await uploadAvatar(croppedBlob); toast.success('Foto atualizada com sucesso!'); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Erro ao enviar foto'); }
  };

  const handleCropCancel = () => { setShowCropDialog(false); setCropImageSrc(null); };

  const handleDeleteAvatar = async () => {
    const ok = await deleteAvatar();
    if (ok) toast.success('Foto removida com sucesso!'); else toast.error('Erro ao remover foto');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile.mutateAsync({
        full_name: editForm.full_name,
        phone: editForm.phone || null,
        phone_country_code: editForm.phone_country_code,
        is_whatsapp: editForm.is_whatsapp,
        timezone: editForm.timezone,
      });
      toast.success('Perfil atualizado com sucesso!');
      setShowEditDialog(false);
    } catch { toast.error('Erro ao atualizar perfil'); }
  };

  /* password helpers */
  const passwordRules = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
  };
  const isPasswordValid = Object.values(passwordRules).every(Boolean);
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (!isPasswordValid) { setPasswordError('A nova senha não atende aos requisitos mínimos'); return; }
    if (!passwordsMatch) { setPasswordError('As senhas não correspondem'); return; }
    setIsChangingPassword(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: user?.email || '', password: currentPassword });
      if (signInError) { setPasswordError('Senha atual incorreta'); setIsChangingPassword(false); return; }
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) { setPasswordError(updateError.message.includes('same') ? 'A nova senha deve ser diferente da senha atual' : 'Erro ao atualizar a senha. Tente novamente.'); return; }
      toast.success('Senha alterada com sucesso!');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setPasswordError(null);
    } catch { setPasswordError('Erro inesperado. Tente novamente.'); }
    finally { setIsChangingPassword(false); }
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const getTimezoneLabel = (tz: string) => TIMEZONE_OPTIONS.find(t => t.value === tz)?.label || tz;

  /* ═══════════════════════ loading ═══════════════════════ */

  if (isProfileLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  const priceMonthly = planAccess?.priceMonthly || 0;
  const userStatus = profile?.status || 'active';

  /* ═══════════════════════ RENDER ═══════════════════════ */

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ═══════════ LEFT SIDEBAR ═══════════ */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6 order-1 lg:order-none">

          {/* ── User Card ── */}
          <Card className="bg-white dark:bg-card border">
            <CardContent className="pt-12 pb-6">
              {/* avatar + name */}
              <div className="flex flex-col items-center">
                <div className="relative group mb-4">
                  {profile?.profile_photo_url ? (
                    <img
                      src={profile.profile_photo_url}
                      alt={profile?.full_name || 'Avatar'}
                      className="h-[120px] w-[120px] rounded-md object-cover"
                    />
                  ) : (
                    <div className="h-[120px] w-[120px] rounded-md bg-primary/10 flex items-center justify-center">
                      <span className="text-3xl font-semibold text-primary">
                        {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={handleAvatarClick}
                    disabled={isUploading}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    {isUploading
                      ? <Loader2 className="h-6 w-6 text-white animate-spin" />
                      : <Camera className="h-6 w-6 text-white" />}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileChange} className="hidden" />
                </div>

                {isUploading && uploadProgress > 0 && <Progress value={uploadProgress} className="h-1.5 w-32 mb-3" />}

                <div className="text-center">
                  <h5 className="text-lg font-semibold">{profile?.full_name || 'Usuário'}</h5>
                  <Badge variant="secondary" className="mt-1">
                    {user ? roleLabels[user.role] || user.role : 'Usuário'}
                  </Badge>
                </div>
              </div>

              {/* details */}
              <h5 className="text-sm font-semibold pb-4 border-b mt-6 mb-4">Detalhes</h5>

              <ul className="list-none space-y-2 text-sm mb-6">
                <li>
                  <span className="font-semibold">E-mail:</span>{' '}
                  <span className="text-muted-foreground">{profile?.email || '-'}</span>
                </li>
                <li>
                  <span className="font-semibold">Status:</span>{' '}
                  <span className="text-muted-foreground">{statusLabels[userStatus] || 'Ativo'}</span>
                </li>
                <li>
                  <span className="font-semibold">Perfil:</span>{' '}
                  <span className="text-muted-foreground">{user ? roleLabels[user.role] || user.role : '-'}</span>
                </li>
                <li>
                  <span className="font-semibold">Contato:</span>{' '}
                  <span className="text-muted-foreground">
                    {profile?.phone
                      ? `${profile.phone_country_code || '+55'} ${profile.phone}${profile.is_whatsapp ? ' (WhatsApp)' : ''}`
                      : '-'}
                  </span>
                </li>
                <li>
                  <span className="font-semibold">Fuso Horário:</span>{' '}
                  <span className="text-muted-foreground">{getTimezoneLabel(profile?.timezone || 'America/Sao_Paulo')}</span>
                </li>
                <li>
                  <span className="font-semibold">Membro desde:</span>{' '}
                  <span className="text-muted-foreground">
                    {profile?.created_at ? format(new Date(profile.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : '-'}
                  </span>
                </li>
              </ul>

              {/* action buttons */}
              <div className="flex justify-center gap-3 mt-6">
                <Button onClick={() => setShowEditDialog(true)}>Editar</Button>
                {profile?.profile_photo_url && (
                  <Button
                    variant="outline"
                    onClick={handleDeleteAvatar}
                    disabled={isUploading}
                    className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Remover foto
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ── Plan Card ── */}
          <Card className="border-2 border-primary shadow-[0_2px_10px_hsl(var(--primary)/0.2)]">
            <CardContent className="pt-6 pb-6">
              <div className="flex justify-between items-start">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-0">{planName}</Badge>
                {priceMonthly > 0 && (
                  <div className="flex items-baseline">
                    <span className="text-sm text-primary font-medium">R$</span>
                    <span className="text-3xl font-bold text-primary mx-0.5">{priceMonthly}</span>
                    <span className="text-sm text-muted-foreground">/mês</span>
                  </div>
                )}
              </div>

              <ul className="space-y-2 my-5 text-sm">
                <li className="flex items-center gap-2">
                  <CircleDot className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />
                  <span>Status: {subscriptionStatusLabels[subscriptionStatus] || 'Inativa'}</span>
                </li>
                {billingCycle && (
                  <li className="flex items-center gap-2">
                    <CircleDot className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />
                    <span>Ciclo: {billingCycle === 'annual' ? 'Anual' : 'Mensal'}</span>
                  </li>
                )}
                {nextBillingDate && (
                  <li className="flex items-center gap-2">
                    <CircleDot className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />
                    <span>Próxima cobrança: {format(new Date(nextBillingDate), 'dd/MM/yyyy')}</span>
                  </li>
                )}
                {planAccess && (
                  <li className="flex items-center gap-2">
                    <CircleDot className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />
                    <span>Análises: {planAccess.usedThisMonth} de {planAccess.monthlyLimit}/mês</span>
                  </li>
                )}
              </ul>

              {planAccess && (
                <div className="space-y-1.5 mb-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Uso mensal</span>
                    <span>{planAccess.usedThisMonth} de {planAccess.monthlyLimit}</span>
                  </div>
                  <Progress value={planAccess.monthlyLimit > 0 ? (planAccess.usedThisMonth / planAccess.monthlyLimit) * 100 : 0} className="h-1.5" />
                  <p className="text-xs text-muted-foreground">
                    {planAccess.remaining} análise{planAccess.remaining !== 1 ? 's' : ''} restante{planAccess.remaining !== 1 ? 's' : ''}
                  </p>
                </div>
              )}

              {!isPremiumPlan && (
                <Button className="w-full mt-4" onClick={() => navigate('/assinar')}>Fazer Upgrade</Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ═══════════ RIGHT CONTENT — TABS ═══════════ */}
        <div className="lg:col-span-7 xl:col-span-8 order-0 lg:order-none">
          <Tabs defaultValue="account" className="w-full">

            {/* nav-pills (Vuexy style) */}
            <TabsList className="inline-flex flex-wrap gap-2 bg-transparent h-auto p-0 mb-6 rounded-none">
              <TabsTrigger
                value="account"
                className="rounded-md px-5 py-2.5 text-sm font-medium shadow-none border-0
                  data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground
                  data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                <UserCheck className="h-4 w-4 mr-1.5" />Conta
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="rounded-md px-5 py-2.5 text-sm font-medium shadow-none border-0
                  data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground
                  data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                <Lock className="h-4 w-4 mr-1.5" />Segurança
              </TabsTrigger>
              <TabsTrigger
                value="billing"
                className="rounded-md px-5 py-2.5 text-sm font-medium shadow-none border-0
                  data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground
                  data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                <Bookmark className="h-4 w-4 mr-1.5" />Planos e Cobrança
              </TabsTrigger>
            </TabsList>

            {/* ── CONTA tab ── */}
            <TabsContent value="account" className="space-y-6 mt-0">
              <Card className="bg-white dark:bg-card border">
                <CardHeader>
                  <CardTitle className="text-base">Histórico de Pagamentos</CardTitle>
                </CardHeader>
                <CardContent>
                  {isOrdersLoading ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                  ) : !orders || orders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">Nenhum pagamento registrado.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[100px]">Data</TableHead>
                            <TableHead>Produto</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell className="text-sm">{format(new Date(order.created_at), 'dd/MM/yyyy')}</TableCell>
                              <TableCell className="text-sm font-medium">{order.product_name || order.service?.name || order.plan?.name || '-'}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {order.product_type === 'subscription_initial' ? 'Assinatura' : order.product_type === 'subscription_renewal' ? 'Renovação' : 'Serviço'}
                              </TableCell>
                              <TableCell className="text-sm text-right font-medium">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: order.currency || 'BRL' }).format(order.amount)}
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${orderStatusLabels[order.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                                  {orderStatusLabels[order.status]?.label || order.status}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── SEGURANÇA tab ── */}
            <TabsContent value="security" className="space-y-6 mt-0">
              <Card className="bg-white dark:bg-card border">
                <CardHeader><CardTitle className="text-base">Alterar Senha</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordSubmit}>
                    {/* warning alert */}
                    <div className="flex items-start gap-3 p-3 mb-5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h6 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-0.5">Certifique-se de que estes requisitos sejam atendidos</h6>
                        <span className="text-xs text-amber-700 dark:text-amber-400">Mínimo de 8 caracteres, letra maiúscula, número e símbolo</span>
                      </div>
                    </div>

                    {passwordError && (
                      <div className="p-3 mb-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-sm text-destructive">{passwordError}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="current-pw">Senha Atual</Label>
                        <div className="relative">
                          <Input id="current-pw" type={showCurrentPassword ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} disabled={isChangingPassword} placeholder="Digite sua senha atual" autoComplete="current-password" />
                          <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-pw">Nova Senha</Label>
                        <div className="relative">
                          <Input id="new-pw" type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={isChangingPassword} placeholder="Nova senha" autoComplete="new-password" />
                          <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-pw">Confirmar Nova Senha</Label>
                        <Input id="confirm-pw" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isChangingPassword} placeholder="Confirme a nova senha" autoComplete="new-password" />
                      </div>
                    </div>

                    {newPassword && (
                      <div className="grid grid-cols-2 gap-1.5 mb-4 p-3 bg-muted/50 rounded-lg">
                        <PasswordCheck passed={passwordRules.length} label="Mínimo 8 caracteres" />
                        <PasswordCheck passed={passwordRules.uppercase} label="Letra maiúscula" />
                        <PasswordCheck passed={passwordRules.number} label="Um número" />
                        <PasswordCheck passed={passwordRules.special} label="Caractere especial" />
                      </div>
                    )}

                    <Button type="submit" disabled={isChangingPassword || !currentPassword || !isPasswordValid || !passwordsMatch}>
                      {isChangingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Alterar Senha
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── PLANOS E COBRANÇA tab ── */}
            <TabsContent value="billing" className="space-y-6 mt-0">
              <Card className="bg-white dark:bg-card border">
                <CardHeader><CardTitle className="text-base">Plano Atual</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h6 className="font-semibold mb-1">Seu plano atual é {planName}</h6>
                        <p className="text-sm text-muted-foreground">{isPremiumPlan ? 'Acesso completo a todas as funcionalidades' : 'Acesso básico à plataforma'}</p>
                      </div>
                      {subscriptionStatus === 'active' && nextBillingDate && (
                        <div>
                          <h6 className="font-semibold mb-1">Ativo até {format(new Date(nextBillingDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</h6>
                          <p className="text-sm text-muted-foreground">Enviaremos uma notificação antes da renovação</p>
                        </div>
                      )}
                      {priceMonthly > 0 && (
                        <div>
                          <h6 className="font-semibold mb-1">
                            <span className="mr-1.5">R${billingCycle === 'annual' ? (planAccess?.priceAnnual || priceMonthly * 12) : priceMonthly} por {billingCycle === 'annual' ? 'ano' : 'mês'}</span>
                            {isPremiumPlan && <Badge variant="secondary" className="bg-primary/10 text-primary border-0 text-xs">{planName}</Badge>}
                          </h6>
                          <p className="text-sm text-muted-foreground mb-0">{billingCycle === 'annual' ? 'Plano anual com desconto' : 'Plano mensal padrão'}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {(subscriptionStatus === 'past_due' || subscriptionStatus === 'grace_period') && (
                        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                          <h6 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">Atenção necessária!</h6>
                          <span className="text-xs text-amber-700 dark:text-amber-400">Seu pagamento está pendente. Atualize seus dados de pagamento.</span>
                        </div>
                      )}
                      {planAccess && (
                        <div>
                          <div className="flex justify-between text-sm mb-1.5">
                            <span className="font-medium">Uso mensal</span>
                            <span className="font-medium">{planAccess.usedThisMonth} de {planAccess.monthlyLimit}</span>
                          </div>
                          <Progress value={planAccess.monthlyLimit > 0 ? (planAccess.usedThisMonth / planAccess.monthlyLimit) * 100 : 0} className="h-2.5" />
                          <p className="text-xs text-muted-foreground mt-1">{planAccess.remaining} análise{planAccess.remaining !== 1 ? 's' : ''} restante{planAccess.remaining !== 1 ? 's' : ''}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t">
                    {!isPremiumPlan && <Button onClick={() => navigate('/assinar')}>Fazer Upgrade</Button>}
                    {isPremiumPlan && subscriptionStatus === 'active' && <Button variant="outline" onClick={() => navigate('/assinar')}>Alterar Plano</Button>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* ═══════════ EDIT USER DIALOG ═══════════ */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-center">Editar Informações</DialogTitle>
            <DialogDescription className="text-center">Atualize seus dados pessoais e de contato</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit-name">Nome Completo</Label>
                <Input id="edit-name" value={editForm.full_name} onChange={(e) => setEditForm(p => ({ ...p, full_name: e.target.value }))} placeholder="Seu nome completo" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit-email">E-mail</Label>
                <Input id="edit-email" value={profile?.email || ''} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado</p>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Telefone</Label>
                <PhoneInput
                  value={editForm.phone}
                  countryCode={editForm.phone_country_code}
                  isWhatsApp={editForm.is_whatsapp}
                  onValueChange={(phone) => setEditForm(p => ({ ...p, phone }))}
                  onCountryCodeChange={(code) => setEditForm(p => ({ ...p, phone_country_code: code }))}
                  onWhatsAppChange={(isWhatsApp) => setEditForm(p => ({ ...p, is_whatsapp: isWhatsApp }))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit-tz">Fuso Horário</Label>
                <Select value={editForm.timezone} onValueChange={(v) => setEditForm(p => ({ ...p, timezone: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione o fuso horário" /></SelectTrigger>
                  <SelectContent>
                    {TIMEZONE_OPTIONS.map((tz) => <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)} disabled={updateProfile.isPending}>Cancelar</Button>
              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══════════ IMAGE CROP DIALOG ═══════════ */}
      <ImageCropDialog open={showCropDialog} imageSrc={cropImageSrc} onConfirm={handleCropConfirm} onCancel={handleCropCancel} />
    </DashboardLayout>
  );
}
