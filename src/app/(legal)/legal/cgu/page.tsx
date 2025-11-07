import Link from "next/link";
import { Button, Card, Badge } from "@/components/ui";

export default function CGUPage() {
  const sections = [
    { id: "acceptation", title: "1. Acceptation des Conditions" },
    { id: "description", title: "2. Description du Service" },
    { id: "inscription", title: "3. Inscription et Compte" },
    { id: "propriete", title: "4. Propriété Intellectuelle" },
    { id: "donnees", title: "5. Collecte et Utilisation des Données" },
    { id: "tiers", title: "6. Services Tiers" },
    { id: "responsabilite", title: "7. Limitation de Responsabilité" },
    { id: "modifications", title: "8. Modifications des CGU" },
    { id: "resiliation", title: "9. Résiliation" },
    { id: "loi", title: "10. Loi Applicable" }
  ];

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header Section */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Conditions Générales d'Utilisation
          </h1>
          <Badge variant="outline" className="text-sm">
            Dernière mise à jour : 18 septembre 2025
          </Badge>
        </header>

        {/* Table des matières - Toujours en haut */}
        <section className="mb-8">
          <Card>
            <Card.Header>
              <Card.Title className="text-lg text-foreground">Table des matières</Card.Title>
            </Card.Header>
            <Card.Content>
              <nav className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="block text-sm text-muted-foreground hover:text-primary transition-colors py-2 px-3 rounded-md hover:bg-muted/50"
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            </Card.Content>
          </Card>
        </section>

        {/* Contenu principal */}
        <section className="max-w-4xl mx-auto">
          <Card>
            <Card.Content className="p-8">
              <div className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground">

                <div className="bg-primary/10 p-6 rounded-lg border-l-4 border-primary mb-8">
                  <p className="text-foreground leading-relaxed text-lg">
                    Bienvenue sur Notus. Veuillez lire attentivement les présentes
                    conditions générales d'utilisation qui régissent l'utilisation de
                    notre application mobile.
                  </p>
                </div>

                <section id="acceptation" className="mb-12">
                  <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
                    1. Acceptation des Conditions
                  </h2>
                  <div className="space-y-6">
                    <div className="bg-muted/30 p-6 rounded-lg">
                      <p className="text-foreground leading-relaxed">
                        En accédant ou en utilisant Notus, vous acceptez d'être lié par
                        ces Conditions Générales d'Utilisation. Si vous n'acceptez pas ces
                        conditions, veuillez ne pas utiliser notre service.
                      </p>
                    </div>
                  </div>
                </section>

                <section id="description" className="mb-12">
                  <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
                    2. Description du Service
                  </h2>
                  <div className="space-y-6">
                    <p className="text-foreground leading-relaxed">
                      Notus est une application mobile qui permet aux utilisateurs de
                      créer, gérer et organiser leurs documents et notes de manière
                      collaborative et sécurisée.
                    </p>
                  </div>
                </section>

                <section id="inscription" className="mb-12">
                  <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
                    3. Inscription et Compte
                  </h2>
                  <div className="space-y-6">
                    <div className="bg-muted/30 p-6 rounded-lg">
                      <p className="text-foreground leading-relaxed">
                        Pour utiliser certaines fonctionnalités de notre service, vous
                        pourriez devoir créer un compte. Vous êtes responsable de
                        maintenir la confidentialité de vos informations de connexion et
                        de toutes les activités qui se produisent sous votre compte.
                      </p>
                    </div>
                  </div>
                </section>

                <section id="propriete" className="mb-12">
                  <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
                    4. Propriété Intellectuelle
                  </h2>
                  <div className="space-y-6">
                    <div className="bg-primary/5 p-4 rounded-lg border-l-4 border-primary">
                      <p className="text-foreground leading-relaxed">
                        Le contenu, les fonctionnalités et la disponibilité de Notus sont
                        notre propriété exclusive et sont protégés par les lois sur la
                        propriété intellectuelle.
                      </p>
                    </div>
                  </div>
                </section>

                <section id="donnees" className="mb-12">
                  <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
                    5. Collecte et Utilisation des Données
                  </h2>
                  <div className="space-y-6">
                    <div className="bg-muted/30 p-6 rounded-lg">
                      <ul className="space-y-4">
                        <li className="flex items-start">
                          <span className="text-primary mr-3 font-bold">•</span>
                          <span className="text-foreground">
                            Nous collectons les données personnelles suivantes : nom, prénom, adresse email, nom d'utilisateur.
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-primary mr-3 font-bold">•</span>
                          <span className="text-foreground">
                            Ces données sont utilisées uniquement pour fournir et améliorer
                            notre service. Nous ne vendrons ni ne louerons vos informations
                            personnelles à des tiers sans votre consentement explicite, sauf
                            si la loi l'exige.
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section id="tiers" className="mb-12">
                  <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
                    6. Services Tiers
                  </h2>
                  <div className="space-y-6">
                    <div className="bg-primary/5 p-4 rounded-lg border-l-4 border-primary">
                      <p className="text-foreground leading-relaxed">
                        Notre service n'utilise aucun service tiers pour son
                        fonctionnement. Toutes les données restent sous notre contrôle exclusif.
                      </p>
                    </div>
                  </div>
                </section>

                <section id="responsabilite" className="mb-12">
                  <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
                    7. Limitation de Responsabilité
                  </h2>
                  <div className="space-y-6">
                    <div className="bg-muted/30 p-6 rounded-lg">
                      <p className="text-foreground leading-relaxed">
                        Notus est fourni "tel quel" sans garantie d'aucune sorte. Nous ne
                        garantissons pas que notre service sera ininterrompu, opportun,
                        sécurisé ou sans erreur.
                      </p>
                    </div>
                  </div>
                </section>

                <section id="modifications" className="mb-12">
                  <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
                    8. Modifications des CGU
                  </h2>
                  <div className="space-y-6">
                    <p className="text-foreground leading-relaxed">
                      Nous nous réservons le droit de modifier ces conditions à tout
                      moment. Les modifications entrent en vigueur dès leur publication
                      sur Notus.
                    </p>
                  </div>
                </section>

                <section id="resiliation" className="mb-12">
                  <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
                    9. Résiliation
                  </h2>
                  <div className="space-y-6">
                    <div className="bg-muted/30 p-6 rounded-lg">
                      <p className="text-foreground leading-relaxed">
                        Nous nous réservons le droit de résilier ou de restreindre votre
                        accès à notre service, sans préavis, pour toute raison ou sans
                        raison.
                      </p>
                    </div>
                  </div>
                </section>

                <section id="loi" className="mb-12">
                  <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
                    10. Loi Applicable
                  </h2>
                  <div className="space-y-6">
                    <div className="bg-primary/10 p-6 rounded-lg border-l-4 border-primary">
                      <p className="text-foreground leading-relaxed mb-4">
                        Ces conditions sont régies par la loi française. Tout litige
                        relatif à l'interprétation ou à l'exécution de ces CGU sera soumis
                        aux tribunaux compétents de Paris, France.
                      </p>
                    </div>
                    
                    <div className="bg-muted/30 p-6 rounded-lg">
                      <p className="text-foreground leading-relaxed">
                        Conformément à la loi "Informatique et Libertés" du 6 janvier 1978
                        modifiée et au Règlement Général sur la Protection des Données
                        (RGPD), vous disposez d'un droit d'accès, de rectification et de
                        suppression de vos données personnelles.
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </Card.Content>
          </Card>
        </section>

        {/* Footer avec bouton de retour */}
        <footer className="flex justify-center mt-12">
          <Button asChild className="py-2 px-4 text-lg">
            <Link href="/">Retour à l'accueil</Link>
          </Button>
        </footer>
      </div>
    </main>
  );
}

