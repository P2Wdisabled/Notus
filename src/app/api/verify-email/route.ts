import { NextResponse } from "next/server";
import { UserService } from "../../../lib/services/UserService";

const userService = new UserService();

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 400 }
      );
    }

    const result = await userService.verifyUserEmail(token);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Bienvenue ${result.data!.first_name} ! Votre compte a été activé avec succès.`,
    });
  } catch (error) {
    console.error("❌ Erreur API vérification email:", error);
    return NextResponse.json(
      { success: false, error: "Accès refusé" },
      { status: 500 }
    );
  }
}
