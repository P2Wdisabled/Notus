import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { query } from "./src/lib/database";
import { NextRequest } from "next/server";

export default async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const token = await getToken({ req });
  const isLoggedIn = !!token;

  const isPublicPath =
    nextUrl.pathname === "/login" ||
    nextUrl.pathname === "/register" ||
    nextUrl.pathname === "/" ||
    nextUrl.pathname.startsWith("/auth") ||
    nextUrl.pathname.startsWith("/api/auth");

  const isAdminPath = nextUrl.pathname.startsWith("/admin");

  // Redirect unauthenticated users to login for protected routes
  if (!isPublicPath && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Redirect authenticated users away from auth pages
  if (
    isLoggedIn &&
    (nextUrl.pathname === "/login" || nextUrl.pathname === "/register")
  ) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  // Admin routes require admin privileges
  if (isAdminPath && isLoggedIn && !token?.isAdmin) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  // Vérifier le statut banni pour les utilisateurs connectés
  if (isLoggedIn && token?.id && nextUrl.pathname !== "/banned") {
    try {
      const userResult = await query(
        "SELECT is_banned FROM users WHERE id = $1::bigint",
        [token.id]
      );

      if (userResult.rows.length > 0 && userResult.rows[0].is_banned) {
        console.log(
          "🚫 Utilisateur banni détecté, redirection vers page banni:",
          token.id
        );
        return NextResponse.redirect(new URL("/banned", nextUrl));
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du statut banni:", error);
    }
  }

  return NextResponse.next();
}

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
  runtime: "nodejs",
};
