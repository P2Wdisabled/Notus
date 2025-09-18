"use client";

import { useActionState } from "react";
import { authenticate } from "@/lib/actions";
import Link from "next/link";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { useLocalSession } from "@/hooks/useLocalSession";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button, Input, Card, Alert, LoadingSpinner } from "@/components/ui";

function LoginPageClient({ serverSession }) {
  const { isLoggedIn, loading } = useLocalSession(serverSession);
  const router = useRouter();
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <Card.Header className="text-center">
          <Card.Title className="text-3xl mb-2">Se connecter</Card.Title>
          <Card.Description>Accédez à votre compte</Card.Description>
        </Card.Header>

        {/* Bouton Google */}
        <div className="mb-6">
          <GoogleSignInButton text="Se connecter avec Google" />
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
            {/* Email/Pseudo */}
            <Input
              label="Email ou nom d'utilisateur"
              type="text"
              id="email"
              name="email"
              required
              placeholder="votre@email.com ou nom d'utilisateur"
            />

            {/* Mot de passe */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Mot de passe
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <Input
                type="password"
                id="password"
                name="password"
                required
                minLength={6}
                placeholder="Votre mot de passe"
              />
            </div>

            {/* Message d'erreur */}
            {errorMessage && (
              <Alert variant="error">
                <Alert.Description>{errorMessage}</Alert.Description>
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
              {isPending ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
        </Card.Content>

        <Card.Footer className="text-center">
          <p className="text-gray-600 dark:text-gray-300">
            Pas encore de compte ?{" "}
            <Button variant="link" asChild>
              <Link href="/register">S'inscrire</Link>
            </Button>
          </p>
        </Card.Footer>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return <LoginPageClient serverSession={null} />;
}
