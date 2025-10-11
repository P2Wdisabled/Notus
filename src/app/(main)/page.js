import { getServerSession } from "next-auth/next";
import { authOptions } from "@/../lib/auth";
import Link from "next/link";
import { getUserDocumentsAction } from "@/lib/actions";
import DocumentCard from "@/components/DocumentCard";
import LocalDocumentsList from "@/components/LocalDocumentsList";
import Navigation from "@/components/Navigation";
import NavBar from "@/components/NavBar";
import { Button, Card, Alert, LoadingSpinner, Logo } from "@/components/ui";
import { SearchableDocumentsList } from "@/components/SearchableDocumentsList";

export default async function Home() {
  const session = await getServerSession(authOptions);

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
          <h2 className="font-title text-4xl font-regular text-black dark:text-white hidden md:block">
            Mes notes
          </h2>

          {!session?.user && <LocalDocumentsList />}

          {session?.user && (
            <SearchableDocumentsList
              documents={
                documentsResult.success ? documentsResult.documents : []
              }
              currentUserId={session.user.id}
              error={!documentsResult.success ? documentsResult.error : null}
            />
          )}
        </div>
      </div>
      {!session?.user && (
        <div className="fixed bottom-0 left-0 right-0 z-10 px-0 md:px-4">
          <div className="md:ml-64 md:max-w-4/5 max-w-4xl mx-auto py-3 bg-orange dark:bg-dark-purple text-white text-center">
            Vous n'êtes pas connecté. Vos notes locales ne seront pas
            sauvegardées dans le cloud.
          </div>
        </div>
      )}
    </div>
  );
}
