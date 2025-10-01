import { auth } from "@/../auth";
import Link from "next/link";
import { getUserDocumentsAction } from "@/lib/actions";
import DocumentCard from "@/components/DocumentCard";
import LocalDocumentsList from "@/components/LocalDocumentsList";
import Navigation from "@/components/Navigation";
import NavBar from "@/components/NavBar";
import { Button, Card, Alert, LoadingSpinner, Logo } from "@/components/ui";

export default async function Home() {
  const session = await auth();

  // Récupérer les documents seulement si l'utilisateur est connecté
  const documentsResult = session?.user?.id
    ? await getUserDocumentsAction(session.user.id)
    : { success: true, documents: [] };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Persistent sidebar on md+ */}
      <NavBar />
      <div className="md:ml-64 md:max-w-4/5 max-w-4xl mx-auto px-4 md:px-auto py-3 pt-10">

        {/* Fil d'actualité */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-black dark:text-white hidden md:block">
            Mes notes
          </h2>

          {!session?.user && (
            <LocalDocumentsList />
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
            documentsResult.documents.length > 0 && (
              <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">
                {documentsResult.documents.map((document) => (
                  <div key={document.id} className="w-full">
                    <DocumentCard
                      document={document}
                      currentUserId={session.user.id}
                    />
                  </div>
                ))}
              </div>
            )}

          {session?.user && !documentsResult.success && (
            <Alert variant="error">
              <Alert.Description>
                Erreur lors du chargement des documents: {documentsResult.error}
              </Alert.Description>
            </Alert>
          )}
        </div>
      </div>
      {!session?.user && (
        <div className="fixed bottom-0 left-0 right-0 z-10 px-0 md:px-4">
          <div className="md:ml-64 md:max-w-4/5 max-w-4xl mx-auto py-3 bg-orange dark:bg-dark-purple text-white text-center">
            Vous n'êtes pas connecté. Vos notes locales ne seront pas sauvegardées dans le cloud.
          </div>
        </div>
      )}
    </div>
  );
}
