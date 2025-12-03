import Link from "next/link";
import Logo from "@/components/ui/logo";

interface LandingFooterProps {
  isLoggedIn: boolean;
}

export default function LandingFooter({ isLoggedIn }: LandingFooterProps) {
  return (
    <footer className="border-t border-border bg-card/50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <section>
            <Logo className="h-8 mb-4" />
            <p className="text-muted-foreground">
              Votre espace de travail collaboratif pour créer, organiser et partager vos documents.
            </p>
          </section>

          <section>
            <h3 className="font-title text-lg font-bold text-foreground mb-4">Légal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/legal/cgu" className="text-muted-foreground hover:text-foreground transition-colors">
                  Conditions Générales d&apos;Utilisation
                </Link>
              </li>
              <li>
                <Link href="/legal/rgpd" className="text-muted-foreground hover:text-foreground transition-colors">
                  Mentions légales RGPD
                </Link>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-title text-lg font-bold text-foreground mb-4">Navigation</h3>
            <ul className="space-y-2">
              {isLoggedIn ? (
                <li>
                  <Link href="/app" className="text-muted-foreground hover:text-foreground transition-colors">
                    Mes documents
                  </Link>
                </li>
              ) : (
                <>
                  <li>
                    <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                      Connexion
                    </Link>
                  </li>
                  <li>
                    <Link href="/register" className="text-muted-foreground hover:text-foreground transition-colors">
                      Inscription
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </section>
        </div>
        <p className="pt-8 border-t border-border text-center text-muted-foreground text-sm">
          © {new Date().getFullYear()} Notus. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}

