import { NextResponse } from "next/server";
import { DocumentService } from "@/lib/services/DocumentService";
import { auth } from "../../../../../auth";

const documentService = new DocumentService();

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID du document requis" },
        { status: 400 }
      );
    }

    const documentId = parseInt(id);
    if (isNaN(documentId) || documentId <= 0) {
      return NextResponse.json(
        { success: false, error: "ID du document invalide" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur est propriétaire du document
    await documentService.initializeTables();
    const docResult = await documentService.getDocumentById(documentId);
    
    if (!docResult.success || !docResult.document) {
      return NextResponse.json(
        { success: false, error: "Document non trouvé" },
        { status: 404 }
      );
    }

    const document = docResult.document;
    const userId = parseInt(session.user.id);
    
    // Vérifier que l'utilisateur est propriétaire du document
    if (Number(document.user_id) !== userId) {
      return NextResponse.json(
        { success: false, error: "Accès refusé - Vous devez être propriétaire du document pour voir la liste d'accès" },
        { status: 403 }
      );
    }

    const result = await documentService.fetchDocumentAccessList(documentId);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Accès non trouvé" },
        { status: 404 }
      );
    }

  return NextResponse.json({ success: true, accessList: result.data?.accessList ?? [] });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
