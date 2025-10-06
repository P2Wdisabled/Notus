"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AdminButton from "./AdminButton";
import { Logo, Input } from "@/components/ui";
import { useLocalSession } from "@/hooks/useLocalSession";
import { Button } from "@/components/ui";

export default function NavBar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { userName, username, logout, isLoggedIn } = useLocalSession();

  const items = [
    { name: "Récent", href: "/recent", icon: ClockIcon },
    { name: "Notes personnelles", href: "/notes", icon: NoteIcon },
    { name: "Notes partagées", href: "/shared", icon: ShareIcon },
    { name: "Favoris", href: "/favorites", icon: StarIcon },
    { name: "Dossiers", href: "/folders", icon: FolderIcon },
    { name: "Notifications", href: "/notifications", icon: BellIcon },
    { name: "Corbeille", href: "/trash", icon: TrashIcon },
  ];

  const pageTitle = getPageTitle(pathname, items);

  const handleLogout = async () => {
    try {
      if (isLoggedIn) {
        router.push("/logout");
      } else {
        router.push("/login");
      }
    } catch (_) {
    } finally {
      setIsOpen(false);
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const handleDesktopSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      const q = searchQuery.trim();
      if (q.length > 0) {
        router.push(`/search?q=${encodeURIComponent(q)}`);
      } else {
        router.push("/search");
      }
    }
  };

  return (
    <>
      {/* Global top bar (mobile + desktop) */}
      <div className="sticky top-0 z-40 bg-white dark:bg-black">
        <div className="w-full px-2 h-14 flex items-center justify-between md:hidden">
          {/* Left: burger + page title */}
          <div className="flex items-center gap-3">
            <button
              aria-label="Ouvrir le menu"
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-md hover:bg-light-gray dark:hover:bg-light-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange dark:focus:ring-dark-purple cursor-pointer"
            >
              <MenuIcon />
            </button>
            {/* Mobile page title */}
            <span className="font-title text-4xl font-regular text-black dark:text-white">
              {pageTitle}
            </span>
            <Link href="/" className="items-center hidden md:flex">
                <Logo width={160} height={46} />
            </Link>
          </div>

          {/* Right: search, notifications, profile (hidden on desktop) */}
          <div className="flex items-center gap-2 md:hidden">
            {/* <Link
              href="/search"
              aria-label="Rechercher"
              className="p-2 rounded-full hover:bg-light-gray dark:hover:bg-light-black text-black dark:text-white"
            >
              <SearchIcon />
            </Link>
            <Link
              href="/notifications"
              aria-label="Notifications"
              className="p-2 rounded-full hover:bg-light-gray dark:hover:bg-light-black text-black dark:text-white"
            >
              <BellIcon /> 
            </Link>*/}
            {isLoggedIn && (
              <Link
                href="/profile"
                aria-label="Profil"
                className="ml-1 inline-flex items-center justify-center w-8 h-8 rounded-full bg-light-gray dark:bg-light-black text-black dark:text-white font-semibold"
                title={userName || "Profil"}
              >
                {getInitials(userName)}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 bg-white dark:bg-black p-4 flex flex-col">
            <div className="flex items-center justify-end mb-4">
              <button
                aria-label="Fermer"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-md hover:bg-light-gray dark:hover:bg-light-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-orange dark:focus:ring-dark-purple cursor-pointer"
              >
                <CloseIcon />
              </button>
            </div>
            <nav className="space-y-1 flex-1 overflow-y-auto">
              <div className="flex justify-center mb-3 p-3">
                <Link
                  href="/"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center"
                >
                  <Logo width={160} height={46} />
                </Link>
              </div>
              {/* {items
                .filter((i) => i.href !== "/notifications")
                .map(({ name, href, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      active
                        ? "bg-light-gray dark:bg-light-black text-black dark:text-white"
                        : "text-dark-gray dark:text-gray hover:bg-light-gray/70 dark:hover:bg-light-black/70"
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-base font-medium">{name}</span>
                  </Link>
                );
              })} */}
              <div className="pt-3">
                {/* <AdminButton /> */}
              </div>
            </nav>
            <div className="pt-4 space-y-3">
              {isLoggedIn && (
                <Link href="/profile" className="flex items-center gap-3 p-3 bg-transparent cursor-pointer border-t border-gray dark:border-dark-gray">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-light-gray dark:bg-light-black text-black dark:text-white font-semibold">
                    {getInitials(userName || username || "Anonyme")}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-black dark:text-white">
                      {username || userName || "Anonyme"}
                    </span>
                  </div>
                </Link>
              )}
              <Button
                onClick={handleLogout}
                className="w-full py-2"
                variant="primary"
              >
                {isLoggedIn ? "Se déconnecter" : "Se connecter"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop / Tablet sidebar like X */}
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64 bg-white dark:bg-black z-30">
        <div className="px-4 py-3 pt-10 flex justify-center">
          <Link href="/" className="inline-flex items-center">
            <Logo width={160} height={40} />
          </Link>
          {/* <div className="mt-3">
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleDesktopSearchKeyDown}
            />
          </div> */}
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {/* {items.map(({ name, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-4 px-3 py-2 rounded-full text-lg font-medium transition-colors ${
                  active
                    ? "bg-light-gray dark:bg-light-black text-black dark:text-white"
                    : "text-dark-gray dark:text-gray hover:bg-light-gray/70 dark:hover:bg-light-black/70"
                }`}
              >
                <Icon className="w-6 h-6" />
                <span>{name}</span>
              </Link>
            );
          })} */}
        </nav>
        <div className="p-4 space-y-3">
          {/* <AdminButton /> */}
          {isLoggedIn && (
            <Link href="/profile" className="flex items-center gap-3 p-3 bg-transparent cursor-pointer border-t border-gray dark:border-dark-gray">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-light-gray dark:bg-light-black text-black dark:text-white font-semibold">
              {getInitials(userName || username || "Anonyme")}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-black dark:text-white">
                {username || userName || "Anonyme"}
              </span>
            </div>
          </Link>
          )}
          <Button
            onClick={handleLogout}
            variant="primary"
            className="w-full"
          >
            {isLoggedIn ? "Se déconnecter" : "Se connecter"}
          </Button>
        </div>
      </aside>
    </>
  );
}

function MenuIcon(props) {
  return (
    <svg
      {...props}
      className={`w-6 h-6 ${props.className || ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}

function SearchIcon(props) {
  return (
    <svg
      {...props}
      className={`w-6 h-6 ${props.className || ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function BellIcon(props) {
  return (
    <svg
      {...props}
      className={`w-6 h-6 ${props.className || ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8a6 6 0 0112 0v5l2 3H4l2-3V8" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function CloseIcon(props) {
  return (
    <svg
      {...props}
      className={`w-6 h-6 ${props.className || ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 6l12 12" />
      <path d="M6 18L18 6" />
    </svg>
  );
}

function HomeIcon(props) {
  return (
    <svg
      {...props}
      className={`w-6 h-6 ${props.className || ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}

function ClockIcon(props) {
  return (
    <svg
      {...props}
      className={`w-6 h-6 ${props.className || ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function NoteIcon(props) {
  return (
    <svg
      {...props}
      className={`w-6 h-6 ${props.className || ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 4h12a2 2 0 012 2v10l-4-2H6a2 2 0 01-2-2V4z" />
    </svg>
  );
}

function ShareIcon(props) {
  return (
    <svg
      {...props}
      className={`w-6 h-6 ${props.className || ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.59 13.51l6.83 3.98" />
      <path d="M15.41 6.51L8.59 10.49" />
    </svg>
  );
}

function StarIcon(props) {
  return (
    <svg
      {...props}
      className={`w-6 h-6 ${props.className || ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );
}

function FolderIcon(props) {
  return (
    <svg
      {...props}
      className={`w-6 h-6 ${props.className || ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  );
}

function TrashIcon(props) {
  return (
    <svg
      {...props}
      className={`w-6 h-6 ${props.className || ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2" />
    </svg>
  );
}

function getPageTitle(pathname, items) {
  const found = items.find((i) => i.href === pathname);
  if (found) return found.name;
  if (pathname === "/") return "Mes notes";
  if (pathname === "/profile") return "Mon compte";
  if (pathname.startsWith("/profile/edit")) return "Modifier le profil";
  return "Notus";
}

function getInitials(name) {
  if (!name) return "?";
  const parts = String(name).trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}


