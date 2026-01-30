import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { LeadCSVRow, ParsedLead, ImportResult, ImportError } from '@/types/leads';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseCSV(text: string): LeadCSVRow[] {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows: LeadCSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.replace(/^"|"$/g, '') || '';
    });
    rows.push(row as unknown as LeadCSVRow);
  }

  return rows;
}

function validateLead(lead: LeadCSVRow, rowIndex: number): ParsedLead {
  if (!lead.Nome?.trim()) {
    return { row: rowIndex, data: lead, isValid: false, error: 'Nome é obrigatório' };
  }
  if (!lead.email?.trim()) {
    return { row: rowIndex, data: lead, isValid: false, error: 'Email é obrigatório' };
  }
  if (!EMAIL_REGEX.test(lead.email.trim())) {
    return { row: rowIndex, data: lead, isValid: false, error: 'Email inválido' };
  }
  if (!lead.relatorio?.trim()) {
    return { row: rowIndex, data: lead, isValid: false, error: 'Relatório é obrigatório' };
  }
  return { row: rowIndex, data: lead, isValid: true };
}

export function useLeadImport() {
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [parsedLeads, setParsedLeads] = useState<ParsedLead[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const parseFile = async (file: File): Promise<ParsedLead[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const rows = parseCSV(text);
          const validated = rows.map((row, index) => validateLead(row, index + 2));
          setParsedLeads(validated);
          resolve(validated);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsText(file, 'UTF-8');
    });
  };

  const importLeads = async (leads: ParsedLead[]): Promise<ImportResult> => {
    setIsImporting(true);
    const errors: ImportError[] = [];
    let newUsersCreated = 0;
    let reportsLinkedToExisting = 0;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: 'Erro', description: 'Usuário não autenticado', variant: 'destructive' });
      setIsImporting(false);
      return { totalRows: leads.length, newUsersCreated: 0, reportsLinkedToExisting: 0, errors: [{ row: 0, message: 'Não autenticado' }] };
    }

    const batchId = crypto.randomUUID();

    for (const lead of leads.filter(l => l.isValid)) {
      try {
        const email = lead.data.email.trim().toLowerCase();

        // Check if user exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .maybeSingle();

        let userId: string;

        if (existingProfile) {
          userId = existingProfile.id;
          reportsLinkedToExisting++;
        } else {
          // Create new user via edge function (uses service role)
          const { data: newUser, error: createError } = await supabase.functions.invoke('create-lead-user', {
            body: { 
              email, 
              full_name: lead.data.Nome.trim(),
              phone: lead.data.telefone?.trim()
            }
          });

          if (createError || !newUser?.user_id) {
            errors.push({ row: lead.row, email, message: createError?.message || 'Erro ao criar usuário' });
            continue;
          }
          userId = newUser.user_id;
          newUsersCreated++;
        }

        // Insert career evaluation
        const { error: evalError } = await supabase
          .from('career_evaluations')
          .insert({
            user_id: userId,
            name: lead.data.Nome.trim(),
            email,
            phone: lead.data.telefone?.trim() || null,
            area: lead.data.Area?.trim() || null,
            atuacao: lead.data.Atuação?.trim() || null,
            trabalha_internacional: lead.data['trabalha internacional']?.toLowerCase() === 'sim',
            experiencia: lead.data.experiencia?.trim() || null,
            english_level: lead.data.Englishlevel?.trim() || null,
            objetivo: lead.data.objetivo?.trim() || null,
            visa_status: lead.data.VisaStatus?.trim() || null,
            timeline: lead.data.timeline?.trim() || null,
            family_status: lead.data.FamilyStatus?.trim() || null,
            income_range: lead.data.incomerange?.trim() || null,
            investment_range: lead.data['investment range']?.trim() || null,
            impediment: lead.data.impediment?.trim() || null,
            impediment_other: lead.data.impedmentother?.trim() || null,
            main_concern: lead.data['main concern']?.trim() || null,
            report_content: lead.data.relatorio.trim(),
            imported_by: user.id,
            import_batch_id: batchId
          });

        if (evalError) {
          errors.push({ row: lead.row, email, message: evalError.message });
        }
      } catch (error: any) {
        errors.push({ row: lead.row, email: lead.data.email, message: error.message });
      }
    }

    // Add validation errors
    leads.filter(l => !l.isValid).forEach(lead => {
      errors.push({ row: lead.row, email: lead.data.email, message: lead.error || 'Erro de validação' });
    });

    const result: ImportResult = {
      totalRows: leads.length,
      newUsersCreated,
      reportsLinkedToExisting,
      errors: errors.sort((a, b) => a.row - b.row)
    };

    setImportResult(result);
    setIsImporting(false);

    if (errors.length === 0) {
      toast({ title: 'Sucesso', description: `${leads.length} leads importados com sucesso!` });
    } else if (errors.length < leads.length) {
      toast({ title: 'Importação parcial', description: `${leads.length - errors.length} importados, ${errors.length} erros`, variant: 'destructive' });
    } else {
      toast({ title: 'Erro', description: 'Nenhum lead foi importado', variant: 'destructive' });
    }

    return result;
  };

  const reset = () => {
    setParsedLeads([]);
    setImportResult(null);
  };

  return {
    parseFile,
    importLeads,
    reset,
    isImporting,
    parsedLeads,
    importResult
  };
}
