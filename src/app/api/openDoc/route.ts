import { NextResponse } from "next/server";
import { DocumentService } from "@/lib/services/DocumentService";
import { auth } from "../../../../auth";
import { prisma } from "@/lib/prisma";

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

    await documentService.initializeTables();
    const result = await documentService.getDocumentById(documentId);

    if (!result.success || !result.document) {
      return NextResponse.json(
        { success: false, error: result.error || "Document non trouvé" },
        { status: 404 }
      );
    }

    const doc = result.document;
    const userId = parseInt(session.user.id);
    const userEmail = session.user.email;

    // Vérifier que l'utilisateur est propriétaire ou a accès via partage
    const isOwner = Number(doc.user_id) === userId;
    
    if (!isOwner && userEmail) {
      // Vérifier si l'utilisateur a accès via partage
      const share = await prisma.share.findFirst({
        where: {
          id_doc: documentId,
          email: userEmail.toLowerCase().trim(),
        },
      });

      if (!share) {
        return NextResponse.json(
          { success: false, error: "Accès refusé - Vous n'avez pas accès à ce document" },
          { status: 403 }
        );
      }
    } else if (!isOwner) {
      return NextResponse.json(
        { success: false, error: "Accès refusé - Vous n'avez pas accès à ce document" },
        { status: 403 }
      );
    }

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
