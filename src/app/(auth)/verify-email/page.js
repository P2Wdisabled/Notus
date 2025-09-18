"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Card, Alert, LoadingSpinner } from "@/components/ui";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token de vérification manquant");
      return;
    }

    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (token) => {
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <LoadingSpinner.Card
          message="Vérification en cours..."
          className="max-w-md w-full"
        />
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <Card.Content>
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-white text-2xl">✓</span>
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <Card.Content>
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-2xl">✗</span>
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
    </div>
  );
}
