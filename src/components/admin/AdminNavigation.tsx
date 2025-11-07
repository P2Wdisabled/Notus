"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Icon, { type IconName } from "@/components/Icon";

interface NavItem {
  name: string;
  href: string;
  icon: IconName;
}

export default function AdminNavigation() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation: NavItem[] = [
    { name: "Tableau de bord", href: "/admin", icon: "dashboard" },
    { name: "Utilisateurs", href: "/admin/users", icon: "users" },
    { name: "Documents", href: "/admin/documents", icon: "document" },
    { name: "Paramètres", href: "/admin/settings", icon: "gear" },
  ];

  return (
    <nav className="bg-background shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link
                href="/admin"
                className="text-xl font-bold text-foreground"
              >
                Notus Admin
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                    }`}
                  >
                    <span className="mr-2"><Icon name={item.icon} className="w-5 h-5" /></span>
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium"
            >
              Retour à l'app
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring"
            >
              <Icon name="menu" className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive
                      ? "bg-muted border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:bg-muted hover:border-border hover:text-foreground"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <span className="mr-3"><Icon name={item.icon} className="w-5 h-5" /></span>
                    {item.name}
                  </div>
                </Link>
              );
            })}
            <Link
              href="/"
              className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-muted-foreground hover:bg-muted hover:border-border hover:text-foreground"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Retour à l'app
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}


