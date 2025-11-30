import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireDossierOwnership } from "@/lib/security/routeGuards";

export async function POST(
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

    const body = await request.json();
    const { documentIds } = body;

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 400 }
      );
    }

    const documentIdsNumbers = documentIds.map((id) => parseInt(String(id))).filter((id) => !isNaN(id));
    
    const documents = await prisma.document.findMany({
      where: {
        id: { in: documentIdsNumbers },
        user_id: authResult.userId,
      },
    });

    if (documents.length !== documentIdsNumbers.length) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 403 }
      );
    }

    // Ajouter les documents au dossier (en évitant les doublons)
    const existingLinks = await prisma.dossierDocument.findMany({
      where: {
        dossier_id: dossierId,
        document_id: { in: documentIdsNumbers },
      },
    });

    const existingDocumentIds = new Set(existingLinks.map((link) => link.document_id));
    const newDocumentIds = documentIdsNumbers.filter((id) => !existingDocumentIds.has(id));

    if (newDocumentIds.length > 0) {
      await prisma.dossierDocument.createMany({
        data: newDocumentIds.map((docId) => ({
          dossier_id: dossierId,
          document_id: docId,
        })),
      });
    }

    return NextResponse.json({ success: true, added: newDocumentIds.length });
  } catch (error) {
    console.error("❌ Erreur ajout documents au dossier:", error);
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

    const body = await request.json();
    const { documentIds } = body;

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 400 }
      );
    }

    const documentIdsNumbers = documentIds.map((id) => parseInt(String(id))).filter((id) => !isNaN(id));

    // Retirer les documents du dossier
    await prisma.dossierDocument.deleteMany({
      where: {
        dossier_id: dossierId,
        document_id: { in: documentIdsNumbers },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Erreur retrait documents du dossier:", error);
    return NextResponse.json(
      { success: false, error: "Accès refusé" },
      { status: 500 }
    );
  }
}

