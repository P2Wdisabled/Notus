import { getServerSession } from "next-auth/next";
import { authOptions } from "@/../lib/auth";
import NavBar from "@/components/NavBar";
import ContentWrapper from "@/components/ContentWrapper";
import { Card, CardContent, CardHeader, CardTitle, Button, Alert } from "@/components/ui";
import { getUserTrashDocumentsAction, restoreTrashedDocumentFormAction } from "@/lib/actions";

export default async function TrashPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ? parseInt(String(session.user.id)) : undefined;

  const trashedResult = userId
    ? await getUserTrashDocumentsAction(userId)
    : { success: true, documents: [] } as any;

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <ContentWrapper maxWidth="lg">
        <div className="space-y-6">
          <h2 className="font-title text-4xl font-regular text-foreground hidden md:block">
            Corbeille
          </h2>

          {!trashedResult.success && session?.user && (
            <Alert variant="error">
              <Alert.Description>
                Erreur lors du chargement de la corbeille: {trashedResult.error}
              </Alert.Description>
            </Alert>
          )}

          <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">
            {(Array.isArray(trashedResult.documents) ? trashedResult.documents : []).map((t: any) => (
              <Card key={t.id}>
                <CardHeader>
                  <CardTitle className="truncate">{t.title || "Sans titre"}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-4">
                  <div className="text-sm text-muted-foreground">
                    Supprimé le {t.deleted_at ? new Date(t.deleted_at).toLocaleDateString() : ""}
                  </div>
                  <form action={restoreTrashedDocumentFormAction}>
                    <input type="hidden" name="trashId" value={String(t.id)} />
                    <Button type="submit" variant="default">Restaurer</Button>
                  </form>
                </CardContent>
              </Card>
            ))}
          </div>

          {trashedResult.success && (!trashedResult.documents || trashedResult.documents.length === 0) && (
            <div className="text-center py-10 text-muted-foreground">
              Aucune note dans la corbeille.
            </div>
          )}
        </div>
      </ContentWrapper>
    </div>
  );
}


