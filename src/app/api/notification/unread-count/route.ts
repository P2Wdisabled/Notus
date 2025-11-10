import { NextResponse } from "next/server";
import { NotificationService } from "@/lib/services/NotificationService";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        if (!id) {
            return NextResponse.json(
                { success: false, error: "ID du récepteur requis" },
                { status: 400 }
            );
        }
        const id_receiver = parseInt(id);
        const notifSvc = new NotificationService();
        const result = await notifSvc.getUnreadCount(id_receiver);
        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error || "Impossible de récupérer le nombre de notifications non lues" },
                { status: 500 }
            );
        }
        return NextResponse.json({ success: true, count: result.data ?? 0 });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Erreur interne du serveur" },
            { status: 500 }
        );
    }
}
