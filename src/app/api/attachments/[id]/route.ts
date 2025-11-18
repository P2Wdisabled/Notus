import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "@/lib/prisma";
import * as pako from "pako";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const attachmentId = parseInt(id);

    if (isNaN(attachmentId)) {
      return NextResponse.json(
        { success: false, error: "ID de fichier invalide" },
        { status: 400 }
      );
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);

    // Récupérer le fichier
    const attachment = await prisma.documentAttachment.findFirst({
      where: {
        id: attachmentId,
        user_id: userId, // Vérifier que l'utilisateur est propriétaire
      },
    });

    if (!attachment) {
      return NextResponse.json(
        { success: false, error: "Fichier non trouvé ou accès non autorisé" },
        { status: 404 }
      );
    }

    // Décompresser le fichier
    const compressedBuffer = Buffer.from(attachment.file_data, 'base64');
    const decompressed = pako.ungzip(compressedBuffer);
    
    // Convertir en base64 pour l'affichage
    const base64 = Buffer.from(decompressed).toString('base64');
    const dataUrl = `data:${attachment.file_type};base64,${base64}`;

    return NextResponse.json({
      success: true,
      file: {
        id: attachment.id,
        file_name: attachment.file_name,
        file_type: attachment.file_type,
        file_size: attachment.file_size,
        data: dataUrl,
      },
    });
  } catch (error) {
    console.error("❌ Erreur récupération fichier:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

