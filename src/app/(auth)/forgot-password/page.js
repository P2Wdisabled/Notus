"use client";

import { useActionState } from "react";
import { sendPasswordResetEmailAction } from "@/lib/actions";
import Link from "next/link";
import { Button, Input, Card, Alert } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [message, formAction, isPending] = useActionState(
    sendPasswordResetEmailAction,
    undefined
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <Card.Header className="text-center">
          <Card.Title className="text-3xl mb-2">Mot de passe oublié</Card.Title>
          <Card.Description>
            Entrez votre email pour recevoir un lien de réinitialisation
          </Card.Description>
        </Card.Header>

        <Card.Content>
          <form action={formAction} className="space-y-6">
            {/* Email */}
            <Input
              label="Adresse email"
              type="email"
              id="email"
              name="email"
              required
              placeholder="votre@email.com"
            />

            {/* Message de succès/erreur */}
            {message && (
              <Alert
                variant={
                  message.includes("envoyé") || message.includes("réussi")
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
                ? "Envoi en cours..."
                : "Envoyer le lien de réinitialisation"}
            </Button>
          </form>
        </Card.Content>

        <Card.Footer className="text-center">
          <p className="text-gray-600 dark:text-gray-300">
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
