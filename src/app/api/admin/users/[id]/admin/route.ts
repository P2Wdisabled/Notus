import { NextResponse } from "next/server";
import { auth } from "../../../../../../../auth";
import { UserService } from "@/lib/services/UserService";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

const userService = new UserService();

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    // 1. Vérifier l'authentification via les cookies/session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const sessionUserId = parseInt(session.user.id);
    if (isNaN(sessionUserId) || sessionUserId <= 0) {
      return NextResponse.json({ error: "Session invalide" }, { status: 401 });
    }

    // 2. Vérifier que l'utilisateur est admin AVANT toute autre opération
    const isAdmin = await userService.isUserAdmin(sessionUserId);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Accès refusé - Droits administrateur requis" },
        { status: 403 }
      );
    }

    // 3. Maintenant que l'admin est vérifié, on peut lire les paramètres
    const { id } = await params;
    const { isAdmin: newAdminStatus } = await request.json();

    if (typeof newAdminStatus !== "boolean") {
      return NextResponse.json(
        { error: "Le paramètre isAdmin doit être un booléen" },
        { status: 400 }
      );
    }

    // Validation de l'ID utilisateur cible
    const targetUserId = parseInt(id);
    if (isNaN(targetUserId) || targetUserId <= 0) {
      return NextResponse.json(
        { error: "ID utilisateur invalide" },
        { status: 400 }
      );
    }

    // Empêcher un admin de se rétrograder lui-même
    if (targetUserId === sessionUserId && !newAdminStatus) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas vous rétrograder vous-même" },
        { status: 400 }
      );
    }

    const result = await userService.toggleUserAdmin(targetUserId, newAdminStatus);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Utilisateur ${
        newAdminStatus ? "promu administrateur" : "rétrogradé"
      } avec succès`,
      user: result.data,
    });
  } catch (error) {
    console.error("Erreur API changement statut admin:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
