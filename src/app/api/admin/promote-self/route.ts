import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { UserService } from "@/lib/services/UserService";

const userService = new UserService();

export async function POST() {
  try {
    const session = await auth();

    // Vérifier si l'utilisateur est connecté
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Promouvoir l'utilisateur connecté en admin
    const result = await userService.toggleUserAdmin(parseInt(session.user.id), true);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Vous avez été promu administrateur avec succès",
      user: result.data,
    });
  } catch (error) {
    console.error("Erreur auto-promotion admin:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
