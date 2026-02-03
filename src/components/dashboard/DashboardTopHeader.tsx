import { Search, Mail, Bell } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import logoHorizontal from '@/assets/logo-horizontal.png';

const roleLabels = {
  student: 'Aluno',
  mentor: 'Mentor',
  admin: 'Administrador',
};

export function DashboardTopHeader() {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  if (!user) return null;

  const initials = user.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="hidden lg:flex h-16 items-center justify-between px-6 bg-background border-b border-border">
      {/* Left: Logo + Search */}
      <div className="flex items-center gap-6">
        <img
          src={logoHorizontal}
          alt="EUA na Prática"
          className="h-7 w-auto object-contain"
        />
        <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquise por cursos, mentores..."
          className="pl-10 bg-muted/50 border-none rounded-xl h-10"
        />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Mail className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
          {/* Notification dot */}
          <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">{user.full_name}</p>
            <p className="text-xs text-muted-foreground">{roleLabels[user.role]}</p>
          </div>
          <Avatar className="h-9 w-9">
            <AvatarImage src={profile?.profile_photo_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
