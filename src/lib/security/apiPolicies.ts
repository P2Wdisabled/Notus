import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { DocumentService } from "../services/DocumentService";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD";

type PolicyEnforcer = (context: PolicyContext) => Promise<NextResponse | null>;

interface PolicyContext {
  request: NextRequest;
  pathname: string;
  authContext: AuthContext | null;
}

export interface RoutePolicy {
  id: string;
  matcher: RegExp;
  methods: HttpMethod[];
  description: string;
  jsonBodyFor?: HttpMethod[];
  maxBodySize?: number;
  enforce?: PolicyEnforcer;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

const DEFAULT_JSON_BODY_LIMIT = 512 * 1024; // 512 KB
const documentAccessService = new DocumentService();

interface AuthContext {
  userId: number | null;
  email: string | null;
  isAdmin: boolean;
}

const jsonMethodSet = new Set<HttpMethod>(["POST", "PUT", "PATCH", "DELETE"]);

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.replace(/\/+$/, "");
  }
  return pathname;
}

function matchRoutePolicy(pathname: string): RoutePolicy | undefined {
  return apiRoutePolicies.find((policy) => policy.matcher.test(pathname));
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseDocumentIdFromBody(body: Record<string, unknown> | null | undefined): number | null {
  if (!body) return null;
  const candidates = [body.documentId, body.document_id, body.id_doc, body.docId, body.id];
  for (const candidate of candidates) {
    const asNumber = toNumber(candidate);
    if (asNumber) {
      return asNumber;
    }
  }
  return null;
}

function parseDocumentIdFromParams(
  params: URLSearchParams,
  keys: string[] = ["id", "documentId", "docId", "document_id", "id_doc"]
): number | null {
  for (const key of keys) {
    const value = params.get(key);
    if (!value) continue;
    const parsed = toNumber(value);
    if (parsed) return parsed;
  }
  return null;
}

async function parseJsonBody<T = Record<string, unknown>>(request: NextRequest): Promise<T | null> {
  try {
    const cloned = request.clone();
    return (await cloned.json()) as T;
  } catch {
    return null;
  }
}

async function extractAuthContext(request: NextRequest): Promise<AuthContext | null> {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    console.error("[apiPolicies] AUTH_SECRET manquant: impossible de décoder la session.");
    return null;
  }

  try {
    const token = await getToken({ req: request, secret });
    if (!token) {
      return null;
    }

    const rawId = (token as Record<string, unknown>).id ?? token.sub ?? null;
    const parsedId =
      typeof rawId === "number"
        ? rawId
        : typeof rawId === "string"
        ? Number.parseInt(rawId, 10)
        : null;
    const userId = Number.isFinite(parsedId ?? NaN) ? (parsedId as number) : null;

    const email =
      typeof token.email === "string" ? token.email.toLowerCase().trim() : null;

    const isAdmin =
      typeof (token as Record<string, unknown>).isAdmin === "boolean"
        ? Boolean((token as Record<string, unknown>).isAdmin)
        : false;

    return { userId, email, isAdmin };
  } catch (error) {
    console.error("[apiPolicies] Erreur lors du décodage du token NextAuth:", error);
    return null;
  }
}

async function ensureDocumentOwnership(
  authContext: AuthContext | null,
  documentId: number | null,
  { allowAdmin = true }: { allowAdmin?: boolean } = {}
) {
  if (!documentId || documentId <= 0) {
    return NextResponse.json(
      { success: false, error: "Accès refusé" },
      { status: 400 }
    );
  }

  const ownerResult = await documentAccessService.ownerIdForDocument(documentId);
  if (!ownerResult.success) {
    return NextResponse.json(
      { success: false, error: "Accès refusé" },
      { status: 500 }
    );
  }

  const ownerId = ownerResult.data?.ownerId ?? null;
  if (!ownerId) {
    return NextResponse.json(
      { success: false, error: "Accès refusé" },
      { status: 404 }
    );
  }

  const isOwner = authContext?.userId != null && authContext.userId === ownerId;
  const isAdmin = allowAdmin && (authContext?.isAdmin ?? false);

  if (!isOwner && !isAdmin) {
    return NextResponse.json(
      { success: false, error: "Accès refusé" },
      { status: 403 }
    );
  }

  return null;
}

