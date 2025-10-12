import { NextResponse } from "next/server";
import { UserService } from "../../../lib/services/UserService";

const userService = new UserService();

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token de vérification requis" },
        { status: 400 }
      );
    }

    // Vérifier l'email
    const result = await userService.verifyUserEmail(token);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
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
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
