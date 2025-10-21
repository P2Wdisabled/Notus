"use client";

import Link from "next/link";
import Modal from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
  title?: string;
}

export default function LoginRequiredModal({
  isOpen,
  onClose,
  message = "Vous devez être connecté pour effectuer cette action.",
  title = "Connexion requise",
}: LoginRequiredModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
    >
      <Modal.Content>
        <div className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Accès restreint
            </h3>
            <p className="text-muted-foreground">
              {message}
            </p>
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
        <Button 
          asChild 
          className="cursor-pointer px-6 py-2"
        >
          <Link href="/login">
            Se connecter
          </Link>
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

