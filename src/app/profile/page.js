"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getUserNotesAction } from "@/lib/actions";
import CreateNoteForm from "@/components/CreateNoteForm";
import NoteCard from "@/components/NoteCard";
import Link from "next/link";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      loadUserNotes();
    }
  }, [status, session]);

  const loadUserNotes = async () => {
    try {
      setLoading(true);
      const result = await getUserNotesAction(session.user.id);

      if (result.success) {
        setNotes(result.notes);
      } else {
        setError(result.error || "Erreur lors du chargement des notes");
      }
    } catch (err) {
      setError("Erreur lors du chargement des notes");
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNoteCreated = () => {
    // Recharger les notes après création
    loadUserNotes();
  };

  const handleNoteDeleted = (noteId) => {
    // Supprimer la note de la liste locale
    setNotes(notes.filter((note) => note.id !== noteId));
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Chargement...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Accès refusé
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Vous devez être connecté pour accéder à votre profil.
          </p>
          <Link
            href="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* En-tête du profil */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">
                {session.user.name?.charAt(0) || "U"}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {session.user.name || "Utilisateur"}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                @{session.user.username || "utilisateur"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {notes.length} note{notes.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Formulaire de création de note */}
        <CreateNoteForm
          userId={session.user.id}
          onNoteCreated={handleNoteCreated}
        />

        {/* Liste des notes */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Mes notes
          </h2>

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">
                Chargement des notes...
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {!loading && !error && notes.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Aucune note pour le moment
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Partagez vos premières pensées !
              </p>
            </div>
          )}

          {!loading &&
            !error &&
            notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                currentUserId={session.user.id}
                onDelete={handleNoteDeleted}
              />
            ))}
        </div>

        {/* Navigation */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
