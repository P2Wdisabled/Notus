import { useState, useEffect, useCallback } from "react";
import { useSession as useNextAuthSession } from "next-auth/react";
import type { Session } from "next-auth";
import {
  clearUserSession as clearSessionUtils,
  getUserSession as getSessionUtils,
  saveUserSession as saveSessionUtils,
} from "@/lib/session-utils";
import { createDocumentAction } from "@/lib/actions";

interface UserSession {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  username: string;
  profileImage?: string;
  bannerImage?: string;
  isAdmin?: boolean;
  isVerified?: boolean;
}

interface UseLocalSessionReturn {
  session: UserSession | Session | null;
  loading: boolean;
  isLoggedIn: boolean;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  userFirstName: string | null;
  userLastName: string | null;
  username: string | null;
  isAdmin: boolean;
  isVerified: boolean;
  profileImage: string | null;
  bannerImage: string | null;
  logout: () => void;
  migrationInProgress: boolean;
  forceMigration: () => Promise<void>;
}

const getLocalUserSession = (): UserSession | null => {
  if (typeof window === "undefined") return null;
  try {
    const session = localStorage.getItem("userSession");
    return session ? JSON.parse(session) : null;
  } catch (error) {
    console.error("Erreur lors de la récupération de la session:", error);
    return null;
  }
};

const saveLocalUserSession = (sessionData: UserSession): boolean => {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem("userSession", JSON.stringify(sessionData));
    return true;
  } catch (error) {
    console.error("Erreur lors de la sauvegarde de la session:", error);
    return false;
  }
};

