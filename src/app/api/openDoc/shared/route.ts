import { NextResponse } from "next/server";
import { DocumentService } from "@/lib/services/DocumentService";

const documentService = new DocumentService();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email requis" },
        { status: 400 }
      );
    }

    // Fetch all documents shared with this email
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
