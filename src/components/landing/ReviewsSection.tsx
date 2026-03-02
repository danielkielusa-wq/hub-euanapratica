import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, PlayCircle } from 'lucide-react';

const videoTestimonials = [
  {
    youtubeId: '', // TODO: substituir pelo ID do YouTube (ex: 'dQw4w9WgXcQ')
    name: 'Ana Lima',
    role: 'Mentoria Individual — Conseguiu emprego na Adobe',
    horizontal: true,
  },
  {
    youtubeId: '', // TODO: substituir pelo ID do YouTube
    name: 'Carlos Mendes',
    role: 'Mentoria Individual — Transição para Big Tech',
    horizontal: true,
  },
  {
    youtubeId: '', // TODO: substituir pelo ID do YouTube
    name: 'Fernanda Rocha',
    role: 'Mentoria Individual — De CLT para os EUA',
    horizontal: false,
  },
];

const reviews = [
  {
    company: 'SAP',
    companyColor: '#0070F2',
    quote: '"Ficava mandando currículo e nada. O ResumePass me mostrou que eu errava em coisas básicas que nunca teria percebido sozinho. Logo depois apareceu a oportunidade na SAP."',
    name: 'Rafael Moraes',
    role: 'Software Engineer na SAP',
    avatar: '/images/landing/avatars/1.png',
  },
  {
    company: 'Accenture',
    companyColor: '#A100FF',
    quote: '"Não sabia nem por onde começar. Conversar com brasileiros que já tinham passado pelo processo foi o que me faltava. Aprendi mais em semanas do que em meses pesquisando sozinha."',
    name: 'Camila Ferreira',
    role: 'Business Analyst na Accenture',
    avatar: '/images/landing/avatars/2.png',
  },
  {
    company: 'JPMorgan',
    companyColor: '#003087',
    quote: '"Nunca imaginei que meu cargo no Brasil precisava ser traduzido de forma tão diferente pra fazer sentido aqui. Isso mudou como eu escrevia o currículo, o LinkedIn, tudo."',
    name: 'Bruno Carvalho',
    role: 'Financial Analyst no JPMorgan',
    avatar: '/images/landing/avatars/3.png',
  },
  {
    company: 'Figma',
    companyColor: '#F24E1E',
    quote: '"Tentei sozinha por um tempo e só ficava rodando. A mentoria me deu um caminho de verdade, não foi mágica, mas foi o que eu precisava pra finalmente sair do lugar."',
    name: 'Larissa Andrade',
    role: 'UX Designer na Figma',
    avatar: '/images/landing/avatars/4.png',
  },
  {
    company: 'Cloudflare',
    companyColor: '#F48120',
    quote: '"Gostei da honestidade. Me disseram o que estava errado sem rodeio. Dói um pouco, mas é exatamente o que você precisa ouvir quando está estagnado."',
    name: 'Thiago Lemos',
    role: 'DevOps Engineer na Cloudflare',
    avatar: '/images/landing/avatars/5.png',
  },
  {
    company: 'Deloitte',
    companyColor: '#86BC25',
    quote: '"No LinkedIn só apareciam as mesmas vagas genéricas. Aqui encontrei oportunidades que nunca teria achado por conta própria, mais alinhadas com o que eu queria."',
    name: 'Isabela Ramos',
    role: 'Data Analyst na Deloitte',
    avatar: '/images/landing/avatars/6.png',
  },
];

const brandLogos = [
  '/images/landing/branding/logo_1-light.png',
  '/images/landing/branding/logo_2-light.png',
  '/images/landing/branding/logo_3-light.png',
  '/images/landing/branding/logo_4-light.png',
  '/images/landing/branding/logo_5-light.png',
];

