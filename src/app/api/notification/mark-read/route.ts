import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/../lib/auth";
import { NotificationService } from "@/lib/services/NotificationService";
import { BaseRepository } from "@/lib/repositories/BaseRepository";

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

    const userId = parseInt(session.user.id);
    
    // Vérifier que la notification appartient à l'utilisateur
    const repo = new BaseRepository();
    const notifCheck = await repo.query<{ id_receiver: number }>(
      `SELECT id_receiver FROM notifications WHERE id = $1`,
      [notificationId]
    );
    
    if (!notifCheck.rows || notifCheck.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Notification non trouvée" }, { status: 404 });
    }
    
    if (notifCheck.rows[0].id_receiver !== userId) {
      return NextResponse.json(
        { success: false, error: "Accès refusé - Cette notification ne vous appartient pas" },
        { status: 403 }
      );
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
