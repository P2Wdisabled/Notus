import SectionHeading from "./SectionHeading";
import { Card } from "@/components/ui";

const testimonials = [
  {
    name: "Moïse Aérien",
    role: "Développeuse, indépendante",
    quote:
      "Notus a réduit de moitié le temps de consolidation des notes internes. L’éditeur et les synthèses IA sont devenus indispensables pour rédiger des messages pour mes clients.",
  },
  {
    name: "Gastien Bitard",
    role: "CEO, DotTxt",
    quote:
      "Nous avons enfin un référentiel unique pour les équipes produit et support. Les dossiers partagés nous évitent de multiples réunions.",
  },
  {
    name: "Methane Manchot",
    role: "Chef de projet, Yanotela",
    quote:
      "Le suivi des versions et les commentaires contextualisés ont fluidifié nos validations. L’adoption a été immédiate.",
  },
];

export default function TestimonialSection() {
  return (
    <section id="testimonials" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Ils utilisent Notus"
          title="Des équipes exigeantes nous font confiance"
          description="PME, cabinets, scale-ups... tous gagnent en efficacité documentaire."
        />
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="h-full border-border p-6 flex flex-col gap-4">
              <p className="text-lg text-foreground">“{testimonial.quote}”</p>
              <div>
                <p className="font-semibold text-foreground">{testimonial.name}</p>
                <p className="text-sm text-muted-foreground">{testimonial.role}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

