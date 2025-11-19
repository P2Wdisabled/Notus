"use client";

import { useState } from "react";
import { Badge } from "@/components/ui";
import Icon from "@/components/Icon";
import { cn } from "@/lib/utils";
import type { Request } from "@/lib/repositories/RequestRepository";

interface RequestWithMessage extends Request {
  message?: string;
}

interface RequestHistoryCardProps {
  request: RequestWithMessage;
  typeLabels: Record<Request["type"], string>;
  statusLabels: Record<Request["status"], string>;
  statusVariants: Record<Request["status"], "warning" | "info" | "success" | "destructive">;
  formatDate: (date: Date | string) => string;
}

export default function RequestHistoryCard({
  request,
  typeLabels,
  statusLabels,
  statusVariants,
  formatDate,
}: RequestHistoryCardProps) {
  const [isResponseExpanded, setIsResponseExpanded] = useState(false);

  return (
    <article className="p-4 border border-border rounded-lg bg-card hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground mb-1">{request.title}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={statusVariants[request.status]}>
              {statusLabels[request.status]}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {typeLabels[request.type]}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDate(request.created_at)}
            </span>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <div>
          <p className="text-sm font-medium text-foreground mb-1">Description :</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {request.description}
          </p>
        </div>
        {request.message && (
          <div className="mt-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => setIsResponseExpanded(!isResponseExpanded)}
              className="flex items-center gap-2 w-full text-left"
              aria-expanded={isResponseExpanded}
            >
              <p className="text-sm font-medium text-foreground">Réponse :</p>
              <Icon
                name="chevronDown"
                className={cn(
                  "w-4 h-4 transition-transform text-muted-foreground",
                  isResponseExpanded && "transform rotate-180"
                )}
              />
            </button>
            {isResponseExpanded && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded border border-border mt-2">
                {request.message}
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

