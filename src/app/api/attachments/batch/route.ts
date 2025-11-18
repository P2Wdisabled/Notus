import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "@/lib/prisma";
import * as pako from "pako";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();
    const { attachmentIds } = body;

    if (!Array.isArray(attachmentIds) || attachmentIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Liste d'IDs invalide" },
        { status: 400 }
      );
    }

    // Limiter le nombre de fichiers à récupérer en une fois (sécurité)
    if (attachmentIds.length > 100) {
      return NextResponse.json(
        { success: false, error: "Trop de fichiers demandés (max 100)" },
        { status: 400 }
      );
    }

    // Récupérer tous les fichiers en une seule requête
    const attachments = await prisma.documentAttachment.findMany({
      where: {
        id: { in: attachmentIds.map(id => parseInt(id.toString())) },
        user_id: userId, // Vérifier que l'utilisateur est propriétaire
      },
    });

    // Décompresser et convertir tous les fichiers
    const files = attachments.map(attachment => {
      try {
        // Convertir la base64 en Buffer puis en Uint8Array pour pako
        const compressedBuffer = Buffer.from(attachment.file_data, 'base64');
        const compressedUint8Array = new Uint8Array(compressedBuffer);
        
        // Décompresser avec pako (attend un Uint8Array)
        const decompressed = pako.ungzip(compressedUint8Array);
        
        // Convertir en base64 pour l'affichage
        const base64 = Buffer.from(decompressed).toString('base64');
        const dataUrl = `data:${attachment.file_type};base64,${base64}`;

        return {
          id: attachment.id,
          file_name: attachment.file_name,
          file_type: attachment.file_type,
          file_size: attachment.file_size,
          data: dataUrl,
        };
      } catch (err) {
        console.error(`Erreur décompression fichier ${attachment.id}:`, err);
        // Si la décompression échoue, essayer de retourner les données telles quelles (peut-être pas compressées)
        try {
          const dataUrl = `data:${attachment.file_type};base64,${attachment.file_data}`;
          return {
            id: attachment.id,
            file_name: attachment.file_name,
            file_type: attachment.file_type,
            file_size: attachment.file_size,
            data: dataUrl,
          };
        } catch (fallbackErr) {
          console.error(`Erreur fallback fichier ${attachment.id}:`, fallbackErr);
          return null;
        }
      }
    }).filter(file => file !== null);

    return NextResponse.json({
      success: true,
      files: files,
    });
  } catch (error) {
    console.error("❌ Erreur récupération fichiers batch:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

