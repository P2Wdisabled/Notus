import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "@/lib/prisma";
import { DocumentService } from "@/lib/services/DocumentService";

const documentService = new DocumentService();

async function ensureDocumentAccess(documentId: number, userId: number, userEmail?: string | null) {
  await documentService.initializeTables();
  const result = await documentService.getDocumentById(documentId);

  if (!result.success || !result.document) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, error: "Document non trouvé" },
        { status: 404 }
      ),
    };
  }

  const document = result.document;
  const isOwner = Number(document.user_id) === userId;

  if (isOwner) {
    return { ok: true as const, document };
  }

  if (!userEmail) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, error: "Accès refusé - Vous n'avez pas accès à ce document" },
        { status: 403 }
      ),
    };
  }

  // Vérifier si l'utilisateur a accès via partage (lecture ou édition)
  const sharePermission = await documentService.getSharePermission(documentId, userEmail);
  if (!sharePermission.success) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, error: "Accès refusé - Vous n'avez pas accès à ce document" },
        { status: 403 }
      ),
    };
  }

  return { ok: true as const, document };
}

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
    const id = searchParams.get("documentId");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID du document requis" },
        { status: 400 }
      );
    }

    const documentId = parseInt(id, 10);
    if (isNaN(documentId) || documentId <= 0) {
      return NextResponse.json(
        { success: false, error: "ID du document invalide" },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id);
    const userEmail = session.user.email;

    const access = await ensureDocumentAccess(documentId, userId, userEmail);
    if (!access.ok) return access.response;

    const historyEntries = await (prisma as any).documentHistory.findMany({
      where: { document_id: documentId },
      orderBy: { created_at: "asc" },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true,
            email: true,
            profile_image: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      history: historyEntries,
    });
  } catch (error) {
    console.error("❌ Erreur GET /api/openDoc/history:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}


