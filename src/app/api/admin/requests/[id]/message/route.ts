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
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { success: false, error: "Le message est requis" },
        { status: 400 }
      );
    }

    await requestService.initializeTables();
    await notificationService.initializeTables();

    // Récupérer la requête pour obtenir l'utilisateur
    const requestResult = await requestService.getRequestById(parseInt(id));
    if (!requestResult.success || !requestResult.request) {
      return NextResponse.json(
        { success: false, error: "Requête non trouvée" },
        { status: 404 }
      );
    }

    const userRequest = requestResult.request;

    // Créer la notification pour l'utilisateur
    const notificationMessage = {
      type: "request-response",
      requestId: userRequest.id,
      requestTitle: userRequest.title,
      requestType: userRequest.type,
      status: userRequest.status,
      message: message.trim(),
      from: "Administration",
    };

    const notificationResult = await notificationService.sendNotification(
      parseInt(session.user.id),
      userRequest.user_id,
      notificationMessage
    );

    if (!notificationResult.success) {
      const errorMessage = 'error' in notificationResult ? notificationResult.error : "Erreur inconnue";
      console.error("❌ Erreur envoi notification:", errorMessage);
      // On continue quand même, la notification n'est pas critique
    }

    return NextResponse.json({
      success: true,
      message: "Message envoyé avec succès",
      notificationSent: notificationResult.success,
    });
  } catch (error) {
    console.error("❌ Erreur envoi message requête:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

