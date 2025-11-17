import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/../lib/auth";
import { NotificationService } from "@/lib/services/NotificationService";

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let idParam = searchParams.get("id");

    if (!idParam) {
      try {
        const body = await request.json();
        idParam = body?.id ?? body?.notificationId ?? body?.notification_id;
      } catch {
      }
    }

    if (!idParam) {
      return NextResponse.json({ success: false, error: "ID de la notification requis" }, { status: 400 });
    }

    const notificationId = parseInt(String(idParam), 10);
    if (Number.isNaN(notificationId)) {
      return NextResponse.json({ success: false, error: "ID invalide" }, { status: 400 });
    }

    const notifSvc = new NotificationService();
    const result = await notifSvc.deleteNotification(notificationId);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || "Échec suppression" }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 200 });
  } catch (error) {
    console.error("API /notification/detete DELETE error:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Erreur interne" }, { status: 500 });
  }
}