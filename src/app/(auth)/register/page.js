"use client";

import { useActionState } from "react";
import { registerUser } from "@/lib/actions";
import Link from "next/link";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { useLocalSession } from "@/hooks/useLocalSession";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button, Input, Card, Alert, LoadingSpinner, Logo } from "@/components/ui";

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
      <div className="min-h-screen bg-gradient-to-br from-light-gray to-white dark:from-light-black dark:to-black flex items-center justify-center p-4">
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
      <div className="min-h-screen bg-gradient-to-br from-light-gray to-white dark:from-light-black dark:to-black flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-gradient-to-br from-light-gray to-white dark:from-light-black dark:to-black flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <Card.Header className="text-center">
        <Logo />
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
            <div className="w-full border-t border-gray dark:border-dark-gray" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-black text-dark-gray dark:text-gray">
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
              className="w-4 h-4 accent-orange dark:accent-dark-purple bg-white dark:bg-white border-orange dark:border-purple rounded"
            />
              </div>
              <div className="ml-3 text-sm">
                <label
                  htmlFor="acceptTerms"
                  className="text-dark-gray dark:text-gray"
                >
                  Je confirme avoir lu et accepté les{" "}
                  <Link
                    href="/legal/cgu"
                    target="_blank"
                    className="text-orange hover:text-dark-orange dark:text-dark-purple dark:hover:text-purple underline"
                  >
                    conditions générales d&apos;utilisation
                  </Link>{" "}
                  et les{" "}
                  <Link
                    href="/legal/rgpd"
                    target="_blank"
                    className="text-orange hover:text-dark-orange dark:text-dark-purple dark:hover:text-purple underline"
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
          <p className="text-dark-gray dark:text-gray">
            Déjà un compte ?{" "}
            <Button variant="link" asChild>
              <Link className="text-orange dark:text-dark-purple" href="/login">Se connecter</Link>
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
