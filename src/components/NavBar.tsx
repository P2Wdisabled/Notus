"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import AdminButton from "./AdminButton";
import { Logo, Input, Button } from "@/components/ui";
import { useLocalSession } from "@/hooks/useLocalSession";
import { useSearch } from "@/contexts/SearchContext";
import { useGuardedNavigate } from "@/hooks/useGuardedNavigate";
import LoginRequiredModal from "@/components/LoginRequiredModal";

interface NavItem {
  name: string;
  href: string;
  icon: (props: { className?: string }) => React.JSX.Element;
}

export default function NavBar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const router = useRouter();
  const { searchQuery, startSearch, clearSearch } = useSearch();
  const { data: session, status } = useSession();
  const { logout } = useLocalSession();
  const { guardedNavigate } = useGuardedNavigate();

  // Extraire les données de session
  const isLoggedIn = status === "authenticated" && session?.user;
  const userName = session?.user?.name || (session?.user as any)?.firstName || null;
  const username = (session?.user as any)?.username || null;
  const profileImage = (session?.user as any)?.profileImage || null;

  const [localProfileImage, setLocalProfileImage] = useState<string | null>(profileImage);

  // Mettre à jour l'image de profil locale quand la session change
  useEffect(() => {
    setLocalProfileImage(profileImage);
  }, [profileImage]);

  // Récupérer l'image de profil depuis la base de données si pas disponible dans la session
  useEffect(() => {
    const fetchProfileImage = async () => {
      if (isLoggedIn && !profileImage) {
        try {
          const response = await fetch("/api/profile-image");
          if (response.ok) {
            const data = await response.json();
            if (data.profileImage) {
              setLocalProfileImage(data.profileImage);
            }
          }
        } catch (error) {
          console.error(
            "Erreur lors de la récupération de l'image de profil:",
            error
          );
        }
      }
    };

    fetchProfileImage();
  }, [isLoggedIn, profileImage]);

  const items: NavItem[] = [
    // { name: "Récent", href: "/recent", icon: ClockIcon },
    { name: "Notes personnelles", href: "/notes", icon: NoteIcon },
    { name: "Notes partagées", href: "/shared", icon: ShareIcon },
    { name: "Paramètres", href: "/settings", icon: GearIcon },
    //{ name: "Favoris", href: "/favorites", icon: StarIcon },
    //{ name: "Dossiers", href: "/folders", icon: FolderIcon },
    //{ name: "Notifications", href: "/notifications", icon: BellIcon },
    { name: "Corbeille", href: "/trash", icon: TrashIcon },
  ];

  const pageTitle = getPageTitle(pathname, items);

  const handleLogout = async () => {
    try {
      if (isLoggedIn) {
        router.push("/logout");
      } else {
        await guardedNavigate("/login");
      }
    } catch (_) {
    } finally {
      setIsOpen(false);
    }
  };

  // Navigation protégée centralisée via hook

  const handleDesktopSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const q = searchQuery.trim();
      if (q.length > 0) {
        startSearch(q);
      } else {
        clearSearch();
      }
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length > 0) {
      startSearch(value);
    } else {
      clearSearch();
    }
  };

  const handleNavItemClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    setIsOpen(false);
    
    // Vérifier si c'est "Notes partagées" et l'utilisateur n'est pas connecté
    if (href === "/shared" && !isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    
    guardedNavigate(href);
  };

  return (
    <>
      {/* Global top bar (mobile + desktop) */}
      <div className="sticky top-0 z-40 bg-background">
        <div className="w-full px-2 h-14 flex items-center justify-between md:hidden">
          {/* Left: burger + page title */}
          <div className="flex items-center gap-3">
            <button
              aria-label="Ouvrir le menu"
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-md hover:bg-accent text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
            >
              <MenuIcon />
            </button>
            {/* Mobile page title */}
            <span className="font-title text-4xl font-regular text-foreground">
              {pageTitle}
            </span>
            <button
              type="button"
              className="items-center hidden md:flex"
              onClick={() => guardedNavigate("/")}
              aria-label="Accueil"
            >
              <Logo width={160} height={46} />
            </button>
          </div>

          {/* Right: profile (hidden on desktop) */}
          <div className="flex items-center gap-2 md:hidden">
            {isLoggedIn && (
              <button
                type="button"
                onClick={() => guardedNavigate("/profile")}
                aria-label="Profil"
                className="ml-1 inline-flex items-center justify-center w-8 h-8 rounded-full overflow-hidden bg-muted ring-1 ring-border/20 shadow-sm"
                title={userName || "Profil"}
              >
                {localProfileImage ? (
                  <img
                    src={localProfileImage}
                    alt="Photo de profil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-secondary text-secondary-foreground font-semibold flex items-center justify-center">
                    {getInitials(userName)}
                  </div>
                )}
              </button>
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
          <div className="absolute left-0 top-0 h-full w-72 bg-background border-r-2 border-border/50 p-4 flex flex-col">
            <div className="flex items-center justify-end mb-4">
              <button
                aria-label="Fermer"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-md hover:bg-accent text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
              >
                <CloseIcon />
              </button>
            </div>
            <nav className="space-y-1 flex-1 overflow-y-auto">
              <div className="flex justify-center mb-3 p-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    guardedNavigate("/");
                  }}
                  className="inline-flex items-center"
                  aria-label="Accueil"
                >
                  <Logo width={160} height={46} />
                </button>
              </div>
              <div className="px-3 mb-3">
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={handleDesktopSearchKeyDown}
                />
              </div>
              <div className="pt-3">{/* <AdminButton /> */}</div>
              {/* Navigation items (mobile) */}
              <div className="px-2">
                {items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={(e) => handleNavItemClick(e, item.href)}
                    className={`flex items-center gap-3 p-3 rounded-md hover:bg-accent text-foreground ${pathname === item.href ? 'bg-accent/70' : ''}`}
                  >
                    <item.icon />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                ))}
              </div>
            </nav>
            <div className="pt-4 space-y-3">
              {isLoggedIn && (
                <button
                  type="button"
                  onClick={() => guardedNavigate("/profile")}
                  className="flex items-center gap-3 p-3 bg-transparent cursor-pointer border-t border-border w-full text-left"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden bg-muted ring-1 ring-border/20 shadow-sm">
                    {localProfileImage ? (
                      <img
                        src={localProfileImage}
                        alt="Photo de profil"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-secondary text-secondary-foreground font-semibold flex items-center justify-center">
                        {getInitials(userName || username || "Anonyme")}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">
                      {username || userName || "Anonyme"}
                    </span>
                  </div>
                </button>
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
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64 bg-background border-r-2 border-border/50 z-30">
        <div className="px-4 py-3 pt-10 flex justify-center">
          <button
            type="button"
            onClick={() => guardedNavigate("/")}
            className="inline-flex items-center"
            aria-label="Accueil"
          >
            <Logo width={160} height={40} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="mt-3">
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleDesktopSearchKeyDown}
            />
          </div>
          {/* Navigation items (desktop) */}
          <div className="mt-4 space-y-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavItemClick(e, item.href)}
                className={`flex items-center gap-3 p-3 rounded-md hover:bg-accent text-foreground ${pathname === item.href ? 'bg-accent/70' : ''}`}
              >
                <item.icon />
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </div>
        </nav>
        <div className="p-4 space-y-3">
          {/* <AdminButton /> */}
          {isLoggedIn && (
            <button
              type="button"
              onClick={() => guardedNavigate("/profile")}
              className="flex items-center gap-3 p-3 bg-transparent cursor-pointer border-t border-border w-full text-left"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden bg-muted ring-1 ring-border/20 shadow-sm">
                {localProfileImage ? (
                  <img
                    src={localProfileImage}
                    alt="Photo de profil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-secondary text-secondary-foreground font-semibold flex items-center justify-center">
                    {getInitials(userName || username || "Anonyme")}
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">
                  {username || userName || "Anonyme"}
                </span>
              </div>
            </button>
          )}
          <Button onClick={handleLogout} variant="primary" className="w-full">
            {isLoggedIn ? "Se déconnecter" : "Se connecter"}
          </Button>
        </div>
      </aside>

      {/* Modal de connexion pour Notes partagées */}
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        message="Vous devez être connecté pour avoir accès aux notes partagées."
      />
    </>
  );
}

function MenuIcon(props: { className?: string }) {
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

function SearchIcon(props: { className?: string }) {
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

function BellIcon(props: { className?: string }) {
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

function CloseIcon(props: { className?: string }) {
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

function HomeIcon(props: { className?: string }) {
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

function ClockIcon(props: { className?: string }) {
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

function NoteIcon(props: { className?: string }) {
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

function ShareIcon(props: { className?: string }) {
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

function StarIcon(props: { className?: string }) {
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

function FolderIcon(props: { className?: string }) {
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

function TrashIcon(props: { className?: string }) {
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

function GearIcon(props: { className?: string }) {
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
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 1 1 7.04 3.4l.06.06a1.65 1.65 0 0 0 1.82.33h0A1.65 1.65 0 0 0 10.43 2.3V2a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0A1.65 1.65 0 0 0 21.7 10.43H22a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function getPageTitle(pathname: string | null, items: NavItem[]): string {
  if (!pathname) return "Notus";
  const found = items.find((i) => i.href === pathname);
  if (found) return found.name;
  if (pathname === "/") return "Mes notes";
  if (pathname === "/profile") return "Mon compte";
  if (pathname === "/settings") return "Paramètres";
  if (pathname === "/trash") return "Corbeille";
  if (pathname.startsWith("/profile/edit")) return "Modifier le profil";
  return "Notus";
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = String(name).trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

