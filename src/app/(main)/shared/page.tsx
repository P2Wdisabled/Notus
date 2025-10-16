import { getServerSession } from "next-auth/next";
import { authOptions } from "@/../lib/auth";
import { fetchSharedDocumentsAction } from "@/lib/actions/DocumentActions";
import NavBar from "@/components/NavBar";
import ContentWrapper from "@/components/ContentWrapper";
import {Alert} from "@/components/ui";
import { SearchableDocumentsList } from "@/components/SearchableDocumentsList";

export default async function Home() {
  const session = await getServerSession(authOptions);

  // Récupérer les documents partagés avec l'utilisateur
  const documentsResult = session?.user?.email
    ? await fetchSharedDocumentsAction()
    : { success: true, documents: [] };

  const normalizedDocuments = (documentsResult.success ? documentsResult.documents || [] : []).map((d: any) => ({
    ...d,
    id: String(d.id),
    user_id: d.user_id != null ? String(d.user_id) : undefined,
  }));

  const listError = documentsResult.success ? undefined : (documentsResult.error || undefined);

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <ContentWrapper maxWidth="lg">
        <div className="space-y-6">
          <h2 className="font-title text-4xl font-regular text-foreground hidden md:block">
            Notes partagées
          </h2>

          {!documentsResult.success && session?.user && (
            <Alert variant="error">
              <Alert.Description>
                Erreur lors du chargement des documents: {documentsResult.error}
              </Alert.Description>
            </Alert>
          )}

          <SearchableDocumentsList
            documents={normalizedDocuments}
            currentUserId={session?.user?.id}
            error={listError}
          />
        </div>
      </ContentWrapper>
      {!session?.user && (
        <div className="fixed bottom-0 left-0 right-0 z-10">
          <div className="md:ml-64 md:pl-4 max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-3 bg-primary text-primary-foreground text-center">
            Vous n'êtes pas connecté. Vos notes locales ne seront pas
            sauvegardées dans le cloud.
          </div>
        </div>
      )}
    </div>
  );
}

