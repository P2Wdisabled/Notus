import { getServerSession } from "next-auth/next";
import { authOptions } from "@/../lib/auth";
import { fetchSharedDocumentsAction } from "@/lib/actions/DocumentActions";
import { getFavoritesAction } from "@/lib/actions";
import NavBar from "@/components/navigation/NavBar";
import ContentWrapper from "@/components/common/ContentWrapper";
import {Alert} from "@/components/ui";
import { SearchableDocumentsList } from "@/components/documents/SearchableDocumentsList";

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

  // Also fetch current user's favorites so we can mark shared documents
  // as favorite when appropriate (some shared docs may have favori on the share row)
  const favoritesResult = session?.user?.email ? await getFavoritesAction() : { success: true, documents: [] };
  const favoriteIds = new Set<string>((favoritesResult.success ? favoritesResult.documents || [] : []).map((f: any) => String(f.id)));

  // Ensure favori flag is present and normalized for the UI
  const normalizedDocumentsWithFav = normalizedDocuments.map((d: any) => ({ ...d, favori: favoriteIds.has(String(d.id)) ? true : (d.favori ?? false) }));

  const listError = documentsResult.success ? undefined : (documentsResult.error || undefined);

  // Séparer les documents en deux catégories
  const currentUserId = session?.user?.id;
  const sharedWithMe = normalizedDocumentsWithFav.filter(doc => doc.user_id !== String(currentUserId));
  const sharedByMe = normalizedDocumentsWithFav.filter(doc => doc.user_id === String(currentUserId));

  return (
    <main className="min-h-screen bg-background">
      <NavBar />
      <ContentWrapper maxWidth="lg">
        <section className="space-y-8">
          <header>
            <h1 className="font-title text-4xl font-regular text-foreground hidden md:block">
              Notes partagées
            </h1>
          </header>

          {!documentsResult.success && session?.user && (
            <Alert variant="error">
              <Alert.Description>
                Erreur lors du chargement des documents: {documentsResult.error}
              </Alert.Description>
            </Alert>
          )}

          {/* Section des notes partagées avec moi */}
          <section className="space-y-4">
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
          </section>

          {/* Section des notes que j'ai partagées */}
          <section className="space-y-4">
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
          </section>
        </section>
      </ContentWrapper>
    </main>
  );
}

