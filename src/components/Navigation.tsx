"use client";

import Link from "next/link";
import { useLocalSession } from "@/hooks/useLocalSession";
import AdminButton from "./AdminButton";
import type { Session } from "next-auth";

interface NavigationProps {
  serverSession?: Session | null;
}

export default function Navigation({ serverSession }: NavigationProps) {
  const { session: localSession, loading, isLoggedIn, userName } =
    useLocalSession(serverSession);

  if (loading) {
    return (
      <div className="flex items-center space-x-4">
        <div className="animate-pulse bg-gray dark:bg-dark-gray h-8 w-20 rounded"></div>
        <div className="animate-pulse bg-gray dark:bg-dark-gray h-8 w-20 rounded"></div>
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
          className="border border-gray dark:border-dark-gray hover:bg-light-gray dark:hover:bg-gray-700 text-gray-700 dark:text-gray font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <span className="text-gray-700 dark:text-gray">
        Bonjour, <strong>{userName}</strong>
      </span>
      <AdminButton />
    </div>
  );
}

