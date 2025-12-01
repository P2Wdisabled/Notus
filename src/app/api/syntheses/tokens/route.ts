import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/../lib/auth";

// Récupérer la limite de tokens par jour depuis les settings
async function getTokenLimit(): Promise<number> {
  try {
    const setting = await (prisma as any).appSetting.findUnique({
      where: { key: "ai_token_limit_per_day" },
    });
    return setting ? parseInt(setting.value, 10) : 10000; // Par défaut 10000
  } catch (error) {
    console.error("❌ Erreur lors de la récupération de la limite:", error);
    return 10000;
  }
}

// Récupérer l'utilisation de tokens pour un utilisateur aujourd'hui
async function getTodayTokenUsage(userId: number): Promise<number> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const usage = await (prisma as any).userTokenUsage.findUnique({
      where: {
        user_id_date: {
          user_id: userId,
          date: today,
        },
      },
    });
    
    return usage?.tokens_used || 0;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération de l'utilisation:", error);
    return 0;
  }
}

// Incrémenter l'utilisation de tokens pour un utilisateur aujourd'hui
async function incrementTokenUsage(userId: number, tokens: number): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    await (prisma as any).userTokenUsage.upsert({
      where: {
        user_id_date: {
          user_id: userId,
          date: today,
        },
      },
      update: {
        tokens_used: {
          increment: tokens,
        },
      },
      create: {
        user_id: userId,
        date: today,
        tokens_used: tokens,
      },
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'incrémentation des tokens:", error);
    throw error;
  }
}

// GET - Récupérer l'utilisation actuelle et la limite
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

    const limit = await getTokenLimit();
    const used = await getTodayTokenUsage(userId);
    const remaining = Math.max(0, limit - used);

    return NextResponse.json({
      success: true,
      limit,
      used,
      remaining,
    });
  } catch (error) {
    console.error("❌ Erreur GET /api/syntheses/tokens:", error);
    return NextResponse.json(
      { success: false, error: "Accès refusé" },
      { status: 500 }
    );
  }
}

// POST - Vérifier si l'utilisateur peut utiliser des tokens et les incrémenter
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

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 400 }
      );
    }

    const { tokens } = body as { tokens?: unknown };
    const tokensToUse = typeof tokens === "number" ? tokens : 0;

    if (tokensToUse <= 0) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 400 }
      );
    }

    const limit = await getTokenLimit();
    const used = await getTodayTokenUsage(userId);
    const remaining = limit - used;

    if (tokensToUse > remaining) {
      return NextResponse.json(
        {
          success: false,
          error: "Accès refusé",
          limit,
          used,
          remaining,
        },
        { status: 403 }
      );
    }

    // Incrémenter l'utilisation
    await incrementTokenUsage(userId, tokensToUse);

    const newUsed = used + tokensToUse;
    const newRemaining = limit - newUsed;

    return NextResponse.json({
      success: true,
      limit,
      used: newUsed,
      remaining: newRemaining,
    });
  } catch (error) {
    console.error("❌ Erreur POST /api/syntheses/tokens:", error);
    return NextResponse.json(
      { success: false, error: "Accès refusé" },
      { status: 500 }
    );
  }
}

