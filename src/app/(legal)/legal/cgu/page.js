import Link from "next/link";
import { Button, Card } from "@/components/ui";

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <Card.Title className="text-3xl">
                Conditions Générales d'Utilisation
              </Card.Title>
              <Button asChild>
                <Link href="/">← Retour à l'accueil</Link>
              </Button>
            </div>
          </Card.Header>
          <Card.Content>

          <div className="prose prose-lg max-w-none dark:prose-invert">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
              Dernière mise à jour : 18 septembre 2025
            </p>

            <p className="mb-6">
              Bienvenue sur Notus. Veuillez lire attentivement les présentes
              conditions générales d'utilisation qui régissent l'utilisation de
              notre application mobile.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
              1. Acceptation des Conditions
            </h2>
            <p>
              En accédant ou en utilisant Notus, vous acceptez d'être lié par
              ces Conditions Générales d'Utilisation. Si vous n'acceptez pas ces
              conditions, veuillez ne pas utiliser notre service.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
              2. Description du Service
            </h2>
            <p>
              Notus est un application mobile qui permet aux utilisateurs de
              utiliser notre application mobile et ses fonctionnalités.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
              3. Inscription et Compte
            </h2>
            <p>
              Pour utiliser certaines fonctionnalités de notre service, vous
              pourriez devoir créer un compte. Vous êtes responsable de
              maintenir la confidentialité de vos informations de connexion et
              de toutes les activités qui se produisent sous votre compte.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
              4. Propriété Intellectuelle
            </h2>
            <p>
              Le contenu, les fonctionnalités et la disponibilité de Notus sont
              notre propriété exclusive et sont protégés par les lois sur la
              propriété intellectuelle.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
              5. Collecte et Utilisation des Données
            </h2>
            <ul className="list-disc pl-6 mb-4">
              <li>
                Nous collectons les données personnelles suivantes : adresses
                email.
              </li>
              <li>
                Ces données sont utilisées uniquement pour fournir et améliorer
                notre service. Nous ne vendrons ni ne louerons vos informations
                personnelles à des tiers sans votre consentement explicite, sauf
                si la loi l'exige.
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
              6. Services Tiers
            </h2>
            <p>
              Notre service n'utilise aucun service tiers pour son
              fonctionnement.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
              7. Limitation de Responsabilité
            </h2>
            <p>
              Notus est fourni "tel quel" sans garantie d'aucune sorte. Nous ne
              garantissons pas que notre service sera ininterrompu, opportun,
              sécurisé ou sans erreur.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
              8. Modifications des CGU
            </h2>
            <p>
              Nous nous réservons le droit de modifier ces conditions à tout
              moment. Les modifications entrent en vigueur dès leur publication
              sur Notus.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
              9. Résiliation
            </h2>
            <p>
              Nous nous réservons le droit de résilier ou de restreindre votre
              accès à notre service, sans préavis, pour toute raison ou sans
              raison.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
              10. Loi Applicable
            </h2>
            <p>
              Ces conditions sont régies par la loi française. Tout litige
              relatif à l'interprétation ou à l'exécution de ces CGU sera soumis
              aux tribunaux compétents de Paris, France.
            </p>
            <p>
              Conformément à la loi "Informatique et Libertés" du 6 janvier 1978
              modifiée et au Règlement Général sur la Protection des Données
              (RGPD), vous disposez d'un droit d'accès, de rectification et de
              suppression de vos données personnelles.
            </p>
          </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
