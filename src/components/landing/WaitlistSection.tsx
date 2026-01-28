import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Rocket, Mail, Zap, Shield, X, Check } from "lucide-react";
import { toast } from "sonner";

export function WaitlistSection() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.success("Você está na lista! 🚀", {
      description: "Em breve você receberá novidades exclusivas.",
    });

    setEmail("");
    setIsSubmitting(false);
  };

  return (
    <section className="bg-background py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-[hsl(222,47%,11%)] via-[hsl(240,47%,15%)] to-[hsl(260,47%,18%)] p-8 md:p-12 lg:p-20">
          {/* Mesh Gradient Overlay */}
          <div className="absolute inset-0 opacity-50">
            <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-secondary/20 blur-3xl" />
          </div>

          <div className="relative z-10 mx-auto max-w-2xl text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
              <Rocket className="h-4 w-4 text-white" />
              <span className="text-sm font-medium text-white">VAGAS LIMITADAS PARA O BETA</span>
            </div>

            {/* Title */}
            <h2 className="mb-4 text-3xl font-bold text-primary-foreground md:text-4xl lg:text-5xl">
              Seja o primeiro a{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                dominar o mercado USA.
              </span>
            </h2>

            {/* Subtitle */}
            <p className="mb-10 text-primary-foreground/70">
              As ferramentas de IA e o Concierge de Vagas estão em fase final de desenvolvimento. Entre na lista de
              espera e seja notificado em primeira mão.
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mb-8">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Seu melhor e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 rounded-xl border-0 bg-background/10 pl-12 text-primary-foreground placeholder:text-primary-foreground/50 focus-visible:ring-primary"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="group relative h-14 overflow-hidden rounded-xl bg-primary px-8 text-primary-foreground hover:bg-primary/90"
                >
                  {/* Shimmer Effect */}
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  <span className="relative flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    {isSubmitting ? "Enviando..." : "Garantir Acesso"}
                  </span>
                </Button>
              </div>
            </form>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-primary-foreground/60">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Privacidade Garantida</span>
              </div>
              <div className="flex items-center gap-2">
                <X className="h-4 w-4" />
                <span>Zero Spam</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                <span>Acesso Imediato ao Hub Free</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
