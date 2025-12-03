import { NextRequest } from "next/server";

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }: { auth: any; request: { nextUrl: URL } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnAdmin = nextUrl.pathname.startsWith("/admin");
      const isOnRegister = nextUrl.pathname.startsWith("/register");
      const isOnLogin = nextUrl.pathname.startsWith("/login");
      const isOnAuth = nextUrl.pathname.startsWith("/auth");

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isOnAdmin) {
        if (isLoggedIn) return true; // L'autorisation admin sera vérifiée dans le layout
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn && (isOnLogin || isOnRegister)) {
        return Response.redirect(new URL("/app", nextUrl));
      } else if (isOnAuth) {
        return true; // Autoriser l'accès aux pages d'authentification
      }
      return true;
    },
  },
  debug: process.env.NODE_ENV === "development",
};
