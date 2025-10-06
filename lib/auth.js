import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { query } from "../src/lib/database";

export const authOptions = {
  secret: process.env.AUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          // Vérifier si l'utilisateur existe déjà
          const existingUser = await query(
            "SELECT id, email, username FROM users WHERE email = $1",
            [user.email]
          );

          if (existingUser.rows.length === 0) {
            // Créer un nouvel utilisateur
            const username = user.email?.split("@")[0] || "user";
            const firstName =
              profile?.given_name || user.name?.split(" ")[0] || "";
            const lastName =
              profile?.family_name ||
              user.name?.split(" ").slice(1).join(" ") ||
              "";

            await query(
              `INSERT INTO users (email, username, first_name, last_name, email_verified, created_at, updated_at) 
               VALUES ($1, $2, $3, $4, true, NOW(), NOW())`,
              [user.email, username, firstName, lastName]
            );
          }
        } catch (error) {
          console.error(
            "Erreur lors de la création/connexion utilisateur:",
            error
          );
          return false;
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session?.user) {
        try {
          const user = await query(
            "SELECT id, email, username, first_name, last_name, is_admin, email_verified FROM users WHERE email = $1",
            [session.user.email]
          );

          if (user.rows.length > 0) {
            session.user.id = user.rows[0].id.toString();
            session.user.username = user.rows[0].username;
            session.user.firstName = user.rows[0].first_name;
            session.user.lastName = user.rows[0].last_name;
            session.user.isAdmin = user.rows[0].is_admin;
            session.user.isVerified = user.rows[0].email_verified;
          }
        } catch (error) {
          console.error(
            "Erreur lors de la récupération des données utilisateur:",
            error
          );
        }
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.isAdmin = user.isAdmin;
        token.isVerified = user.isVerified;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === "development",
};

export default NextAuth(authOptions);
