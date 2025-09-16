import { NextResponse } from "next/server";
import { getDocumentById } from "@/lib/database";

export async function GET(request) {
  try {
    console.log("🔍 [API] openDoc appelée");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    console.log("🔍 [API] ID reçu:", id);

    if (!id) {
      console.log("❌ [API] ID manquant");
      return NextResponse.json(
        { success: false, error: "ID du document requis" },
        { status: 400 }
      );
    }

    // Vérifier si l'ID est un nombre valide
    const documentId = parseInt(id);
    if (isNaN(documentId) || documentId <= 0) {
      console.log("❌ [API] ID invalide:", id);
      return NextResponse.json(
        { success: false, error: "ID du document invalide" },
        { status: 400 }
      );
    }

    console.log("🔍 [API] Récupération du document ID:", documentId);
    // Récupérer le document
    const result = await getDocumentById(documentId);
    console.log("🔍 [API] Résultat de la base de données:", result);

    if (!result.success) {
      console.log("❌ [API] Document non trouvé:", result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 404 }
      );
    }

    // Retourner seulement le titre et le contenu
    const response = {
      success: true,
      title: result.document.title,
      content: result.document.content,
    };
    console.log("🔍 [API] Réponse envoyée:", response);
    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ [API] Erreur openDoc:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
