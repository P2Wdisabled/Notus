import React, { useState } from "react";
import Icon from "@/components/Icon";
import Link from "next/link";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

type User = {
  id: number | null;
  name: string;
  avatarUrl: string;
  permission: boolean;
  email?: string | null;
};

interface UserListProps {
  users: User[];
  currentUserId?: string | number;
  documentId: number;
  onChanged?: () => Promise<void> | void;
  isOwner?: boolean;
}

export default function UserList({ users, currentUserId, documentId, onChanged, isOwner }: UserListProps) {
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [localUsers, setLocalUsers] = useState<User[]>(users);
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const ownerId = localUsers && localUsers.length > 0 ? (localUsers[0].id !== null ? Number(localUsers[0].id) : null) : null;
  const connectedId = typeof currentUserId !== 'undefined' && currentUserId !== null ? Number(currentUserId) : null;
  const isConnectedOwner = isOwner ?? (ownerId !== null && connectedId !== null && ownerId === connectedId);
  
  React.useEffect(() => setLocalUsers(users), [users]);

  async function handleSetPermission(targetEmail: string | undefined | null, newPermission: boolean) {
    if (!targetEmail) {
      alert("Impossible de trouver l'email de l'utilisateur");
      return;
    }

    const prev = localUsers;
    setLocalUsers(prevList => prevList.map(u => u.email?.toLowerCase() === targetEmail.toLowerCase() ? { ...u, permission: newPermission } : u));
    setLoadingEmail(targetEmail);

    try {
      const res = await fetch('/api/openDoc/share', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, email: targetEmail, permission: newPermission }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body?.error || 'Erreur serveur');
      }
      setMenuOpen(null);
      setLoadingEmail(null);
      if (onChanged) {
        try { await onChanged(); } catch (_) {}
      }
    } catch (err) {
      setLocalUsers(prev);
      setLoadingEmail(null);
      alert('Impossible de modifier la permission : ' + (err instanceof Error ? err.message : String(err)));
    }
  }

  return (
    <div className="space-y-4">
      {localUsers.map((user, idx) => (
        <div
          key={String(user.email ?? user.id ?? idx)}
          className="flex items-center bg-secondary justify-between px-2 py-2 rounded-lg hover:bg-muted/50 transition relative"
        >
          <div className="flex items-center gap-3">
            {user.avatarUrl && user.avatarUrl !== ""
              ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover hover:opacity-80 transition"
                />
              ) : (
                <span className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg bg-secondary text-secondary-foreground select-none uppercase hover:opacity-80 transition">
                  {user.name ? user.name.charAt(0).toUpperCase() : "?"}
                </span>
              )
            }
            <div className="flex flex-col">
              <span>
                {user.name}
                {user.id === connectedId && (
                  <span className="ml-2 text-xs text-muted-foreground">(vous)</span>
                )}
              </span>
              <span className="text-xs text-muted-foreground">
                {idx === 0
                  ? "Propriétaire"
                  : user.permission === true
                    ? "Éditeur"
                    : "Lecteur"}
              </span>
            </div>
          </div>
          {isConnectedOwner && user.id !== ownerId ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Plus d'options"
                  className="p-2 rounded hover:bg-accent/50"
                  onClick={() => setMenuOpen(prev => prev === (user.id ?? null) ? null : (user.id ?? null))}
                >
                  <Icon name="dotsHorizontal" className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                    onClick={() => handleSetPermission(user.email, true)}
                    aria-disabled={loadingEmail !== null}
                  >
                    {loadingEmail === user.email ? '...' : 'Éditeur'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleSetPermission(user.email, false)}
                    aria-disabled={loadingEmail !== null}
                  >
                    {loadingEmail === user.email ? '...' : 'Lecteur'}
                  </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      ))}
    </div>
  );
}
