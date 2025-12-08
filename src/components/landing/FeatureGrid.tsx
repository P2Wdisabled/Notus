import { Card } from "@/components/ui";
import Icon, { type IconName } from "@/components/Icon";
import SectionHeading from "./SectionHeading";

interface Feature {
  title: string;
  description: string;
  icon: IconName;
  highlight?: string;
}

const features: Feature[] = [
  {
    title: "Éditeur",
    description: "Mise en forme avancée, composants collaboratifs, mentions et intégrations médias.",
    icon: "note",
    highlight: "Temps réel",
  },
  {
    title: "Collaboration instantanée",
    description: "Invitez vos coéquipiers, assignez des tâches et discutez directement dans le document.",
    icon: "users",
    highlight: "Accès partagé",
  },
  {
    title: "Synthèses IA",
    description: "Résumez vos notes en un clic grâce à notre moteur de synthèse contextuelle.",
    icon: "sparkles",
    highlight: "IA intégrée",
  },
  {
    title: "Organisation claire",
    description: "Classez vos notes par dossiers et tags. Trouvez la bonne information immédiatement.",
    icon: "folder",
  },
  {
    title: "Historique complet",
    description: "Revenez sur n'importe quelle version de votre document et comparez les modifications.",
    icon: "clock",
  },
  {
    title: "Commentaires contextualisés",
    description: "Ajoutez des annotations ciblées et recevez des notifications personnalisées.",
    icon: "comment",
  },
  {
    title: "Recherche intelligente",
    description: "Filtres, tags... retrouvez en quelques secondes la bonne note.",
    icon: "search",
  },
  {
    title: "Partage sécurisé",
    description: "Définissez des niveaux d’accès précis. Notus respecte vos exigences RGPD.",
    icon: "shieldCheck",
  },
  {
    title: "Favoris rapides",
    description: "Epinglez vos documents critiques pour les retrouver instantanément.",
    icon: "star",
  },
];

export default function FeatureGrid() {
  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Fonctionnalités"
          title="Tout ce dont votre équipe a besoin"
          description="Des outils puissants et simples d’utilisation pour accompagner chaque étape de votre flux documentaire."
        />
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="h-full p-6 border-border flex flex-col gap-4">
              <div className="inline-flex items-center gap-3">
                <span className="p-3 rounded-xl bg-primary/10 text-primary">
                  <Icon name={feature.icon} className="w-6 h-6" aria-hidden="true" />
                </span>
                {feature.highlight && (
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                    {feature.highlight}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-title text-xl font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

