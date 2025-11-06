"use client";

import { useTheme } from "@/contexts/ThemeContext";
import NavBar from "@/components/NavBar";
import ContentWrapper from "@/components/ContentWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import Icon from "@/components/Icon";

export default function SettingsPage() {
  const { isDark, toggleTheme, primaryColor, setPrimaryColor } = useTheme();

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
                    <Icon name="moon" className="h-5 w-5 text-foreground/80" />
                  ) : (
                    <Icon name="sun" className="h-5 w-5 text-foreground/80" />
                  )}
                </span>
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Couleur principale</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div>
                <div className="text-foreground font-medium">Couleur de l'interface</div>
                <div className="text-muted-foreground text-sm">Changez la couleur primaire utilisée dans l'application.</div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  aria-label="Choisir la couleur principale"
                  value={primaryColor && /^#([0-9a-fA-F]{6})$/.test(primaryColor) ? primaryColor : "#a855f7"}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-10 w-16 cursor-pointer rounded-md border border-border bg-background p-1"
                />
                <div
                  className="h-10 w-10 rounded-full border border-border"
                  style={{ backgroundColor: primaryColor && /^#([0-9a-fA-F]{6})$/.test(primaryColor) ? primaryColor : "#a855f7" }}
                  aria-hidden="true"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </ContentWrapper>
    </div>
  );
}


