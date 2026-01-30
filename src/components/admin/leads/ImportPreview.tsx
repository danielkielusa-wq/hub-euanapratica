import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { ParsedLead } from '@/types/leads';

interface ImportPreviewProps {
  leads: ParsedLead[];
}

export function ImportPreview({ leads }: ImportPreviewProps) {
  const validCount = leads.filter(l => l.isValid).length;
  const invalidCount = leads.length - validCount;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Badge variant="outline" className="gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
          {validCount} válidos
        </Badge>
        {invalidCount > 0 && (
          <Badge variant="destructive" className="gap-1.5">
            <XCircle className="w-3.5 h-3.5" />
            {invalidCount} com erros
          </Badge>
        )}
      </div>

      <ScrollArea className="h-[400px] rounded-[16px] border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Linha</TableHead>
              <TableHead className="w-20">Status</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Área</TableHead>
              <TableHead>Inglês</TableHead>
              <TableHead className="w-[200px]">Erro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.row} className={!lead.isValid ? 'bg-destructive/5' : ''}>
                <TableCell className="font-mono text-sm">{lead.row}</TableCell>
                <TableCell>
                  {lead.isValid ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-destructive" />
                  )}
                </TableCell>
                <TableCell className="font-medium">{lead.data.Nome || '-'}</TableCell>
                <TableCell className="text-muted-foreground">{lead.data.email || '-'}</TableCell>
                <TableCell>{lead.data.Area || '-'}</TableCell>
                <TableCell>{lead.data.Englishlevel || '-'}</TableCell>
                <TableCell className="text-destructive text-sm">{lead.error || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
