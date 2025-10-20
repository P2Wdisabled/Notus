import { useState, useEffect } from "react";
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

  useEffect(() => {
    const migrateLocalDocuments = async (userId: string) => {
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

        if (!Array.isArray(localDocs) || localDocs.length === 0) {
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
            const result: any = await createDocumentAction(undefined as unknown as never, formData);
            const ok = result && typeof result === "object" && "success" in result ? result.success : typeof result !== "string";
            if (ok) {
              remainingDocs = remainingDocs.filter((d) => String(d.id) !== String(doc.id));
              localStorage.setItem(LOCAL_DOCS_KEY, JSON.stringify(remainingDocs));
              if (String(doc.id) in tagsMap) {
                delete tagsMap[String(doc.id)];
                localStorage.setItem("notus.tags", JSON.stringify(tagsMap));
              }
            }
          } catch (e) {
            console.warn("Migration d'un document local échouée", e);
          }
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
    };

    const activeUserId = (nextAuthSession?.user?.id || serverSession?.user?.id) as unknown as string | undefined;
    if (activeUserId) migrateLocalDocuments(String(activeUserId));
  }, [nextAuthSession, serverSession, migrationInProgress]);

  const logout = (): void => {
    clearSessionUtils();
    setLocalSession(null);
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
  };
}