import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAdminSubscriptions } from '@/hooks/useAdminSubscriptions';
import { 
  PlanBadge, 
  UsageProgressBar, 
  UserDetailDrawer 
} from '@/components/admin/subscriptions';
import { 
  Loader2, 
  RotateCcw, 
  Users, 
  Crown, 
  Zap, 
  BarChart4,
  Search,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserWithUsage {
  user_id: string;
  full_name: string;
  email: string;
  profile_photo_url: string | null;
  plan_id: string;
  plan_name: string;
  monthly_limit: number;
  used_this_month: number;
  last_usage_at: string | null;
}

export default function AdminSubscriptions() {
  const { 
    users, 
    isLoading, 
    error, 
    fetchUsers, 
    fetchPlans, 
    resetUsage 
  } = useAdminSubscriptions();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithUsage | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchPlans();
  }, [fetchUsers, fetchPlans]);

  const handleResetUsage = async (userId: string): Promise<boolean> => {
    setIsResetting(true);
    const success = await resetUsage(userId);
    setIsResetting(false);
    if (success && selectedUser) {
      setSelectedUser({ ...selectedUser, used_this_month: 0 });
    }
    return success;
  };

  const handleRowClick = (user: UserWithUsage) => {
    setSelectedUser(user);
    setDrawerOpen(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredUsers = users.filter(user => 
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate stats
  const totalUsers = users.length;
  const proUsers = users.filter(u => u.plan_id === 'pro').length;
  const vipUsers = users.filter(u => u.plan_id === 'vip').length;
  const totalUsageThisMonth = users.reduce((sum, u) => sum + u.used_this_month, 0);

  const statCards = [
    { icon: Users, label: 'Total Usuários', value: totalUsers, trend: '+12%', color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: Zap, label: 'Plano Pro', value: proUsers, trend: '+5%', color: 'text-purple-600', bg: 'bg-purple-50' },
    { icon: Crown, label: 'Plano VIP', value: vipUsers, trend: '+2%', color: 'text-amber-600', bg: 'bg-amber-50' },
    { icon: BarChart4, label: 'Análises (mês)', value: totalUsageThisMonth, trend: '+18%', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#F5F5F7] p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Gestão de Usuários</h1>
              <p className="text-slate-500">
                Controle o consumo e as permissões de cada conta
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar usuário..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64 bg-white border-slate-200 rounded-xl"
                />
              </div>
              <Button 
                onClick={fetchUsers} 
                disabled={isLoading} 
                variant="outline"
                className="bg-white rounded-xl"
              >
                <RotateCcw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat) => (
              <Card key={stat.label} className="bg-white border-0 shadow-sm rounded-[24px]">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                      {stat.trend}
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Users Table */}
          <Card className="bg-white border-0 shadow-sm rounded-[24px] overflow-hidden">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : error ? (
                <div className="text-center py-16 text-red-500">{error}</div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                  {searchQuery ? 'Nenhum usuário encontrado.' : 'Nenhum usuário cadastrado.'}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-100 hover:bg-transparent">
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide py-4 pl-6">
                        Usuário
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide py-4">
                        Plano
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide py-4">
                        Consumo: Currículo USA
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide py-4">
                        Consumo: Jobs
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide py-4">
                        Última Atividade
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide py-4 pr-6 text-right">
                        
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow 
                        key={user.user_id}
                        onClick={() => handleRowClick(user)}
                        className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer transition-colors"
                      >
                        <TableCell className="py-4 pl-6">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.profile_photo_url || undefined} />
                              <AvatarFallback className="text-sm bg-blue-600 text-white font-medium">
                                {getInitials(user.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-slate-900">{user.full_name}</p>
                              <p className="text-sm text-slate-500">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <PlanBadge planId={user.plan_id} planName={user.plan_name} />
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="w-32 space-y-1.5">
                            <div className="flex items-baseline justify-between text-sm">
                              <span className="font-medium text-slate-900">{user.used_this_month}</span>
                              <span className="text-slate-400">
                                /{user.monthly_limit === 999 ? '∞' : user.monthly_limit}
                              </span>
                            </div>
                            <UsageProgressBar 
                              used={user.used_this_month} 
                              limit={user.monthly_limit}
                              variant="curriculo"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="w-32 space-y-1.5">
                            <div className="flex items-baseline justify-between text-sm">
                              <span className="font-medium text-slate-900">0</span>
                              <span className="text-slate-400">/0</span>
                            </div>
                            <UsageProgressBar 
                              used={0} 
                              limit={0}
                              variant="jobs"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="text-sm text-slate-500">
                            {user.last_usage_at 
                              ? format(new Date(user.last_usage_at), "dd/MM HH:mm", { locale: ptBR })
                              : '—'
                            }
                          </span>
                        </TableCell>
                        <TableCell className="py-4 pr-6 text-right">
                          <ChevronRight className="w-5 h-5 text-slate-400 inline-block" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* User Detail Drawer */}
      <UserDetailDrawer
        user={selectedUser}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onResetUsage={handleResetUsage}
        isResetting={isResetting}
      />
    </DashboardLayout>
  );
}
