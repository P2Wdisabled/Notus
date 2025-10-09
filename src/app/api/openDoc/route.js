import { NextResponse } from "next/server";
import { getDocumentById } from "@/lib/database";

export async function GET(request) {
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

    const result = await getDocumentById(documentId);

    if (!result || result.success !== true) {
      return NextResponse.json(
        { success: false, error: result?.error || "Document non trouvé" },
        { status: 404 }
      );
    }

    // Normaliser le document (result.document peut être un objet ou un tableau)
    let doc = result.document;
    if (Array.isArray(doc)) doc = doc.length > 0 ? doc[0] : null;
    if (!doc) {
      return NextResponse.json(
        { success: false, error: "Document non trouvé" },
        { status: 404 }
      );
    }

    // Retourner le titre, le contenu, les tags et la date de mise à jour
    const response = {
      success: true,
      title: doc.title,
      content: doc.content,
      tags: doc.tags || [],
      updated_at: doc.updated_at,
      user_id: Number(
        doc.user_id ?? doc.userId ?? doc.owner_id ?? doc.ownerId ?? null
      ),
    };
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