export default function ReviewsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(3);

  useEffect(() => {
    const updateVisible = () => {
      if (window.innerWidth < 768) setVisibleCount(1);
      else if (window.innerWidth < 1200) setVisibleCount(2);
      else setVisibleCount(3);
    };
    updateVisible();
    window.addEventListener('resize', updateVisible);
    return () => window.removeEventListener('resize', updateVisible);
  }, []);

  const maxIndex = Math.max(0, reviews.length - visibleCount);

  const goPrev = () => setCurrentIndex((prev) => Math.max(0, prev - 1));
  const goNext = () => setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));

  return (
    <section id="landingReviews" className="py-12 md:py-20 lg:py-24 bg-gray-50/50 pb-0">
      <div className="container mx-auto max-w-7xl px-4">

        {/* Video Testimonials */}
        <div className="mb-10 md:mb-14">
          <div className="text-center mb-6">
            <span className="inline-block rounded-md bg-landing-primary/10 px-3 py-1 text-sm font-medium text-landing-primary">
              Depoimentos Reais
            </span>
            <h4 className="text-2xl md:text-3xl font-bold mt-3 mb-1">
              <span className="relative font-extrabold z-10">
                O que dizem
                <img
                  src="/images/landing/icons/section-title-icon.png"
                  alt=""
                  className="absolute bottom-0 left-0 right-0 -z-10 object-contain w-full"
                />
              </span>
              {' '}em vídeo
            </h4>
            <p className="text-gray-500 text-sm mt-2">Veja o depoimento de quem passou pela mentoria.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-2 gap-4">
            {/* Horizontal 1 — col-span-2, row 1 */}
            <div className="lg:col-span-2 lg:row-span-1 rounded-lg overflow-hidden border border-gray-100 shadow-sm bg-white">
              <div className="relative bg-gray-100" style={{ aspectRatio: '16/9' }}>
                {videoTestimonials[0].youtubeId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${videoTestimonials[0].youtubeId}`}
                    title={videoTestimonials[0].name}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <PlayCircle className="h-12 w-12 text-gray-300" />
                    <span className="text-xs text-gray-400">Vídeo em breve</span>
                  </div>
                )}
              </div>
              <div className="px-4 py-3">
                <p className="text-sm font-semibold">{videoTestimonials[0].name}</p>
                <p className="text-xs text-gray-500">{videoTestimonials[0].role}</p>
              </div>
            </div>

            {/* Vertical — col-span-1, row-span-2 */}
            <div className="lg:col-span-1 lg:row-span-2 lg:col-start-3 lg:row-start-1 rounded-lg overflow-hidden border border-gray-100 shadow-sm bg-white flex flex-col">
              <div className="relative bg-gray-100 flex-1" style={{ minHeight: '280px' }}>
                {videoTestimonials[2].youtubeId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${videoTestimonials[2].youtubeId}`}
                    title={videoTestimonials[2].name}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <PlayCircle className="h-12 w-12 text-gray-300" />
                    <span className="text-xs text-gray-400">Vídeo em breve</span>
                  </div>
                )}
              </div>
              <div className="px-4 py-3 border-t border-gray-100">
                <p className="text-sm font-semibold">{videoTestimonials[2].name}</p>
                <p className="text-xs text-gray-500">{videoTestimonials[2].role}</p>
              </div>
            </div>

            {/* Horizontal 2 — col-span-2, row 2 */}
            <div className="lg:col-span-2 lg:row-span-1 lg:col-start-1 lg:row-start-2 rounded-lg overflow-hidden border border-gray-100 shadow-sm bg-white">
              <div className="relative bg-gray-100" style={{ aspectRatio: '16/9' }}>
                {videoTestimonials[1].youtubeId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${videoTestimonials[1].youtubeId}`}
                    title={videoTestimonials[1].name}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <PlayCircle className="h-12 w-12 text-gray-300" />
                    <span className="text-xs text-gray-400">Vídeo em breve</span>
                  </div>
                )}
              </div>
              <div className="px-4 py-3">
                <p className="text-sm font-semibold">{videoTestimonials[1].name}</p>
                <p className="text-xs text-gray-500">{videoTestimonials[1].role}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-10 mb-8 pb-4 md:pb-8">
          <div className="lg:w-1/4 xl:w-1/5 shrink-0">
            <h5 className="text-lg font-bold mb-2">Mais depoimentos</h5>
            <p className="text-gray-500 text-sm mb-6 lg:mb-10">
              Veja o que nossos alunos têm a<br className="hidden xl:block" />
              dizer sobre a experiência.
            </p>
            <div className="flex gap-3">
              <button
                onClick={goPrev}
                className="w-10 h-10 rounded-md bg-landing-primary/10 text-landing-primary hover:bg-landing-primary/20 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={goNext}
                className="w-10 h-10 rounded-md bg-landing-primary/10 text-landing-primary hover:bg-landing-primary/20 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="lg:w-3/4 xl:w-4/5 overflow-hidden">
            <div
              ref={trackRef}
              className="flex gap-6 transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${currentIndex * (100 / visibleCount)}%)` }}
            >
              {reviews.map((review, i) => (
                <div
                  key={i}
                  className="shrink-0"
                  style={{ width: `calc(${100 / visibleCount}% - ${(visibleCount - 1) * 24 / visibleCount}px)` }}
                >
                  <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 h-full flex flex-col justify-between">
                    <div>
                      <div className="mb-4">
                        <span
                          className="text-xl font-bold tracking-tight"
                          style={{ color: review.companyColor }}
                        >
                          {review.company}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed mb-4">{review.quote}</p>
                      <div className="flex text-amber-400 mb-4 gap-0.5">
                        {[...Array(5)].map((_, j) => (
                          <Star key={j} className="h-4 w-4 fill-current" />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <img src={review.avatar} alt={review.name} className="h-9 w-9 rounded-full object-cover" />
                      <div>
                        <h6 className="text-sm font-semibold">{review.name}</h6>
                        <p className="text-xs text-gray-500">{review.role}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <hr className="border-gray-200 mx-0 mt-8 md:mt-12" />

      {/* Brand Logo Slider */}
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-center gap-6 sm:gap-10 lg:gap-16 flex-wrap overflow-hidden">
          {brandLogos.map((logo, i) => (
            <img
              key={i}
              src={logo}
              alt=""
              className="h-6 sm:h-7 md:h-8 object-contain opacity-60 hover:opacity-100 transition-opacity"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
