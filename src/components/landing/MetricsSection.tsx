import SectionHeading from "./SectionHeading";

const metrics = [
  { label: "Temps gagné par semaine", value: "2 min", detail: "sur la préparation et le partage de documents" },
  { label: "Documents collaboratifs/mois", value: "8+", detail: "créés par nos utilisateurs actifs" },
  { label: "Réduction des erreurs", value: "-10%", detail: "grâce à l’historique et la validation intégrée" },
];

export default function MetricsSection() {
  return (
    <section id="metrics" className="py-20 bg-card/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Impact mesuré"
          title="Des résultats tangibles dès le premier mois"
          description="Notus apporte de la clarté et supprime les frictions liées à la documentation."
        />
        <dl className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-border bg-background/60 p-6 text-center">
              <dt className="text-sm text-muted-foreground">{metric.label}</dt>
              <dd className="font-title text-4xl text-foreground my-3">{metric.value}</dd>
              <p className="text-sm text-muted-foreground">{metric.detail}</p>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

