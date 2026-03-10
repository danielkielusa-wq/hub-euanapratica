import { useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  useUnsubscribes,
  useAddUnsubscribe,
  useRemoveUnsubscribe,
} from '@/hooks/useAdminEmailCampaigns';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UnsubscribesSheet({ open, onOpenChange }: Props) {
  const [newEmail, setNewEmail] = useState('');
  const { data: unsubscribes = [], isLoading } = useUnsubscribes();
  const addUnsubscribe = useAddUnsubscribe();
  const removeUnsubscribe = useRemoveUnsubscribe();

  const handleAdd = () => {
    if (!newEmail.trim()) return;
    addUnsubscribe.mutate(newEmail.trim());
    setNewEmail('');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Lista de Opt-out ({unsubscribes.length})</SheetTitle>
        </SheetHeader>

        <div className="flex gap-2 mt-4 mb-4">
          <Input
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="email@exemplo.com"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={!newEmail.trim() || addUnsubscribe.isPending}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Fonte</TableHead>
                <TableHead>Data</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unsubscribes.map((u) => (
                <TableRow key={u.email}>
                  <TableCell className="text-sm font-mono">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {u.source}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(u.unsubscribed_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUnsubscribe.mutate(u.email)}
                      disabled={removeUnsubscribe.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {unsubscribes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Nenhum email na lista de opt-out
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </SheetContent>
    </Sheet>
  );
}
