import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "@/lib/prisma";
import { DocumentService } from "@/lib/services/DocumentService";

const documentService = new DocumentService();

async function ensureDocumentAccess(documentId: number, userId: number, userEmail?: string | null) {
  await documentService.initializeTables();
  const result = await documentService.getDocumentById(documentId);

  if (!result.success || !result.document) {
    return { ok: false, response: NextResponse.json({ success: false, error: "Document non trouvé" }, { status: 404 }) };
  }

  const document = result.document;
  const isOwner = Number(document.user_id) === userId;

  if (isOwner) {
    return { ok: true as const, document };
  }

  if (!userEmail) {
    return {
      ok: false,
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
      ok: false,
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

    const comments = await (prisma as any).comment.findMany({
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
      comments,
    });
  } catch (error) {
    console.error("❌ Erreur GET /api/comments:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Corps de requête invalide" },
        { status: 400 }
      );
    }

    const { documentId, content } = body as { documentId?: unknown; content?: unknown };

    const parsedDocumentId =
      typeof documentId === "number"
        ? documentId
        : typeof documentId === "string"
        ? parseInt(documentId, 10)
        : NaN;

    if (!parsedDocumentId || isNaN(parsedDocumentId) || parsedDocumentId <= 0) {
      return NextResponse.json(
        { success: false, error: "ID du document invalide" },
        { status: 400 }
      );
    }

    if (typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Le commentaire ne peut pas être vide" },
        { status: 400 }
      );
    }

    const trimmed = content.trim();
    if (trimmed.length > 2000) {
      return NextResponse.json(
        { success: false, error: "Le commentaire ne peut pas dépasser 2000 caractères" },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id);
    const userEmail = session.user.email;

    const access = await ensureDocumentAccess(parsedDocumentId, userId, userEmail);
    if (!access.ok) return access.response;

    const comment = await (prisma as any).comment.create({
      data: {
        document_id: parsedDocumentId,
        user_id: userId,
        content: trimmed,
      },
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
      comment,
    });
  } catch (error) {
    console.error("❌ Erreur POST /api/comments:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}


