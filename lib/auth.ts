import NextAuth, { NextAuthOptions, User } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { UserService } from "../src/lib/services/UserService";

// Étendre les types NextAuth
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      username: string;
      firstName: string;
      lastName: string;
      isAdmin: boolean;
      isVerified: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    username: string;
    firstName: string;
    lastName: string;
    isAdmin: boolean;
    isVerified: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    isAdmin: boolean;
    isVerified: boolean;
  }
}


interface DatabaseUser {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  password_hash: string | null;
  email_verified: boolean;
  is_banned: boolean;
  is_admin: boolean;
}

const userService = new UserService();

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
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
      async authorize(credentials): Promise<User | null> {
        try {
          if (!credentials) return null;

          const identifier = (credentials.email || "").toString().trim();
          const password = (credentials.password || "").toString();

          if (!identifier || !password) return null;

          const result = await userService.authenticateUser(identifier, password);

          if (!result.success || !result.user) return null;

          const user = result.user;

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
          const existingUser = await userService.getUserByEmail(user.email!);

          if (!existingUser.success) {
            // Créer un nouvel utilisateur
            const username = user.email?.split("@")[0] || "user";
            const firstName =
              String((profile as Record<string, unknown>)?.given_name || user.name?.split(" ")[0] || "");
            const lastName =
              String((profile as Record<string, unknown>)?.family_name ||
              user.name?.split(" ").slice(1).join(" ") ||
              "");

            await userService.createUser({
              email: user.email!,
              username,
              password: "", // Pas de mot de passe pour OAuth
              firstName: firstName || "Utilisateur",
              lastName: lastName || "OAuth",
            });
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
          const userResult = await userService.getUserByEmail(session.user.email);

          if (userResult.success && userResult.user) {
            const user = userResult.user;
            session.user.id = user.id.toString();
            session.user.username = user.username;
            session.user.firstName = user.first_name;
            session.user.lastName = user.last_name;
            session.user.isAdmin = user.is_admin;
            session.user.isVerified = user.email_verified;
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
