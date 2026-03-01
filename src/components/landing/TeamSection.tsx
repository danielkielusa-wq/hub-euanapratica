const teamMembers = [
  {
    name: 'Daniel Kiel',
    role1: 'Founder EUA Na Prática',
    role2: 'International Career Strategist',
    image: '/images/landing/landing-page/team-member-1.png',
    bgClass: 'bg-landing-primary/10 border-landing-primary/20',
    borderClass: 'border-landing-primary/20',
  },
  {
    name: 'Jefferson Islan',
    role1: 'CEO Pristate',
    role2: 'Real Estate Investment',
    image: '/images/landing/landing-page/team-member-2.png',
    bgClass: 'bg-sky-100/60 border-sky-200',
    borderClass: 'border-sky-200',
  },
  {
    name: 'Silvia Goulart',
    role1: 'Founder S&P',
    role2: 'Higher Education Consulting',
    image: '/images/landing/landing-page/team-member-3.png',
    bgClass: 'bg-red-50 border-red-200',
    borderClass: 'border-red-200',
  },
  {
    name: 'Dr. Gustavo Saliba',
    role1: 'CEO Green Card US',
    role2: 'Advogado Licenciado nos EUA',
    image: '/images/landing/landing-page/team-member-4.png',
    bgClass: 'bg-emerald-50 border-emerald-200',
    borderClass: 'border-emerald-200',
  },
];

export default function TeamSection() {
  return (
    <section id="landingTeam" className="py-12 md:py-20 lg:py-24">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="text-center mb-4">
          <span className="inline-block rounded-md bg-landing-primary/10 px-3 py-1 text-sm font-medium text-landing-primary">
            Nossa Equipe
          </span>
        </div>
        <h4 className="text-center text-2xl md:text-3xl font-bold mb-1">
          <span className="relative font-extrabold z-10">
            Apoiado
            <img
              src="/images/landing/icons/section-title-icon.png"
              alt=""
              className="absolute bottom-0 left-0 right-0 -z-10 object-contain w-full"
            />
          </span>
          {' '}por Pessoas Reais
        </h4>
        <p className="text-center text-gray-500 mb-10 md:mb-14 lg:mb-16">
          Quem está por trás dessa plataforma que transforma carreiras?
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {teamMembers.map((member, i) => (
            <div key={i} className="mt-3 lg:mt-0">
              <div className="rounded-lg shadow-none overflow-hidden">
                <div
                  className={`relative h-44 ${member.bgClass} border border-b-0`}
                  style={{ borderRadius: '5.625rem 1.25rem 0 0' }}
                >
                  <img
                    src={member.image}
                    alt={member.name}
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 h-40 object-contain"
                  />
                </div>
                <div className={`text-center py-4 px-3 border border-t-0 rounded-b-lg ${member.borderClass}`}>
                  <h5 className="font-semibold text-base mb-0">{member.name}</h5>
                  <p className="text-gray-500 text-xs mb-0 leading-snug">
                    {member.role1}<br />{member.role2}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
