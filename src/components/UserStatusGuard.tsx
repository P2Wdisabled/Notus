"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { clearUserSession } from "@/lib/session-utils";
import BannedUserModal from "./BannedUserModal";

interface UserStatusGuardProps {
  children: React.ReactNode;
}

export default function UserStatusGuard({ children }: UserStatusGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [showBannedModal, setShowBannedModal] = useState(false);
  const [banReason, setBanReason] = useState<string>("");
  const [hasShownModal, setHasShownModal] = useState(false);

  useEffect(() => {
    if (status === "loading") return; // Attendre que la session soit chargée

    // Si l'utilisateur n'est pas connecté, nettoyer sa userSession
    if (status === "unauthenticated") {
      if (typeof window !== "undefined") {
        const userSession = localStorage.getItem("userSession");
        if (userSession) {
          console.log("🧹 Utilisateur non connecté détecté, nettoyage de userSession...");
          clearUserSession();
        }
      }
      return;
    }

    // Vérifier si l'utilisateur est connecté et banni
    if (session?.user?.isBanned && !hasShownModal) {
      // Déconnecter immédiatement l'utilisateur banni
      const handleBannedUser = async () => {
        try {
          // Supprimer la session du localStorage et sessionStorage
          clearUserSession();
          
          // Vérifier que le localStorage est bien nettoyé
          if (typeof window !== "undefined") {
            const userSession = localStorage.getItem("userSession");
            const currentUserId = localStorage.getItem("currentUserId");
            console.log("🧹 Nettoyage localStorage - userSession:", userSession ? "présent" : "supprimé");
            console.log("🧹 Nettoyage localStorage - currentUserId:", currentUserId ? "présent" : "supprimé");
            
            if (userSession) {
              console.log("⚠️ userSession encore présent, suppression forcée...");
              localStorage.removeItem("userSession");
            }
            if (currentUserId) {
              console.log("⚠️ currentUserId encore présent, suppression forcée...");
              localStorage.removeItem("currentUserId");
            }
          }
          
          // Déconnecter l'utilisateur
          await signOut({ redirect: false });
          
          // Afficher le modal de notification
          setBanReason("Votre compte a été suspendu par un administrateur.");
          setShowBannedModal(true);
          setHasShownModal(true);
        } catch (error) {
          console.error("Erreur lors de la déconnexion de l'utilisateur banni:", error);
          setBanReason("Votre compte a été suspendu par un administrateur.");
          setShowBannedModal(true);
          setHasShownModal(true);
        }
      };
      
      handleBannedUser();
      return;
    }

    // Si l'utilisateur n'est pas banni mais essaie d'accéder à /banned, rediriger vers l'accueil
    if (pathname === "/banned" && session?.user && !session.user.isBanned) {
      router.push("/");
      return;
    }
  }, [session, status, pathname, router, hasShownModal]);

  // Si l'utilisateur est banni, afficher le modal
  if (showBannedModal) {
    return (
      <BannedUserModal
        isOpen={showBannedModal}
        onClose={() => {
          setShowBannedModal(false);
          // Rediriger vers l'accueil après fermeture du modal
          router.push("/");
        }}
        reason={banReason}
      />
    );
  }

  // Sinon, afficher le contenu normal
  return <>{children}</>;
}
