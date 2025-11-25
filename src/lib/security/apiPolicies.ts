import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";
import { DocumentService } from "@/lib/services/DocumentService";

type PolicyName = "connected" | "accessToNote";

interface PolicyFailure {
  ok?: false;
  status?: number;
  message?: string;
}

type PolicyCheckResult = true | PolicyFailure;

interface PolicyContext {
  req: NextRequest;
  token: JWT | null;
  params: Record<string, string>;
}

interface ApiPolicy {
  path: string;
  checks: PolicyName[];
  mode?: "exact" | "startsWith";
  exclude?: string[];
}

interface CompiledPolicy extends ApiPolicy {
  regex?: RegExp;
}

const documentService = new DocumentService();

const rawPolicies: ApiPolicy[] = [
  {
    path: "/api",
    mode: "startsWith",
    checks: ["connected"],
    exclude: ["/api/auth"],
  },
  {
    path: "/api/accesslist/[id]",
    checks: ["connected", "accessToNote"],
  },
  {
    path: "/api/openDoc/accessList",
    checks: ["connected", "accessToNote"],
  },
];

const compiledPolicies: CompiledPolicy[] = rawPolicies.map((policy) => {
  if (policy.mode === "startsWith") {
    return policy;
  }
  return {
    ...policy,
    regex: buildRegexFromTemplate(policy.path),
  };
});

type PolicyMatch = {
  policy: CompiledPolicy;
  params: Record<string, string>;
};

const policyChecks: Record<PolicyName, (ctx: PolicyContext) => Promise<PolicyCheckResult>> = {
  connected: async ({ token }) => {
    if (!token?.id && !token?.sub) {
      return {
        status: 401,
        message: "Authentification requise pour accéder à cette ressource.",
      };
    }
    return true;
  },
  accessToNote: async ({ token, params, req }) => {
    if (!token?.id && !token?.sub) {
      return {
        status: 401,
        message: "Authentification requise pour accéder au document.",
      };
    }

    const documentId = extractDocumentId(params, req);
    if (!documentId) {
      return {
        status: 400,
        message: "Identifiant de document manquant ou invalide.",
      };
    }

    const userId = token.id ? Number(token.id) : token.sub ? Number(token.sub) : undefined;
    const userEmail = token.email ?? undefined;

    if (!userId && !userEmail) {
      return {
        status: 401,
        message: "Impossible de déterminer l'utilisateur courant.",
      };
    }

    const hasAccess = await documentService.userHasAccessToDocument(documentId, userId, userEmail);

    if (!hasAccess) {
      return {
        status: 403,
        message: "Accès refusé : vous n'avez pas les droits sur ce document.",
      };
    }

    return true;
  },
};

export async function enforceApiPolicies(req: NextRequest) {
  const matches = matchPolicies(req.nextUrl.pathname);
  if (!matches.length) {
    return null;
  }

  const token = await getToken({ req });

  for (const { policy, params } of matches) {
    for (const check of policy.checks) {
      const checkFn = policyChecks[check];
      if (!checkFn) {
        continue;
      }

      const result = await checkFn({ req, token, params });
      if (result !== true) {
        const failure = result as PolicyFailure;
        const status = failure.status ?? 403;
        const message = failure.message ?? `Accès refusé (${check}).`;

        return NextResponse.json(
          { success: false, error: message },
          { status }
        );
      }
    }
  }

  return null;
}

function matchPolicies(pathname: string): PolicyMatch[] {
  const matches: PolicyMatch[] = [];
  for (const policy of compiledPolicies) {
    if (policy.mode === "startsWith") {
      if (!pathname.startsWith(policy.path)) {
        continue;
      }
      const excluded = policy.exclude?.some((prefix) => pathname.startsWith(prefix));
      if (excluded) {
        continue;
      }
      matches.push({ policy, params: {} });
      continue;
    }

    const match = policy.regex?.exec(pathname);
    if (match) {
      matches.push({ policy, params: match.groups ?? {} });
    }
  }
  return matches;
}

function buildRegexFromTemplate(template: string): RegExp {
  const trimmed = template.replace(/\/+$/, "");
  if (!trimmed || trimmed === "/") {
    return /^\/$/;
  }
  const segments = trimmed.split("/").filter(Boolean);
  const pattern = segments
    .map((segment) => {
      const colonMatch = segment.match(/^:(.+)$/);
      const bracketMatch = segment.match(/^\[(?:\:)?(.+)\]$/);
      const paramName = sanitizeParamName(colonMatch?.[1] ?? bracketMatch?.[1]);
      if (paramName) {
        return `(?<${paramName}>[^/]+)`;
      }
      if (segment === "*") {
        return ".*";
      }
      return escapeRegex(segment);
    })
    .join("\\/");

  return new RegExp(`^/${pattern}/?$`, "i");
}

function sanitizeParamName(name?: string | null): string | null {
  if (!name) return null;
  return name.replace(/[^a-zA-Z0-9_]/g, "");
}

function escapeRegex(value: string): string {
  return value.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
}

function extractDocumentId(params: Record<string, string>, req: NextRequest): number | null {
  const keys = ["id", "noteId", "documentId", "docId"];
  for (const key of keys) {
    const value = params?.[key];
    const parsed = parseNumericId(value);
    if (parsed) return parsed;
  }

  for (const key of keys) {
    const value = req.nextUrl.searchParams.get(key);
    const parsed = parseNumericId(value ?? undefined);
    if (parsed) return parsed;
  }

  return null;
}

function parseNumericId(value?: string): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

