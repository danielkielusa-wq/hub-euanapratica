import { Sparkles } from 'lucide-react';

export function AnalyzingLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      {/* Animated icon container */}
      <div className="relative">
        {/* Pulsating outer ring */}
        <div className="absolute inset-0 w-32 h-32 bg-primary/20 rounded-full animate-ping" />
        
        {/* Inner white circle with icon */}
        <div className="relative flex items-center justify-center w-32 h-32 bg-white rounded-full shadow-lg">
          <Sparkles className="w-12 h-12 text-primary animate-pulse" />
        </div>
      </div>
      
      {/* Text */}
      <div className="text-center space-y-2 mt-4">
        <h2 className="text-xl font-bold text-gray-900">
          Analisando seu Currículo...
        </h2>
        <p className="text-gray-500 max-w-md">
          Nossa IA está comparando suas experiências com os requisitos da vaga e padrões americanos.
        </p>
      </div>
    </div>
  );
}
