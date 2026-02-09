import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { 
  FileText, 
  Download, 
  Loader2, 
  Send,
  CheckCircle,
  RotateCcw,
  XCircle,
  Clock,
  User
} from 'lucide-react';
import { formatFileSize } from '@/lib/file-utils';
import { useSubmitFeedback, useSubmissionMessages, useSendSubmissionMessage } from '@/hooks/useSubmissions';
import type { Submission, ReviewResult } from '@/types/assignments';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

const formSchema = z.object({
  review_result: z.enum(['approved', 'revision', 'rejected']),
  feedback: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface SubmissionReviewProps {
  submission: Submission | null;
  open: boolean;
  onClose: () => void;
}

export function SubmissionReview({ submission, open, onClose }: SubmissionReviewProps) {
  const submitFeedback = useSubmitFeedback();
  const sendMessage = useSendSubmissionMessage();
  
  // Only fetch messages if we have a real submission ID
  const isValidSubmissionId = submission?.id && !submission.id.startsWith('placeholder-');
  const { data: messages } = useSubmissionMessages(isValidSubmissionId ? submission.id : '');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      review_result: undefined,
      feedback: '',
    },
  });

  // Reset form when submission changes - MUST be in useEffect
  useEffect(() => {
    if (submission && open) {
      form.reset({
        review_result: submission.review_result || undefined,
        feedback: submission.feedback || '',
      });
    }
  }, [submission?.id, open, form]);

  const onSubmit = async (data: FormData) => {
    if (!submission?.id || submission.id.startsWith('placeholder-')) {
      return;
    }

    try {
      await submitFeedback.mutateAsync({
        submission_id: submission.id,
        review_result: data.review_result as ReviewResult,
        feedback: data.feedback,
      });

      // Also save feedback as a message in the conversation history
      if (data.feedback && data.feedback.trim()) {
        await sendMessage.mutateAsync({
          submission_id: submission.id,
          message: `[Feedback do Mentor - ${data.review_result === 'approved' ? 'Aprovada' : data.review_result === 'revision' ? 'Revisão Necessária' : 'Não Aprovada'}]\n\n${data.feedback}`
        });
      }

      onClose();
    } catch (error) {
    }
  };

  // Show loading state instead of null when no submission
  if (!submission) {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Avaliar Entrega</SheetTitle>
            <SheetDescription>Carregando dados...</SheetDescription>
          </SheetHeader>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  const resultOptions = [
    { 
      value: 'approved', 
      label: 'Aprovada', 
      icon: CheckCircle, 
      className: 'border-primary/50 bg-primary/5 data-[state=checked]:border-primary'
    },
    { 
      value: 'revision', 
      label: 'Precisa Revisar', 
      icon: RotateCcw, 
      className: 'border-accent bg-accent/5 data-[state=checked]:border-accent'
    },
    { 
      value: 'rejected', 
      label: 'Não Aprovada', 
      icon: XCircle, 
      className: 'border-destructive/50 bg-destructive/5 data-[state=checked]:border-destructive'
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Avaliar Entrega</SheetTitle>
          <SheetDescription>
            Revise a entrega e forneça feedback ao aluno
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Student info */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-full">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{submission.user?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{submission.user?.email}</p>
                </div>
              </div>
              {submission.submitted_at && (
                <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Entregue em {format(new Date(submission.submitted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submission content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conteúdo da Entrega</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File */}
              {submission.file_url && (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{submission.file_name}</p>
                      {submission.file_size && (
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(submission.file_size)}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(submission.file_url!, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </Button>
                </div>
              )}

              {/* Text content */}
              {submission.text_content && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Texto:</p>
                  <div className="prose prose-sm dark:prose-invert max-w-none max-h-64 overflow-y-auto">
                    <p className="whitespace-pre-wrap">{submission.text_content}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Messages history */}
          {messages && messages.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Histórico de Mensagens</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-64 pr-4">
                  <div className="space-y-3">
                    {messages.map((msg) => {
                      const isStudent = msg.sender_id === submission.user_id;
                      const initials = msg.sender?.full_name
                        ?.split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2) || 'U';

                      return (
                        <div key={msg.id} className="flex gap-2">
                          <Avatar className="h-6 w-6 flex-shrink-0">
                            <AvatarFallback className={cn(
                              "text-xs",
                              isStudent ? "bg-muted" : "bg-primary text-primary-foreground"
                            )}>
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-medium truncate">
                                {msg.sender?.full_name || 'Usuário'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(msg.created_at), "dd/MM HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                              {msg.message}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Review form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="review_result"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resultado da Avaliação</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-3 gap-4"
                      >
                        {resultOptions.map((option) => {
                          const Icon = option.icon;
                          return (
                            <div key={option.value}>
                              <RadioGroupItem
                                value={option.value}
                                id={option.value}
                                className="peer sr-only"
                              />
                              <Label
                                htmlFor={option.value}
                                className={cn(
                                  "flex flex-col items-center justify-center rounded-md border-2 p-4 cursor-pointer",
                                  "hover:bg-accent hover:text-accent-foreground",
                                  "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary",
                                  option.className
                                )}
                              >
                                <Icon className="h-6 w-6 mb-2" />
                                <span className="text-sm font-medium">{option.label}</span>
                              </Label>
                            </div>
                          );
                        })}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="feedback"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Feedback (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Escreva seu feedback para o aluno..."
                        className="min-h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitFeedback.isPending}>
                  {submitFeedback.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Enviar Feedback
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
