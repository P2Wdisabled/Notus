import { NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
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

export async function GET(request: Request, { params }: RouteParams) {
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

    const result = await requestService.getRequestById(parseInt(id));

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Requête non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, request: result.request });
  } catch (error) {
    console.error("❌ Erreur récupération requête:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
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
    await requestService.initializeTables();
    await notificationService.initializeTables();

    // Récupérer la requête avant mise à jour pour vérifier le changement de statut
    const requestBeforeUpdate = await requestService.getRequestById(parseInt(id));
    if (!requestBeforeUpdate.success || !requestBeforeUpdate.request) {
      return NextResponse.json(
        { success: false, error: "Requête non trouvée" },
        { status: 404 }
      );
    }

    const oldStatus = requestBeforeUpdate.request.status;
    const newStatus = body.status;

    // Mettre à jour la requête
    const result = await requestService.updateRequest(parseInt(id), body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Erreur lors de la mise à jour" },
        { status: 500 }
      );
    }

    // Si le statut passe à "resolved", envoyer une notification automatique
    if (newStatus === "resolved" && oldStatus !== "resolved" && result.request) {
      const typeLabels: Record<string, string> = {
        help: "Demande d'aide",
        data_restoration: "Restauration de données",
        other: "Autre",
      };

      const notificationMessage = {
        type: "request-resolved",
        requestId: result.request.id,
        requestTitle: result.request.title,
        requestType: result.request.type,
        requestTypeLabel: typeLabels[result.request.type] || "Autre",
        status: "resolved",
        message: `Votre requête "${result.request.title}" a été résolue.`,
        from: "Administration",
      };

      const notificationResult = await notificationService.sendNotification(
        parseInt(session.user.id),
        result.request.user_id,
        notificationMessage
      );

      if (!notificationResult.success) {
        console.error("❌ Erreur envoi notification:", notificationResult.error);
        // On continue quand même, la notification n'est pas critique
      }
    }

    return NextResponse.json({ success: true, request: result.request });
  } catch (error) {
    console.error("❌ Erreur mise à jour requête:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
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

    const result = await requestService.deleteRequest(parseInt(id));

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Erreur lors de la suppression" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Erreur suppression requête:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

