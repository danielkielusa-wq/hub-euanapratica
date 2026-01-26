import { useState } from 'react';
import { Check, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GRADIENT_PRESETS, type GradientPresetKey, resolveGradient } from '@/lib/gradients';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface GradientThemePickerProps {
  selectedPreset?: string | null;
  customStart?: string | null;
  customEnd?: string | null;
  onChange: (preset: string | null, customStart: string | null, customEnd: string | null) => void;
  showPreview?: boolean;
  className?: string;
}

export function GradientThemePicker({
  selectedPreset,
  customStart,
  customEnd,
  onChange,
  showPreview = true,
  className
}: GradientThemePickerProps) {
  const [mode, setMode] = useState<'preset' | 'custom'>(
    customStart && customEnd ? 'custom' : 'preset'
  );
  const [localStart, setLocalStart] = useState(customStart || '#6366f1');
  const [localEnd, setLocalEnd] = useState(customEnd || '#a855f7');

  const handlePresetSelect = (presetKey: string) => {
    setMode('preset');
    onChange(presetKey, null, null);
  };

  const handleCustomChange = (start: string, end: string) => {
    setLocalStart(start);
    setLocalEnd(end);
    setMode('custom');
    onChange(null, start, end);
  };

  const currentGradient = resolveGradient(
    mode === 'preset' ? selectedPreset : null,
    mode === 'custom' ? localStart : null,
    mode === 'custom' ? localEnd : null
  );

  return (
    <div className={cn("space-y-4", className)}>
      <Label className="flex items-center gap-2">
        <Palette className="h-4 w-4" />
        Tema de Cores
      </Label>
      
      {/* Preset Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Object.entries(GRADIENT_PRESETS).map(([key, preset]) => {
          const isSelected = mode === 'preset' && selectedPreset === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => handlePresetSelect(key)}
              className={cn(
                "relative aspect-[4/3] rounded-[16px] overflow-hidden transition-all duration-300",
                "ring-2 ring-offset-2 ring-offset-background",
                isSelected 
                  ? "ring-primary scale-[1.02] shadow-lg" 
                  : "ring-transparent hover:ring-border hover:shadow-md"
              )}
              style={{ background: preset.css }}
            >
              {/* Overlay with name */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-xs font-medium text-white truncate drop-shadow-sm">
                  {preset.name}
                </p>
              </div>
              
              {/* Selected check */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center">
                  <Check className="h-4 w-4 text-primary" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Custom Colors Section */}
      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={() => {
            setMode('custom');
            onChange(null, localStart, localEnd);
          }}
          className={cn(
            "w-full flex items-center gap-3 p-3 rounded-[16px] border transition-all duration-200",
            mode === 'custom'
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          )}
        >
          <div 
            className="w-8 h-8 rounded-lg shrink-0"
            style={{ background: `linear-gradient(135deg, ${localStart} 0%, ${localEnd} 100%)` }}
          />
          <span className="text-sm font-medium">Cores Personalizadas</span>
          {mode === 'custom' && (
            <Check className="h-4 w-4 text-primary ml-auto" />
          )}
        </button>

        {mode === 'custom' && (
          <div className="flex gap-4 pl-4 animate-fade-in">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Cor Inicial</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={localStart}
                  onChange={(e) => handleCustomChange(e.target.value, localEnd)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-border"
                />
                <Input
                  value={localStart}
                  onChange={(e) => handleCustomChange(e.target.value, localEnd)}
                  placeholder="#FF6B6B"
                  className="flex-1 font-mono text-xs rounded-xl"
                />
              </div>
            </div>
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Cor Final</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={localEnd}
                  onChange={(e) => handleCustomChange(localStart, e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-border"
                />
                <Input
                  value={localEnd}
                  onChange={(e) => handleCustomChange(localStart, e.target.value)}
                  placeholder="#4ECDC4"
                  className="flex-1 font-mono text-xs rounded-xl"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Live Preview */}
      {showPreview && (
        <div className="pt-2">
          <Label className="text-xs text-muted-foreground mb-2 block">Preview</Label>
          <div 
            className="aspect-[3/4] max-w-[160px] rounded-[24px] overflow-hidden shadow-xl transition-all duration-300"
            style={{ background: currentGradient }}
          >
            <div className="h-full bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
              <div className="space-y-1">
                <div className="h-2 w-16 bg-white/80 rounded" />
                <div className="h-1.5 w-12 bg-white/40 rounded" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
