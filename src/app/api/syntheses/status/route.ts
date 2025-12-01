import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// Vérifier si la synthèse IA est activée (route publique pour le frontend)
export async function GET(request: NextRequest) {
  try {
    const setting = await (prisma as any).appSetting.findUnique({
      where: { key: "ai_synthesis_enabled" },
    });
    
    const enabled = setting?.value === "true";
    
    return NextResponse.json({
      success: true,
      enabled,
    });
  } catch (error) {
    console.error("❌ Erreur GET /api/syntheses/status:", error);
    // Par défaut, activé si le setting n'existe pas
    return NextResponse.json({
      success: true,
      enabled: true,
    });
  }
}

