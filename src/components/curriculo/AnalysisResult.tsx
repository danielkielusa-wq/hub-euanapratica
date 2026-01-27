import { CheckCircle, XCircle, Lightbulb, Tag, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export interface AnalysisResultData {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  keywords: {
    found: string[];
    missing: string[];
  };
}

interface AnalysisResultProps {
  result: AnalysisResultData;
  onReset: () => void;
}

export function AnalysisResult({ result, onReset }: AnalysisResultProps) {
  const scoreColor = result.score >= 70 
    ? 'text-green-600' 
    : result.score >= 50 
      ? 'text-yellow-600' 
      : 'text-red-600';

  const scoreLabel = result.score >= 70 
    ? 'Excelente!' 
    : result.score >= 50 
      ? 'Precisa de ajustes' 
      : 'Requer melhorias';

  return (
    <div className="space-y-6">
      {/* Score Card */}
      <Card className="p-6 rounded-[24px] bg-white border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Score de Compatibilidade</h3>
          <span className={cn("text-3xl font-bold", scoreColor)}>
            {result.score}%
          </span>
        </div>
        <Progress value={result.score} className="h-3 mb-2" />
        <p className={cn("text-sm font-medium", scoreColor)}>{scoreLabel}</p>
      </Card>

      {/* Summary */}
      <Card className="p-6 rounded-[24px] bg-white border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Resumo</h3>
        <p className="text-gray-600 leading-relaxed">{result.summary}</p>
      </Card>

      {/* Strengths & Improvements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths */}
        <Card className="p-6 rounded-[24px] bg-green-50 border border-green-100">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-900">Pontos Fortes</h3>
          </div>
          <ul className="space-y-2">
            {result.strengths.map((strength, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-green-800">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                {strength}
              </li>
            ))}
          </ul>
        </Card>

        {/* Improvements */}
        <Card className="p-6 rounded-[24px] bg-amber-50 border border-amber-100">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-amber-900">Melhorias Sugeridas</h3>
          </div>
          <ul className="space-y-2">
            {result.improvements.map((improvement, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                {improvement}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Keywords Analysis */}
      <Card className="p-6 rounded-[24px] bg-white border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Tag className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-gray-900">Análise de Keywords</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Found Keywords */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Encontradas no currículo
            </p>
            <div className="flex flex-wrap gap-2">
              {result.keywords.found.map((keyword, i) => (
                <span 
                  key={i} 
                  className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          {/* Missing Keywords */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Faltando (adicionar)
            </p>
            <div className="flex flex-wrap gap-2">
              {result.keywords.missing.map((keyword, i) => (
                <span 
                  key={i} 
                  className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Reset Button */}
      <div className="flex justify-center pt-4">
        <Button 
          onClick={onReset}
          variant="outline"
          className="rounded-[16px] px-8 py-5 gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Analisar Outro Currículo
        </Button>
      </div>
    </div>
  );
}
