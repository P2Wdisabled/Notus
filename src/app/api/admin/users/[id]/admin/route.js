import { NextResponse } from "next/server";
import { auth } from "../../../../../../../auth";
import { toggleUserAdmin, isUserAdmin } from "@/lib/database";

export async function PATCH(request, { params }) {
  try {
    const session = await auth();

    // Vérifier si l'utilisateur est connecté
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier si l'utilisateur est admin
    const isAdmin = await isUserAdmin(session.user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Accès refusé - Droits administrateur requis" },
        { status: 403 }
      );
    }

    const { id } = params;
    const { isAdmin: newAdminStatus } = await request.json();

    if (typeof newAdminStatus !== "boolean") {
      return NextResponse.json(
        { error: "Le paramètre isAdmin doit être un booléen" },
        { status: 400 }
      );
    }

    // Empêcher un admin de se rétrograder lui-même
    if (parseInt(id) === session.user.id && !newAdminStatus) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas vous rétrograder vous-même" },
        { status: 400 }
      );
    }

    const result = await toggleUserAdmin(parseInt(id), newAdminStatus);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Utilisateur ${
        newAdminStatus ? "promu administrateur" : "rétrogradé"
      } avec succès`,
      user: result.user,
    });
  } catch (error) {
    console.error("Erreur API changement statut admin:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
