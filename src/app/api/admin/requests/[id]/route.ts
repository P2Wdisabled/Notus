import { NextResponse } from "next/server";
import { UserService } from "@/lib/services/UserService";
import { RequestService } from "@/lib/services/RequestService";
import { NotificationService } from "@/lib/services/NotificationService";
import { UpdateRequestData } from "@/lib/repositories/RequestRepository";
import { requireAdmin } from "@/lib/security/routeGuards";

const requestService = new RequestService();
const userService = new UserService();
const notificationService = new NotificationService();

const REQUEST_STATUSES = ["pending", "in_progress", "resolved", "rejected"] as const;
type RequestStatus = (typeof REQUEST_STATUSES)[number];

function isValidRequestStatus(status: unknown): status is RequestStatus {
  return typeof status === "string" && REQUEST_STATUSES.includes(status as RequestStatus);
}

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const adminResult = await requireAdmin();
    if (adminResult instanceof NextResponse) {
      return adminResult;
    }

    const { id } = await params;
    await requestService.initializeTables();

    const result = await requestService.getRequestById(parseInt(id));

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, request: result.request });
  } catch (error) {
    console.error("❌ Erreur récupération requête:", error);
    return NextResponse.json(
      { success: false, error: "Accès refusé" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const adminResult = await requireAdmin();
    if (adminResult instanceof NextResponse) {
      return adminResult;
    }

    const { id } = await params;
    const body = await request.json();
    const { status, message } = body;
    await requestService.initializeTables();
    await notificationService.initializeTables();

    const requestBeforeUpdate = await requestService.getRequestById(parseInt(id));
    if (!requestBeforeUpdate.success || !requestBeforeUpdate.request) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 404 }
      );
    }

    const oldStatus = requestBeforeUpdate.request.status;
    const newStatus: "pending" | "in_progress" | "resolved" | "rejected" | undefined = 
      status && ["pending", "in_progress", "resolved", "rejected"].includes(status)
        ? (status as "pending" | "in_progress" | "resolved" | "rejected")
        : undefined;

    // Mettre à jour la requête
    const updateData: UpdateRequestData = {};
    if (status !== undefined) {
      if (!isValidRequestStatus(status)) {
        return NextResponse.json(
          { success: false, error: "Accès refusé" },
          { status: 400 }
        );
      }
      updateData.status = status;
    }
    const result = await requestService.updateRequest(parseInt(id), updateData);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 500 }
      );
    }

    // Envoyer une notification si le statut a changé ou si un message est fourni
    const statusChanged = newStatus && String(newStatus) !== String(oldStatus);
    const hasMessage = message && typeof message === "string" && message.trim();
    
    // Envoyer une notification si le statut a changé (même sans message) ou si un message est fourni
    if ((statusChanged || hasMessage) && result.request) {
      const typeLabels: Record<string, string> = {
        help: "Demande d'aide",
        data_restoration: "Restauration de données",
        other: "Autre",
      };

      const statusLabels: Record<string, string> = {
        pending: "En attente",
        in_progress: "En cours",
        resolved: "Résolu",
        rejected: "Rejeté",
      };

      const statusLabel = newStatus ? (statusLabels[newStatus] || newStatus) : "mise à jour";
      
      // Construire le message : toujours mentionner le changement de statut si le statut a changé, puis ajouter le message personnalisé s'il existe
      let notificationMessageText: string;
      
      if (statusChanged) {
        // Le statut a changé
        const statusChangeText = `Le statut de votre requête "${result.request.title}" a été modifié : ${statusLabel}.`;
        
        if (hasMessage) {
          // Combiner le changement de statut avec le message personnalisé
          notificationMessageText = `${statusChangeText}\n\n${message.trim()}`;
        } else {
          // Message par défaut selon le nouveau statut
          if (newStatus === "resolved") {
            notificationMessageText = `Votre requête "${result.request.title}" a été résolue.`;
          } else {
            notificationMessageText = statusChangeText;
          }
        }
      } else if (hasMessage) {
        // Pas de changement de statut mais un message est fourni
        notificationMessageText = message.trim();
      } else {
        // Ne devrait pas arriver ici, mais au cas où
        notificationMessageText = `Mise à jour de votre requête "${result.request.title}".`;
      }

      // Déterminer le type de notification
      const notificationType = statusChanged && newStatus === "resolved" 
        ? "request-resolved" 
        : "request-response";

      const notificationMessage = {
        type: notificationType,
        requestId: result.request.id,
        requestTitle: result.request.title,
        requestType: result.request.type,
        requestTypeLabel: typeLabels[result.request.type] || "Autre",
        status: newStatus || result.request.status,
        message: notificationMessageText,
        from: "Administration",
      };

      const notificationResult = await notificationService.sendNotification(
        adminResult.userId,
        result.request.user_id,
        notificationMessage
      );

      if (!notificationResult.success) {
        const errorMessage = 'error' in notificationResult ? notificationResult.error : "Erreur inconnue";
        console.error("❌ Erreur envoi notification:", errorMessage);
        // On continue quand même, la notification n'est pas critique
      }
    }

    return NextResponse.json({ success: true, request: result.request });
  } catch (error) {
    console.error("❌ Erreur mise à jour requête:", error);
    return NextResponse.json(
      { success: false, error: "Accès refusé" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const adminResult = await requireAdmin();
    if (adminResult instanceof NextResponse) {
      return adminResult;
    }

    const { id } = await params;
    await requestService.initializeTables();

    const result = await requestService.deleteRequest(parseInt(id));

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Erreur suppression requête:", error);
    return NextResponse.json(
      { success: false, error: "Accès refusé" },
      { status: 500 }
    );
  }
}

