import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/security/routeGuards";

export async function GET() {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const dossiers = await prisma.dossier.findMany({
      where: { user_id: authResult.userId },
      include: {
        documents: {
          include: {
            document: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({
      success: true,
      dossiers: dossiers.map((d) => ({
        id: d.id,
        nom: d.nom,
        created_at: d.created_at,
        updated_at: d.updated_at,
        documentCount: d.documents.length,
      })),
    });
  } catch (error) {
    console.error("❌ Erreur récupération dossiers:", error);
    return NextResponse.json(
      { success: false, error: "Accès refusé" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { nom } = body;

    if (!nom || typeof nom !== "string" || nom.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 400 }
      );
    }

    const dossier = await prisma.dossier.create({
      data: {
        user_id: authResult.userId,
        nom: nom.trim(),
      },
    });

    return NextResponse.json(
      { success: true, dossier: { id: dossier.id, nom: dossier.nom, created_at: dossier.created_at, updated_at: dossier.updated_at } },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Erreur création dossier:", error);
    return NextResponse.json(
      { success: false, error: "Accès refusé" },
      { status: 500 }
    );
  }
}

