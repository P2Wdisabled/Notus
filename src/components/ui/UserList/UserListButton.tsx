import React, { useRef, useState } from "react";
import Icon from "@/components/Icon";
import UserList from "./UserList";
import Image  from "next/image";

type User = {
  id: number;
  name: string;
  avatarUrl: string;
  email?: string;
  permission?: boolean;
};


interface UserListButtonProps {
  users: User[];
  className?: string;
}

export default function UserListButton({ users, className }: UserListButtonProps) {
  const [errored, setErrored] = useState<{ [id: string]: boolean }>({});
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close overlay on outside click (not when clicking inside overlay or button)
  React.useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        buttonRef.current && buttonRef.current.contains(target)
      ) return;
      if (
        overlayRef.current && overlayRef.current.contains(target)
      ) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className={`relative inline-block ${className || ""}`}>
      <button
        ref={buttonRef}
        className="relative w-24 h-16 bg-transparent border-none p-0 flex items-center justify-center"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <div className="relative w-24 h-16 flex items-end">
          {/* First avatar: big, aligned bottom left */}
          {users[0] && (
            <span className="z-10 -ml-2">
              {users[0].avatarUrl && users[0].avatarUrl !== "" && !errored[users[0].id] ? (
                <img
                  src={users[0].avatarUrl}
                  alt={users[0].name}
                  className="w-12 h-12 rounded-full object-cover"
                  onError={() => setErrored(e => ({ ...e, [users[0].id]: true }))}
                />
              ) : (
                <span className="w-12 h-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-lg font-bold">
                  {users[0].name?.charAt(0) || users[0].email?.charAt(0)}
                </span>
              )}
            </span>
          )}
          {/* Second avatar: small, always overlaps first */}
          {users[1] && (
            <span className="z-9 -ml-4">
              {users[1].avatarUrl && users[1].avatarUrl !== "" && !errored[users[1].id] ? (
                <img
                  src={users[1].avatarUrl}
                  alt={users[1].name}
                  className="w-10 h-10 rounded-full object-cover"
                  onError={() => setErrored(e => ({ ...e, [users[1].id]: true }))}
                />
              ) : (
                <span className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-xs font-bold">
                  {users[1].name?.charAt(0) || users[1].email?.charAt(0)}
                </span>
              )}
            </span>
          )}
          {/* Third avatar: small, always overlaps second */}
          {users[2] && (
            <span className="z-8 -ml-4">
              {users[2].avatarUrl && users[2].avatarUrl !== "" && !errored[users[2].id] ? (
                <img
                  src={users[2].avatarUrl}
                  alt={users[2].name}
                  className="w-8 h-8 rounded-full object-cover"
                  onError={() => setErrored(e => ({ ...e, [users[2].id]: true }))}
                />
              ) : (
                <span className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-xs font-bold">
                  {users[2].name?.charAt(0) || users[2].email?.charAt(0)}
                </span>
              )}
            </span>
          )}
        </div>

        <span className="absolute bottom-1 right-1 z-20">
          <Icon name="userListBadge" className="w-[11px] h-[11px]" />
        </span>
      </button>
      {open && (
        <div
          ref={overlayRef}
          className="absolute mt-2 z-50 min-w-[220px] max-w-xs bg-secondary text-secondary-foreground rounded-xl shadow-lg p-2 left-0 md:left-auto md:right-0 w-[90vw] md:w-auto "
        >
          <UserList
            users={users.map(u => ({
              ...u,
              id: Number(u.id),
              permission: u.permission === undefined ? false : u.permission
            }))}
            currentUserId={typeof window !== 'undefined' ? Number(window.localStorage.getItem('currentUserId')) : users[0]?.id}
          />
        </div>
      )}
    </div>
  );
}