import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Sparkles, ArrowRight, Crown, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ServiceRecommendation } from '@/types/leads';

interface RecommendationsCTAProps {
  recommendations: ServiceRecommendation[];
}

export function RecommendationsCTA({ recommendations }: RecommendationsCTAProps) {
  // Filter only recommendations that have enriched service data
  const validRecs = recommendations.filter(r => r.service_name);
  
  if (validRecs.length === 0) return null;

  const primary = validRecs.filter(r => r.type === 'PRIMARY');
  const others = validRecs.filter(r => r.type !== 'PRIMARY');

  return (
    <section className="bg-muted/30 rounded-[40px] p-8 md:p-10 border print:hidden">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 bg-primary text-primary-foreground rounded-xl">
          <Zap size={22} className="fill-current" />
        </div>
        <h3 className="text-2xl font-black tracking-tight text-foreground">
          Próximos Passos Estratégicos
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PRIMARY */}
        {primary.map((rec) => (
          <div 
            key={rec.service_id} 
            className="lg:col-span-2 bg-foreground dark:bg-slate-800 text-background rounded-[32px] p-8 shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary rounded-full blur-[80px] opacity-30 -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                <Sparkles size={12} className="fill-current" /> Recomendação Para Você
              </div>
              
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-background/10 rounded-2xl border border-background/10">
                  <FileText size={24} className="text-primary/80" />
                </div>
                <div>
                  <h4 className="text-xl font-black mb-1">{rec.service_name}</h4>
                  <p className="text-background/60 text-sm">{rec.reason}</p>
                </div>
              </div>

              {rec.service_price_display && (
                <Badge variant="secondary" className="mb-4">{rec.service_price_display}</Badge>
              )}

              <Button 
                className="w-full bg-background text-foreground hover:bg-background/90 font-black py-6 rounded-2xl mt-4 group"
                onClick={() => rec.service_checkout_url && window.open(rec.service_checkout_url, '_blank')}
              >
                {rec.service_cta_text || 'Garantir Minha Vaga'} 
                <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        ))}

        {/* SECONDARY & UPGRADE */}
        {others.length > 0 && (
          <div className="flex flex-col gap-6">
            {others.map((rec) => (
              <div 
                key={rec.service_id} 
                className={cn(
                  "flex-1 rounded-[32px] p-6 border transition-all flex flex-col justify-between",
                  rec.type === 'UPGRADE' 
                    ? "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20" 
                    : "bg-card"
                )}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <Badge variant={rec.type === 'UPGRADE' ? 'default' : 'secondary'} className="text-[9px] uppercase">
                      {rec.type === 'UPGRADE' ? 'Acompanhamento' : 'Estratégia'}
                    </Badge>
                    {rec.type === 'UPGRADE' && <Crown size={16} className="text-primary" />}
                  </div>
                  <h4 className="font-bold text-sm mb-2 text-foreground">{rec.service_name}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">{rec.reason}</p>
                </div>
                
                <Button 
                  variant={rec.type === 'UPGRADE' ? 'default' : 'outline'}
                  className="w-full rounded-xl text-xs font-bold"
                  onClick={() => rec.service_checkout_url && window.open(rec.service_checkout_url, '_blank')}
                >
                  {rec.service_cta_text || 'Saiba mais'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <p className="text-center text-xs text-muted-foreground mt-8 font-medium">
        Todos os serviços contam com garantia de satisfação de 7 dias.
      </p>
    </section>
  );
}
