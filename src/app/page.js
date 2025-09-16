import { auth } from "../../auth";
import Link from "next/link";
import { getAllDocumentsAction } from "@/lib/actions";
import DocumentCard from "@/components/DocumentCard";

export default async function Home() {
  const session = await auth();
  const documentsResult = await getAllDocumentsAction();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Bienvenue sur Notus
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Partagez ce qui vous passe par la tête
          </p>
          {session?.user && (
            <div className="mt-6 p-4 bg-green-100 dark:bg-green-900/20 rounded-lg max-w-md mx-auto">
              <p className="text-green-800 dark:text-green-200">
                Connecté en tant que <strong>{session.user.name}</strong>
              </p>
            </div>
          )}
        </header>

        {/* Fil d'actualité */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Documents récents
          </h2>

          {documentsResult.success &&
            documentsResult.documents.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 dark:text-gray-500 mb-4">
                  <svg
                    className="w-16 h-16 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Aucun document pour le moment
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {session?.user
                    ? "Créez votre premier document !"
                    : "Connectez-vous pour voir les documents"}
                </p>
              </div>
            )}

          {documentsResult.success &&
            documentsResult.documents.map((document) => (
              <DocumentCard
                key={document.id}
                document={document}
                currentUserId={session?.user?.id || null}
              />
            ))}

          {!documentsResult.success && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-400">
                Erreur lors du chargement des documents: {documentsResult.error}
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="text-center mt-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {session?.user ? (
              <>
                <Link
                  href="/profile"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center"
                >
                  Mon profil
                </Link>
                <Link
                  href="/logout"
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center"
                >
                  Se déconnecter
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center"
                >
                  S'inscrire
                </Link>
                <Link
                  href="/login"
                  className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-lg transition-colors text-center"
                >
                  Se connecter
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
