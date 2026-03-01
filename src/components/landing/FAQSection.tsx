import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const faqs = [
  {
    question: 'O que é o Hub EUA na Prática?',
    answer:
      'O Hub EUA na Prática é uma plataforma completa para profissionais brasileiros que desejam construir ou acelerar suas carreiras nos Estados Unidos. Oferecemos ferramentas de IA como o ResumePass, tradução de títulos, vagas curadas, comunidade premium e mentoria individualizada.',
  },
  {
    question: 'Como funciona o ResumePass IA?',
    answer:
      'O ResumePass analisa seu currículo brasileiro usando inteligência artificial e o transforma no padrão americano. Ele substitui termos passivos por verbos de impacto, quantifica resultados, otimiza para sistemas ATS (Applicant Tracking System) e formata seguindo as melhores práticas do mercado dos EUA.',
  },
  {
    question: 'Posso cancelar minha assinatura a qualquer momento?',
    answer:
      'Sim! Todas as assinaturas podem ser canceladas a qualquer momento sem multas ou taxas adicionais. O acesso permanece ativo até o final do período já pago. Oferecemos também garantia de satisfação nos primeiros 7 dias.',
  },
  {
    question: 'Quais são os planos disponíveis?',
    answer:
      'Oferecemos três planos: Basic (gratuito) com acesso limitado às ferramentas, Pro (R$97/mês) com acesso ilimitado ao ResumePass IA, Prime Jobs exclusivo e comunidade premium, e VIP (R$197/mês) que inclui tudo do Pro mais mentoria individual mensal e hot seats exclusivos.',
  },
  {
    question: 'Preciso morar nos EUA para usar a plataforma?',
    answer:
      'Não! A plataforma foi projetada tanto para quem já está nos EUA quanto para quem está planejando a transição. Muitos de nossos alunos começam a usar as ferramentas ainda no Brasil, preparando currículo, networking e estratégia antes mesmo de se mudar.',
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(2);

  return (
    <section id="landingFAQ" className="py-12 md:py-20 lg:py-24 bg-gray-50/50">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="text-center mb-4">
          <span className="inline-block rounded-md bg-landing-primary/10 px-3 py-1 text-sm font-medium text-landing-primary">
            FAQ
          </span>
        </div>
        <h4 className="text-center text-2xl md:text-3xl font-bold mb-1">
          Perguntas{' '}
          <span className="relative font-extrabold z-10">
            frequentes
            <img
              src="/images/landing/icons/section-title-icon.png"
              alt=""
              className="absolute bottom-0 left-0 right-0 -z-10 object-contain w-full"
            />
          </span>
        </h4>
        <p className="text-center text-gray-500 mb-12 pb-0 md:pb-4">
          Navegue pelas perguntas mais comuns para encontrar respostas.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Image */}
          <div className="lg:col-span-5">
            <div className="text-center">
              <img
                src="/images/landing/landing-page/faq-boy-with-logos.png"
                alt="FAQ"
                className="max-w-full mx-auto lg:max-w-sm"
              />
            </div>
          </div>

          {/* Accordion */}
          <div className="lg:col-span-7">
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setOpenIndex(openIndex === i ? -1 : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left"
                  >
                    <span className="font-medium text-sm md:text-base">{faq.question}</span>
                    <ChevronDown
                      className={cn(
                        'h-5 w-5 text-gray-400 shrink-0 ml-4 transition-transform duration-200',
                        openIndex === i && 'rotate-180'
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      'overflow-hidden transition-all duration-300',
                      openIndex === i ? 'max-h-96 pb-4' : 'max-h-0'
                    )}
                  >
                    <div className="px-5 text-gray-500 text-sm leading-relaxed">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
