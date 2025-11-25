import { NextResponse } from "next/server";
import { RequestService } from "@/lib/services/RequestService";
import { NotificationService } from "@/lib/services/NotificationService";
import { requireAdmin } from "@/lib/security/routeGuards";

const requestService = new RequestService();
const notificationService = new NotificationService();

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const adminResult = await requireAdmin();
    if (adminResult instanceof NextResponse) {
      return adminResult;
    }

    const { id } = await params;
    await requestService.initializeTables();
    await notificationService.initializeTables();

    const requestBeforeResolution = await requestService.getRequestById(parseInt(id));
    if (!requestBeforeResolution.success || !requestBeforeResolution.request) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 404 }
      );
    }

    const userRequest = requestBeforeResolution.request;

    const result = await requestService.resolveRequest(parseInt(id), adminResult.userId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 500 }
      );
    }

    // Envoyer une notification automatique à l'utilisateur
    const typeLabels: Record<string, string> = {
      help: "Demande d'aide",
      data_restoration: "Restauration de données",
      other: "Autre",
    };

    const notificationMessage = {
      type: "request-resolved",
      requestId: userRequest.id,
      requestTitle: userRequest.title,
      requestType: userRequest.type,
      requestTypeLabel: typeLabels[userRequest.type] || "Autre",
      status: "resolved",
      message: `Votre requête "${userRequest.title}" a été résolue.`,
      from: "Administration",
    };

    const notificationResult = await notificationService.sendNotification(
      adminResult.userId,
      userRequest.user_id,
      notificationMessage
    );

    if (!notificationResult.success) {
      const errorMessage = 'error' in notificationResult ? notificationResult.error : "Erreur inconnue";
      console.error("❌ Erreur envoi notification:", errorMessage);
    }

    return NextResponse.json({
      success: true,
      request: result.request,
      notificationSent: notificationResult.success,
    });
  } catch (error) {
    console.error("❌ Erreur résolution requête:", error);
    return NextResponse.json(
      { success: false, error: "Accès refusé" },
      { status: 500 }
    );
  }
}

