"use client";

import { useTheme } from "@/contexts/ThemeContext";
import NavBar from "@/components/NavBar";
import ContentWrapper from "@/components/ContentWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

export default function SettingsPage() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <ContentWrapper maxWidth="md">
        <div className="space-y-6">
          <h1 className="font-title text-4xl font-regular text-foreground hidden md:block">Paramètres</h1>

          <Card>
            <CardHeader>
              <CardTitle>Apparence</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div>
                <div className="text-foreground font-medium">Thème</div>
                <div className="text-muted-foreground text-sm">Basculez entre le mode clair et sombre.</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isDark}
                aria-label={isDark ? "Passer au mode clair" : "Passer au mode sombre"}
                onClick={toggleTheme}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleTheme();
                  }
                }}
                className={`relative inline-flex h-10 w-20 items-center rounded-full transition-colors focus:outline-none ${isDark ? "bg-primary" : "bg-muted"}`}
              >
                <span className="sr-only">Basculer le thème</span>
                <span
                  className={`absolute left-1 h-8 w-8 rounded-full bg-background shadow-sm ring-1 ring-border transition-transform duration-300 ease-out flex items-center justify-center ${isDark ? "translate-x-10" : "translate-x-0"}`}
                >
                  {isDark ? (
                    <svg
                      className="h-5 w-5 text-foreground/80"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5 text-foreground/80"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle cx="12" cy="12" r="5" />
                      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                    </svg>
                  )}
                </span>
              </button>
            </CardContent>
          </Card>
        </div>
      </ContentWrapper>
    </div>
  );
}


