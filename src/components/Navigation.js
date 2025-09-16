"use client";

import Link from "next/link";
import { useLocalSession } from "@/hooks/useLocalSession";
import { signOut } from "next-auth/react";
import { clearUserSession } from "@/lib/session-utils";
import { useRouter } from "next/navigation";

export default function Navigation({ serverSession }) {
  const {
    session: localSession,
    loading,
    isLoggedIn,
    userName,
    logout,
  } = useLocalSession(serverSession);
  const router = useRouter();

  const handleLogout = async () => {
    // Nettoyer la session localStorage
    logout();

    // Déconnexion NextAuth
    await signOut({
      callbackUrl: "/",
      redirect: false,
    });

    // Redirection manuelle
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-4">
        <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-8 w-20 rounded"></div>
        <div className="animate-pulse bg-gray-300 dark:bg-gray-600 h-8 w-20 rounded"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex items-center space-x-4">
        <Link
          href="/register"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          S'inscrire
        </Link>
        <Link
          href="/login"
          className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <span className="text-gray-700 dark:text-gray-300">
        Bonjour, <strong>{userName}</strong>
      </span>
      <Link
        href="/profile"
        className="text-blue-600 hover:text-blue-700 font-semibold"
      >
        Mon profil
      </Link>
      <button
        onClick={handleLogout}
        className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
      >
        Se déconnecter
      </button>
    </div>
  );
}
