import { useState, useEffect } from "react";
import {
  getUserSession,
  saveUserSession,
  clearUserSession,
} from "@/lib/session-utils";

export function useLocalSession(serverSession = null) {
  const [localSession, setLocalSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = () => {
      try {
        // Essayer de récupérer la session depuis localStorage
        let userSession = getUserSession();

        if (userSession) {
          setLocalSession(userSession);
        } else if (serverSession?.user) {
          // Si pas de session localStorage mais session serveur disponible
          const userId = serverSession.user.id;

          const sessionData = {
            id: userId || "unknown",
            email: serverSession.user.email,
            name: serverSession.user.name,
            firstName: serverSession.user.firstName,
            lastName: serverSession.user.lastName,
            username: serverSession.user.username,
            profileImage: serverSession.user.profileImage,
            bannerImage: serverSession.user.bannerImage,
          };

          if (saveUserSession(sessionData)) {
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

  const logout = () => {
    clearUserSession();
    setLocalSession(null);
  };

  const isLoggedIn = localSession !== null && localSession.id;

  return {
    session: localSession,
    loading,
    isLoggedIn,
    logout,
    userId: localSession?.id || null,
    userName: localSession?.name || null,
    userEmail: localSession?.email || null,
    userFirstName: localSession?.firstName || null,
    userLastName: localSession?.lastName || null,
    username: localSession?.username || null,
    profileImage: localSession?.profileImage || null,
    bannerImage: localSession?.bannerImage || null,
  };
}
