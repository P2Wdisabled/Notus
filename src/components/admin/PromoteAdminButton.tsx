"use client";

import { useState } from "react";
import Icon from "@/components/Icon";

export default function PromoteAdminButton() {
  const [isPromoting, setIsPromoting] = useState(false);

  const handlePromoteToAdmin = async () => {
    if (!confirm("Êtes-vous sûr de vouloir vous promouvoir administrateur ?")) {
      return;
    }

    setIsPromoting(true);

    try {
      const response = await fetch("/api/admin/promote-self", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        alert(
          "Vous avez été promu administrateur ! Rechargez la page pour voir les changements."
        );
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.message}`);
      }
    } catch (error) {
      alert(`Erreur: ${(error as Error).message}`);
    } finally {
      setIsPromoting(false);
    }
  };

  return (
    <button
      onClick={handlePromoteToAdmin}
      disabled={isPromoting}
      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-primary bg-primary/10 hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isPromoting ? (
        <Icon name="spinner" className="animate-spin -ml-1 mr-2 h-3 w-3" />
      ) : (
        <Icon name="shieldCheck" className="w-3 h-3 mr-1" />
      )}
      {isPromoting ? "Promotion..." : "Devenir Admin"}
    </button>
  );
}


