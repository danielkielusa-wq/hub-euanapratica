import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Briefcase, 
  Globe, 
  DollarSign, 
  Calendar, 
  Target, 
  CheckCircle2,
  MessageCircle,
  Download,
  Sparkles
} from 'lucide-react';
import logo from '@/assets/logo-horizontal.png';
import type { CareerEvaluation } from '@/types/leads';

interface FormattedReportProps {
  evaluation: CareerEvaluation;
  formattedContent?: string;
}

export function FormattedReport({ evaluation, formattedContent }: FormattedReportProps) {
  // Parse diagnostic metrics from evaluation data
  const diagnosticCards = [
    {
      icon: Briefcase,
      label: 'Experiência',
      value: evaluation.experiencia || 'Não informado',
      color: 'text-blue-500'
    },
    {
      icon: Globe,
      label: 'Inglês',
      value: evaluation.english_level || 'Não informado',
      color: 'text-green-500'
    },
    {
      icon: DollarSign,
      label: 'Renda',
      value: evaluation.income_range || 'Não informado',
      color: 'text-amber-500'
    },
    {
      icon: Calendar,
      label: 'Timeline',
      value: evaluation.timeline || 'Não informado',
      color: 'text-purple-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <img src={logo} alt="Logo" className="h-10 mx-auto" />
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="w-3 h-3" />
            Relatório Personalizado
          </Badge>
        </div>

        {/* Greeting */}
        <Card className="rounded-[24px] overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Olá, {evaluation.name.split(' ')[0]}! 👋
            </h1>
            <p className="mt-2 text-muted-foreground">
              Seu diagnóstico de prontidão para carreira internacional está pronto.
            </p>
          </div>
        </Card>

        {/* Diagnostic Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Diagnóstico de Prontidão
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {diagnosticCards.map((card) => (
              <Card key={card.label} className="rounded-[16px]">
                <CardContent className="p-4 text-center">
                  <card.icon className={`w-6 h-6 mx-auto mb-2 ${card.color}`} />
                  <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
                  <p className="font-medium text-sm">{card.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Report Content */}
        <Card className="rounded-[24px]">
          <CardContent className="p-8">
            {formattedContent ? (
              <div 
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: formattedContent }}
              />
            ) : (
              <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                {evaluation.report_content}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Plan */}
        {evaluation.objetivo && (
          <Card className="rounded-[24px]">
            <CardContent className="p-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Seu Objetivo
              </h2>
              <p className="text-muted-foreground">{evaluation.objetivo}</p>
            </CardContent>
          </Card>
        )}

        {/* CTA */}
        <Card className="rounded-[24px] bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-8 text-center space-y-4">
            <h2 className="text-xl font-semibold">Pronto para o próximo passo?</h2>
            <p className="text-muted-foreground">
              Converse com nossa equipe e receba orientação personalizada para sua jornada.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button className="rounded-[12px] gap-2">
                <MessageCircle className="w-4 h-4" />
                Falar com Especialista
              </Button>
              <Button variant="outline" className="rounded-[12px] gap-2">
                <Download className="w-4 h-4" />
                Baixar Relatório
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} - Relatório gerado com IA
        </p>
      </div>
    </div>
  );
}
