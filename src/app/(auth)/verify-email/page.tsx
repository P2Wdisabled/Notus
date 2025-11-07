"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Card, Alert, LoadingSpinner } from "@/components/ui";

type Status = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token de vérification manquant");
      return;
    }

    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch("/api/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus("success");
        setMessage(data.message);
      } else {
        setStatus("error");
        setMessage(data.error || "Erreur lors de la vérification");
      }
    } catch (error) {
      setStatus("error");
      setMessage("Erreur de connexion. Veuillez réessayer.");
    }
  };

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <LoadingSpinner.Card
          message="Vérification en cours..."
          className="max-w-md w-full"
        />
      </main>
    );
  }

  if (status === "success") {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <Card.Content>
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-primary-foreground text-2xl">✓</span>
            </div>
            <Card.Title className="text-2xl mb-4">Email vérifié !</Card.Title>
            <Card.Description className="mb-6">
              {message ||
                "Votre adresse email a été vérifiée avec succès. Vous pouvez maintenant vous connecter."}
            </Card.Description>
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/login">Se connecter</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/">Retour à l'accueil</Link>
              </Button>
            </div>
          </Card.Content>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <Card.Content>
          <div className="w-16 h-16 bg-destructive rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-destructive-foreground text-2xl">✗</span>
          </div>
          <Card.Title className="text-2xl mb-4">Erreur de vérification</Card.Title>
          <Card.Description className="mb-6">
            {message ||
              "Une erreur est survenue lors de la vérification de votre email."}
          </Card.Description>
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/register">Réessayer l'inscription</Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/">Retour à l'accueil</Link>
            </Button>
          </div>
        </Card.Content>
      </Card>
    </main>
  );
}

