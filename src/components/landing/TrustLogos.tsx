export function TrustLogos() {
  const companies = [
    'Google',
    'Amazon',
    'Meta',
    'Microsoft',
    'Deloitte',
    'SAP',
  ];

  return (
    <section className="border-y border-border/40 bg-background py-12">
      <div className="container mx-auto px-4">
        <p className="mb-8 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Nossos alunos estão nas maiores techs e consultorias dos EUA
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          {companies.map((company) => (
            <span
              key={company}
              className="text-xl font-bold text-muted-foreground/40 transition-colors duration-300 hover:text-muted-foreground md:text-2xl"
            >
              {company}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
