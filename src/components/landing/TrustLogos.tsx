export function TrustLogos() {
  const companies = ['Google', 'Amazon', 'Meta', 'Microsoft', 'Deloitte', 'SAP', 'Apple', 'Spotify'];

  return (
    <section className="relative overflow-hidden border-y border-landing-border bg-landing-surface py-10">
      <p className="mb-6 text-center text-[10px] font-semibold uppercase tracking-[0.25em] text-landing-text-muted/60">
        Nossos alunos estão nas maiores techs e consultorias dos EUA
      </p>

      <div className="flex animate-marquee">
        {[...companies, ...companies].map((company, i) => (
          <span
            key={i}
            className="mx-8 shrink-0 text-xl font-semibold text-landing-text/10 transition-colors duration-300 hover:text-landing-text/40 md:mx-12 md:text-2xl"
          >
            {company}
          </span>
        ))}
      </div>
    </section>
  );
}
