import { NextResponse } from "next/server";
import { auth } from "../../../../../../../auth.js";
import { toggleUserBan, isUserAdmin, query } from "@/lib/database";
import {
  sendBanNotificationEmail,
  sendUnbanNotificationEmail,
} from "@/lib/email";

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
    const { isBanned, reason } = await request.json();

    if (typeof isBanned !== "boolean") {
      return NextResponse.json(
        { error: "Le paramètre isBanned doit être un booléen" },
        { status: 400 }
      );
    }

    // Empêcher un admin de se bannir lui-même
    if (parseInt(id) === session.user.id) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas vous bannir vous-même" },
        { status: 400 }
      );
    }

    const result = await toggleUserBan(parseInt(id), isBanned);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Envoyer un email de notification selon l'action
    try {
      // Récupérer les informations de l'utilisateur pour l'email
      const userResult = await query(
        "SELECT email, first_name, last_name FROM users WHERE id = $1",
        [parseInt(id)]
      );

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        let emailResult;

        if (isBanned) {
          // Email de bannissement
          emailResult = await sendBanNotificationEmail(
            user.email,
            user.first_name || "Utilisateur",
            reason || null
          );

          if (!emailResult.success) {
            console.error(
              `❌ Erreur envoi email de bannissement à ${user.email}:`,
              emailResult.error
            );
          }
        } else {
          // Email de débannissement
          emailResult = await sendUnbanNotificationEmail(
            user.email,
            user.first_name || "Utilisateur"
          );

          if (!emailResult.success) {
            console.error(
              `❌ Erreur envoi email de débannissement à ${user.email}:`,
              emailResult.error
            );
          }
        }
      }
    } catch (emailError) {
      console.error(
        `❌ Erreur lors de l'envoi de l'email de ${
          isBanned ? "bannissement" : "débannissement"
        }:`,
        emailError
      );
      // Ne pas faire échouer la requête si l'email ne peut pas être envoyé
    }

    return NextResponse.json({
      success: true,
      message: `Utilisateur ${isBanned ? "banni" : "débanni"} avec succès`,
      user: result.user,
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
