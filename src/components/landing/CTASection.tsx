import Link from "next/link";
import { Button } from "@/components/ui";

interface CTASectionProps {
  isLoggedIn: boolean;
}

export default function CTASection({ isLoggedIn }: CTASectionProps) {
  return (
    <section className="py-20 bg-primary/5">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-title text-4xl sm:text-5xl font-bold text-foreground mb-6">
          Prêt à structurer vos connaissances ?
        </h2>
        <p className="text-xl text-muted-foreground mb-10">
          Notus se connecte en quelques minutes à votre organisation. Aucun déploiement complexe requis.
        </p>
        {isLoggedIn ? (
          <Button asChild size="lg" className="text-lg px-4 py-2">
            <Link href="/app">Accéder à l&apos;application</Link>
          </Button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-4 py-2">
              <Link href="/register">Créer un compte gratuit</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-4 py-2">
              <Link href="/login">Se connecter</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

