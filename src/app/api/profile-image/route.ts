import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { UserService } from "@/lib/services/UserService";

const userService = new UserService();

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Récupérer l'utilisateur depuis la base de données
    const result = await userService.getUserById(userId);

    if (!result.success) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      profileImage: result.user!.profile_image,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de l'image de profil:",
      error
    );
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
