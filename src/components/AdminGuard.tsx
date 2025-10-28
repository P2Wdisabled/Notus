"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import BannedUserModal from "./BannedUserModal";

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showBannedModal, setShowBannedModal] = useState(false);
  const [banReason, setBanReason] = useState<string>("");

  useEffect(() => {
    if (status === "loading") return; // Attendre que la session soit chargée

    if (!session?.user) {
      // Utilisateur non connecté, rediriger vers la page de connexion
      router.push("/login");
      return;
    }

    // Vérifier si l'utilisateur est banni
    if (session.user.isBanned) {
      setBanReason("Votre compte a été suspendu par un administrateur.");
      setShowBannedModal(true);
      return;
    }

    // Vérifier si l'utilisateur est admin
    if (!session.user.isAdmin) {
      // Utilisateur connecté mais pas admin, rediriger vers l'accueil
      router.push("/");
      return;
    }
  }, [session, status, router]);

  // Afficher un loader pendant la vérification
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Si l'utilisateur est banni, afficher le modal
  if (showBannedModal) {
    return (
      <BannedUserModal
        isOpen={showBannedModal}
        onClose={() => setShowBannedModal(false)}
        reason={banReason}
      />
    );
  }

  // Si l'utilisateur n'est pas admin ou pas connecté, ne rien afficher
  if (!session?.user || !session.user.isAdmin) {
    return null;
  }

  // Utilisateur admin connecté, afficher le contenu
  return <>{children}</>;
}
