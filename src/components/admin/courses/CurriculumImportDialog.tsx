import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileUp,
  Download,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Film,
  Eye,
  HelpCircle,
  FileText,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────

interface ParsedQuestion {
  question_text: string;
  question_type: 'multiple_choice' | 'true_false';
  options: string[];
  correct_answer: string;
  explanation: string | null;
}

interface ParsedLesson {
  title: string;
  description: string | null;
  content_html: string | null;
  is_free_preview: boolean;
  is_published: boolean;
  questions: ParsedQuestion[];
}

interface ParsedModule {
  title: string;
  description: string | null;
  is_published: boolean;
  lessons: ParsedLesson[];
}

interface ParseError {
  row: number;
  message: string;
}

type ImportState = 'idle' | 'preview' | 'importing' | 'done';

interface CurriculumImportDialogProps {
  espacoId: string;
  existingModuleCount: number;
}

// ─── Excel Parser ─────────────────────────────────────

function cellStr(row: unknown[], index: number): string {
  if (index < 0 || index >= row.length) return '';
  const v = row[index];
  if (v == null) return '';
  return String(v).trim();
}

function isTruthy(value: string): boolean {
  const v = value.toLowerCase().trim();
  return v === 'sim' || v === 's' || v === '1' || v === 'yes' || v === 'true';
}

/** Wrap plain text in <p> tags; leave existing HTML untouched. */
function wrapAsHtml(text: string): string {
  if (!text) return text;
  if (/<[a-z][\s\S]*>/i.test(text)) return text;
  return text
    .split(/\n+/)
    .filter((line) => line.trim())
    .map((line) => `<p>${line.trim()}</p>`)
    .join('');
}

/** Split quiz options — prefers | separator, falls back to ; */
function splitOptions(raw: string): string[] {
  if (raw.includes('|')) {
    return raw.split('|').map((o) => o.trim()).filter(Boolean);
  }
  if (raw.includes(';')) {
    return raw.split(';').map((o) => o.trim()).filter(Boolean);
  }
  return raw.trim() ? [raw.trim()] : [];
}

