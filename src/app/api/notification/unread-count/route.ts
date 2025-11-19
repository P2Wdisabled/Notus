import { NextResponse } from "next/server";
import { NotificationService } from "@/lib/services/NotificationService";
import { auth } from "../../../../../auth";

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
        const id = searchParams.get("id");
        if (!id) {
            return NextResponse.json(
                { success: false, error: "ID du récepteur requis" },
                { status: 400 }
            );
        }
        
        const id_receiver = parseInt(id);
        const sessionUserId = parseInt(session.user.id);
        
        // Vérifier que l'utilisateur demande son propre compte
        if (id_receiver !== sessionUserId) {
            return NextResponse.json(
                { success: false, error: "Accès refusé - Vous ne pouvez voir que votre propre nombre de notifications non lues" },
                { status: 403 }
            );
        }
        
        const notifSvc = new NotificationService();
        await notifSvc.initializeTables();
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
