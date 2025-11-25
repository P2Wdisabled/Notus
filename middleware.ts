// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { enforceApiPolicies } from "./src/lib/security/apiPolicies"; // adapte le chemin si besoin

export const config = {
  // Ne fait tourner le middleware que sur les routes API
  matcher: "/api/:path*",
  runtime: "nodejs",
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Sécurité supplémentaire, au cas où le matcher change un jour
  if (!pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Laisse apiPolicies décider si la requête est autorisée ou non
  const policyResponse = await enforceApiPolicies(request);

  // Si apiPolicies renvoie une réponse (erreur, refus, etc.), on la renvoie telle quelle
  if (policyResponse) {
    return policyResponse;
  }

  // Sinon on laisse passer vers la route API
  return NextResponse.next();
}
