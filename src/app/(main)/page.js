import { auth } from "@/../auth";
import Link from "next/link";
import { getUserDocumentsAction } from "@/lib/actions";
import DocumentCard from "@/components/DocumentCard";
import Navigation from "@/components/Navigation";
import { Button, Card, Alert, LoadingSpinner } from "@/components/ui";

export default async function Home() {
  const session = await auth();

  // Récupérer les documents seulement si l'utilisateur est connecté
  const documentsResult = session?.user?.id
    ? await getUserDocumentsAction(session.user.id)
    : { success: true, documents: [] };

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

          {/* Navigation */}
          <div className="mt-6 flex justify-center">
            <Navigation serverSession={session} />
          </div>
        </header>

        {/* Fil d'actualité */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {session?.user ? "Mes documents" : "Documents"}
          </h2>

          {!session?.user && (
            <Card className="text-center py-12">
              <Card.Content>
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
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <Card.Title className="text-lg mb-2">
                  Connectez-vous pour voir vos documents
                </Card.Title>
                <Card.Description className="mb-4">
                  Vous devez être connecté pour accéder à vos documents
                  personnels.
                </Card.Description>
                <div className="flex justify-center space-x-4">
                  <Button asChild>
                    <Link href="/login">Se connecter</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/register">S'inscrire</Link>
                  </Button>
                </div>
              </Card.Content>
            </Card>
          )}

          {session?.user &&
            documentsResult.success &&
            documentsResult.documents.length === 0 && (
              <Card className="text-center py-12">
                <Card.Content>
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
                  <Card.Title className="text-lg mb-2">
                    Aucun document pour le moment
                  </Card.Title>
                  <Card.Description>
                    Créez votre premier document !
                  </Card.Description>
                </Card.Content>
              </Card>
            )}

          {session?.user &&
            documentsResult.success &&
            documentsResult.documents.map((document) => (
              <DocumentCard
                key={document.id}
                document={document}
                currentUserId={session.user.id}
              />
            ))}

          {session?.user && !documentsResult.success && (
            <Alert variant="error">
              <Alert.Description>
                Erreur lors du chargement des documents: {documentsResult.error}
              </Alert.Description>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
