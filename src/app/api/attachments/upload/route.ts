import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "@/lib/prisma";
import * as pako from "pako";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const MAX_VIDEO_SIZE = 10 * 1024 * 1024; // 10MB pour les vidéos

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
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const documentId = formData.get("documentId") ? parseInt(formData.get("documentId") as string) : null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // Vérifier si c'est une vidéo
    const isVideo = file.type.startsWith('video/') || file.type.startsWith('audio/');
    
    // Vérifier la taille selon le type
    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      return NextResponse.json(
        { success: false, error: `Le fichier vidéo est trop volumineux. Taille maximale: 10MB` },
        { status: 400 }
      );
    }
    
    if (!isVideo && file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `Le fichier est trop volumineux. Taille maximale: 25MB` },
        { status: 400 }
      );
    }

    // Lire le fichier en ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Compresser le fichier avec gzip
    const compressed = pako.gzip(uint8Array);
    const compressedBase64 = Buffer.from(compressed).toString('base64');

    // Normaliser le type MIME (certains navigateurs peuvent retourner une chaîne vide ou incorrecte)
    let fileType = file.type;
    const extension = file.name.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      'gif': 'image/gif',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    
    // Si le type MIME est vide ou ne correspond pas à l'extension, utiliser l'extension
    if (!fileType || fileType === '' || (extension && mimeTypes[extension] && fileType !== mimeTypes[extension])) {
      fileType = extension ? (mimeTypes[extension] || fileType || 'application/octet-stream') : (fileType || 'application/octet-stream');
    }

    // Sauvegarder dans la base de données
    const attachment = await prisma.documentAttachment.create({
      data: {
        user_id: userId,
        document_id: documentId,
        file_name: file.name,
        file_type: fileType,
        file_size: file.size,
        file_data: compressedBase64,
      },
    });

    return NextResponse.json({
      success: true,
      attachment: {
        id: attachment.id,
        file_name: attachment.file_name,
        file_type: attachment.file_type,
        file_size: attachment.file_size,
      },
    });
  } catch (error) {
    console.error("❌ Erreur upload fichier:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

