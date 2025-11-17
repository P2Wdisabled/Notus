import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    const dossierId = parseInt(id);
    const userId = parseInt(session.user.id);

    if (isNaN(dossierId)) {
      return NextResponse.json(
        { success: false, error: "ID de dossier invalide" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { documentIds } = body;

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Les IDs des documents sont requis" },
        { status: 400 }
      );
    }

    // Vérifier que le dossier appartient à l'utilisateur
    const dossier = await prisma.dossier.findFirst({
      where: { id: dossierId, user_id: userId },
    });

    if (!dossier) {
      return NextResponse.json(
        { success: false, error: "Dossier non trouvé ou accès non autorisé" },
        { status: 404 }
      );
    }

    // Vérifier que tous les documents appartiennent à l'utilisateur
    const documentIdsNumbers = documentIds.map((id) => parseInt(String(id))).filter((id) => !isNaN(id));
    
    const documents = await prisma.document.findMany({
      where: {
        id: { in: documentIdsNumbers },
        user_id: userId,
      },
    });

    if (documents.length !== documentIdsNumbers.length) {
      return NextResponse.json(
        { success: false, error: "Certains documents n'existent pas ou ne vous appartiennent pas" },
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
      { success: false, error: "Erreur interne du serveur" },
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

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    const dossierId = parseInt(id);
    const userId = parseInt(session.user.id);

    if (isNaN(dossierId)) {
      return NextResponse.json(
        { success: false, error: "ID de dossier invalide" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { documentIds } = body;

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Les IDs des documents sont requis" },
        { status: 400 }
      );
    }

    // Vérifier que le dossier appartient à l'utilisateur
    const dossier = await prisma.dossier.findFirst({
      where: { id: dossierId, user_id: userId },
    });

    if (!dossier) {
      return NextResponse.json(
        { success: false, error: "Dossier non trouvé ou accès non autorisé" },
        { status: 404 }
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
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

