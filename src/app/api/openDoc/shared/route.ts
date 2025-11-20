import { NextResponse } from "next/server";
import { DocumentService } from "@/lib/services/DocumentService";
import { auth } from "../../../../../auth";

const documentService = new DocumentService();

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur demande ses propres documents partagés
    const userEmail = session.user.email?.toLowerCase().trim();
    const requestedEmail = email.toLowerCase().trim();

    if (userEmail !== requestedEmail) {
      return NextResponse.json(
        { success: false, error: "Accès refusé - Vous ne pouvez voir que vos propres documents partagés" },
        { status: 403 }
      );
    }

    // Fetch all documents shared with this email
    await documentService.initializeTables();
    const result = await documentService.fetchSharedWithUser(email);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Documents non trouvés" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, documents: result.documents ?? [] });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
