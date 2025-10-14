import { prisma } from '../prisma';
import { User, UserRepositoryResult, CreateUserData, UpdateUserProfileData } from '../types';
import bcrypt from 'bcryptjs';

export class PrismaUserRepository {
  async createUser(userData: CreateUserData): Promise<UserRepositoryResult<User>> {
    try {
      // Hacher le mot de passe avec salt
      const passwordHash = await bcrypt.hash(userData.password, 12);
      
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          username: userData.username,
          password_hash: passwordHash,
          first_name: userData.firstName,
          last_name: userData.lastName,
          email_verification_token: userData.verificationToken,
          email_verified: false,
          is_admin: false,
          is_banned: false,
          terms_accepted_at: new Date(),
        },
      });

      return {
        success: true,
        user,
      };
    } catch (error: unknown) {
      console.error('❌ Erreur création utilisateur:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  async getUserByEmail(email: string): Promise<UserRepositoryResult<User>> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return {
          success: false,
          error: 'Utilisateur non trouvé',
        };
      }

      return {
        success: true,
        user,
      };
    } catch (error: unknown) {
      console.error('❌ Erreur récupération utilisateur par email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  async getUserById(id: number): Promise<UserRepositoryResult<User>> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        return {
          success: false,
          error: 'Utilisateur non trouvé',
        };
      }

      return {
        success: true,
        user,
      };
    } catch (error: unknown) {
      console.error('❌ Erreur récupération utilisateur par ID:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  async updateUser(id: number, data: UpdateUserProfileData): Promise<UserRepositoryResult<User>> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: {
          email: data.email,
          username: data.username,
          first_name: data.firstName,
          last_name: data.lastName,
          profile_image: data.profileImage,
          banner_image: data.bannerImage,
        },
      });

      return {
        success: true,
        user,
      };
    } catch (error: unknown) {
      console.error('❌ Erreur mise à jour utilisateur:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  async toggleBan(id: number, isBanned: boolean): Promise<UserRepositoryResult<User>> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: { is_banned: isBanned },
      });

      return {
        success: true,
        user,
      };
    } catch (error: unknown) {
      console.error('❌ Erreur basculement bannissement:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  async toggleAdmin(id: number, isAdmin: boolean): Promise<UserRepositoryResult<User>> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: { is_admin: isAdmin },
      });

      return {
        success: true,
        user,
      };
    } catch (error: unknown) {
      console.error('❌ Erreur basculement admin:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  async isUserAdmin(id: number): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: { is_admin: true },
      });

      return user?.is_admin || false;
    } catch (error: unknown) {
      console.error('❌ Erreur vérification admin:', error);
      return false;
    }
  }

  async verifyEmail(token: string): Promise<UserRepositoryResult<User>> {
    try {
      const user = await prisma.user.findFirst({
        where: { email_verification_token: token },
      });

      if (!user) {
        return {
          success: false,
          error: 'Token de vérification invalide',
        };
      }

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          email_verified: true,
          email_verification_token: null,
        },
      });

      return {
        success: true,
        user: updatedUser,
      };
    } catch (error: unknown) {
      console.error('❌ Erreur vérification email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  async updatePasswordResetToken(email: string, token: string, expiry: Date): Promise<UserRepositoryResult<User>> {
    try {
      const user = await prisma.user.update({
        where: { email },
        data: {
          reset_token: token,
          reset_token_expiry: expiry,
        },
      });

      return {
        success: true,
        user,
      };
    } catch (error: unknown) {
      console.error('❌ Erreur mise à jour token reset:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  async updatePassword(token: string, password: string): Promise<UserRepositoryResult<User>> {
    try {
      const user = await prisma.user.findFirst({
        where: {
          reset_token: token,
          reset_token_expiry: {
            gt: new Date(),
          },
        },
      });

      if (!user) {
        return {
          success: false,
          error: 'Token de réinitialisation invalide ou expiré',
        };
      }

      // Hacher le nouveau mot de passe avec salt
      const passwordHash = await bcrypt.hash(password, 12);

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          password_hash: passwordHash,
          reset_token: null,
          reset_token_expiry: null,
        },
      });

      return {
        success: true,
        user: updatedUser,
      };
    } catch (error: unknown) {
      console.error('❌ Erreur mise à jour mot de passe:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  async getAllUsers(): Promise<UserRepositoryResult<User[]>> {
    try {
      const users = await prisma.user.findMany({
        orderBy: { created_at: 'desc' },
      });

      return {
        success: true,
        users,
      };
    } catch (error: unknown) {
      console.error('❌ Erreur récupération utilisateurs:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        users: [],
      };
    }
  }

  async initializeTables(): Promise<void> {
    // Prisma gère automatiquement la création des tables via les migrations
    // Cette méthode est conservée pour la compatibilité
    return Promise.resolve();
  }
}
