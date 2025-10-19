"use client";

import Link from "next/link";
import { useLocalSession } from "@/hooks/useLocalSession";
import { usePathname, useRouter } from "next/navigation";
import type { Session } from "next-auth";

interface FloatingCreateButtonProps {
  serverSession?: Session | null;
}

export default function FloatingCreateButton({ serverSession }: FloatingCreateButtonProps) {
  const { loading, isLoggedIn } = useLocalSession(serverSession);
  const pathname = usePathname();
  const router = useRouter();

  // Ne pas afficher le bouton sur certaines pages
  if (
    loading ||
    pathname === "/register" ||
    pathname === "/login" ||
    pathname === "/documents/new" ||
    pathname?.startsWith("/profile") ||
    (pathname?.startsWith("/documents/local/") &&
      pathname !== "/documents/local/new")
  ) {
    return null;
  }

  // Remonter le bouton si l'utilisateur n'est pas connecté sur la page d'accueil
  // bottom-32 pour laisser de la place à la barre de non-connexion ET à la barre de sélection
  const bottomClass =
    !isLoggedIn && pathname === "/" ? "bottom-32" : "bottom-20";

  // Choisir l'URL de destination selon le statut de connexion
  const createUrl = isLoggedIn ? "/documents/new" : "/documents/local/new";

  return (
    <button
      type="button"
      onClick={async () => {
        // Si non connecté, on crée une note locale sans vérification réseau
        if (!isLoggedIn) {
          router.push(createUrl);
          return;
        }

        console.log(`[CreateButton] Vérification de connexion avant création de note...`);
        try {
          const controller = new AbortController();
          const timeoutId = window.setTimeout(() => controller.abort(), 5000);
          const resp = await fetch("/api/admin/check-status", {
            method: "GET",
            cache: "no-store",
            credentials: "include",
            headers: { "cache-control": "no-cache" },
            signal: controller.signal,
          });
          window.clearTimeout(timeoutId);
          console.log(`[CreateButton] Réponse de vérification: ${resp.status} ${resp.ok ? "OK" : "FAIL"}`);
          if (resp.ok) {
            console.log(`[CreateButton] Connexion OK, redirection vers ${createUrl}`);
            router.push(createUrl);
          } else {
            console.log(`[CreateButton] Connexion échouée, affichage popin offline`);
            window.dispatchEvent(
              new CustomEvent("notus:offline-popin", {
                detail: {
                  message:
                    "Vous pourrez créer une note une fois la connexion rétablie.",
                  durationMs: 5000,
                },
              })
            );
          }
        } catch (error) {
          console.log(`[CreateButton] Erreur de vérification de connexion:`, error);
          window.dispatchEvent(
            new CustomEvent("notus:offline-popin", {
              detail: {
                message: "Vous pourrez créer une note une fois la connexion rétablie.",
                durationMs: 5000,
              },
            })
          );
        }
      }}
      className={`fixed ${bottomClass} right-[5%] whitespace-nowrap bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-10 group inline-flex items-center gap-3`}
      title={isLoggedIn ? "Créer une note" : "Créer une note locale"}
    >
      <span className="font-title text-xl">
        {isLoggedIn ? "Créer une note" : "Créer une note locale"}
      </span>
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v16m8-8H4"
        />
      </svg>
    </button>
  );
}

