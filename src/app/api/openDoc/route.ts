import { NextResponse } from "next/server";
import { DocumentService } from "@/lib/services/DocumentService";

const documentService = new DocumentService();

export async function GET(request: Request) {
  try {
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

    const result = await documentService.getDocumentById(documentId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Document non trouvé" },
        { status: 404 }
      );
    }

    const doc = result.document!;

    // Retourner le titre, le contenu, les tags et la date de mise à jour
    const response = {
      success: true,
      title: doc.title,
      content: doc.content,
      tags: doc.tags || [],
      updated_at: doc.updated_at,
      user_id: Number(doc.user_id ?? null),
    };
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
