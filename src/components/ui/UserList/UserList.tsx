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
  id: number;
  name: string;
  avatarUrl: string;
  permission: boolean;
};

interface UserListProps {
  users: User[];
  currentUserId?: string | number;
}

export default function UserList({ users, currentUserId }: UserListProps) {
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const ownerId = users && users.length > 0 ? Number(users[0].id) : null;
  const connectedId = typeof currentUserId !== 'undefined' && currentUserId !== null ? Number(currentUserId) : null;
  const isConnectedOwner = ownerId !== null && connectedId !== null && ownerId === connectedId;

  return (
    <div className="space-y-4">
      {users.map((user, idx) => (
        <div
          key={user.id}
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
                >
                  <Icon name="dotsHorizontal" className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                    onClick={() => {
                      // replace with real handler: set permission to editor
                      console.log("Set editor for user", user.id);
                    }}
                  >
                    Éditeur
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      // replace with real handler: set permission to reader
                      console.log("Set reader for user", user.id);
                    }}
                  >
                    Lecteur
                  </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      ))}
    </div>
  );
}