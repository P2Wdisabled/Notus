import { NextResponse } from "next/server";
import { UserService } from "@/lib/services/UserService";
import { requireAuth } from "@/lib/security/routeGuards";

const userService = new UserService();

export async function GET() {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const result = await userService.getUserById(authResult.userId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
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
    return NextResponse.json({ success: false, error: "Accès refusé" }, { status: 500 });
  }
}
