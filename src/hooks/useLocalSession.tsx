import { useState, useEffect } from "react";
import { useSession as useNextAuthSession } from "next-auth/react";
import { Session } from "next-auth";
import {
  clearUserSession as clearSessionUtils,
  getUserSession as getSessionUtils,
  saveUserSession as saveSessionUtils,
} from "@/lib/session-utils";

interface UserSession {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  username?: string;
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

// Fonctions utilitaires pour gérer la session locale (localStorage)
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

  useEffect(() => {
    const loadSession = () => {
      try {
        // Essayer de récupérer la session depuis localStorage
        let userSession = getLocalUserSession();

        if (userSession) {
          setLocalSession(userSession);
        } else if (serverSession?.user) {
          // Si pas de session localStorage mais session serveur disponible
          const userId = serverSession.user.id;

          const sessionData: UserSession = {
            id: userId || "unknown",
            email: serverSession.user.email || "",
            name: serverSession.user.name || "",
            firstName: serverSession.user.firstName,
            lastName: serverSession.user.lastName,
            username: serverSession.user.username,
            profileImage: (serverSession.user as any).profileImage,
            bannerImage: (serverSession.user as any).bannerImage,
          };

          if (saveLocalUserSession(sessionData)) {
            setLocalSession(sessionData);
          }
        }
      } catch (error) {
        console.error("❌ Erreur lors du chargement de la session:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [serverSession]);

  const logout = (): void => {
    clearSessionUtils(); // Utilise la fonction centralisée qui vide localStorage ET sessionStorage
    setLocalSession(null);
  };

  const isLoggedIn = Boolean(localSession !== null && localSession.id);

  return {
    session: localSession || serverSession,
    loading,
    isLoggedIn,
    userId: localSession?.id || null,
    userName: localSession?.name || null,
    userEmail: localSession?.email || null,
    userFirstName: localSession?.firstName || null,
    userLastName: localSession?.lastName || null,
    username: localSession?.username || null,
    isAdmin: localSession?.isAdmin || false,
    isVerified: localSession?.isVerified || false,
    profileImage: localSession?.profileImage || null,
    bannerImage: localSession?.bannerImage || null,
    logout,
  };
}
