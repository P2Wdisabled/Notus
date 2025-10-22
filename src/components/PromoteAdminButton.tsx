"use client";

import { useState } from "react";

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
      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-purple-700 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:hover:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isPromoting ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-3 w-3"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : (
        <svg
          className="w-3 h-3 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      )}
      {isPromoting ? "Promotion..." : "Devenir Admin"}
    </button>
  );
}

