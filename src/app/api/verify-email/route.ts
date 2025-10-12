import { NextResponse } from "next/server";
import { verifyUserEmail } from "../../../lib/database";
import { sendWelcomeEmail } from "../../../lib/email";

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
    const result = await verifyUserEmail(token);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Envoyer l'email de bienvenue
    try {
      await sendWelcomeEmail(result.user!.email, result.user!.first_name);
    } catch (emailError) {
      console.error("❌ Erreur envoi email de bienvenue:", emailError);
      // On continue même si l'email de bienvenue échoue
    }

    return NextResponse.json({
      success: true,
      message: `Bienvenue ${result.user!.first_name} ! Votre compte a été activé avec succès.`,
    });
  } catch (error) {
    console.error("❌ Erreur API vérification email:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
