import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireDossierOwnership } from "@/lib/security/routeGuards";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const dossierId = parseInt(id);

    if (isNaN(dossierId)) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 400 }
      );
    }

    const ownershipCheck = await requireDossierOwnership(dossierId, authResult.userId);
    if (ownershipCheck) {
      return ownershipCheck;
    }

    const dossier = await prisma.dossier.findFirst({
      where: { id: dossierId, user_id: authResult.userId },
      include: {
        documents: {
          include: {
            document: true,
          },
          orderBy: {
            created_at: "desc",
          },
        },
      },
    });

    if (!dossier) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      dossier: {
        id: dossier.id,
        nom: dossier.nom,
        created_at: dossier.created_at,
        updated_at: dossier.updated_at,
        documents: dossier.documents.map((dd) => ({
          id: dd.document.id,
          title: dd.document.title,
          content: dd.document.content,
          tags: dd.document.tags,
          favori: dd.document.favori,
          created_at: dd.document.created_at,
          updated_at: dd.document.updated_at,
        })),
      },
    });
  } catch (error) {
    console.error("❌ Erreur récupération dossier:", error);
    return NextResponse.json(
      { success: false, error: "Accès refusé" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const dossierId = parseInt(id);

    if (isNaN(dossierId)) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 400 }
      );
    }

    const ownershipCheck = await requireDossierOwnership(dossierId, authResult.userId);
    if (ownershipCheck) {
      return ownershipCheck;
    }

    // Supprimer le dossier (les relations DossierDocument seront supprimées en cascade)
    await prisma.dossier.delete({
      where: { id: dossierId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Erreur suppression dossier:", error);
    return NextResponse.json(
      { success: false, error: "Accès refusé" },
      { status: 500 }
    );
  }
}