export function useLocalSession(serverSession: Session | null = null): UseLocalSessionReturn {
  const [localSession, setLocalSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { data: nextAuthSession, status } = useNextAuthSession();
  const [migrationInProgress, setMigrationInProgress] = useState<boolean>(false);

  useEffect(() => {
    const loadSession = () => {
      try {
        let userSession = getLocalUserSession();

        const activeSession = nextAuthSession || serverSession;

        if (activeSession?.user) {
          const userId = activeSession.user.id;

          const sessionData: UserSession = {
            id: userId || "unknown",
            email: activeSession.user.email || "",
            name: activeSession.user.name || "",
            firstName: (activeSession.user as any).firstName,
            lastName: (activeSession.user as any).lastName,
            username: (activeSession.user as any).username,
            profileImage: (activeSession.user as any).profileImage,
            bannerImage: (activeSession.user as any).bannerImage,
            isAdmin: (activeSession.user as any).isAdmin,
            isVerified: (activeSession.user as any).isVerified,
          };
          if (saveLocalUserSession(sessionData)) {
            setLocalSession(sessionData);
          }
        } else if (userSession) {
          setLocalSession(userSession);
        } else {
          setLocalSession(null);
        }
      } catch (error) {
        console.error("❌ Erreur lors du chargement de la session:", error);
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, [serverSession, nextAuthSession, status]);

  // Fonction de migration des documents locaux
  const migrateLocalDocuments = useCallback(async (userId: string) => {
    if (typeof window === "undefined") return;
    if (migrationInProgress) return;

    try {
      setMigrationInProgress(true);
      const lockKey = `notus.migration.lock.for_user_${userId}`;
      const sessionLock = `session.${lockKey}`;
      const nowTs = Date.now();
      const lastLockTs = Number(localStorage.getItem(lockKey) || 0);
      if (sessionStorage.getItem(sessionLock) === "1") {
        setMigrationInProgress(false);
        return;
      }
      if (lastLockTs && nowTs - lastLockTs < 60_000) {
        setMigrationInProgress(false);
        return;
      }
      sessionStorage.setItem(sessionLock, "1");
      localStorage.setItem(lockKey, String(nowTs));

      const LOCAL_DOCS_KEY = "notus.local.documents";
      const raw = localStorage.getItem(LOCAL_DOCS_KEY);
      const localDocs: Array<{
        id: string | number;
        title?: string;
        content?: any;
        created_at?: string;
        updated_at?: string;
        tags?: string[];
      }> = raw ? JSON.parse(raw) : [];

      console.log(`[Migration] Documents locaux détectés: ${localDocs.length}`);
      if (localDocs.length > 0) {
        console.log(`[Migration] Liste des documents:`, localDocs.map(d => ({ id: d.id, title: d.title })));
      }

      if (!Array.isArray(localDocs) || localDocs.length === 0) {
        console.log(`[Migration] Aucun document local à migrer`);
        return;
      }

      const tagsRaw = localStorage.getItem("notus.tags");
      const tagsMap: Record<string, string[]> = tagsRaw ? JSON.parse(tagsRaw) : {};

      let remainingDocs = [...localDocs];

      for (const doc of localDocs) {
        const formData = new FormData();
        formData.append("userId", String(userId));
        formData.append("title", (doc.title || "Sans titre").trim());

        let contentStr = "";
        try {
          if (typeof doc.content === "string") contentStr = doc.content;
          else if (doc.content && typeof doc.content === "object") contentStr = JSON.stringify(doc.content);
          else contentStr = String(doc.content ?? "");
        } catch (_) {
          contentStr = String(doc.content ?? "");
        }
        formData.append("content", contentStr);

        const tagList = Array.isArray(tagsMap[String(doc.id)])
          ? tagsMap[String(doc.id)]
          : Array.isArray(doc.tags)
          ? doc.tags!
          : [];
        formData.append("tags", JSON.stringify(tagList));

        try {
          console.log(`[Migration] Tentative de migration du document local: ${doc.id} - "${doc.title}"`);
          const result: any = await createDocumentAction(undefined as unknown as never, formData);
          console.log(`[Migration] Résultat de création:`, result);
          
          // Vérification plus robuste du succès
          let ok = false;
          if (typeof result === "object" && result !== null && "success" in result) {
            ok = Boolean(result.success);
          } else if (typeof result === "string") {
            ok = false; // Les erreurs sont retournées comme des strings
          } else {
            ok = false; // Type inattendu
          }
          
          console.log(`[Migration] Succès de migration: ${ok} (type: ${typeof result}, result:`, result, ")");
          
          if (ok) {
            console.log(`[Migration] ✅ Document ${doc.id} migré avec succès, suppression du localStorage`);
            remainingDocs = remainingDocs.filter((d) => String(d.id) !== String(doc.id));
            localStorage.setItem(LOCAL_DOCS_KEY, JSON.stringify(remainingDocs));
            console.log(`[Migration] Documents restants: ${remainingDocs.length}`);
            
            if (String(doc.id) in tagsMap) {
              delete tagsMap[String(doc.id)];
              localStorage.setItem("notus.tags", JSON.stringify(tagsMap));
              console.log(`[Migration] Tags supprimés pour le document ${doc.id}`);
            }
          } else {
            console.warn(`[Migration] ❌ Échec de migration du document ${doc.id}:`, result);
          }
        } catch (e) {
          console.warn(`[Migration] ❌ Erreur lors de la migration du document ${doc.id}:`, e);
        }
      }
      
      // Log final de l'état du localStorage
      const finalRaw = localStorage.getItem(LOCAL_DOCS_KEY);
      const finalDocs = finalRaw ? JSON.parse(finalRaw) : [];
      console.log(`[Migration] Migration terminée. Documents restants dans localStorage: ${finalDocs.length}`);
      if (finalDocs.length > 0) {
        console.log(`[Migration] Documents non migrés:`, finalDocs.map((d: any) => ({ id: d.id, title: d.title })));
      }
    } catch (e) {
      console.error("Erreur de migration des documents locaux:", e);
    } finally {
      setMigrationInProgress(false);
      try {
        const lk = `notus.migration.lock.for_user_${userId}`;
        const slk = `session.${lk}`;
        sessionStorage.removeItem(slk);
        localStorage.removeItem(lk);
      } catch (_) {
        // ignore
      }
    }
  }, [migrationInProgress]);

  useEffect(() => {
    const activeUserId = (nextAuthSession?.user?.id || serverSession?.user?.id) as unknown as string | undefined;
    if (activeUserId) migrateLocalDocuments(String(activeUserId));
  }, [nextAuthSession, serverSession, migrateLocalDocuments]);

  const logout = (): void => {
    clearSessionUtils();
    setLocalSession(null);
  };

  // Fonction utilitaire pour forcer la migration (utile pour les tests)
  const forceMigration = async (): Promise<void> => {
    const activeUserId = (nextAuthSession?.user?.id || serverSession?.user?.id) as unknown as string | undefined;
    if (activeUserId) {
      console.log(`[Migration] Migration forcée pour l'utilisateur ${activeUserId}`);
      await migrateLocalDocuments(String(activeUserId));
    } else {
      console.warn(`[Migration] Aucun utilisateur actif pour forcer la migration`);
    }
  };

  const isLoggedIn = !!(localSession && localSession.id);

  return {
    session: localSession || serverSession,
    loading,
    isLoggedIn,
    userId: localSession?.id || null,
    userName: localSession?.name || null,
    userEmail: localSession?.email || null,
  userFirstName: localSession?.firstName ?? null,
  userLastName: localSession?.lastName ?? null,
  username: localSession?.username ?? null,
    isAdmin: localSession?.isAdmin || false,
    isVerified: localSession?.isVerified || false,
    profileImage: localSession?.profileImage || null,
    bannerImage: localSession?.bannerImage || null,
    logout,
    migrationInProgress,
    forceMigration,
  };
}