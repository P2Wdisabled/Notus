"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import GoogleTestButton from "@/components/GoogleTestButton";
import { useLocalSession } from "@/hooks/useLocalSession";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Button,
  Input,
  Card,
  Alert,
  LoadingSpinner,
  Logo,
} from "@/components/ui";

function LoginPageClient({ serverSession }) {
  const { isLoggedIn, loading } = useLocalSession(serverSession);
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [password, setPassword] = useState("");

  // Clear only the password on auth error
  useEffect(() => {
    if (errorMessage) {
      setPassword("");
    }
  }, [errorMessage]);

  // Redirection si déjà connecté
  useEffect(() => {
    if (!loading && isLoggedIn) {
      router.push("/");
    }
  }, [isLoggedIn, loading, router]);

  // Affichage du loading pendant la vérification
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <Card.Header className="text-center">
          <Logo />
          <Card.Title className="text-4xl mb-2 font-light">
            Se connecter
          </Card.Title>
        </Card.Header>

        {/* Bouton Google */}
        <div className="mb-6">
          <GoogleSignInButton text="Se connecter avec Google" />
        </div>

        {/* Test Google OAuth */}
        <div className="mb-6">
          <GoogleTestButton />
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
          <form
            className="space-y-6 mb-0"
            onSubmit={async (e) => {
              e.preventDefault();
              setErrorMessage("");
              setIsPending(true);
              try {
                const formData = new FormData(e.currentTarget);
                const email = (formData.get("email") || "").toString();
                const passwordValue = (
                  formData.get("password") || ""
                ).toString();

                if (!email || !passwordValue) {
                  setErrorMessage(
                    "Veuillez renseigner votre identifiant et votre mot de passe."
                  );
                  setIsPending(false);
                  return;
                }

                const result = await signIn("credentials", {
                  redirect: false,
                  callbackUrl: "/",
                  email,
                  password: passwordValue,
                });

                if (result?.ok && !result.error) {
                  router.push("/");
                } else {
                  setErrorMessage(
                    "Email ou mot de passe incorrect, ou email non vérifié."
                  );
                }
              } catch (err) {
                setErrorMessage("Une erreur est survenue.");
              } finally {
                setIsPending(false);
              }
            }}
          >
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
            <div className="mb-0">
              <div className="flex justify-between items-center mb-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-dark-gray dark:text-gray"
                >
                  Mot de passe
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-dark-gray dark:text-gray hover:text-light-gray dark:hover:text-white font-medium"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errorMessage || undefined}
                enablePasswordToggle
              />
            </div>
            <Card.Footer className="text-center">
              <p className="text-dark-gray dark:text-gray py-4">
                Pas encore de compte ?{" "}
                <Button variant="link" asChild>
                  <Link
                    className="text-orange dark:text-dark-purple"
                    href="/register"
                  >
                    S'inscrire
                  </Link>
                </Button>
              </p>
            </Card.Footer>
            {/* Bouton de soumission */}
            <Button
              type="submit"
              disabled={isPending}
              loading={isPending}
              className="w-full text-black dark:text-white"
            >
              {isPending ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
        </Card.Content>
        <Card.Footer className="text-center p-2">
          <Link href="/" className="text-dark-gray dark:text-gray">
            Continuer en tant que personne anonyme
          </Link>
        </Card.Footer>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return <LoginPageClient serverSession={null} />;
}
