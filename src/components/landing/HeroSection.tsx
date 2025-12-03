import Link from "next/link";
import { Button } from "@/components/ui";

interface HeroSectionProps {
  isLoggedIn: boolean;
}

const highlights = [
  { label: "Documents créés", value: "150k+" },
  { label: "Equipes actives", value: "2 800+" },
  { label: "Satisfaction", value: "4.9/5" },
];

export default function HeroSection({ isLoggedIn }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <header>
            <p className="inline-flex items-center rounded-full border border-border px-4 py-1 text-sm text-muted-foreground mb-6">
              Productivité augmentée en quelques minutes
            </p>
            <h1 className="font-title text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Centralisez vos documents,
              <span className="text-primary"> collaborez sans friction</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl">
              Notus est votre espace sécurisé pour rédiger, structurer et partager toutes vos connaissances.
              Synchronisé en temps réel, pensé pour les équipes exigeantes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              {isLoggedIn ? (
                <Button asChild size="lg" className="text-base px-8 py-6">
                  <Link href="/app">Accéder à mes documents</Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="text-base px-8 py-6">
                    <Link href="/register">Commencer gratuitement</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="text-base px-8 py-6">
                    <Link href="/login">Voir une démonstration</Link>
                  </Button>
                </>
              )}
            </div>
          </header>

          <section className="grid gap-6">
            <article className="rounded-3xl border border-border bg-card/60 p-6 shadow-lg">
              <h3 className="font-title text-2xl text-foreground mb-3">Une plateforme unique</h3>
              <p className="text-muted-foreground mb-6">
                Créez vos notes, briefs et synthèses dans un éditeur moderne pensé pour le travail collaboratif.
              </p>
              <div className="grid grid-cols-3 gap-4">
                {highlights.map((item) => (
                  <div key={item.label} className="rounded-xl bg-secondary/30 p-4 text-center">
                    <p className="font-title text-2xl text-foreground">{item.value}</p>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </div>
      </div>
    </section>
  );
}

