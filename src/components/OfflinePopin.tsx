"use client";

import React, { useEffect, useState, useCallback } from "react";
import Alert from "@/components/ui/alert";
import { XIcon, WifiOff } from "lucide-react";
import { usePathname } from "next/navigation";

export default function OfflinePopin() {
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [overrideMessage, setOverrideMessage] = useState<string | null>(null);
  const [forceShow, setForceShow] = useState<boolean>(false);
  const pathname = usePathname();
  const isEditingDocument = /^\/documents\/(\d+)/.test(pathname || "");

  const handleOnline = useCallback(() => {
    console.log(`[OfflinePopin] Événement 'online' détecté`);
    setIsOffline(false);
    setIsDismissed(false);
    // Masquer toute popin offline affichée lors de la reconnexion
    setForceShow(false);
    setOverrideMessage(null);
  }, []);

  const handleOffline = useCallback(() => {
    console.log(`[OfflinePopin] Événement 'offline' détecté`);
    setIsOffline(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const initialOffline = !navigator.onLine;
    console.log(`[OfflinePopin] État initial: ${initialOffline ? "hors ligne" : "en ligne"}`);
    setIsOffline(initialOffline);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleOnline, handleOffline]);

  // Listen for global requests to show an offline message (e.g., before guarded navigations)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ message?: string; durationMs?: number }>;
      const message = custom.detail?.message || null;
      console.log(`[OfflinePopin] Événement reçu - message: "${message}"`);
      setOverrideMessage(message);
      setIsDismissed(false);
      setForceShow(true);
    };
    window.addEventListener("notus:offline-popin", handler as EventListener);
    return () => {
      window.removeEventListener("notus:offline-popin", handler as EventListener);
    };
  }, []);

  // Poll every 5s when on a document page to verify connectivity by fetching the current note
  useEffect(() => {
    if (typeof window === "undefined") return;

    const match = pathname?.match(/^\/documents\/(\d+)/);
    const documentId = match?.[1] || null;
    if (!documentId) return;

    let cancelled = false;

    const checkConnection = async () => {
      console.log(`[OfflinePopin] Vérification de connexion pour le document ${documentId}...`);
      try {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`/api/openDoc?id=${documentId}`,
          {
            method: "GET",
            cache: "no-store",
            credentials: "include",
            headers: { "cache-control": "no-cache" },
            signal: controller.signal,
          }
        );

        window.clearTimeout(timeoutId);
        const online = response.ok;
        console.log(`[OfflinePopin] État: ${online ? "en ligne" : "hors ligne"} (status: ${response.status})`);
        if (!cancelled) {
          setIsOffline((previous) => {
            const next = !online;
            return previous !== next ? next : previous;
          });
          if (online) {
            // Masquer la popin si la connexion est rétablie via polling
            setForceShow(false);
            setOverrideMessage(null);
          }
        }
      } catch (error) {
        console.log(`[OfflinePopin] État: hors ligne (erreur réseau)`, error);
        if (!cancelled) setIsOffline(true);
      }
    };

    checkConnection();
    const intervalId = window.setInterval(checkConnection, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [pathname]);

  if (!(isOffline || forceShow) || isDismissed) return null;

  return (
    <div className="fixed left-4 bottom-4 z-50 max-w-sm animate-slide-up">
      <Alert variant="error" className="shadow-lg flex items-start gap-3 pr-10 bg-white dark:bg-gray-800">
        <div className="mt-0.5 text-red-600 dark:text-red-300">
          <WifiOff className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-semibold mb-1">Vous êtes hors ligne</h4>
          <p className="text-sm leading-5">
            {overrideMessage || (isEditingDocument
              ? "Votre connexion internet semble interrompue. Vous pourrez enregistrer la note une fois la connexion rétablie."
              : "Votre connexion internet semble interrompue. Vous pourrez avoir accès aux différentes fonctionnalités une fois la connexion rétablie.")}
          </p>
        </div>
        <button
          type="button"
          aria-label="Fermer l'alerte hors ligne"
          className="absolute top-2 right-2 rounded-xs p-1 text-red-700/70 hover:text-red-700 focus:outline-hidden focus:ring-2 focus:ring-ring"
          onClick={() => setIsDismissed(true)}
        >
          <XIcon className="h-4 w-4" />
        </button>
      </Alert>
    </div>
  );
}


