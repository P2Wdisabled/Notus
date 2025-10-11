import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { query } from "@/lib/database";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Récupérer l'image de profil depuis la base de données
    const result = await query(
      "SELECT profile_image FROM users WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    const user = result.rows[0];

    return NextResponse.json({
      profileImage: user.profile_image,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de l'image de profil:",
      error
    );
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
