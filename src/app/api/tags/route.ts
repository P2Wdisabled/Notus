import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non authentifié", tags: [] },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);

    // Récupérer tous les tags uniques depuis les documents de l'utilisateur
    const documents = await prisma.document.findMany({
      where: { user_id: userId },
      select: { tags: true },
    });

    // Extraire tous les tags et les dédupliquer
    const allTags = new Set<string>();
    for (const doc of documents) {
      if (Array.isArray(doc.tags)) {
        for (const tag of doc.tags) {
          const trimmed = String(tag || "").trim();
          if (trimmed) {
            allTags.add(trimmed);
          }
        }
      }
    }

    // Trier les tags par ordre alphabétique
    const sortedTags = Array.from(allTags).sort((a, b) => a.localeCompare(b, "fr"));

    return NextResponse.json({
      success: true,
      tags: sortedTags,
    });
  } catch (error) {
    console.error("❌ Erreur récupération tags:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur", tags: [] },
      { status: 500 }
    );
  }
}

