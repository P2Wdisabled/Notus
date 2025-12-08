"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui";

function LoginPageClient({ serverSession }: { serverSession: any }) {
  const { isLoggedIn, loading } = useLocalSession(serverSession);
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [password, setPassword] = useState("");
  const [reactivateOpen, setReactivateOpen] = useState(false);
  const [reactivateEmail, setReactivateEmail] = useState("");
  const [reactivateExpiresAt, setReactivateExpiresAt] = useState<string | null>(null);
  const [reactivateError, setReactivateError] = useState("");

  // Clear only the password on auth error
  useEffect(() => {
    if (errorMessage) {
      setPassword("");
    }
  }, [errorMessage]);

  // Redirection si déjà connecté
  useEffect(() => {
    if (!loading && isLoggedIn) {
      router.push("/app");
    }
  }, [isLoggedIn, loading, router]);

  // Affichage du loading pendant la vérification
  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <LoadingSpinner.Card
          message="Vérification..."
          className="max-w-md w-full"
        />
      </main>
    );
  }

  // Ne pas afficher le formulaire si déjà connecté
  if (isLoggedIn) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <Card.Header className="text-center">
          <Logo />
          <Card.Title className="text-4xl mb-2 font-light">
            Se connecter
          </Card.Title>
        </Card.Header>

        <Card.Content>
          {/* Bouton Google */}
          <div className="mb-6">
            <GoogleSignInButton text="Se connecter avec Google" />
          </div>

          {/* Séparateur */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">
                ou
              </span>
            </div>
          </div>

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

                // 1) Check if account is deleted but restorable
                try {
                  const checkRes = await fetch("/api/check-deleted-account", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                  });
                  if (checkRes.ok) {
                    const data = await checkRes.json();
                    if (data?.success && data.found) {
                      if (data.expired) {
                        setErrorMessage(
                          "Ce compte a été supprimé et le délai de restauration est dépassé."
                        );
                        setIsPending(false);
                        return;
                      }
                      // Prompt to reactivate
                      setReactivateEmail(email);
                      setReactivateExpiresAt(data.expiresAt || null);
                      setReactivateError("");
                      setReactivateOpen(true);
                      setIsPending(false);
                      return;
                    }
                  }
                } catch (_) {}

                // 2) Proceed with normal sign-in
                const result = await signIn("credentials", {
                  redirect: false,
                  callbackUrl: "/",
                  email,
                  password: passwordValue,
                });

                if (result?.ok && !result.error) {
                  router.push("/app");
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
              label="Email"
              type="text"
              id="email"
              name="email"
              required
              placeholder="votre@email.com"
            />

            {/* Mot de passe */}
            <div className="mb-0">
              <div className="flex justify-between items-center mb-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-foreground"
                >
                  Mot de passe
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-muted-foreground hover:text-foreground font-medium"
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
              <p className="text-muted-foreground py-4">
                Pas encore de compte ?{" "}
                <Button variant="link" asChild>
                  <Link
                    className="text-primary"
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
              className="w-full"
            >
              {isPending ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
        </Card.Content>
        <Card.Footer className="text-center p-2">
          <Link href="/" className="text-muted-foreground">
            Continuer en tant que personne anonyme
          </Link>
        </Card.Footer>
      </Card>
      {/* Reactivation dialog */}
      <Dialog open={reactivateOpen} onOpenChange={setReactivateOpen}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Réactiver votre compte ?</DialogTitle>
            <DialogDescription>
              Votre compte associé à {reactivateEmail} a été supprimé, mais peut
              encore être restauré{reactivateExpiresAt ? ` jusqu'au ${new Date(reactivateExpiresAt).toLocaleDateString()}` : ""}.
              Confirmez pour le réactiver.
            </DialogDescription>
          </DialogHeader>
          {reactivateError ? (
            <div className="text-destructive text-sm">{reactivateError}</div>
          ) : null}
          <DialogFooter>
            <Button
              className="px-6 py-2"
              variant="secondary"
              onClick={() => {
                setReactivateOpen(false);
              }}
            >
              Annuler
            </Button>
            <Button
              className="px-6 py-2"
              variant="primary"
              onClick={async () => {
                setReactivateError("");
                try {
                  const res = await fetch("/api/reactivate-account", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: reactivateEmail, password }),
                  });
                  const data = await res.json().catch(() => ({}));
                  if (!res.ok || !data?.success) {
                    setReactivateError(data?.error || "Impossible de réactiver le compte.");
                    return;
                  }
                  // After restore, sign-in directly
                  const result = await signIn("credentials", {
                    redirect: false,
                    callbackUrl: "/app",
                    email: reactivateEmail,
                    password,
                  });
                  if (result?.ok && !result.error) {
                    setReactivateOpen(false);
                    router.push("/app");
                  } else {
                    setReactivateError("La réactivation a réussi, mais la connexion a échoué.");
                  }
                } catch (e) {
                  setReactivateError("Erreur interne. Veuillez réessayer.");
                }
              }}
            >
              Réactiver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

export default function LoginPage() {
  return <LoginPageClient serverSession={null} />;
}

