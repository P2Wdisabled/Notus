import { NextResponse } from "next/server";
import { auth } from "../../../../../../../auth";
import { UserService } from "@/lib/services/UserService";
import { RequestService } from "@/lib/services/RequestService";

const requestService = new RequestService();
const userService = new UserService();

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    const isAdmin = await userService.isUserAdmin(parseInt(session.user.id));
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 403 }
      );
    }

    const { id } = await params;
    await requestService.initializeTables();

    const result = await requestService.rejectRequest(parseInt(id), parseInt(session.user.id));

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Erreur lors du rejet" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, request: result.request });
  } catch (error) {
    console.error("❌ Erreur rejet requête:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

