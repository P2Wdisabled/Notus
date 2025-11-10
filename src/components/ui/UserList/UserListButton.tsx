import React, { useRef, useState } from "react";
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
                <Image
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
                <Image
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
                <Image
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
          <svg
            width="11"
            height="11"
            viewBox="0 0 11 11"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g clipPath="url(#clip0_735_16645)">
              <rect x="1" y="1" width="9" height="9" className="fill-white dark:fill-black" />
              <path
                d="M8.07723 3.45456L2.92254 3.45456C2.87035 3.45472 2.8192 3.46845 2.77458 3.49428C2.72996 3.52011 2.69357 3.55706 2.66933 3.60116C2.64509 3.64525 2.63391 3.69482 2.637 3.74452C2.64009 3.79422 2.65732 3.84218 2.68686 3.88324L5.2642 7.43502C5.37102 7.58229 5.62818 7.58229 5.73528 7.43502L8.31263 3.88324C8.34246 3.84227 8.35996 3.79429 8.36321 3.7445C8.36647 3.69471 8.35536 3.64503 8.3311 3.60084C8.30683 3.55665 8.27034 3.51965 8.22558 3.49387C8.18083 3.46808 8.12952 3.45448 8.07723 3.45456Z"
                className="fill-black dark:fill-white"
              />
            </g>
            <rect
              x="10.5"
              y="10.5"
              width="10"
              height="10"
              rx="1.5"
              transform="rotate(-180 10.5 10.5)"
              className="stroke-black dark:stroke-white"
            />
            <defs>
              <clipPath id="clip0_735_16645">
                <rect x="10" y="10" width="9" height="9" rx="1" transform="rotate(-180 10 10)" fill="white" />
              </clipPath>
            </defs>
          </svg>
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