"use client";

import { Fragment } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { Badge } from "@/components/ui";
import type { Request } from "@/lib/repositories/RequestRepository";

interface RequestsTableProps {
  requests: Request[];
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

export default function RequestsTable({ requests }: RequestsTableProps) {
  const router = useRouter();


  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-background">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
              Utilisateur
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
              Statut
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-foreground uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-background divide-y divide-border">
          {requests.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                Aucune requête trouvée
              </td>
            </tr>
          ) : (
            requests.map((request) => (
              <Fragment key={request.id}>
                <tr className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {typeLabels[request.type]}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    <div>
                      <div className="font-medium">{request.user_name || "N/A"}</div>
                      <div className="text-muted-foreground text-xs">{request.user_email || ""}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={statusVariants[request.status]} size="sm">
                      {statusLabels[request.status]}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => router.push(`/admin/requests/${request.id}`)}
                        className="text-primary hover:text-primary/80"
                        aria-label="Voir les détails"
                      >
                        <Icon name="eye" className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              </Fragment>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

