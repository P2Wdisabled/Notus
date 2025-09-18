import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { authConfig } from './auth.config';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { query } from './src/lib/database';

async function getUser(emailOrUsername: string) {
  try {
    // Vérifier si la base de données est configurée
    if (!process.env.DATABASE_URL) {
      console.log('⚠️ Base de données non configurée - Mode simulation');
      return null;
    }

    // Chercher par email ou nom d'utilisateur
    const result = await query(
      'SELECT * FROM users WHERE email = $1 OR username = $1',
      [emailOrUsername]
    );
    
    const user = result.rows[0];
    
    // Vérifier si l'utilisateur est banni
    if (user && user.is_banned) {
      console.log('🚫 Tentative de connexion d\'un utilisateur banni:', emailOrUsername);
      // Retourner un objet spécial pour indiquer le bannissement
      return { ...user, _banned: true };
    }
    
    return user;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    // En cas d'erreur de connexion, retourner null au lieu de throw
    if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') {
      console.log('⚠️ Base de données non accessible - Mode simulation');
      return null;
    }
    throw new Error('Failed to fetch user.');
  }
}

async function createOrUpdateOAuthUser(profile: any) {
  try {
    // Vérifier si la base de données est configurée
    if (!process.env.DATABASE_URL) {
      console.log('⚠️ Base de données non configurée - Mode simulation');
      console.log(`👤 Utilisateur OAuth simulé: ${profile.name} (${profile.email})`);
      return {
        id: 'oauth-simulated-user',
        email: profile.email,
        name: profile.name,
      };
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await query(
      'SELECT * FROM users WHERE email = $1',
      [profile.email]
    );

    if (existingUser.rows.length > 0) {
      // Mettre à jour l'utilisateur existant avec les infos OAuth
      const user = existingUser.rows[0];
      
      // Vérifier si l'utilisateur est banni
      if (user.is_banned) {
        console.log('🚫 Tentative de connexion OAuth d\'un utilisateur banni:', profile.email);
        throw new Error('Compte banni');
      }
      
      await query(
        'UPDATE users SET provider = $1, provider_id = $2, email_verified = true WHERE id = $3',
        ['google', profile.sub, (user as any).id]
      );
      
      return {
        id: (user as any).id.toString(),
        email: (user as any).email,
        name: `${(user as any).first_name} ${(user as any).last_name}`,
        firstName: (user as any).first_name,
        lastName: (user as any).last_name,
        username: (user as any).username,
      };
    } else {
      // Créer un nouvel utilisateur OAuth
      const nameParts = profile.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const result = await query(
        `INSERT INTO users (email, first_name, last_name, username, provider, provider_id, email_verified, created_at, updated_at, terms_accepted_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), NOW()) 
         RETURNING *`,
        [
          profile.email,
          firstName,
          lastName,
          profile.email.split('@')[0], // Utiliser la partie avant @ comme username
          'google',
          profile.sub,
          true
        ]
      );

      const user = result.rows[0];
      console.log(`👤 Utilisateur OAuth créé: ${(user as any).first_name} ${(user as any).last_name} (${(user as any).email})`);
      
      return {
        id: (user as any).id.toString(),
        email: (user as any).email,
        name: `${(user as any).first_name} ${(user as any).last_name}`,
        firstName: (user as any).first_name,
        lastName: (user as any).last_name,
        username: (user as any).username,
      };
    }
  } catch (error) {
    console.error('Failed to create/update OAuth user:', error);
    throw new Error('Failed to create/update OAuth user.');
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ 
            email: z.string().min(1), 
            password: z.string().min(6) 
          })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          if (!user) return null;
          
          // Vérifier si l'utilisateur est banni
          if ((user as any)._banned) {
            console.log('Tentative de connexion d\'un utilisateur banni:', email);
            return null; // Retourner null au lieu de lancer une erreur
          }
          
          // Vérifier que l'email est vérifié
          if (!(user as any).email_verified) {
            console.log('Email non vérifié pour:', email);
            return null;
          }
          
          const passwordsMatch = await bcrypt.compare(password, (user as any).password_hash);

          if (passwordsMatch) {
            return {
              id: (user as any).id.toString(),
              email: (user as any).email,
              name: `${(user as any).first_name} ${(user as any).last_name}`,
              firstName: (user as any).first_name,
              lastName: (user as any).last_name,
              username: (user as any).username,
            };
          }
        }

        console.log('Invalid credentials');
        return null;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Si c'est une connexion OAuth (Google)
      if (account?.provider === 'google') {
        try {
          // Vérifier d'abord si l'utilisateur existe et est banni
          if (profile?.email && process.env.DATABASE_URL) {
            const result = await query(
              'SELECT is_banned FROM users WHERE email = $1',
              [profile.email]
            );
            
            if (result.rows.length > 0 && result.rows[0].is_banned) {
              console.log('🚫 Tentative de connexion OAuth d\'un utilisateur banni:', profile.email);
              return false; // Empêcher la connexion
            }
          }
          
          await createOrUpdateOAuthUser(profile);
          return true;
        } catch (error) {
          console.error('Erreur lors de la création/mise à jour de l\'utilisateur OAuth:', error);
          return false;
        }
      }
      
      // Pour les connexions par credentials, laisser NextAuth gérer
      return true;
    },
    async jwt({ token, user, account }) {
      // Si c'est la première connexion OAuth
      if (account?.provider === 'google' && user) {
        try {
          const oauthUser = await createOrUpdateOAuthUser(user);
          token.id = oauthUser.id;
          token.email = oauthUser.email;
          token.name = oauthUser.name;
          token.firstName = oauthUser.firstName;
          token.lastName = oauthUser.lastName;
          token.username = oauthUser.username;
        } catch (error) {
          console.error('Erreur lors de la récupération de l\'utilisateur OAuth:', error);
        }
      }
      
      // Si c'est une connexion par credentials et que l'utilisateur a un ID
      if (account?.provider === 'credentials' && user?.id) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.username = user.username;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.username = token.username as string;
      }
      return session;
    },
  },
});
