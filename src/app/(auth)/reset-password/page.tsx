"use client";

import { useActionState } from "react";
import { resetPasswordAction } from "@/lib/actions";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, Input, Card, Alert } from "@/components/ui";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");

  const [message, formAction, isPending] = useActionState(
    resetPasswordAction,
    undefined
  );

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <Card.Header>
            <Card.Title className="text-3xl mb-4">Token invalide</Card.Title>
            <Card.Description className="mb-6">
              Le lien de réinitialisation est invalide ou a expiré.
            </Card.Description>
          </Card.Header>
          <Card.Footer>
            <Button asChild className="py-2 px-4 text-lg">
              <Link href="/forgot-password">Demander un nouveau lien</Link>
            </Button>
          </Card.Footer>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <Card.Header className="text-center">
          <Card.Title className="text-3xl mb-2">Nouveau mot de passe</Card.Title>
          <Card.Description>Entrez votre nouveau mot de passe</Card.Description>
        </Card.Header>

        <Card.Content>
          <form action={formAction} className="space-y-6">
            <input type="hidden" name="token" value={token} />

            {/* Nouveau mot de passe */}
            <Input
              label="Nouveau mot de passe"
              type="password"
              id="password"
              name="password"
              required
              minLength={6}
              placeholder="Votre nouveau mot de passe"
            />

            {/* Confirmation du mot de passe */}
            <Input
              label="Confirmer le mot de passe"
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              required
              minLength={6}
              placeholder="Confirmez votre nouveau mot de passe"
            />

            {/* Message de succès/erreur */}
            {message && (
              <Alert
                variant={
                  message.includes("réussi") || message.includes("modifié")
                    ? "success"
                    : "error"
                }
              >
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
              {isPending
                ? "Modification en cours..."
                : "Modifier le mot de passe"}
            </Button>
          </form>
        </Card.Content>

        <Card.Footer className="text-center">
          <p className="text-foreground">
            Vous vous souvenez de votre mot de passe ?{" "}
            <Button variant="link" asChild>
              <Link href="/login">Se connecter</Link>
            </Button>
          </p>
        </Card.Footer>
      </Card>
    </div>
  );
}

