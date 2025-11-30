import { NextResponse } from "next/server";
import { DocumentService } from "@/lib/services/DocumentService";
import { requireAuth, requireDocumentOwnership } from "@/lib/security/routeGuards";

const documentService = new DocumentService();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 400 }
      );
    }

    const documentId = parseInt(id);
    if (isNaN(documentId) || documentId <= 0) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 400 }
      );
    }

    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const ownershipCheck = await requireDocumentOwnership(documentId, authResult.userId);
    if (ownershipCheck) {
      return ownershipCheck;
    }

    const result = await documentService.fetchDocumentAccessList(documentId);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, accessList: result.data?.accessList ?? [] });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Accès refusé" },
      { status: 500 }
    );
  }
}
