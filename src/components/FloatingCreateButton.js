"use client";

import Link from "next/link";
import { useLocalSession } from "@/hooks/useLocalSession";
import { usePathname } from "next/navigation";

export default function FloatingCreateButton({ serverSession }) {
  const { loading, isLoggedIn } = useLocalSession(serverSession);
  const pathname = usePathname();

  // Ne pas afficher le bouton si l'utilisateur n'est pas connecté
  if (loading || pathname === "/register" || pathname === "/login" || pathname === "/documents/new" || pathname.startsWith("/profile") || pathname.startsWith("/documents/local/")) {
    return null;
  }

  // Remonter le bouton si l'utilisateur n'est pas connecté sur la page d'accueil
  const bottomClass = !isLoggedIn && pathname === "/" ? "bottom-20" : "bottom-6";

  return (
    <Link
      href="/documents/new"
      className={`fixed ${bottomClass} right-[5%] whitespace-nowrap bg-orange dark:bg-dark-purple dark:hover:bg-purple hover:bg-dark-orange text-black dark:text-white cursor-pointer px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-10 group inline-flex items-center gap-3`}
      title="Créer une note"
    >

      <span className="font-title text-xl">Créer une note </span>
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
  );
}
