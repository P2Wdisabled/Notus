import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/../lib/auth";
import { DocumentService } from "@/lib/services/DocumentService";

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { documentId, email, userId } = body ?? {};

    // validate
    if (!documentId) {
      return NextResponse.json({ success: false, error: "Missing documentId" }, { status: 400 });
    }
    if (!email && !userId) {
      return NextResponse.json({ success: false, error: "Missing target (email or userId)" }, { status: 400 });
    }

    // auth
    let session: any = null;
    try {
      session = await getServerSession(authOptions);
    } catch (e) {
      // ignore here, handled below
    }
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const documentService = new DocumentService();

    // ownership/admin check
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

    // perform removal
    if (email) {
      const res = await documentService.removeShare(documentId, String(email));
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error || "Failed to remove share" }, { status: 500 });
      }
      return NextResponse.json({ success: true, data: res.data });
    }

    // if userId provided, resolve to share (email) then remove
    if (userId) {
      const findRes = await documentService.findShare(documentId, Number(userId));
      if (!findRes.success) {
        return NextResponse.json({ success: false, error: findRes.error || "Share not found" }, { status: 404 });
      }
      const share = findRes.data?.share;
      const targetEmail = share?.email;
      if (!targetEmail) {
        return NextResponse.json({ success: false, error: "Share has no associated email" }, { status: 400 });
      }
      const delRes = await documentService.removeShare(documentId, String(targetEmail));
      if (!delRes.success) {
        return NextResponse.json({ success: false, error: delRes.error || "Failed to remove share" }, { status: 500 });
      }
      return NextResponse.json({ success: true, data: delRes.data });
    }

    return NextResponse.json({ success: false, error: "Unhandled" }, { status: 400 });
  } catch (e) {
    console.error("❌ Error in /api/openDoc/share/delete DELETE:", e);
    return NextResponse.json({ success: false, error: "server_error" }, { status: 500 });
  }
}
