import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/../lib/auth";
import { DocumentService } from "@/lib/services/DocumentService";

const documentService = new DocumentService();

export async function GET(request: NextRequest) {
  try {
    // L'authentification et la vérification d'accès au document sont gérées par le middleware
    // Mais on vérifie aussi explicitement ici pour garantir la sécurité
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? Number(session.user.id) : undefined;
    const userEmail = session?.user?.email as string | undefined;

    if (!userId && !userEmail) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("documentId") || searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 400 }
      );
    }

    const documentId = parseInt(id, 10);
    if (isNaN(documentId) || documentId <= 0) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 400 }
      );
    }

    // Vérifier explicitement l'accès au document
    const hasAccess = await documentService.userHasAccessToDocument(
      documentId,
      userId,
      userEmail
    );

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 403 }
      );
    }

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
      { success: false, error: "Accès refusé" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // L'authentification et la vérification d'accès au document sont gérées par le middleware
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? Number(session.user.id) : null;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
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
        { success: false, error: "Accès refusé" },
        { status: 400 }
      );
    }

    if (typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 400 }
      );
    }

    const trimmed = content.trim();
    if (trimmed.length > 2000) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 400 }
      );
    }

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
      { success: false, error: "Accès refusé" },
      { status: 500 }
    );
  }
}


