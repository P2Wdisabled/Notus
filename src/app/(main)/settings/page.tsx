"use client";

import { useTheme } from "@/contexts/ThemeContext";
import NavBar from "@/components/navigation/NavBar";
import ContentWrapper from "@/components/common/ContentWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import Icon from "@/components/Icon";
import ColorPicker from "@/components/common/ColorPicker";

export default function SettingsPage() {
  const { isDark, toggleTheme, primaryColor, setPrimaryColor } = useTheme();

  return (
    <main className="min-h-screen bg-background">
      <NavBar />
      <ContentWrapper maxWidth="md">
        <section className="space-y-6">
          <header>
            <h1 className="font-title text-4xl font-regular text-foreground hidden md:block">Paramètres</h1>
          </header>

          <section>
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
          </section>

          <section>
          <Card>
            <CardHeader>
              <CardTitle>Couleur principale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="text-foreground font-medium">Couleur de l'interface</div>
                <div className="text-muted-foreground text-sm">Choisissez une couleur parmi la palette pour personnaliser l'interface.</div>
              </div>
              <ColorPicker selectedColor={primaryColor} onColorChange={setPrimaryColor} />
            </CardContent>
          </Card>
          </section>
        </section>
      </ContentWrapper>
    </main>
  );
}


