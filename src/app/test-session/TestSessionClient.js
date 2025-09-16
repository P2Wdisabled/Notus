"use client";

import { useLocalSession } from "@/hooks/useLocalSession";
import { clearUserSession } from "@/lib/session-utils";

export default function TestSessionClient({ serverSession }) {
  const {
    session: localSession,
    loading,
    isLoggedIn,
    userId,
    userName,
    userEmail,
    logout,
  } = useLocalSession(serverSession);

  const handleClearSession = () => {
    clearUserSession();
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Test de Session
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Session Serveur (NextAuth)
          </h2>
          <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg overflow-auto text-sm">
            {JSON.stringify(serverSession, null, 2)}
          </pre>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Session LocalStorage
          </h2>
          <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg overflow-auto text-sm">
            {JSON.stringify(localSession, null, 2)}
          </pre>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            État de la Session
          </h2>
          <div className="space-y-2">
            <p>
              <strong>Chargement:</strong> {loading ? "Oui" : "Non"}
            </p>
            <p>
              <strong>Connecté:</strong> {isLoggedIn ? "Oui" : "Non"}
            </p>
            <p>
              <strong>ID Utilisateur:</strong> {userId || "Non défini"}
            </p>
            <p>
              <strong>Nom:</strong> {userName || "Non défini"}
            </p>
            <p>
              <strong>Email:</strong> {userEmail || "Non défini"}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Actions
          </h2>
          <div className="flex space-x-4">
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Déconnexion
            </button>
            <button
              onClick={handleClearSession}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Vider localStorage
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Recharger
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
