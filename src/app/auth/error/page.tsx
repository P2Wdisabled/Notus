"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, Button, Alert } from "@/components/ui";

const errorMessages: Record<string, string> = {
  Configuration: "Il y a un problème avec la configuration du serveur.",
  AccessDenied: "Vous n'avez pas la permission de vous connecter.",
  Verification: "Le token de vérification a expiré ou a déjà été utilisé.",
  Default: "Une erreur inattendue s'est produite.",
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams?.get("error");

  const getErrorMessage = (error: string | null): string => {
    if (!error) return errorMessages.Default;
    return errorMessages[error] || errorMessages.Default;
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <Card.Header className="text-center">
          <Card.Title className="text-2xl mb-4 text-destructive">
            Erreur d'authentification
          </Card.Title>
        </Card.Header>

        <Card.Content className="space-y-4">
          <Alert variant="error">
            {getErrorMessage(error || null)}
          </Alert>

          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              Veuillez réessayer ou contacter le support si le problème persiste.
            </p>
          </div>
        </Card.Content>

        <Card.Footer className="flex flex-col space-y-2">
          <Button asChild className="w-full">
            <Link href="/login">
              Retour à la connexion
            </Link>
          </Button>

          <Button variant="outline" asChild className="w-full">
            <Link href="/">
              Retour à l'accueil
            </Link>
          </Button>
        </Card.Footer>
      </Card>
    </main>
  );
}

