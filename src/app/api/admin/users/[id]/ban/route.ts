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
    const { isBanned, reason } = await request.json();

    if (typeof isBanned !== "boolean") {
      return NextResponse.json(
        { error: "Le paramètre isBanned doit être un booléen" },
        { status: 400 }
      );
    }

    // Empêcher un admin de se bannir lui-même
    if (parseInt(id) === parseInt(session.user.id)) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas vous bannir vous-même" },
        { status: 400 }
      );
    }

    const result = await userService.toggleUserBan(parseInt(id), isBanned, reason);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Utilisateur ${isBanned ? "banni" : "débanni"} avec succès`,
      user: result.data,
      emailSent: true,
    });
  } catch (error) {
    console.error("Erreur API bannissement utilisateur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
