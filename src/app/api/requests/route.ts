import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { RequestService } from "@/lib/services/RequestService";
import { UserService } from "@/lib/services/UserService";

const requestService = new RequestService();
const userService = new UserService();

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    await requestService.initializeTables();

    const body = await request.json();
    const { type, title, description } = body;

    if (!type || !title || !description) {
      return NextResponse.json(
        { success: false, error: "Type, titre et description requis" },
        { status: 400 }
      );
    }

    if (!["help", "data_restoration", "other"].includes(type)) {
      return NextResponse.json(
        { success: false, error: "Type de requête invalide" },
        { status: 400 }
      );
    }

    const result = await requestService.createRequest({
      user_id: parseInt(session.user.id),
      type: type as "help" | "data_restoration" | "other",
      title: title.trim(),
      description: description.trim(),
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Erreur lors de la création de la requête" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, request: result.request }, { status: 201 });
  } catch (error) {
    console.error("❌ Erreur création requête:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    await requestService.initializeTables();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    let result;
    if (userId) {
      // Vérifier que l'utilisateur demande ses propres requêtes ou qu'il est admin
      const requestedUserId = parseInt(userId);
      const sessionUserId = parseInt(session.user.id);
      const isAdmin = await userService.isUserAdmin(sessionUserId);
      
      if (requestedUserId !== sessionUserId && !isAdmin) {
        return NextResponse.json(
          { success: false, error: "Accès refusé - Vous ne pouvez voir que vos propres requêtes" },
          { status: 403 }
        );
      }
      
      result = await requestService.getRequestsByUser(requestedUserId);
    } else {
      // Récupérer toutes les requêtes nécessite d'être admin
      const isAdmin = await userService.isUserAdmin(parseInt(session.user.id));
      
      if (!isAdmin) {
        return NextResponse.json(
          { success: false, error: "Accès refusé - Droits administrateur requis" },
          { status: 403 }
        );
      }
      
      const limit = parseInt(searchParams.get("limit") || "100");
      const offset = parseInt(searchParams.get("offset") || "0");
      result = await requestService.getAllRequests(limit, offset);
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Erreur lors de la récupération des requêtes" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, requests: result.requests || [] });
  } catch (error) {
    console.error("❌ Erreur récupération requêtes:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

