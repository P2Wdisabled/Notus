import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/../lib/auth";
import { UserService } from "@/lib/services/UserService";

const userService = new UserService();

// Vérifier si l'utilisateur est admin
async function checkAdmin(userId: number | undefined): Promise<boolean> {
  if (!userId) return false;
  try {
    return await userService.isUserAdmin(userId);
  } catch (error) {
    console.error("❌ Erreur vérification admin:", error);
    return false;
  }
}

// GET - Récupérer tous les settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? Number(session.user.id) : undefined;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 401 }
      );
    }

    const isAdmin = await checkAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 403 }
      );
    }

    const settings = await (prisma as any).appSetting.findMany({
      orderBy: { key: "asc" },
    });

    // Convertir en objet clé-valeur
    // Ne pas exposer les valeurs sensibles (tokens, clés API, etc.)
    const settingsMap: Record<string, string> = {};
    const sensitiveKeys = ["ollama_token"];
    
    for (const setting of settings) {
      if (sensitiveKeys.includes(setting.key)) {
        // Ne pas renvoyer les valeurs sensibles, juste indiquer qu'elles existent
        settingsMap[setting.key] = setting.value ? "***" : "";
      } else {
        settingsMap[setting.key] = setting.value;
      }
    }

    return NextResponse.json({
      success: true,
      settings: settingsMap,
    });
  } catch (error) {
    console.error("❌ Erreur GET /api/admin/settings:", error);
    return NextResponse.json(
      { success: false, error: "Accès refusé" },
      { status: 500 }
    );
  }
}

// POST - Mettre à jour un setting
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? Number(session.user.id) : undefined;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 401 }
      );
    }

    const isAdmin = await checkAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 400 }
      );
    }

    const { key, value, description } = body as {
      key?: unknown;
      value?: unknown;
      description?: unknown;
    };

    if (typeof key !== "string" || key.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 400 }
      );
    }

    if (typeof value !== "string") {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 400 }
      );
    }

    // Créer ou mettre à jour le setting
    const setting = await (prisma as any).appSetting.upsert({
      where: { key },
      update: {
        value,
        ...(typeof description === "string" ? { description } : {}),
      },
      create: {
        key,
        value,
        description: typeof description === "string" ? description : null,
      },
    });

    return NextResponse.json({
      success: true,
      setting,
    });
  } catch (error) {
    console.error("❌ Erreur POST /api/admin/settings:", error);
    return NextResponse.json(
      { success: false, error: "Accès refusé" },
      { status: 500 }
    );
  }
}

