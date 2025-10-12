import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { UserService } from "@/lib/services/UserService";

const userService = new UserService();

export async function GET() {
  try {
    const session = await auth();

    // Vérifier si l'utilisateur est connecté
    if (!session?.user?.id) {
      return NextResponse.json({ isAdmin: false });
    }

    // Vérifier si l'utilisateur est admin
    const adminStatus = await userService.isUserAdmin(parseInt(session.user.id));

    return NextResponse.json({ isAdmin: adminStatus });
  } catch (error) {
    console.error("Erreur vérification statut admin:", error);
    return NextResponse.json({ isAdmin: false });
  }
}
