"use client";

import { useEffect } from "react";
import Modal from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import Icon from "@/components/Icon";

interface BannedUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
}

export default function BannedUserModal({
  isOpen,
  onClose,
  reason = "Votre compte a été suspendu par un administrateur.",
}: BannedUserModalProps) {

  // Auto-redirection après 5 secondes si l'utilisateur ne ferme pas le modal
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Compte suspendu"
      size="md"
    >
      <Modal.Content>
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <Icon name="alert" className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Accès suspendu
            </h3>
            <p className="text-muted-foreground mb-4">
              {reason}
            </p>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
              <p className="text-sm text-red-700 dark:text-red-300">
                Vous avez été déconnecté automatiquement. Vous serez redirigé vers l'accueil dans quelques secondes.
              </p>
            </div>
          </div>
        </div>
      </Modal.Content>
      <Modal.Footer>
        <Button
          variant="ghost"
          className="cursor-pointer px-6 py-2"
          onClick={onClose}
        >
          Fermer
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
