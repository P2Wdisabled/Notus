import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    const dossierId = parseInt(params.id);
    const userId = parseInt(session.user.id);

    if (isNaN(dossierId)) {
      return NextResponse.json(
        { success: false, error: "ID de dossier invalide" },
        { status: 400 }
      );
    }

    // Récupérer le dossier avec ses documents
    const dossier = await prisma.dossier.findFirst({
      where: { id: dossierId, user_id: userId },
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
        { success: false, error: "Dossier non trouvé ou accès non autorisé" },
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
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    const dossierId = parseInt(params.id);
    const userId = parseInt(session.user.id);

    if (isNaN(dossierId)) {
      return NextResponse.json(
        { success: false, error: "ID de dossier invalide" },
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

    // Supprimer le dossier (les relations DossierDocument seront supprimées en cascade)
    await prisma.dossier.delete({
      where: { id: dossierId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Erreur suppression dossier:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
