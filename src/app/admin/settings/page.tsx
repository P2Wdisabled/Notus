"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { Card } from "@/components/ui";
import Icon from "@/components/Icon";
import { cn } from "@/lib/utils";
import ColorPicker from "@/components/common/ColorPicker";

export default function AdminSettingsPage() {
  const { isDark, toggleTheme, primaryColor, setPrimaryColor } = useTheme();

  return (
    <main className="space-y-6">
      <header className="text-center pt-10">
        <h1 className="text-3xl font-bold text-foreground">
          Paramètres administrateur
        </h1>
        <p className="mt-2 text-muted-foreground">
          Gérez les paramètres de l'application Notus
        </p>
      </header>

      <section className="max-w-4xl mx-auto">
        <Card className="bg-background">
          <Card.Header>
            <Card.Title className="text-foreground text-2xl font-semibold">
              Apparence
            </Card.Title>
          </Card.Header>
          <Card.Content className="flex items-center justify-between gap-4 p-6">
            <div>
              <p className="text-foreground font-medium">Thème</p>
              <p className="text-muted-foreground text-sm">
                Basculez entre le mode clair et sombre.
              </p>
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
              className={cn(
                "relative inline-flex h-10 w-20 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                isDark ? "bg-primary" : "bg-muted"
              )}
            >
              <span className="sr-only">Basculer le thème</span>
              <span
                className={cn(
                  "absolute left-1 h-8 w-8 rounded-full bg-background shadow-sm ring-1 ring-border transition-transform duration-300 ease-out flex items-center justify-center",
                  isDark ? "translate-x-10" : "translate-x-0"
                )}
              >
                {isDark ? (
                  <Icon name="moon" className="h-5 w-5 text-foreground/80" />
                ) : (
                  <Icon name="sun" className="h-5 w-5 text-foreground/80" />
                )}
              </span>
            </button>
          </Card.Content>
        </Card>
      </section>

      <section className="max-w-4xl mx-auto">
        <Card className="bg-background">
          <Card.Header>
            <Card.Title className="text-foreground text-2xl font-semibold">
              Couleur principale
            </Card.Title>
          </Card.Header>
          <Card.Content className="p-6">
            <div className="mb-4">
              <p className="text-foreground font-medium">Couleur de l'interface</p>
              <p className="text-muted-foreground text-sm">
                Choisissez une couleur parmi la palette pour personnaliser l'interface.
              </p>
            </div>
            <ColorPicker selectedColor={primaryColor} onColorChange={setPrimaryColor} />
          </Card.Content>
        </Card>
      </section>
    </main>
  );
}

