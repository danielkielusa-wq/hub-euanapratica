import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  OnboardingProfile,
  CAREER_AREAS,
  ENGLISH_LEVELS,
  CAREER_OBJECTIVES,
  CAREER_TIMELINES,
} from '@/types/onboarding';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Globe, Target, Clock } from 'lucide-react';

interface CareerAssessmentStepProps {
  data: Partial<OnboardingProfile>;
  onChange: (field: keyof OnboardingProfile, value: string) => void;
  errors: Record<string, string>;
}

export function CareerAssessmentStep({ data, onChange, errors }: CareerAssessmentStepProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
          Sobre sua carreira
        </h1>
        <p className="text-muted-foreground text-base">
          Essas informações ajudam a personalizar sua experiência no Hub.
        </p>
      </div>

      {/* Cards */}
      <div className="space-y-6">
        {/* Professional Area */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-600" />
              Área de atuação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="area_profissional" className="text-sm font-medium">
                Qual sua área profissional? <span className="text-destructive">*</span>
              </Label>
              <Select
                value={data.area_profissional || ''}
                onValueChange={(value) => onChange('area_profissional', value)}
              >
                <SelectTrigger className={errors.area_profissional ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Selecione uma opção" />
                </SelectTrigger>
                <SelectContent>
                  {CAREER_AREAS.map((area) => (
                    <SelectItem key={area} value={area}>{area}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.area_profissional && (
                <p className="text-xs text-destructive">{errors.area_profissional}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* English Level */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-600" />
              Nível de inglês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="nivel_ingles" className="text-sm font-medium">
                Qual seu nível de inglês? <span className="text-destructive">*</span>
              </Label>
              <Select
                value={data.nivel_ingles || ''}
                onValueChange={(value) => onChange('nivel_ingles', value)}
              >
                <SelectTrigger className={errors.nivel_ingles ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Selecione uma opção" />
                </SelectTrigger>
                <SelectContent>
                  {ENGLISH_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.nivel_ingles && (
                <p className="text-xs text-destructive">{errors.nivel_ingles}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Career Objective */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              Seu objetivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="objetivo" className="text-sm font-medium">
                Qual seu principal objetivo? <span className="text-destructive">*</span>
              </Label>
              <Select
                value={data.objetivo || ''}
                onValueChange={(value) => onChange('objetivo', value)}
              >
                <SelectTrigger className={errors.objetivo ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Selecione uma opção" />
                </SelectTrigger>
                <SelectContent>
                  {CAREER_OBJECTIVES.map((obj) => (
                    <SelectItem key={obj} value={obj}>{obj}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.objetivo && (
                <p className="text-xs text-destructive">{errors.objetivo}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              Prazo para se mover
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="prazo_movimento" className="text-sm font-medium">
                Quando pretende dar o próximo passo? <span className="text-destructive">*</span>
              </Label>
              <Select
                value={data.prazo_movimento || ''}
                onValueChange={(value) => onChange('prazo_movimento', value)}
              >
                <SelectTrigger className={errors.prazo_movimento ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Selecione uma opção" />
                </SelectTrigger>
                <SelectContent>
                  {CAREER_TIMELINES.map((timeline) => (
                    <SelectItem key={timeline} value={timeline}>{timeline}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.prazo_movimento && (
                <p className="text-xs text-destructive">{errors.prazo_movimento}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
