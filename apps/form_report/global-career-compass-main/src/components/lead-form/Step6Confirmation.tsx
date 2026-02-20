import { useEffect } from "react";
import confetti from "canvas-confetti";
import { CheckCircle, Mail, Clock, Globe, Instagram } from "lucide-react";

const Step6Confirmation = () => {
  useEffect(() => {
    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ["#2563EB", "#10B981", "#F59E0B"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ["#2563EB", "#10B981", "#F59E0B"],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  return (
    <div className="space-y-6 fade-in-scale text-center">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success text-sm font-semibold">
          <CheckCircle className="w-4 h-4" />
          Parabéns! Análise Completa
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
          Sua aplicação foi recebida com sucesso!
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
          Assista ao vídeo abaixo enquanto nossa equipe{" "}
          <strong>analisa suas respostas em tempo real</strong> para identificar seu potencial de carreira internacional.
        </p>
      </div>

      <div className="w-full aspect-video rounded-xl overflow-hidden shadow-lg">
        <iframe
          src="https://www.youtube.com/embed/hsX8gWHrLRE?autoplay=1&mute=1&rel=0"
          title="EUA Na Prática"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>

      <div className="space-y-3 text-sm text-muted-foreground">
        <p className="flex items-center justify-center gap-2">
          <Mail className="w-4 h-4" />
          Você receberá o resultado via <strong>E-mail</strong> ou <strong>WhatsApp</strong>.
        </p>
        <p className="flex items-center justify-center gap-2">
          <Clock className="w-4 h-4" />
          <strong>Tempo médio de resposta: 24-48 horas</strong>
        </p>
      </div>

      <div className="space-y-3 pt-2">
        <a
          href="https://euanapratica.com"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary-gradient inline-flex items-center justify-center gap-2 w-full py-4 text-base"
        >
          <Globe className="w-5 h-5" />
          Conhecer a EUA Na Prática
        </a>
        <a
          href="https://instagram.com/euanapratica"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 text-sm text-primary hover:underline"
        >
          <Instagram className="w-4 h-4" />
          Enquanto isso, siga-nos no Instagram
        </a>
      </div>
    </div>
  );
};

export default Step6Confirmation;
