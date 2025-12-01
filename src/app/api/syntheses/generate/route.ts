import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/../lib/auth";
import { DocumentService } from "@/lib/services/DocumentService";
import { Ollama } from "ollama";

const documentService = new DocumentService();

// Fonctions pour gérer les tokens (réutilisées depuis /api/syntheses/tokens)
async function getTokenLimit(): Promise<number> {
  try {
    const setting = await (prisma as any).appSetting.findUnique({
      where: { key: "ai_token_limit_per_day" },
    });
    return setting ? parseInt(setting.value, 10) : 10000;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération de la limite:", error);
    return 10000;
  }
}

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

// Vérifier si la synthèse IA est activée
async function isAiSynthesisEnabled(): Promise<boolean> {
  try {
    const setting = await (prisma as any).appSetting.findUnique({
      where: { key: "ai_synthesis_enabled" },
    });
    return setting?.value === "true";
  } catch (error) {
    console.error("❌ Erreur lors de la vérification du setting:", error);
    // Par défaut, activé si le setting n'existe pas
    return true;
  }
}

// Fonction pour extraire le texte sans formatage markdown
function stripMarkdownFormatting(text: string): string {
  if (!text || typeof text !== "string") return "";
  
  return text
    // Supprimer les headers markdown
    .replace(/^#{1,6}\s+/gm, "")
    // Supprimer le gras
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    // Supprimer l'italique
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    // Supprimer le strikethrough
    .replace(/~~(.*?)~~/g, "$1")
    // Supprimer les liens markdown
    .replace(/\[([^\]]*)\]\([^\)]*\)/g, "$1")
    // Supprimer les images markdown
    .replace(/!\[([^\]]*)\]\([^\)]*\)/g, "")
    // Supprimer les listes
    .replace(/^[\*\-\+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    // Supprimer les blockquotes
    .replace(/^>\s+/gm, "")
    // Supprimer le code inline
    .replace(/`([^`]*)`/g, "$1")
    // Supprimer les blocs de code
    .replace(/```[\s\S]*?```/g, "")
    // Supprimer les balises HTML
    .replace(/<[^>]*>/g, "")
    // Nettoyer les espaces multiples
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? Number(session.user.id) : null;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 401 }
      );
    }

    // Vérifier si la synthèse IA est activée
    const enabled = await isAiSynthesisEnabled();
    if (!enabled) {
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

    const { documentId, content } = body as { documentId?: unknown; content?: unknown };

    const parsedDocumentId =
      typeof documentId === "number"
        ? documentId
        : typeof documentId === "string"
        ? parseInt(documentId, 10)
        : NaN;

    if (!parsedDocumentId || isNaN(parsedDocumentId) || parsedDocumentId <= 0) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 400 }
      );
    }

    if (typeof content !== "string") {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 400 }
      );
    }

    // Vérifier l'accès au document
    const userEmail = session?.user?.email as string | undefined;
    const hasAccess = await documentService.userHasAccessToDocument(
      parsedDocumentId,
      userId,
      userEmail
    );

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 403 }
      );
    }

    // Extraire le texte sans formatage
    const plainText = stripMarkdownFormatting(content);

    if (!plainText || plainText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 400 }
      );
    }

    // Estimer le nombre de tokens nécessaires (approximation: 1 token ≈ 4 caractères)
    // On estime les tokens pour le prompt + la réponse attendue
    const promptTokens = Math.ceil(plainText.length / 4);
    const estimatedResponseTokens = 1000; // Estimation pour une synthèse
    const estimatedTotalTokens = promptTokens + estimatedResponseTokens;

    // Vérifier la limite de tokens avant de générer
    const limit = await getTokenLimit();
    const used = await getTodayTokenUsage(userId);
    const remaining = limit - used;

    if (estimatedTotalTokens > remaining) {
      return NextResponse.json(
        {
          success: false,
          error: "Accès refusé",
          tokenLimit: limit,
          tokenUsed: used,
          tokenRemaining: remaining,
        },
        { status: 403 }
      );
    }

    // Récupérer la configuration Ollama depuis les settings
    async function getOllamaConfig(): Promise<{ url: string; model: string; token?: string }> {
      try {
        const [urlSetting, modelSetting, tokenSetting] = await Promise.all([
          (prisma as any).appSetting.findUnique({ where: { key: "ollama_url" } }),
          (prisma as any).appSetting.findUnique({ where: { key: "ollama_model" } }),
          (prisma as any).appSetting.findUnique({ where: { key: "ollama_token" } }),
        ]);

        return {
          url: urlSetting?.value || process.env.OLLAMA_URL || "http://localhost:11434",
          model: modelSetting?.value || process.env.OLLAMA_MODEL || "llama3.2",
          token: tokenSetting?.value || process.env.OLLAMA_TOKEN || undefined,
        };
      } catch (error) {
        console.error("❌ Erreur lors de la récupération de la config Ollama:", error);
        return {
          url: process.env.OLLAMA_URL || "http://localhost:11434",
          model: process.env.OLLAMA_MODEL || "llama3.2",
          token: process.env.OLLAMA_TOKEN || undefined,
        };
      }
    }

    const ollamaConfig = await getOllamaConfig();
    const ollamaUrl = ollamaConfig.url;
    const ollamaModel = ollamaConfig.model;

    const prompt = `Tu es un assistant qui crée des synthèses de documents. Crée une synthèse concise et structurée du document suivant. La synthèse doit être en français et mettre en évidence les points clés.

Document:
${plainText.substring(0, 8000)}${plainText.length > 8000 ? "\n\n[... document tronqué ...]" : ""}

Synthèse:`;

    let synthesisText = "";
    let actualTokens = estimatedTotalTokens;
    try {
      // Initialiser le client Ollama
      const ollama = new Ollama({
        host: ollamaUrl,
        headers: ollamaConfig.token
          ? {
              Authorization: `Bearer ${ollamaConfig.token}`,
            }
          : undefined,
      });

      // Appeler l'API Ollama avec streaming désactivé pour récupérer toute la réponse
      const response = await ollama.chat({
        model: ollamaModel,
        messages: [{ role: "user", content: prompt }],
        stream: false,
      });

      // Récupérer le contenu de la réponse
      synthesisText = response.message.content || "";
      
      // Calculer le nombre réel de tokens utilisés si disponible
      // Le package ollama peut retourner des informations sur les tokens
      if (response.prompt_eval_count && response.eval_count) {
        actualTokens = response.prompt_eval_count + response.eval_count;
      }
    } catch (error) {
      console.error("❌ Erreur lors de l'appel à Ollama:", error);
      // En cas d'erreur, on ne décompte pas les tokens car la génération a échoué
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 500 }
      );
    }

    if (!synthesisText || synthesisText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 500 }
      );
    }

    // Utiliser les tokens réels d'Ollama si disponibles, sinon utiliser l'estimation
    const finalTokens = actualTokens !== estimatedTotalTokens 
      ? actualTokens 
      : promptTokens + Math.ceil(synthesisText.length / 4);
    
    // Incrémenter l'utilisation de tokens avec le nombre réel
    try {
      await incrementTokenUsage(userId, finalTokens);
    } catch (error) {
      console.error("❌ Erreur lors de l'incrémentation des tokens:", error);
      // On continue quand même car la synthèse est déjà générée
    }

    // Sauvegarder la synthèse dans la base de données
    const synthesis = await (prisma as any).synthesis.create({
      data: {
        document_id: parsedDocumentId,
        user_id: userId,
        content: synthesisText.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true,
            email: true,
            profile_image: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      synthesis,
    });
  } catch (error) {
    console.error("❌ Erreur POST /api/syntheses/generate:", error);
    return NextResponse.json(
      { success: false, error: "Accès refusé" },
      { status: 500 }
    );
  }
}

