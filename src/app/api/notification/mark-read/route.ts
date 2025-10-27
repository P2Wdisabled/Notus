import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/../lib/auth";
import { NotificationService } from "@/lib/services/NotificationService";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const notificationId = body?.notificationId;
    if (!notificationId) {
      return NextResponse.json({ success: false, error: "notificationId requis" }, { status: 400 });
    }

    const notifSvc = new NotificationService();
    const result = await notifSvc.markNotificationAsRead(Number(notificationId));
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || "Erreur" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: "Erreur interne" }, { status: 500 });
  }
}
