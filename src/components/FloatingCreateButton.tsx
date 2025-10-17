"use client";

import Link from "next/link";
import { useLocalSession } from "@/hooks/useLocalSession";
import { usePathname } from "next/navigation";
import { useSelection } from "@/contexts/SelectionContext";
import type { Session } from "next-auth";

interface FloatingCreateButtonProps {
  serverSession?: Session | null;
}

export default function FloatingCreateButton({ serverSession }: FloatingCreateButtonProps) {
  const { loading, isLoggedIn } = useLocalSession(serverSession);
  const { isSelectModeActive } = useSelection();
  const pathname = usePathname();

  // Ne pas afficher le bouton sur certaines pages
  if (
    loading ||
    pathname !== "/"
  ) {
    return null;
  }

  // Calculer la position du bouton en fonction de l'état de connexion et du mode sélection
  const getBottomClass = () => {
    const isHomePage = pathname === "/";
    const hasConnectionWarning = !isLoggedIn && isHomePage;
    
    if (isSelectModeActive && hasConnectionWarning) {
      // Mode sélection + avertissement de connexion : remonter pour éviter l'empilement
      return "bottom-32";
    } else {
      // Position fixe pour tous les autres cas (évite les mouvements)
      return "bottom-20";
    }
  };

  const bottomClass = getBottomClass();

  // Choisir l'URL de destination selon le statut de connexion
  const createUrl = isLoggedIn ? "/documents/new" : "/documents/local/new";

  return (
    <div className={`fixed ${bottomClass} left-0 right-0 z-10 px-0 md:ml-68 md:px-4`}>
      <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex justify-end">
          <Link
            href={createUrl}
            className="whitespace-nowrap bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer p-4 md:px-4 md:py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group inline-flex items-center gap-3"
            title={isLoggedIn ?  "Créer une note" : "Créer une note locale"}
          >
            <span className="font-title text-xl hidden md:inline">
              Créer une note
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
          </Link>
        </div>
      </div>
    </div>
  );
}

