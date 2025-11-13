"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import Icon from "@/components/Icon";
import { Badge } from "@/components/ui";
import type { Request } from "@/lib/repositories/RequestRepository";

interface RequestDetailPageClientProps {
  request: Request;
}

const typeLabels: Record<Request["type"], string> = {
  help: "Demande d'aide",
  data_restoration: "Restauration de données",
  other: "Autre",
};

const statusLabels: Record<Request["status"], string> = {
  pending: "En attente",
  in_progress: "En cours",
  resolved: "Résolu",
  rejected: "Rejeté",
};

const statusVariants: Record<Request["status"], "warning" | "info" | "success" | "destructive"> = {
  pending: "warning",
  in_progress: "info",
  resolved: "success",
  rejected: "destructive",
};

export default function RequestDetailPageClient({ request: initialRequest }: RequestDetailPageClientProps) {
  const router = useRouter();
  const [request, setRequest] = useState(initialRequest);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState(false);

  const handleStatusChange = async (newStatus: Request["status"]) => {
    if (newStatus === request.status) return;

    setError(null);
    setIsUpdatingStatus(true);

    try {
      const response = await fetch(`/api/admin/requests/${request.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erreur lors de la mise à jour du statut");
      }

      setRequest(data.request);
      setStatusUpdateSuccess(true);
      setTimeout(() => {
        setStatusUpdateSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!message.trim()) return;

    setError(null);
    setIsSending(true);

    try {
      const response = await fetch(`/api/admin/requests/${request.id}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erreur lors de l'envoi du message");
      }

      setSuccess(true);
      setMessage("");
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <article className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/requests")}
              className="flex items-center gap-2"
            >
              <Icon name="arrowLeft" className="w-4 h-4" />
              Retour
            </Button>
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">{request.title}</h2>
          <div className="flex items-center gap-2 mb-4">
            <Badge variant={statusVariants[request.status]} size="sm">
              {statusLabels[request.status]}
            </Badge>
            <Badge variant="outline" size="sm">
              {typeLabels[request.type]}
            </Badge>
          </div>
        </div>
      </div>

      {statusUpdateSuccess && (
        <div className="p-3 bg-success/10 border border-success/20 rounded-lg text-success text-sm">
          <div className="flex items-center gap-2">
            <Icon name="circleCheck" className="w-4 h-4" />
            <span>Statut mis à jour avec succès !</span>
          </div>
        </div>
      )}

      <section className="border border-border rounded-lg p-4 bg-card">
        <h3 className="text-lg font-semibold text-foreground mb-4">Modifier le statut</h3>
        <div className="flex items-center gap-4">
          <label htmlFor="status-select" className="text-sm font-medium text-foreground">
            Statut de la requête
          </label>
          <Select
            value={request.status}
            onValueChange={(value) => handleStatusChange(value as Request["status"])}
            disabled={isUpdatingStatus}
          >
            <SelectTrigger id="status-select" className="w-48" aria-label="Choisir le statut">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="in_progress">En cours</SelectItem>
              <SelectItem value="resolved">Résolu</SelectItem>
            </SelectContent>
          </Select>
          {isUpdatingStatus && (
            <Icon name="spinner" className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </section>

      <dl className="space-y-4">
        <div>
          <dt className="text-sm font-medium text-muted-foreground mb-1">Utilisateur</dt>
          <dd className="text-sm text-foreground">
            {request.user_name || "N/A"} ({request.user_email || "N/A"})
          </dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-muted-foreground mb-1">Date de création</dt>
          <dd className="text-sm text-foreground">
            {new Date(request.created_at).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </dd>
        </div>

        {request.validated && request.validator_name && (
          <div>
            <dt className="text-sm font-medium text-muted-foreground mb-1">Validé par</dt>
            <dd className="text-sm text-foreground">
              {request.validator_name} ({request.validator_email})
              {request.validated_at && (
                <span className="text-muted-foreground ml-2">
                  le {new Date(request.validated_at).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </dd>
          </div>
        )}

        <div>
          <dt className="text-sm font-medium text-muted-foreground mb-1">Description</dt>
          <dd className="text-sm text-foreground whitespace-pre-wrap bg-muted/30 p-4 rounded-lg">
            {request.description}
          </dd>
        </div>
      </dl>

      <div className="border-t border-border pt-6 mt-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Envoyer un message à l'utilisateur
        </h3>

        {success && (
          <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded-lg text-success text-sm">
            <div className="flex items-center gap-2">
              <Icon name="circleCheck" className="w-4 h-4" />
              <span>Message envoyé avec succès !</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            <div className="flex items-center gap-2">
              <Icon name="alert" className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="space-y-4">
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
              Message
            </label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Écrivez votre message à l'utilisateur..."
              rows={6}
              required
              className="bg-card text-foreground border-border resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Ce message sera envoyé comme notification à l'utilisateur.
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="submit"
              variant="primary"
              disabled={isSending || !message.trim()}
            >
              {isSending ? (
                <>
                  <Icon name="spinner" className="w-4 h-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Icon name="check" className="w-4 h-4 mr-2" />
                  Envoyer le message
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </article>
  );
}

