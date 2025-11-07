import React, { useState } from "react";
import Link from "next/link";
import Image  from "next/image";

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
                  {user.id === currentUserId && (
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
          {/* 3 dots menu and profile overlay can go here if needed */}
        </div>
      ))}
    </div>
  );
}