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
    const session = await auth();

    // Vérifier si l'utilisateur est connecté
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier si l'utilisateur est admin
    const isAdmin = await userService.isUserAdmin(parseInt(session.user.id));
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Accès refusé - Droits administrateur requis" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { isAdmin: newAdminStatus } = await request.json();

    if (typeof newAdminStatus !== "boolean") {
      return NextResponse.json(
        { error: "Le paramètre isAdmin doit être un booléen" },
        { status: 400 }
      );
    }

    // Empêcher un admin de se rétrograder lui-même
    if (parseInt(id) === parseInt(session.user.id) && !newAdminStatus) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas vous rétrograder vous-même" },
        { status: 400 }
      );
    }

    const result = await userService.toggleUserAdmin(parseInt(id), newAdminStatus);

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
