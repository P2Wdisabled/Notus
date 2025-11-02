"use client";

import NavBar from "@/components/NavBar";
import Link from "next/link";
import { Button, Input, Modal } from "@/components/ui";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteAccountPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  useEffect(() => {
    if (successOpen) {
      const t = setTimeout(() => {
        // Rediriger vers le flux de déconnexion unifié (comme la navbar)
        router.push("/logout?immediate=1");
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [successOpen, router]);

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      {/* Back link */}
      <div className="md:ml-64 md:pl-4 pt-10">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 pb-4 hidden md:flex gap-4">
          <Link
            href="/profile"
            className="text-foreground font-semibold flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
          <h2 className="font-title text-4xl font-regular">Supprimer le compte</h2>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:ml-64 md:pl-4 pt-6">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 pb-10">
          <div className="max-w-2xl mx-auto space-y-8">
            {/* Conditions Section */}
            <div>
              <h3 className="text-foreground text-2xl font-title font-bold mb-4">
                Conditions :
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Après la suppression de votre compte, vos données seront conservées encore 30 jours après l'activation de la suppression de votre compte. Vos notes personnelles seront supprimées définitivement après ce délai passé. Vous serez également déconnecté de l'application.
              </p>
            </div>

            {/* Delete Account Section */}
            <div>
              <h3 className="text-foreground text-2xl font-title font-bold mb-4">
                Supprimer le compte
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Une fois avoir pris connaissance des conséquences, si vous voulez toujours supprimer votre compte, veuillez entrer votre mot de passe. Vous recevrez ensuite un email confirmant la suppression. Vous pourrez réactiver votre compte sous 30 jours.
              </p>

              {/* Password Input */}
              <div className="mb-6">
                <label className="text-foreground text-2xl font-title font-bold block mb-2.5">
                  Mot de passe
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Votre mot de passe"
                    className="bg-card text-foreground border-border pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Delete Button */}
              <div className="flex flex-col items-center gap-3">
                {!confirmOpen && message && (
                  <p className="text-sm text-muted-foreground text-center max-w-md">{message}</p>
                )}
                <Button
                  variant="danger"
                  className="px-6 py-2"
                  disabled={isLoading}
                  onClick={() => {
                    setMessage(null);
                    if (!password) {
                      setMessage("Veuillez saisir votre mot de passe.");
                      return;
                    }
                    setConfirmOpen(true);
                  }}
                >
                  {isLoading ? "Traitement..." : "Supprimer votre compte"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        size="sm"
        title="Confirmer la suppression ?"
        className="bg-background text-foreground border-2 border-primary text-center text-xl"
      >
        <div className="flex flex-col items-center text-center gap-4">
          <p className="text-muted-foreground">
            Cette action supprimera votre compte. Vous pourrez le réactiver pendant 30 jours.
          </p>
          {message && (
            <p className="text-sm text-red-600 text-center max-w-md">{message}</p>
          )}
          <div className="flex items-center gap-4 mt-2">
            <Button
              variant="danger"
              className="px-6 py-2"
              disabled={isLoading}
              onClick={async () => {
                try {
                  setIsLoading(true);
                  setMessage(null);
                  const res = await fetch("/api/delete-account", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ password }),
                  });
                  const data = await res.json();
                  if (!res.ok || !data.success) {
                    setMessage(data.error || "Suppression impossible. Réessayez.");
                    return;
                  }
                  setConfirmOpen(false);
                  setSuccessOpen(true);
                } catch (e) {
                  setMessage("Une erreur est survenue. Réessayez plus tard.");
                } finally {
                  setIsLoading(false);
                }
              }}
            >
              Confirmer
            </Button>
            <Button
              variant="ghost"
              className="px-6 py-2"
              onClick={() => setConfirmOpen(false)}
            >
              Annuler
            </Button>
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={successOpen}
        onClose={() => setSuccessOpen(false)}
        size="sm"
        title="Compte supprimé"
        className="bg-background text-foreground border-2 border-primary text-center text-xl"
      >
        <div className="flex flex-col items-center text-center gap-4">
          <p className="text-muted-foreground">
            Compte supprimé. Vous allez être déconnecté de l'application.
          </p>
        </div>
      </Modal>
    </div>
  );
}
