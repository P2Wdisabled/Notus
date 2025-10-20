"use client";

import { usePathname, useRouter } from "next/navigation";

export function useGuardedNavigate() {
  const router = useRouter();
  const pathname = usePathname();

  const checkConnectivity = async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 5000);
      console.log(`[GuardedNavigate] Vérification de connexion...`);
      const resp = await fetch("/api/admin/check-status", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
        headers: { "cache-control": "no-cache" },
        signal: controller.signal,
      });
      window.clearTimeout(timeoutId);
      console.log(`[GuardedNavigate] Réponse de vérification: ${resp.status} ${resp.ok ? "OK" : "FAIL"}`);
      if (!resp.ok) {
        window.dispatchEvent(
          new CustomEvent("notus:offline-popin", {
            detail: {
              message:
                "Vous pourrez accéder à cette fonctionnalité une fois la connexion rétablie.",
              durationMs: 5000,
            },
          })
        );
      }
      return resp.ok;
    } catch (error) {
      console.log(`[GuardedNavigate] Erreur de vérification de connexion:`, error);
      window.dispatchEvent(
        new CustomEvent("notus:offline-popin", {
          detail: {
            message:
              "Vous pourrez accéder à cette fonctionnalité une fois la connexion rétablie.",
            durationMs: 5000,
          },
        })
      );
      return false;
    }
  };

  const guardedNavigate = async (href: string) => {
    console.log(`[GuardedNavigate] Tentative de navigation vers: ${href}`);
    try {
      const currentPath = pathname || "/";
      const targetPath = href || "/";
      if (currentPath === targetPath) {
        console.log(`[GuardedNavigate] Déjà sur ${targetPath}, aucune action effectuée.`);
        return;
      }
    } catch (_) {}

    const ok = await checkConnectivity();
    if (ok) {
      console.log(`[GuardedNavigate] Connexion OK, redirection vers ${href}`);
      router.push(href);
    } else {
      console.log(`[GuardedNavigate] Connexion échouée, navigation annulée`);
    }
  };

  return { guardedNavigate, checkConnectivity };
}


