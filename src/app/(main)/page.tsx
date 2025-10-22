import { getServerSession } from "next-auth/next";
import { authOptions } from "@/../lib/auth";
import Link from "next/link";
import { getUserDocumentsAction } from "@/lib/actions";
import { fetchSharedDocumentsAction } from "@/lib/actions/DocumentActions";
import Navigation from "@/components/Navigation";
import NavBar from "@/components/NavBar";
import ContentWrapper from "@/components/ContentWrapper";
import { Button, Card, Alert, LoadingSpinner, Logo } from "@/components/ui";
import { SearchableDocumentsList } from "@/components/SearchableDocumentsList";

export default async function Home() {
  const session = await getServerSession(authOptions);

  // Récupérer les documents seulement si l'utilisateur est connecté
  const userDocumentsResult = session?.user?.id
    ? await getUserDocumentsAction(parseInt(session.user.id))
    : { success: true, documents: [] };

  const sharedDocumentsResult = session?.user?.email
    ? await fetchSharedDocumentsAction()
    : { success: true, documents: [] };

  const allDocuments = [
    ...(userDocumentsResult.success && Array.isArray(userDocumentsResult.documents)
      ? userDocumentsResult.documents
      : []),
    ...(sharedDocumentsResult.success && Array.isArray(sharedDocumentsResult.documents)
      ? sharedDocumentsResult.documents
      : []),
  ].map((d: any) => ({
    ...d,
    id: String(d.id),
    user_id: d.user_id != null ? String(d.user_id) : undefined,
  }));

  const documentsResult = {
    success: userDocumentsResult.success && sharedDocumentsResult.success,
    documents: allDocuments,
    error: !userDocumentsResult.success
      ? userDocumentsResult.error
      : !sharedDocumentsResult.success
      ? sharedDocumentsResult.error
      : undefined,
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <ContentWrapper maxWidth="lg">
        <div className="space-y-6">
          <h2 className="font-title text-4xl font-regular text-foreground hidden md:block">
            Mes notes
          </h2>

          {!documentsResult.success && session?.user && (
            <Alert variant="error">
              <Alert.Description>
                Erreur lors du chargement des documents: {documentsResult.error}
              </Alert.Description>
            </Alert>
          )}

          <SearchableDocumentsList
            documents={
              documentsResult.success && Array.isArray(documentsResult.documents)
                ? (documentsResult.documents as any[]).map((d) => ({
                    ...d,
                    id: String(d.id),
                    user_id: d.user_id != null ? String(d.user_id) : undefined,
                  }))
                : []
            }
            currentUserId={session?.user?.id ? String(session.user.id) : undefined}
            error={!documentsResult.success ? documentsResult.error : undefined}
          />
        </div>
      </ContentWrapper>
    </div>
  );
}

