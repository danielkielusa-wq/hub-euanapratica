import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { LeadCSVRow, ParsedLead, ImportResult, ImportError } from '@/types/leads';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseCSV(text: string): LeadCSVRow[] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  
  // Normaliza quebras de linha
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    const nextChar = normalized[i + 1];
    
    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Aspas escapadas
          currentField += '"';
          i++;
        } else {
          // Fim do campo entre aspas
          inQuotes = false;
        }
      } else {
        // Incluir qualquer caractere (inclusive \n) dentro de aspas
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.length > 0) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }
  
  // Última linha
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }
  
  // Primeira linha são os headers
  if (rows.length < 2) return [];
  
  const headers = rows[0].map(h => h.replace(/^\uFEFF/, '')); // Remove BOM
  const result: LeadCSVRow[] = [];
  
  for (let i = 1; i < rows.length; i++) {
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = rows[i][index] || '';
    });
    result.push(row as unknown as LeadCSVRow);
  }
  
  return result;
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
    const processedEvaluationIds: string[] = [];

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
            let errorMessage = createError?.message || 'Erro ao criar usuário';

            const contextBody = createError?.context?.body;
            if (contextBody) {
              try {
                const parsed = JSON.parse(contextBody);
                if (parsed?.error) {
                  errorMessage = parsed.error;
                }
              } catch {
                // Ignore JSON parse errors and keep default message
              }
            }

            errors.push({ row: lead.row, email, message: errorMessage });
            continue;
          }

          userId = newUser.user_id;
          if (newUser.existing) {
            reportsLinkedToExisting++;
          } else {
            newUsersCreated++;
          }
        }

        const evaluationPayload = {
          user_id: userId,
          name: lead.data.Nome.trim(),
          email,
          phone: lead.data.telefone?.trim() || null,
          area: lead.data.Area?.trim() || null,
          atuacao: lead.data['Atuação']?.trim() || null,
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
          formatted_report: null,
          formatted_at: null,
          processing_status: 'pending' as const,
          processing_error: null,
          processing_started_at: null,
          imported_by: user.id,
          import_batch_id: batchId
        };

        // Upsert by email: keep a single report per email
        const { data: existingEvaluation, error: existingEvalError } = await supabase
          .from('career_evaluations')
          .select('id')
          .eq('email', email)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingEvalError) {
          errors.push({ row: lead.row, email, message: existingEvalError.message });
          continue;
        }

        if (existingEvaluation) {
          const { error: evalError } = await supabase
            .from('career_evaluations')
            .update(evaluationPayload)
            .eq('id', existingEvaluation.id);

          if (evalError) {
            errors.push({ row: lead.row, email, message: evalError.message });
          } else {
            processedEvaluationIds.push(existingEvaluation.id);
          }
        } else {
          const { data: insertedData, error: evalError } = await supabase
            .from('career_evaluations')
            .insert(evaluationPayload)
            .select('id')
            .single();

          if (evalError) {
            errors.push({ row: lead.row, email, message: evalError.message });
          } else if (insertedData) {
            processedEvaluationIds.push(insertedData.id);
          }
        }
      } catch (error: any) {
        errors.push({ row: lead.row, email: lead.data.email, message: error.message });
      }
    }

    // Fire-and-forget: trigger report pre-processing for updated evaluations
    // (New inserts are handled by the DB trigger; this covers updates/re-imports)
    processedEvaluationIds.forEach(id => {
      supabase.functions.invoke('format-lead-report', {
        body: { evaluationId: id }
      }).catch(() => {}); // Silent - DB trigger is the primary path
    });

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
