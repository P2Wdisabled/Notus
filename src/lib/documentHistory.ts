import { prisma } from "./prisma";

/**
 * Système de debounce pour réduire les insertions d'historique en base.
 * On ne crée une entrée qu'après un délai d'inactivité (10 secondes).
 */
interface PendingHistoryEntry {
  documentId: number;
  userId?: number;
  userEmail?: string | null;
  previousContent: string | null;
  nextContent: string;
  timeout: NodeJS.Timeout;
  lastUpdate: number;
}

const pendingHistoryEntries = new Map<string, PendingHistoryEntry>();

const HISTORY_DEBOUNCE_MS = 10000; // 10 secondes d'inactivité avant d'enregistrer

function getHistoryKey(documentId: number, userId?: number, userEmail?: string | null): string {
  return `${documentId}:${userId ?? 'null'}:${userEmail ?? 'null'}`;
}

/**
 * Extrait le texte stocké dans le champ `content` d'un document.
 * Le contenu peut être soit une chaîne brute, soit une chaîne JSON
 * contenant un objet { text: string; timestamp?: number }.
 */
export function extractTextFromStoredContent(stored: unknown): string {
  if (!stored) return "";

  if (typeof stored === "string") {
    const raw = stored.trim();
    if (!raw) return "";

    // Tenter de parser comme snapshot JSON { text, timestamp }
    if (raw.startsWith("{") && raw.endsWith("}")) {
      try {
        const parsed = JSON.parse(raw) as { text?: unknown };
        if (typeof parsed?.text === "string") {
          return parsed.text;
        }
      } catch {
        // Si le parse échoue, on considère que c'est du texte brut
      }
    }

    return raw;
  }

  try {
    const asString = String(stored);
    return asString;
  } catch {
    return "";
  }
}

export interface TextDiff {
  added: string;
  removed: string;
}

/**
 * Calcule un diff très simple entre deux textes :
 * - on cherche le préfixe commun
 * - puis le suffixe commun
 * - tout ce qui diffère au milieu est considéré comme ajouté / supprimé
 *
 * L'objectif est de résumer un "envoi" complet, pas de produire un diff exhaustif.
 */
export function computeTextDiff(previous: string, next: string): TextDiff {
  if (previous === next) {
    return { added: "", removed: "" };
  }

  const prevLen = previous.length;
  const nextLen = next.length;
  const minLen = Math.min(prevLen, nextLen);

  let start = 0;
  while (start < minLen && previous[start] === next[start]) {
    start++;
  }

  let endPrev = prevLen;
  let endNext = nextLen;

  while (
    endPrev > start &&
    endNext > start &&
    previous[endPrev - 1] === next[endNext - 1]
  ) {
    endPrev--;
    endNext--;
  }

  const removed = previous.slice(start, endPrev);
  const added = next.slice(start, endNext);

  return { added, removed };
}

interface RecordHistoryParams {
  documentId: number;
  userId?: number;
  userEmail?: string | null;
  previousContent?: string | null;
  nextContent: string;
}

/**
 * Enregistre réellement une entrée d'historique en base de données.
 */
async function commitHistoryEntry({
  documentId,
  userId,
  userEmail,
  previousContent,
  nextContent,
}: RecordHistoryParams): Promise<void> {
  if (!process.env.DATABASE_URL) return;

  // Normaliser les textes pour le diff
  const prevText = extractTextFromStoredContent(previousContent ?? "");
  const nextText = extractTextFromStoredContent(nextContent);

  if (prevText === nextText) {
    // Rien n'a changé, pas besoin d'entrée d'historique
    return;
  }

  const { added, removed } = computeTextDiff(prevText, nextText);

  try {
    await prisma.documentHistory.create({
      data: {
        document_id: documentId,
        user_id: typeof userId === "number" ? userId : null,
        user_email: userEmail ?? null,
        snapshot_before: previousContent ?? null,
        snapshot_after: nextContent,
        diff_added: added || null,
        diff_removed: removed || null,
      },
    } as any);
  } catch (error) {
    console.error("❌ Erreur lors de l'enregistrement de l'historique du document:", error);
  }
}

/**
 * Enregistre une entrée d'historique pour un document avec debounce.
 * - Utilise un système de debounce pour regrouper les modifications rapides.
 * - Ne crée une entrée qu'après 10 secondes d'inactivité.
 * - Si une nouvelle modification arrive avant le délai, on annule le timeout précédent et on le relance.
 */
export async function recordDocumentHistory({
  documentId,
  userId,
  userEmail,
  previousContent,
  nextContent,
}: RecordHistoryParams): Promise<void> {
  if (!process.env.DATABASE_URL) return;

  const key = getHistoryKey(documentId, userId, userEmail);
  const now = Date.now();

  // Si une entrée en attente existe déjà, annuler son timeout
  const existing = pendingHistoryEntries.get(key);
  if (existing) {
    clearTimeout(existing.timeout);
    // Mettre à jour avec le nouveau contenu, mais garder le previousContent original
    existing.nextContent = nextContent;
    existing.lastUpdate = now;
  } else {
    // Créer une nouvelle entrée en attente
    const entry: PendingHistoryEntry = {
      documentId,
      userId,
      userEmail,
      previousContent: previousContent ?? null,
      nextContent,
      timeout: setTimeout(() => {}, 0), // Sera remplacé ci-dessous
      lastUpdate: now,
    };
    pendingHistoryEntries.set(key, entry);
  }

  // Créer un nouveau timeout qui enregistrera l'historique après le délai d'inactivité
  const entry = pendingHistoryEntries.get(key)!;
  entry.timeout = setTimeout(async () => {
    // Vérifier que l'entrée n'a pas été modifiée entre-temps
    const current = pendingHistoryEntries.get(key);
    if (current && current.lastUpdate === entry.lastUpdate) {
      // Enregistrer l'historique
      await commitHistoryEntry({
        documentId: entry.documentId,
        userId: entry.userId,
        userEmail: entry.userEmail,
        previousContent: entry.previousContent,
        nextContent: entry.nextContent,
      });
      // Retirer de la Map
      pendingHistoryEntries.delete(key);
    }
  }, HISTORY_DEBOUNCE_MS);
}

/**
 * Force l'enregistrement immédiat de l'historique (sans debounce).
 * Utile pour les sauvegardes HTTP explicites où on veut enregistrer immédiatement.
 */
export async function recordDocumentHistoryImmediate({
  documentId,
  userId,
  userEmail,
  previousContent,
  nextContent,
}: RecordHistoryParams): Promise<void> {
  // Annuler toute entrée en attente pour cette clé
  const key = getHistoryKey(documentId, userId, userEmail);
  const existing = pendingHistoryEntries.get(key);
  if (existing) {
    clearTimeout(existing.timeout);
    pendingHistoryEntries.delete(key);
    // Utiliser le previousContent de l'entrée en attente si disponible
    previousContent = existing.previousContent ?? previousContent ?? null;
    nextContent = existing.nextContent;
  }

  // Enregistrer immédiatement
  await commitHistoryEntry({
    documentId,
    userId,
    userEmail,
    previousContent,
    nextContent,
  });
}