/** Normalize text for comparison: strip stray quotes, collapse whitespace. */
function normalizeForMatch(text: string): string {
  return text
    .replace(/"/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function parseExcelData(rows: unknown[][]): { modules: ParsedModule[]; errors: ParseError[] } {
  if (rows.length < 2) {
    return { modules: [], errors: [{ row: 1, message: 'Arquivo vazio ou sem dados após o cabeçalho' }] };
  }

  // Normalize headers
  const headers = (rows[0] as string[]).map((h) =>
    String(h || '').replace(/^\uFEFF/, '').trim().toLowerCase()
  );

  // Required columns
  const colModule = headers.findIndex((h) => h.includes('módulo') || h.includes('modulo') || h === 'module');
  const colLesson = headers.findIndex((h) => h.includes('aula') || h === 'lesson');

  // Optional columns
  const colDesc = headers.findIndex((h) => h.includes('descrição') || h.includes('descricao') || h === 'description');
  const colPreview = headers.findIndex((h) => h.includes('preview') || h.includes('gratuita') || h === 'free');
  const colPublished = headers.findIndex((h) => h.includes('publicada') || h.includes('published'));
  const colContent = headers.findIndex((h) => h.includes('conteúdo') || h.includes('conteudo') || h === 'content' || h === 'notas' || h === 'notes');

  // Quiz columns
  const colQuestion = headers.findIndex((h) => h.includes('pergunta') || h === 'question');
  const colQType = headers.findIndex((h) => h.includes('tipo') || h === 'type');
  const colOptions = headers.findIndex((h) => h.includes('opções') || h.includes('opcoes') || h === 'options');
  const colAnswer = headers.findIndex((h) => h.includes('resposta') || h === 'answer');
  const colExplanation = headers.findIndex((h) => h.includes('explicação') || h.includes('explicacao') || h === 'explanation');

  if (colModule === -1 || colLesson === -1) {
    return {
      modules: [],
      errors: [{
        row: 1,
        message: `Colunas obrigatórias não encontradas: "Módulo" e "Aula". Colunas detectadas: ${headers.join(', ')}`,
      }],
    };
  }

  const modules: ParsedModule[] = [];
  const errors: ParseError[] = [];
  let currentModule: ParsedModule | null = null;
  let currentLesson: ParsedLesson | null = null;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    const rowNum = i + 1; // 1-indexed for user display

    const moduleTitle = cellStr(row, colModule);
    const lessonTitle = cellStr(row, colLesson);
    const description = colDesc >= 0 ? cellStr(row, colDesc) || null : null;
    const isPreview = colPreview >= 0 ? isTruthy(cellStr(row, colPreview)) : false;
    const isPublished = colPublished >= 0 ? isTruthy(cellStr(row, colPublished)) : false;
    const rawContent = colContent >= 0 ? cellStr(row, colContent) || null : null;
    const contentHtml = rawContent ? wrapAsHtml(rawContent) : null;
    const questionText = colQuestion >= 0 ? cellStr(row, colQuestion) : '';

    if (moduleTitle) {
      // Module row
      currentModule = {
        title: moduleTitle,
        description: description || null,
        is_published: isPublished,
        lessons: [],
      };
      modules.push(currentModule);
      currentLesson = null;
    } else if (lessonTitle) {
      // Lesson row
      if (!currentModule) {
        errors.push({ row: rowNum, message: `Aula "${lessonTitle}" sem módulo pai` });
        continue;
      }
      currentLesson = {
        title: lessonTitle,
        description: description || null,
        content_html: contentHtml,
        is_free_preview: isPreview,
        is_published: isPublished,
        questions: [],
      };
      currentModule.lessons.push(currentLesson);
    } else if (questionText) {
      // Quiz question row
      if (!currentLesson) {
        errors.push({ row: rowNum, message: `Pergunta "${questionText.substring(0, 50)}..." sem aula pai` });
        continue;
      }

      const rawType = colQType >= 0 ? cellStr(row, colQType).toLowerCase() : '';
      const isTF = rawType.includes('true_false') || rawType.includes('verdadeiro') || rawType === 'vf' || rawType === 'tf';
      const questionType: 'multiple_choice' | 'true_false' = isTF ? 'true_false' : 'multiple_choice';

      const rawOptions = colOptions >= 0 ? cellStr(row, colOptions) : '';
      let options = splitOptions(rawOptions);

      // Default options for true/false
      if (questionType === 'true_false' && options.length === 0) {
        options = ['Verdadeiro', 'Falso'];
      }

      const correctAnswer = colAnswer >= 0 ? cellStr(row, colAnswer) : '';
      const explanation = colExplanation >= 0 ? cellStr(row, colExplanation) || null : null;

      if (options.length < 2) {
        errors.push({ row: rowNum, message: `Pergunta "${questionText.substring(0, 40)}..." precisa de pelo menos 2 opções (separar com |)` });
        continue;
      }

      // Clean stray quotes from options too
      options = options.map((o) => o.replace(/(?<=[a-záéíóúãõç])"(?=[,;.])/gi, '').replace(/\s+/g, ' ').trim());

      // Match answer to option: exact → normalized → prefix
      let matchedAnswer = correctAnswer;
      if (correctAnswer && !options.includes(correctAnswer)) {
        const normAnswer = normalizeForMatch(correctAnswer);
        // Try normalized match
        const normMatch = options.find((o) => normalizeForMatch(o) === normAnswer);
        if (normMatch) {
          matchedAnswer = normMatch;
        } else {
          // Try prefix match (answer is beginning of an option)
          const prefixMatch = options.find((o) => normalizeForMatch(o).startsWith(normAnswer) && normAnswer.length >= 20);
          if (prefixMatch) {
            matchedAnswer = prefixMatch;
          } else {
            errors.push({ row: rowNum, message: `Resposta "${correctAnswer.substring(0, 40)}" não está nas opções` });
            continue;
          }
        }
      }

      currentLesson.questions.push({
        question_text: questionText,
        question_type: questionType,
        options,
        correct_answer: matchedAnswer || options[0],
        explanation,
      });
    }
    // Skip empty rows
  }

  if (modules.length === 0 && errors.length === 0) {
    errors.push({ row: 1, message: 'Nenhum módulo encontrado no arquivo' });
  }

  return { modules, errors };
}

// ─── Template Download (Excel) ────────────────────────

function downloadTemplate() {
  const headerRow = [
    'Módulo', 'Aula', 'Descrição', 'Preview Gratuita', 'Publicada',
    'Conteúdo', 'Pergunta', 'Tipo', 'Opções', 'Resposta Correta', 'Explicação',
  ];
  const exampleRows = [
    ['Módulo 1: Introdução', '', 'Visão geral do curso', '', '', '', '', '', '', '', ''],
    ['', 'Aula 1: Bem-vindo', 'Apresentação do curso', 'Sim', 'Sim', 'Notas da aula aqui. Texto simples funciona.', '', '', '', '', ''],
    ['', 'Aula 2: Como funciona', 'Metodologia', 'Sim', 'Sim', '', '', '', '', '', ''],
    ['', '', '', '', '', '', 'O que é aprendizado ativo?', 'multiple_choice', 'Método passivo|Participação ativa|Leitura apenas|Decorar', 'Participação ativa', 'Aprendizado ativo envolve participação do aluno'],
    ['', '', '', '', '', '', 'Aprendizado ativo é mais eficaz?', 'true_false', '', 'Verdadeiro', 'Estudos comprovam maior retenção'],
    ['Módulo 2: Fundamentos', '', '', '', '', '', '', '', '', '', ''],
    ['', 'Aula 1: Conceitos básicos', 'Teoria fundamental', '', '', '', '', '', '', '', ''],
    ['', 'Aula 2: Exercício prático', '', '', '', 'Material de apoio da aula', '', '', '', '', ''],
  ];

  const data = [headerRow, ...exampleRows];
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Column widths for readability
  ws['!cols'] = [
    { wch: 30 }, // Módulo
    { wch: 30 }, // Aula
    { wch: 30 }, // Descrição
    { wch: 16 }, // Preview Gratuita
    { wch: 12 }, // Publicada
    { wch: 40 }, // Conteúdo
    { wch: 40 }, // Pergunta
    { wch: 16 }, // Tipo
    { wch: 50 }, // Opções
    { wch: 25 }, // Resposta Correta
    { wch: 40 }, // Explicação
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Estrutura do Curso');
  XLSX.writeFile(wb, 'template-curriculum.xlsx');
}

// ─── Component ────────────────────────────────────────

export function CurriculumImportDialog({ espacoId, existingModuleCount }: CurriculumImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ImportState>('idle');
  const [parsedModules, setParsedModules] = useState<ParsedModule[]>([]);
  const [parseErrors, setParseErrors] = useState<ParseError[]>([]);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResult, setImportResult] = useState({ modules: 0, lessons: 0, quizzes: 0 });
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const queryClient = useQueryClient();

  const reset = () => {
    setState('idle');
    setParsedModules([]);
    setParseErrors([]);
    setImportProgress({ current: 0, total: 0 });
    setImportResult({ modules: 0, lessons: 0, quizzes: 0 });
    setExpandedModules(new Set());
  };

  const toggleModule = (index: number) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const expandAll = () => setExpandedModules(new Set(parsedModules.map((_, i) => i)));
  const collapseAll = () => setExpandedModules(new Set());

  const handleFileSelect = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: unknown[][] = XLSX.utils.sheet_to_json(firstSheet, {
          header: 1,
          defval: '',
          blankrows: false,
        });
        const { modules, errors } = parseExcelData(rows);
        setParsedModules(modules);
        setParseErrors(errors);
        setState('preview');
        setExpandedModules(new Set());
      } catch (err) {
        setParseErrors([{ row: 0, message: 'Erro ao ler o arquivo. Verifique se é um arquivo Excel (.xlsx) válido.' }]);
        setParsedModules([]);
        setState('preview');
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) handleFileSelect(acceptedFiles[0]);
    },
    [handleFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    disabled: state !== 'idle',
  });

  const handleImport = async () => {
    setState('importing');
    setImportProgress({ current: 0, total: parsedModules.length });

    let totalModules = 0;
    let totalLessons = 0;
    let totalQuizzes = 0;

    try {
      for (let i = 0; i < parsedModules.length; i++) {
        const mod = parsedModules[i];
        setImportProgress({ current: i + 1, total: parsedModules.length });

        const { data: moduleRow, error: modError } = await supabase
          .from('course_modules')
          .insert({
            espaco_id: espacoId,
            title: mod.title,
            description: mod.description,
            display_order: existingModuleCount + i,
            is_published: mod.is_published,
          })
          .select('id')
          .single();

        if (modError) {
          toast.error(`Erro ao criar módulo "${mod.title}": ${modError.message}`);
          continue;
        }

        totalModules++;

        if (moduleRow && mod.lessons.length > 0) {
          const lessonPayloads = mod.lessons.map((l, j) => ({
            module_id: moduleRow.id,
            title: l.title,
            description: l.description,
            content_html: l.content_html,
            display_order: j,
            is_free_preview: l.is_free_preview,
            is_published: l.is_published,
          }));

          // Debug: log what we're inserting

          const { data: lessonRows, error: lessonsError } = await supabase
            .from('course_lessons')
            .insert(lessonPayloads)
            .select('id, title, description, content_html');

          if (lessonsError) {
            toast.error(`Erro ao criar aulas do módulo "${mod.title}"`);
            continue;
          }

          // Debug: log what came back from DB

          totalLessons += lessonRows?.length || 0;

          if (lessonRows) {
            for (let j = 0; j < mod.lessons.length; j++) {
              const lesson = mod.lessons[j];
              const lessonRow = lessonRows[j];

              if (lesson.questions.length > 0 && lessonRow) {
                const { data: quizRow, error: quizError } = await supabase
                  .from('course_quizzes')
                  .insert({
                    lesson_id: lessonRow.id,
                    title: `Quiz: ${lesson.title}`,
                    passing_grade: 70,
                    is_required: false,
                    max_attempts: 3,
                  })
                  .select('id')
                  .single();

                if (quizError) {
                  continue;
                }

                if (quizRow) {
                  const { error: questionsError } = await supabase
                    .from('course_quiz_questions')
                    .insert(
                      lesson.questions.map((q, qi) => ({
                        quiz_id: quizRow.id,
                        question_text: q.question_text,
                        question_type: q.question_type,
                        options: q.options,
                        correct_answer: q.correct_answer,
                        explanation: q.explanation,
                        display_order: qi,
                      }))
                    );

                  if (questionsError) {
                  } else {
                    totalQuizzes++;
                  }
                }
              }
            }
          }
        }
      }

      setImportResult({ modules: totalModules, lessons: totalLessons, quizzes: totalQuizzes });
      setState('done');
      queryClient.invalidateQueries({ queryKey: ['admin-course', espacoId] });
      toast.success(`Importação concluída: ${totalModules} módulos, ${totalLessons} aulas, ${totalQuizzes} quizzes`);
    } catch (err) {
      toast.error('Erro inesperado durante a importação');
      setState('preview');
    }
  };

  const totalLessons = parsedModules.reduce((sum, m) => sum + m.lessons.length, 0);
  const totalQuestions = parsedModules.reduce(
    (sum, m) => sum + m.lessons.reduce((ls, l) => ls + l.questions.length, 0),
    0
  );
  const lessonsWithContent = parsedModules.reduce(
    (sum, m) => sum + m.lessons.filter((l) => l.content_html).length,
    0
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-xl border-dashed h-12 gap-2">
          <FileUp className="h-4 w-4" />
          Importar Planilha
        </Button>
      </DialogTrigger>

      <DialogContent className={cn("sm:max-w-lg", state === 'preview' && "sm:max-w-2xl")}>
        <DialogHeader>
          <DialogTitle>Importar Estrutura do Curso</DialogTitle>
        </DialogHeader>

        {/* ── IDLE: Upload zone ── */}
        {state === 'idle' && (
          <div className="space-y-4">
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all',
                'hover:border-primary/50 hover:bg-primary/5',
                isDragActive && 'border-primary bg-primary/10'
              )}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-3">
                <Upload className="h-10 w-10 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {isDragActive ? 'Solte o arquivo aqui' : 'Arraste o arquivo Excel ou clique para selecionar'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Aceita .xlsx e .xls (Excel, Google Sheets, LibreOffice)
                  </p>
                </div>
              </div>
            </div>

            <Button variant="outline" size="sm" className="w-full gap-2" onClick={downloadTemplate}>
              <Download className="h-4 w-4" />
              Baixar template Excel
            </Button>
          </div>
        )}

        {/* ── PREVIEW: Parsed structure ── */}
        {state === 'preview' && (
          <div className="space-y-4">
            {/* Errors */}
            {parseErrors.length > 0 && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 space-y-1">
                {parseErrors.slice(0, 5).map((err, i) => (
                  <p key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                    <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                    <span>Linha {err.row}: {err.message}</span>
                  </p>
                ))}
                {parseErrors.length > 5 && (
                  <p className="text-xs text-red-500 ml-4.5">
                    +{parseErrors.length - 5} erros adicionais
                  </p>
                )}
              </div>
            )}

            {parsedModules.length > 0 && (
              <>
                {/* Summary grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/10 px-3 py-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-lg font-bold leading-none">{parsedModules.length}</p>
                      <p className="text-[10px] text-muted-foreground">módulos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
                    <Film className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-lg font-bold leading-none">{totalLessons}</p>
                      <p className="text-[10px] text-muted-foreground">aulas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-purple-50 border border-purple-100 px-3 py-2">
                    <HelpCircle className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="text-lg font-bold leading-none">{totalQuestions}</p>
                      <p className="text-[10px] text-muted-foreground">perguntas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-orange-50 border border-orange-100 px-3 py-2">
                    <FileText className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="text-lg font-bold leading-none">{lessonsWithContent}</p>
                      <p className="text-[10px] text-muted-foreground">com conteúdo</p>
                    </div>
                  </div>
                </div>

                {/* Expand/collapse controls */}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={expandAll}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Expandir tudo
                  </button>
                  <span className="text-xs text-muted-foreground">·</span>
                  <button
                    onClick={collapseAll}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Recolher tudo
                  </button>
                </div>

                {/* Module tree */}
                <ScrollArea className="max-h-[350px]">
                  <div className="space-y-1">
                    {parsedModules.map((mod, mi) => {
                      const modLessons = mod.lessons.length;
                      const modQuestions = mod.lessons.reduce((s, l) => s + l.questions.length, 0);
                      const modContent = mod.lessons.filter((l) => l.content_html).length;
                      const modPreviews = mod.lessons.filter((l) => l.is_free_preview).length;
                      const isExpanded = expandedModules.has(mi);

                      return (
                        <div key={mi}>
                          {/* Module header */}
                          <button
                            onClick={() => toggleModule(mi)}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left group"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            )}
                            <span className="text-xs font-mono text-muted-foreground w-5 flex-shrink-0">
                              {String(mi + 1).padStart(2, '0')}
                            </span>
                            <span className="text-sm font-medium truncate flex-1">{mod.title}</span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                {modLessons} aulas
                              </span>
                              {modQuestions > 0 && (
                                <span className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                                  {modQuestions}q
                                </span>
                              )}
                              {modContent > 0 && (
                                <span className="text-[10px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                                  {modContent} notas
                                </span>
                              )}
                              {modPreviews > 0 && (
                                <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                  {modPreviews} preview
                                </span>
                              )}
                            </div>
                          </button>

                          {/* Expanded lessons */}
                          {isExpanded && mod.lessons.length > 0 && (
                            <div className="ml-9 mr-2 mb-2 border-l-2 border-muted pl-3 space-y-0.5">
                              {mod.lessons.map((lesson, li) => (
                                <div
                                  key={li}
                                  className="flex items-center gap-2 py-1 px-2 rounded text-xs text-muted-foreground"
                                >
                                  <Film className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate flex-1">{lesson.title}</span>
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {lesson.is_free_preview && (
                                      <Eye className="h-3 w-3 text-blue-500" title="Preview gratuita" />
                                    )}
                                    {lesson.content_html && (
                                      <FileText className="h-3 w-3 text-orange-500" title="Com conteúdo" />
                                    )}
                                    {lesson.questions.length > 0 && (
                                      <span className="flex items-center gap-0.5 text-purple-500" title={`${lesson.questions.length} perguntas`}>
                                        <HelpCircle className="h-3 w-3" />
                                        <span className="text-[10px]">{lesson.questions.length}</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </>
            )}

            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={reset}>
                Cancelar
              </Button>
              <Button onClick={handleImport} disabled={parsedModules.length === 0} className="gap-2">
                <Upload className="h-4 w-4" />
                Importar {parsedModules.length} módulos, {totalLessons} aulas
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ── IMPORTING: Progress ── */}
        {state === 'importing' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-center space-y-1">
              <p className="text-sm font-medium">Importando estrutura...</p>
              <p className="text-xs text-muted-foreground">
                Módulo {importProgress.current} de {importProgress.total}
              </p>
            </div>
          </div>
        )}

        {/* ── DONE: Summary ── */}
        {state === 'done' && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3 py-6">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              <div className="text-center space-y-1">
                <p className="text-lg font-semibold">Importação concluída!</p>
                <p className="text-sm text-muted-foreground">
                  {importResult.modules} módulos, {importResult.lessons} aulas
                  {importResult.quizzes > 0 && ` e ${importResult.quizzes} quizzes`} criados.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setOpen(false)} className="w-full">
                Fechar
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
