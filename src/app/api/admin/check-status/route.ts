import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { UserService } from "@/lib/services/UserService";

const userService = new UserService();

export async function GET() {
  try {
    // 1) Vérifier la connectivité base (ping simple)
    const ping = await userService.getAllUsers(1, 0);
    if (!ping.success) {
      return NextResponse.json(
        { reachable: false, error: ping.error || "database_unreachable" },
        { status: 503 }
      );
    }

    // 2) Si DB OK, tenter de récupérer la session et retourner le statut admin (optionnel)
    const session = await auth();
    const isAdmin = session?.user?.id
      ? await userService.isUserAdmin(parseInt(session.user.id))
      : false;

    return NextResponse.json({ reachable: true, isAdmin }, { status: 200 });
  } catch (error) {
    // Erreur globale (ex: serveur/edge indisponible) => 503
    console.error("Erreur vérification statut admin:", error);
    return NextResponse.json(
      { isAdmin: false, error: "service_unavailable" },
      { status: 503 }
    );
  }
}
