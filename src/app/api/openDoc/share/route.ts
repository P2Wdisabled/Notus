import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/../lib/auth";
import { DocumentService } from "@/lib/services/DocumentService";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { documentId, email, userId, permission } = body ?? {};

    if (!documentId || (typeof permission !== "boolean")) {
      return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
    }

    // Require either email or userId (email preferred)
    if (!email && !userId) {
      return NextResponse.json({ success: false, error: "Missing target (email or userId)" }, { status: 400 });
    }

    // Auth
    let session: any = null;
    try {
      session = await getServerSession(authOptions);
    } catch (e) {
      // continue — will be handled below
    }

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const documentService = new DocumentService();

    // Check ownership or admin
    const ownerRes = await documentService.ownerIdForDocument(documentId);
    if (!ownerRes.success) {
      return NextResponse.json({ success: false, error: ownerRes.error || "Document not found" }, { status: 404 });
    }

    const ownerId = ownerRes.data?.ownerId ?? null;
    const currentUserId = Number(session.user.id);
    const isOwner = ownerId !== null && Number(ownerId) === currentUserId;
    const isAdmin = session.user?.isAdmin === true;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Perform update
    if (email) {
      const res = await documentService.addShare(documentId, email, permission);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error || "Failed to update share" }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    if (userId) {
      const res = await documentService.updatePermission(documentId, Number(userId), permission);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error || "Failed to update share" }, { status: 500 });
      }
      return NextResponse.json({ success: true, data: res.data });
    }

    return NextResponse.json({ success: false, error: "Unhandled" }, { status: 500 });
  } catch (e) {
    console.error("❌ Error in /api/openDoc/share PATCH:", e);
    return NextResponse.json({ success: false, error: "server_error" }, { status: 500 });
  }
}
