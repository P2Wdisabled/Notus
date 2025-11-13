"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/navigation/NavBar";
import ContentWrapper from "@/components/common/ContentWrapper";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Textarea } from "@/components/ui";
import Icon from "@/components/Icon";
import { cn } from "@/lib/utils";

type RequestType = "help" | "data_restoration" | "other";

export default function AssistancePage() {
  const router = useRouter();
  const [type, setType] = useState<RequestType>("help");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!title.trim() || !description.trim()) {
      setError("Le titre et la description sont requis");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          title: title.trim(),
          description: description.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erreur lors de la création de la requête");
      }

      setSuccess(true);
      setTitle("");
      setDescription("");
      setType("help");

      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeOptions: { value: RequestType; label: string; description: string; icon: string }[] = [
    {
      value: "help",
      label: "Demande d'aide",
      description: "Besoin d'aide pour utiliser l'application",
      icon: "alert",
    },
    {
      value: "data_restoration",
      label: "Restauration de données",
      description: "Récupérer des données perdues ou supprimées",
      icon: "document",
    },
    {
      value: "other",
      label: "Autre",
      description: "Autre type de demande",
      icon: "gear",
    },
  ];

  return (
    <main className="min-h-screen bg-background">
      <NavBar />
      <ContentWrapper maxWidth="md">
        <section className="space-y-6">
          <header>
            <h1 className="font-title text-4xl font-regular text-foreground hidden md:block">
              Assistance
            </h1>
            <p className="mt-2 text-muted-foreground">
              Créez une requête pour obtenir de l'aide ou demander une restauration de données.
            </p>
          </header>

          {success && (
            <div className="p-4 bg-success/10 border border-success/20 rounded-lg text-success">
              <div className="flex items-center gap-2">
                <Icon name="circleCheck" className="w-5 h-5" />
                <p className="font-medium">Votre requête a été créée avec succès !</p>
              </div>
              <p className="text-sm mt-1">
                Un administrateur examinera votre demande et vous répondra prochainement.
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
              <div className="flex items-center gap-2">
                <Icon name="alert" className="w-5 h-5" />
                <p className="font-medium">Erreur</p>
              </div>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Nouvelle requête</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <fieldset>
                  <legend className="text-foreground font-medium mb-3">
                    Type de requête
                  </legend>
                  <div className="space-y-2">
                    {typeOptions.map((option) => (
                      <label
                        key={option.value}
                        className={cn(
                          "flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors",
                          type === option.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/50"
                        )}
                      >
                        <input
                          type="radio"
                          name="type"
                          value={option.value}
                          checked={type === option.value}
                          onChange={(e) => setType(e.target.value as RequestType)}
                          className="mt-1"
                          aria-label={option.label}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon name={option.icon as any} className="w-5 h-5 text-foreground" />
                            <span className="font-medium text-foreground">{option.label}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{option.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div>
                  <label htmlFor="title" className="block text-foreground font-medium mb-2">
                    Titre de la requête
                  </label>
                  <Input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Problème de connexion"
                    required
                    maxLength={255}
                    className="bg-card text-foreground border-border"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-foreground font-medium mb-2">
                    Description détaillée
                  </label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Décrivez votre problème ou votre demande en détail..."
                    required
                    rows={6}
                    className="bg-card text-foreground border-border resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Plus vous fournissez de détails, plus nous pourrons vous aider rapidement.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting || !title.trim() || !description.trim()}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <Icon name="spinner" className="w-4 h-4 mr-2 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Icon name="check" className="w-4 h-4 mr-2" />
                        Envoyer la requête
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>
      </ContentWrapper>
    </main>
  );
}

