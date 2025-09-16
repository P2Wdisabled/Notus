"use client";

import { signOut } from "next-auth/react";
import { clearUserSession } from "@/lib/session-utils";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LogoutPageClient() {
  const router = useRouter();

  useEffect(() => {
    // Nettoyer la session sessionStorage
    clearUserSession();

    // Déconnexion NextAuth avec redirection vers la page d'accueil
    signOut({
      callbackUrl: "/",
      redirect: true,
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Déconnexion en cours...
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Nettoyage de la session et redirection...
        </p>
      </div>
    </div>
  );
}
