"use client";

import { signOut } from "next-auth/react";
import { clearUserSession } from "@/lib/session-utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Modal } from "@/components/ui";

export default function LogoutPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const immediate = !!(
    searchParams?.get("immediate") === "1" ||
    searchParams?.get("immediate") === "true" ||
    searchParams?.has("auto") ||
    searchParams?.get("source") === "delete"
  );
  const [open, setOpen] = useState(!immediate);

  const handleConfirm = async () => {
    try {
      clearUserSession();
    } catch {}
    await signOut({ callbackUrl: "/", redirect: true });
  };

  const handleCancel = () => {
    setOpen(false);
    router.push("/");
  };

  useEffect(() => {
    if (immediate) {
      (async () => {
        try {
          clearUserSession();
        } catch {}
        await signOut({ callbackUrl: "/", redirect: true });
      })();
    }
  }, [immediate]);

  return (
    <>
      <Modal
        isOpen={open}
        onClose={handleCancel}
        size="sm"
        title="Se déconnecter ?"
        className="bg-background text-foreground border-2 border-primary text-center text-xl"
      >
        <div className="flex flex-col items-center text-center gap-5 bg-background">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-md">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-foreground">
              <path d="M16 17l5-5-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 12H9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13 21H6a2 2 0 01-2-2V5a2 2 0 012-2h7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div className="flex items-center gap-4 mt-2">
            <Button
              variant="primary"
              className="px-6 py-2"
              onClick={handleConfirm}
            >
              Continuer
            </Button>
            <Button
              variant="ghost"
              className="px-6 py-2"
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

