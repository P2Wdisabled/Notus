import { getServerSession } from "next-auth/next";
import { authOptions } from "@/../lib/auth";
import { fetchSharedDocumentsAction } from "@/lib/actions/DocumentActions";
import NavBar from "@/components/NavBar";
import ContentWrapper from "@/components/ContentWrapper";
import {Alert} from "@/components/ui";
import { SearchableDocumentsList } from "@/components/SearchableDocumentsList";

export default async function Home() {
  const session = await getServerSession(authOptions);

  // Récupérer les documents partagés (avec et par l'utilisateur)
  const documentsResult = session?.user?.email
    ? await fetchSharedDocumentsAction()
    : { success: true, documents: [] };

  const normalizedDocuments = (documentsResult.success ? documentsResult.documents || [] : []).map((d: any) => ({
    ...d,
    id: String(d.id),
    user_id: d.user_id != null ? String(d.user_id) : undefined,
  }));

  const listError = documentsResult.success ? undefined : (documentsResult.error || undefined);

  // Séparer les documents en deux catégories
  const currentUserId = session?.user?.id;
  const sharedWithMe = normalizedDocuments.filter(doc => doc.user_id !== String(currentUserId));
  const sharedByMe = normalizedDocuments.filter(doc => doc.user_id === String(currentUserId));

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <ContentWrapper maxWidth="lg">
        <div className="space-y-8">
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

          {/* Section des notes partagées avec moi */}
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold text-foreground">
              Partagées avec moi ({sharedWithMe.length})
            </h3>
            {sharedWithMe.length > 0 ? (
              <SearchableDocumentsList
                documents={sharedWithMe}
                currentUserId={currentUserId}
                error={undefined}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Aucune note partagée avec vous pour le moment.
              </div>
            )}
          </div>

          {/* Section des notes que j'ai partagées */}
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold text-foreground">
              Mes notes partagées ({sharedByMe.length})
            </h3>
            {sharedByMe.length > 0 ? (
              <SearchableDocumentsList
                documents={sharedByMe}
                currentUserId={currentUserId}
                error={undefined}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Vous n'avez partagé aucune note pour le moment.
              </div>
            )}
          </div>
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