async function enforceDocumentOwnershipFromBody(context: PolicyContext) {
  const body = await parseJsonBody<Record<string, unknown>>(context.request);
  const documentId = parseDocumentIdFromBody(body);
  return ensureDocumentOwnership(context.authContext, documentId);
}

async function enforceDocumentOwnershipFromQuery(context: PolicyContext) {
  const { searchParams } = new URL(context.request.url);
  const documentId = parseDocumentIdFromParams(searchParams, ["id", "documentId"]);
  return ensureDocumentOwnership(context.authContext, documentId);
}

async function enforceSharedEmailMatchesContext(context: PolicyContext) {
  const authContext = context.authContext;
  if (!authContext || !authContext.email) {
    return NextResponse.json(
      { success: false, error: "Accès refusé" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(context.request.url);
  const requestedEmail = searchParams.get("email")?.toLowerCase().trim();

  if (!requestedEmail) {
    return NextResponse.json(
      { success: false, error: "Accès refusé" },
      { status: 400 }
    );
  }

  if (requestedEmail !== authContext.email) {
    return NextResponse.json(
      { success: false, error: "Accès refusé" },
      { status: 403 }
    );
  }

  return null;
}

async function enforceNotificationQueryMatchesUser(context: PolicyContext) {
  const authContext = context.authContext;
  if (!authContext?.userId) {
    return NextResponse.json(
      { success: false, error: "Accès refusé" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(context.request.url);
  const requestedId = toNumber(searchParams.get("id"));

  if (!requestedId) {
    return NextResponse.json(
      { success: false, error: "Accès refusé" },
      { status: 400 }
    );
  }

  if (requestedId !== authContext.userId) {
    return NextResponse.json(
      { success: false, error: "Accès refusé" },
      { status: 403 }
    );
  }

  return null;
}

async function enforceRequestsAccess(context: PolicyContext) {
  const authContext = context.authContext;
  if (!authContext) {
    return NextResponse.json(
      { success: false, error: "Accès refusé" },
      { status: 401 }
    );
  }

  if (context.request.method !== "GET") {
    return null;
  }

  const { searchParams } = new URL(context.request.url);
  const requestedUserId = toNumber(searchParams.get("userId"));

  if (!requestedUserId) {
    if (authContext.isAdmin) {
      return null;
    }
    return NextResponse.json(
      { success: false, error: "Accès refusé" },
      { status: 403 }
    );
  }

  const isSelf = authContext.userId === requestedUserId;

  if (!isSelf && !authContext.isAdmin) {
    return NextResponse.json(
      { success: false, error: "Accès refusé" },
      { status: 403 }
    );
  }

  return null;
}

export const apiRoutePolicies: RoutePolicy[] = [
  {
    id: "open-doc-share-delete",
    description: "Supprimer un partage ciblé d'un document",
    matcher: /^\/api\/openDoc\/share\/delete$/,
    methods: ["DELETE"],
    jsonBodyFor: ["DELETE"],
    requireAuth: true,
    enforce: enforceDocumentOwnershipFromBody,
  },
  {
    id: "open-doc-share",
    description: "Ajout ou mise à jour d'un partage de document",
    matcher: /^\/api\/openDoc\/share$/,
    methods: ["PATCH"],
    jsonBodyFor: ["PATCH"],
    requireAuth: true,
    enforce: enforceDocumentOwnershipFromBody,
  },
  {
    id: "dossiers-documents",
    description: "Ajout ou retrait de documents dans un dossier",
    matcher: /^\/api\/dossiers\/[^/]+\/documents$/,
    methods: ["POST", "DELETE"],
    jsonBodyFor: ["POST", "DELETE"],
    requireAuth: true,
  },
  {
    id: "dossiers-detail",
    description: "Lecture ou suppression d'un dossier précis",
    matcher: /^\/api\/dossiers\/[^/]+$/,
    methods: ["GET", "DELETE"],
    requireAuth: true,
  },
  {
    id: "admin-requests-resolve",
    description: "Résolution d'une requête d'assistance",
    matcher: /^\/api\/admin\/requests\/[^/]+\/resolve$/,
    methods: ["POST"],
    requireAdmin: true,
  },
  {
    id: "admin-requests-reject",
    description: "Rejet d'une requête d'assistance",
    matcher: /^\/api\/admin\/requests\/[^/]+\/reject$/,
    methods: ["POST"],
    requireAdmin: true,
  },
  {
    id: "admin-requests-detail",
    description: "Lecture, mise à jour ou suppression d'une requête",
    matcher: /^\/api\/admin\/requests\/[^/]+$/,
    methods: ["GET", "PATCH", "DELETE"],
    jsonBodyFor: ["PATCH"],
    requireAdmin: true,
  },
  {
    id: "admin-users-admin-toggle",
    description: "Promotion ou rétrogradation d'un utilisateur",
    matcher: /^\/api\/admin\/users\/[^/]+\/admin$/,
    methods: ["PATCH"],
    jsonBodyFor: ["PATCH"],
    requireAdmin: true,
  },
  {
    id: "admin-users-ban-toggle",
    description: "Bannissement ou débannissement d'un utilisateur",
    matcher: /^\/api\/admin\/users\/[^/]+\/ban$/,
    methods: ["PATCH"],
    jsonBodyFor: ["PATCH"],
    requireAdmin: true,
  },
  {
    id: "notification-mark-read",
    description: "Marquer une notification comme lue",
    matcher: /^\/api\/notification\/mark-read$/,
    methods: ["POST"],
    jsonBodyFor: ["POST"],
    requireAuth: true,
  },
  {
    id: "notification-delete",
    description: "Suppression explicite d'une notification",
    matcher: /^\/api\/notification\/detete$/,
    methods: ["DELETE"],
    requireAuth: true,
  },
  {
    id: "open-doc-access-list",
    description: "Liste des accès à un document",
    matcher: /^\/api\/openDoc\/accessList$/,
    methods: ["GET"],
    requireAuth: true,
    enforce: enforceDocumentOwnershipFromQuery,
  },
  {
    id: "open-doc-shared",
    description: "Documents partagés avec l'utilisateur courant",
    matcher: /^\/api\/openDoc\/shared$/,
    methods: ["GET"],
    requireAuth: true,
    enforce: enforceSharedEmailMatchesContext,
  },
  {
    id: "open-doc-single",
    description: "Lecture d'un document via un accès partagé",
    matcher: /^\/api\/openDoc$/,
    methods: ["GET"],
    requireAuth: true,
    enforce: enforceOpenDocAccess,
  },
  {
    id: "notification-unread-count",
    description: "Nombre de notifications non lues",
    matcher: /^\/api\/notification\/unread-count$/,
    methods: ["GET"],
    requireAuth: true,
    enforce: enforceNotificationQueryMatchesUser,
  },
  {
    id: "notification-list",
    description: "Liste paginée des notifications",
    matcher: /^\/api\/notification\/?$/,
    methods: ["GET"],
    requireAuth: true,
    enforce: enforceNotificationQueryMatchesUser,
  },
  {
    id: "tags-list",
    description: "Récupération des tags utilisateur",
    matcher: /^\/api\/tags$/,
    methods: ["GET"],
    requireAuth: true,
  },
  {
    id: "profile-image",
    description: "Lecture de l'image de profil",
    matcher: /^\/api\/profile-image$/,
    methods: ["GET"],
    requireAuth: true,
  },
  {
    id: "requests",
    description: "Création ou consultation des requêtes d'assistance",
    matcher: /^\/api\/requests$/,
    methods: ["GET", "POST"],
    jsonBodyFor: ["POST"],
    requireAuth: true,
    enforce: enforceRequestsAccess,
  },
  {
    id: "dossiers",
    description: "Listing et création de dossiers",
    matcher: /^\/api\/dossiers$/,
    methods: ["GET", "POST"],
    jsonBodyFor: ["POST"],
    requireAuth: true,
  },
  {
    id: "invite-share",
    description: "Invitation d'un collaborateur sur un document",
    matcher: /^\/api\/invite-share$/,
    methods: ["POST"],
    jsonBodyFor: ["POST"],
    requireAuth: true,
    enforce: enforceDocumentOwnershipFromBody,
  },
  {
    id: "confirm-share",
    description: "Confirmation d'une invitation de partage",
    matcher: /^\/api\/confirm-share$/,
    methods: ["GET"],
  },
  {
    id: "reactivate-account",
    description: "Restauration d'un compte supprimé",
    matcher: /^\/api\/reactivate-account$/,
    methods: ["POST"],
    jsonBodyFor: ["POST"],
  },
  {
    id: "delete-account",
    description: "Suppression définitive d'un compte",
    matcher: /^\/api\/delete-account$/,
    methods: ["POST"],
    jsonBodyFor: ["POST"],
    requireAuth: true,
  },
  {
    id: "check-deleted-account",
    description: "Vérification d'un compte supprimé",
    matcher: /^\/api\/check-deleted-account$/,
    methods: ["POST"],
    jsonBodyFor: ["POST"],
  },
  {
    id: "verify-email",
    description: "Validation d'adresse email par token",
    matcher: /^\/api\/verify-email$/,
    methods: ["POST"],
    jsonBodyFor: ["POST"],
  },
  {
    id: "admin-stats",
    description: "Tableau de bord administrateur",
    matcher: /^\/api\/admin\/stats$/,
    methods: ["GET"],
    requireAdmin: true,
  },
  {
    id: "admin-check-status",
    description: "Vérification rapide du statut admin",
    matcher: /^\/api\/admin\/check-status$/,
    methods: ["GET"],
    requireAuth: true,
  },
  {
    id: "next-auth",
    description: "Handlers NextAuth (session, callback, providers)",
    matcher: /^\/api\/auth(?:\/.*)?$/,
    methods: ["GET", "POST"],
  },
  {
    id: "socket-handshake",
    description: "Initialisation du serveur Socket.IO",
    matcher: /^\/api\/socket$/,
    methods: ["GET"],
    requireAuth: true,
  },
];

async function enforceOpenDocAccess({ request, authContext }: PolicyContext) {
  const { searchParams } = new URL(request.url);
  const documentId = parseDocumentIdFromParams(searchParams, ["id"]);

  if (!documentId) {
    return NextResponse.json(
      { success: false, error: "Accès refusé" },
      { status: 400 }
    );
  }

  if (!authContext || (!authContext.userId && !authContext.email)) {
    return NextResponse.json(
      { success: false, error: "Accès refusé" },
      { status: 401 }
    );
  }

  const hasAccess = await documentAccessService.userHasAccessToDocument(
    documentId,
    authContext.userId ?? undefined,
    authContext.email ?? undefined
  );

  if (!hasAccess) {
    return NextResponse.json(
      { success: false, error: "Accès refusé" },
      { status: 403 }
    );
  }

  return null;
}

export async function enforceApiPolicies(request: NextRequest) {
  const pathname = normalizePathname(request.nextUrl.pathname);
  const policy = matchRoutePolicy(pathname);

  if (!policy) {
    console.warn(`[apiPolicies] Route non déclarée: ${pathname}`);
    return NextResponse.json(
      { success: false, error: "Accès refusé" },
      { status: 404 }
    );
  }

  const method = request.method.toUpperCase() as HttpMethod;

  if (method === "OPTIONS") {
    return null;
  }

  if (method === "HEAD" && policy.methods.includes("GET")) {
    return null;
  }

  if (!policy.methods.includes(method)) {
    return NextResponse.json(
      {
        success: false,
        error: `Méthode ${method} non autorisée sur ${pathname}`,
      },
      {
        status: 405,
        headers: {
          Allow: policy.methods.join(", "),
        },
      }
    );
  }

  const jsonMethods = new Set<HttpMethod>(policy.jsonBodyFor ?? []);
  const shouldEnforceJson = jsonMethods.has(method) && jsonMethodSet.has(method);

  if (shouldEnforceJson) {
    const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 415 }
      );
    }

    const limit = policy.maxBodySize ?? DEFAULT_JSON_BODY_LIMIT;
    const contentLengthHeader = request.headers.get("content-length");
    if (contentLengthHeader) {
      const contentLength = Number(contentLengthHeader);
      if (!Number.isNaN(contentLength) && contentLength > limit) {
        return NextResponse.json(
          { success: false, error: "Accès refusé" },
          { status: 413 }
        );
      }
    }
  }

  let authContext: AuthContext | null = null;

  if (policy.requireAuth || policy.requireAdmin) {
    authContext = await extractAuthContext(request);

    if (!authContext) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 401 }
      );
    }

    if (policy.requireAdmin && !authContext.isAdmin) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 403 }
      );
    }
  }

  if (policy.enforce) {
    const customResponse = await policy.enforce({ request, pathname, authContext });
    if (customResponse) {
      return customResponse;
    }
  }

  return null;
}

