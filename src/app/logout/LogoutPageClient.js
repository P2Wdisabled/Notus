"use client";

import { signOut } from "next-auth/react";
import { clearUserSession } from "@/lib/session-utils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Modal } from "@/components/ui";

export default function LogoutPageClient() {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  const handleConfirm = async () => {
    try {
      clearUserSession();
    } catch {}
    await signOut({ callbackUrl: "/", redirect: true });
  };

  const handleCancel = () => {
    setOpen(false);
    router.push("/profile");
  };

  return (
    <>
      <Modal
        isOpen={open}
        onClose={handleCancel}
        size="sm"
        className="!bg-white dark:!bg-black text-black dark:text-white border-2 border-dark-orange dark:border-dark-purple"
      >
        <div className="flex flex-col items-center text-center gap-5 bg-white dark:bg-black">
          <h3 className="font-title text-3xl">Se déconnecter ?</h3>
          <div className="w-12 h-12 rounded-full bg-orange dark:bg-dark-purple flex items-center justify-center shadow-md">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-black dark:text-white">
              <path d="M16 17l5-5-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 12H9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13 21H6a2 2 0 01-2-2V5a2 2 0 012-2h7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div className="flex items-center gap-4 mt-2">
            <Button
              variant="primary"
              className="px-6 py-2 bg-orange dark:bg-dark-purple hover:bg-dark-orange dark:hover:bg-dark-purple shadow-orange dark:shadow-dark-purple"
              onClick={handleConfirm}
            >
              Continuer
            </Button>
            <Button
              variant="secondary"
              className="px-6 py-2 border-orange dark:border-dark-purple text-orange dark:text-dark-purple shadow-orange dark:shadow-dark-purple"
              onClick={handleCancel}
            >
              Annuler
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
