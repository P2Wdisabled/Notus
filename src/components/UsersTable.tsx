"use client";

import { useState } from "react";
import { User } from "@/lib/types";

interface UsersTableProps {
  users: User[];
}

export default function UsersTable({ users }: UsersTableProps) {
  const [banningUsers, setBanningUsers] = useState(new Set<string | number>());
  const [adminUsers, setAdminUsers] = useState(new Set<string | number>());
  const [showBanModal, setShowBanModal] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [userToBan, setUserToBan] = useState<User | null>(null);

  const handleBanClick = (user: User) => {
    if (user.is_banned) {
      // Débannir directement sans modal
      handleBanUser(user.id, false);
    } else {
      // Bannir avec modal pour la raison
      setUserToBan(user);
      setBanReason("");
      setShowBanModal(true);
    }
  };

  const handleBanUser = async (userId: string | number, isBanned: boolean, reason: string | null = null) => {
    setBanningUsers((prev) => new Set(prev).add(userId));

    try {
      const response = await fetch(`/api/admin/users/${userId}/ban`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isBanned, reason }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.emailSent) {
          alert(
            `Utilisateur ${isBanned ? "banni" : "débanni"
            } avec succès. Email de notification envoyé.`
          );
        } else {
          alert(`Utilisateur ${isBanned ? "banni" : "débanni"} avec succès.`);
        }
        // Recharger la page pour mettre à jour les données
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.message}`);
      }
    } catch (error) {
      alert(`Erreur: ${(error as Error).message}`);
    } finally {
      setBanningUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const confirmBan = () => {
    if (userToBan) {
      handleBanUser(userToBan.id, true, banReason);
      setShowBanModal(false);
      setUserToBan(null);
      setBanReason("");
    }
  };

  const handleToggleAdmin = async (userId: string | number, isAdmin: boolean) => {
    setAdminUsers((prev) => new Set(prev).add(userId));

    try {
      const response = await fetch(`/api/admin/users/${userId}/admin`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isAdmin }),
      });

      if (response.ok) {
        // Recharger la page pour mettre à jour les données
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.message}`);
      }
    } catch (error) {
      alert(`Erreur: ${(error as Error).message}`);
    } finally {
      setAdminUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const getStatusBadge = (user: User) => {
    if (user.is_banned) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          Banni
        </span>
      );
    }

    if (!user.email_verified) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          En attente
        </span>
      );
    }

    return (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        Actif
      </span>
    );
  };

  const getProviderBadge = (provider?: string) => {
    if (!provider) return null;

    return (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
        {provider}
      </span>
    );
  };

  return (
    <div className="overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Utilisateur
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Statut
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Rôle
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Inscription
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Conditions acceptées
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {users.map((user) => (
            <tr
              key={user.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {user.first_name?.charAt(0) || ''}
                        {user.last_name?.charAt(0) || ''}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.first_name} {user.last_name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      @{user.username}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-white">
                  {user.email}
                </div>
                {getProviderBadge(user.provider || undefined)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(user)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {user.is_admin ? (
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    Admin
                  </span>
                ) : (
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                    Utilisateur
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {new Date(user.created_at).toLocaleDateString("fr-FR")}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {user.terms_accepted_at ? (
                  <div>
                    <div className="text-green-600 dark:text-green-400 font-medium">
                      ✓ Acceptées
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(user.terms_accepted_at).toLocaleString("fr-FR")}
                    </div>
                  </div>
                ) : (
                  <div className="text-red-600 dark:text-red-400 font-medium">
                    ✗ Non acceptées
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleBanClick(user)}
                    disabled={banningUsers.has(user.id)}
                    className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded ${user.is_banned
                      ? "text-green-700 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800"
                      : "text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {banningUsers.has(user.id) ? (
                      <svg
                        className="animate-spin -ml-1 mr-1 h-3 w-3"
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
                    ) : null}
                    {user.is_banned ? "Débannir" : "Bannir"}
                  </button>

                  {!user.is_admin && (
                    <button
                      onClick={() => handleToggleAdmin(user.id, true)}
                      disabled={adminUsers.has(user.id)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-purple-700 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:hover:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {adminUsers.has(user.id) ? (
                        <svg
                          className="animate-spin -ml-1 mr-1 h-3 w-3"
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
                      ) : null}
                      Promouvoir
                    </button>
                  )}

                  {user.is_admin && (
                    <button
                      onClick={() => handleToggleAdmin(user.id, false)}
                      disabled={adminUsers.has(user.id)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {adminUsers.has(user.id) ? (
                        <svg
                          className="animate-spin -ml-1 mr-1 h-3 w-3"
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
                      ) : null}
                      Rétrograder
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {users.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Aucun utilisateur
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Aucun utilisateur trouvé dans la base de données.
          </p>
        </div>
      )}

      {/* Modal de confirmation de bannissement */}
      {showBanModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
                <svg
                  className="h-6 w-6 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div className="mt-2 text-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Confirmer le bannissement
                </h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Êtes-vous sûr de vouloir bannir{" "}
                    <strong>
                      {userToBan?.first_name} {userToBan?.last_name}
                    </strong>{" "}
                    ?
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    Un email de notification sera envoyé à l'utilisateur.
                  </p>
                </div>
                <div className="mt-4">
                  <label
                    htmlFor="banReason"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-left"
                  >
                    Raison du bannissement (optionnel)
                  </label>
                  <textarea
                    id="banReason"
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                    rows={3}
                    placeholder="Expliquez la raison du bannissement..."
                  />
                </div>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex space-x-3">
                  <button
                    onClick={confirmBan}
                    className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
                  >
                    Confirmer le bannissement
                  </button>
                  <button
                    onClick={() => {
                      setShowBanModal(false);
                      setUserToBan(null);
                      setBanReason("");
                    }}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

