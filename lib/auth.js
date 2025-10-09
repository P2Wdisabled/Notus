import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
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
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email ou nom d'utilisateur", type: "text" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials) return null;

          const identifier = (credentials.email || "").toString().trim();
          const password = (credentials.password || "").toString();

          if (!identifier || !password) return null;

          const result = await query(
            `SELECT id, email, username, first_name, last_name, password_hash, email_verified, is_banned, is_admin
             FROM users WHERE email = $1 OR username = $1 LIMIT 1`,
            [identifier]
          );

          if (result.rows.length === 0) return null;

          const user = result.rows[0];
          if (user.is_banned) return null;
          if (!user.password_hash) return null; // Compte OAuth sans mot de passe

          const bcrypt = require("bcryptjs");
          const isValid = await bcrypt.compare(password, user.password_hash);
          if (!isValid) return null;

          if (!user.email_verified) return null;

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.username,
            username: user.username,
            firstName: user.first_name,
            lastName: user.last_name,
            isAdmin: user.is_admin,
            isVerified: user.email_verified,
          };
        } catch (e) {
          console.error("Erreur authorize(credentials):", e);
          return null;
        }
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
