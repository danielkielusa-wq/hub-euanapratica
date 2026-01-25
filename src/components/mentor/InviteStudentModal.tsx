import { useState, useEffect } from 'react';
import { Search, UserPlus, Mail, User, Loader2, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  useSearchProfiles, 
  useInviteStudent, 
  useEnrollExistingStudent 
} from '@/hooks/useEspacoInvitations';
import { cn } from '@/lib/utils';

interface InviteStudentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  espacoId: string;
  espacoName: string;
}

export function InviteStudentModal({ 
  open, 
  onOpenChange, 
  espacoId, 
  espacoName 
}: InviteStudentModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [enrolledUserId, setEnrolledUserId] = useState<string | null>(null);

  const { data: searchResults, isLoading: isSearching } = useSearchProfiles(searchTerm);
  const inviteStudent = useInviteStudent();
  const enrollExistingStudent = useEnrollExistingStudent();

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setSearchTerm('');
      setNewUserEmail('');
      setNewUserName('');
      setEnrolledUserId(null);
    }
  }, [open]);

  const handleEnrollExisting = async (userId: string) => {
    try {
      await enrollExistingStudent.mutateAsync({ espacoId, userId });
      setEnrolledUserId(userId);
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleInviteNew = async () => {
    if (!newUserEmail) return;

    try {
      await inviteStudent.mutateAsync({
        espaco_id: espacoId,
        email: newUserEmail,
        invited_name: newUserName || undefined,
      });
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUserEmail);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Convidar Aluno
          </DialogTitle>
          <DialogDescription>
            Adicione um aluno ao espaço <span className="font-medium text-foreground">{espacoName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Search existing users */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Search className="h-4 w-4" />
              Buscar usuário existente
            </Label>
            <div className="relative">
              <Input
                placeholder="Digite email ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Search results */}
            {searchResults && searchResults.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {searchResults.map((profile) => (
                  <div
                    key={profile.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border bg-muted/30 transition-all",
                      enrolledUserId === profile.id && "border-primary bg-primary/10"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={profile.profile_photo_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {profile.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{profile.full_name}</p>
                        <p className="text-xs text-muted-foreground">{profile.email}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={enrolledUserId === profile.id ? "default" : "outline"}
                      onClick={() => handleEnrollExisting(profile.id)}
                      disabled={enrollExistingStudent.isPending || enrolledUserId === profile.id}
                      className="rounded-lg"
                    >
                      {enrolledUserId === profile.id ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Adicionado
                        </>
                      ) : enrollExistingStudent.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Adicionar'
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {searchTerm.length >= 2 && searchResults?.length === 0 && !isSearching && (
              <p className="text-sm text-muted-foreground text-center py-2">
                Nenhum usuário encontrado
              </p>
            )}
          </div>

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
              ou
            </span>
          </div>

          {/* Invite new user */}
          <div className="space-y-4">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Convidar novo usuário
            </Label>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="invite-name" className="text-xs text-muted-foreground">
                  Nome (opcional)
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="invite-name"
                    placeholder="Nome do aluno"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invite-email" className="text-xs text-muted-foreground">
                  Email *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleInviteNew}
              disabled={!isEmailValid || inviteStudent.isPending}
              className="w-full rounded-xl"
              variant="gradient"
            >
              {inviteStudent.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Convite
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
