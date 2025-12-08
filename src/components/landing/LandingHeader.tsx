import Link from "next/link";
import { Button } from "@/components/ui";
import Logo from "@/components/ui/logo";

interface LandingHeaderProps {
  isLoggedIn: boolean;
}

const navItems = [
  { label: "Fonctionnalités", href: "#features" },
  { label: "Processus", href: "#process" },
  { label: "Chiffres", href: "#metrics" },
  { label: "Avis", href: "#testimonials" },
];

export default function LandingHeader({ isLoggedIn }: LandingHeaderProps) {
  return (
    <header className="border-b border-border bg-card/70 backdrop-blur-xl sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Navigation principale">
        <div className="flex items-center justify-between h-16 gap-6">
          <Link href="/" className="flex items-center" aria-label="Accueil Notus">
            <Logo width={140} height={40} />
          </Link>

          <ul className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Button asChild size="sm" className="text-base px-4 py-2">
                <Link href="/app">Accéder à l&apos;application</Link>
              </Button>
            ) : (
              <>
                <Button asChild size="sm" variant="ghost" className="text-base px-4 py-2">
                  <Link href="/login">Connexion</Link>
                </Button>
                <Button asChild size="sm" className="text-base px-4 py-2">
                  <Link href="/register">Commencer</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

