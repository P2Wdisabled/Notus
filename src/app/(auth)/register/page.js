"use client";

import { useActionState } from "react";
import { registerUser } from "@/lib/actions";
import Link from "next/link";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { useLocalSession } from "@/hooks/useLocalSession";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button, Input, Card, Alert, LoadingSpinner } from "@/components/ui";

function RegisterPageClient({ serverSession }) {
  const { isLoggedIn, loading } = useLocalSession(serverSession);
  const router = useRouter();
  const [message, formAction, isPending] = useActionState(
    registerUser,
    undefined
  );

  // Redirection si déjà connecté
  useEffect(() => {
    if (!loading && isLoggedIn) {
      router.push("/");
    }
  }, [isLoggedIn, loading, router]);

  // Affichage du loading pendant la vérification
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <LoadingSpinner.Card
          message="Vérification..."
          className="max-w-md w-full"
        />
      </div>
    );
  }

  // Ne pas afficher le formulaire si déjà connecté
  if (isLoggedIn) {
    return null;
  }

  if (message && message.includes("réussie")) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-2xl">✓</span>
          </div>
          <Card.Title className="text-2xl mb-4">
            Inscription réussie !
          </Card.Title>
          <Card.Description className="mb-6">
            Un email de vérification a été envoyé à votre adresse email.
            Veuillez cliquer sur le lien dans l'email pour activer votre compte.
          </Card.Description>
          <Button asChild>
            <Link href="/login">Se connecter</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <Card.Header className="text-center">
          <Card.Title className="text-3xl mb-2">Créer un compte</Card.Title>
          <Card.Description>Rejoignez notre communauté</Card.Description>
        </Card.Header>

        {/* Bouton Google */}
        <div className="mb-6">
          <GoogleSignInButton text="S'inscrire avec Google" />
        </div>

        {/* Séparateur */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              ou
            </span>
          </div>
        </div>

        <Card.Content>
          <form action={formAction} className="space-y-6">
            {/* Prénom et Nom */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Prénom *"
                type="text"
                id="firstName"
                name="firstName"
                required
                minLength={2}
                placeholder="Votre prénom"
              />

              <Input
                label="Nom *"
                type="text"
                id="lastName"
                name="lastName"
                required
                minLength={2}
                placeholder="Votre nom"
              />
            </div>

            {/* Email */}
            <Input
              label="Email *"
              type="email"
              id="email"
              name="email"
              required
              placeholder="votre@email.com"
            />

            {/* Nom d'utilisateur */}
            <Input
              label="Nom d'utilisateur *"
              type="text"
              id="username"
              name="username"
              required
              minLength={3}
              pattern="[a-zA-Z0-9_]+"
              placeholder="nom_utilisateur"
            />

            {/* Mot de passe */}
            <Input
              label="Mot de passe *"
              type="password"
              id="password"
              name="password"
              required
              minLength={8}
              placeholder="Votre mot de passe"
              helperText="Au moins 8 caractères avec majuscules, minuscules, chiffres et caractères spéciaux"
            />

            {/* Acceptation des conditions d'utilisation */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="acceptTerms"
                  name="acceptTerms"
                  type="checkbox"
                  required
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div className="ml-3 text-sm">
                <label
                  htmlFor="acceptTerms"
                  className="text-gray-700 dark:text-gray-300"
                >
                  Je confirme avoir lu et accepté les{" "}
                  <Link
                    href="/legal/cgu"
                    target="_blank"
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
                  >
                    conditions générales d&apos;utilisation
                  </Link>{" "}
                  et les{" "}
                  <Link
                    href="/legal/rgpd"
                    target="_blank"
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
                  >
                    mentions légales RGPD
                  </Link>
                  . *
                </label>
              </div>
            </div>

            {/* Message d'erreur */}
            {message && !message.includes("réussie") && (
              <Alert variant="error">
                <Alert.Description>{message}</Alert.Description>
              </Alert>
            )}

            {/* Bouton de soumission */}
            <Button
              type="submit"
              disabled={isPending}
              loading={isPending}
              className="w-full"
              size="lg"
            >
              {isPending ? "Création du compte..." : "Créer mon compte"}
            </Button>
          </form>
        </Card.Content>

        <Card.Footer className="text-center">
          <p className="text-gray-600 dark:text-gray-300">
            Déjà un compte ?{" "}
            <Button variant="link" asChild>
              <Link href="/login">Se connecter</Link>
            </Button>
          </p>
        </Card.Footer>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return <RegisterPageClient serverSession={null} />;
}
