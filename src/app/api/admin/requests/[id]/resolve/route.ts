import { NextResponse } from "next/server";
import { auth } from "../../../../../../../auth";
import { UserService } from "@/lib/services/UserService";
import { RequestService } from "@/lib/services/RequestService";
import { NotificationService } from "@/lib/services/NotificationService";

const requestService = new RequestService();
const userService = new UserService();
const notificationService = new NotificationService();

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    const isAdmin = await userService.isUserAdmin(parseInt(session.user.id));
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 403 }
      );
    }

    const { id } = await params;
    await requestService.initializeTables();
    await notificationService.initializeTables();

    // Récupérer la requête avant résolution pour obtenir les informations utilisateur
    const requestBeforeResolution = await requestService.getRequestById(parseInt(id));
    if (!requestBeforeResolution.success || !requestBeforeResolution.request) {
      return NextResponse.json(
        { success: false, error: "Requête non trouvée" },
        { status: 404 }
      );
    }

    const userRequest = requestBeforeResolution.request;

    // Résoudre la requête
    const result = await requestService.resolveRequest(parseInt(id), parseInt(session.user.id));

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Erreur lors de la résolution" },
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
      parseInt(session.user.id),
      userRequest.user_id,
      notificationMessage
    );

    if (!notificationResult.success) {
      console.error("❌ Erreur envoi notification:", notificationResult.error);
      // On continue quand même, la notification n'est pas critique
    }

    return NextResponse.json({
      success: true,
      request: result.request,
      notificationSent: notificationResult.success,
    });
  } catch (error) {
    console.error("❌ Erreur résolution requête:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

