import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  try {
    // L'authentification et la vérification d'accès au document sont gérées par le middleware
    // On récupère l'utilisateur depuis le token pour cohérence
    const secret = process.env.AUTH_SECRET;
    if (!secret) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 500 }
      );
    }

    const token = await getToken({ req: request, secret });
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 401 }
      );
    }

    const rawId = (token as Record<string, unknown>).id ?? token.sub ?? null;
    const parsedId =
      typeof rawId === "number"
        ? rawId
        : typeof rawId === "string"
        ? Number.parseInt(rawId, 10)
        : null;
    const userId = Number.isFinite(parsedId ?? NaN) ? (parsedId as number) : null;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("documentId");

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
    const secret = process.env.AUTH_SECRET;
    if (!secret) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 500 }
      );
    }

    const token = await getToken({ req: request, secret });
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 401 }
      );
    }

    const rawId = (token as Record<string, unknown>).id ?? token.sub ?? null;
    const parsedId =
      typeof rawId === "number"
        ? rawId
        : typeof rawId === "string"
        ? Number.parseInt(rawId, 10)
        : null;
    const userId = Number.isFinite(parsedId ?? NaN) ? (parsedId as number) : null;

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


