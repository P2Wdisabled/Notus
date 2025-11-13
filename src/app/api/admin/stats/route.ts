import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { UserService } from "@/lib/services/UserService";
import { BaseRepository } from "@/lib/repositories/BaseRepository";

class StatsRepository extends BaseRepository {
  async initializeTables(): Promise<void> {
    // Pas besoin d'initialiser pour les stats
  }

  private async addColumnIfNotExists(tableName: string, columnName: string, columnDefinition: string): Promise<void> {
    try {
      await this.query(`ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ${columnName} ${columnDefinition}`);
    } catch (error) {
      // Ignorer l'erreur si la colonne existe déjà
    }
  }

  private async ensureSharesCreatedAt(): Promise<void> {
    await this.addColumnIfNotExists("shares", "created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
  }

  async getTotalUsers(): Promise<number> {
    const result = await this.query<{ count: string }>(
      "SELECT COUNT(*) as count FROM users"
    );
    return parseInt(result.rows[0]?.count || "0", 10);
  }

  async getTotalDocuments(): Promise<number> {
    const result = await this.query<{ count: string }>(
      "SELECT COUNT(*) as count FROM documents"
    );
    return parseInt(result.rows[0]?.count || "0", 10);
  }

  async getTotalShares(): Promise<number> {
    const result = await this.query<{ count: string }>(
      "SELECT COUNT(*) as count FROM shares"
    );
    return parseInt(result.rows[0]?.count || "0", 10);
  }

  async getUsersCreatedSince(days: number): Promise<number> {
    const result = await this.query<{ count: string }>(
      "SELECT COUNT(*) as count FROM users WHERE created_at >= NOW() - INTERVAL '1 day' * $1",
      [days]
    );
    return parseInt(result.rows[0]?.count || "0", 10);
  }

  async getDocumentsCreatedSince(days: number): Promise<number> {
    const result = await this.query<{ count: string }>(
      "SELECT COUNT(*) as count FROM documents WHERE created_at >= NOW() - INTERVAL '1 day' * $1",
      [days]
    );
    return parseInt(result.rows[0]?.count || "0", 10);
  }

  async getSharesCreatedSince(days: number): Promise<number> {
    // S'assurer que la colonne created_at existe
    await this.ensureSharesCreatedAt();
    
    // Vérifier si la colonne existe avant de faire la requête
    try {
      const result = await this.query<{ count: string }>(
        "SELECT COUNT(*) as count FROM shares WHERE created_at >= NOW() - INTERVAL '1 day' * $1",
        [days]
      );
      return parseInt(result.rows[0]?.count || "0", 10);
    } catch (error) {
      // Si la colonne n'existe toujours pas, retourner le total
      console.warn("⚠️ Colonne created_at non disponible pour shares, utilisation du total");
      return await this.getTotalShares();
    }
  }

  async getVerifiedUsers(): Promise<number> {
    const result = await this.query<{ count: string }>(
      "SELECT COUNT(*) as count FROM users WHERE email_verified = true"
    );
    return parseInt(result.rows[0]?.count || "0", 10);
  }

  async getBannedUsers(): Promise<number> {
    const result = await this.query<{ count: string }>(
      "SELECT COUNT(*) as count FROM users WHERE is_banned = true"
    );
    return parseInt(result.rows[0]?.count || "0", 10);
  }

  async getAdminUsers(): Promise<number> {
    const result = await this.query<{ count: string }>(
      "SELECT COUNT(*) as count FROM users WHERE is_admin = true"
    );
    return parseInt(result.rows[0]?.count || "0", 10);
  }
}

const statsRepository = new StatsRepository();

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    const userService = new UserService();
    const isAdmin = await userService.isUserAdmin(parseInt(session.user.id));

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 403 }
      );
    }

    const [
      totalUsers,
      totalDocuments,
      totalShares,
      usersLast7Days,
      usersLast30Days,
      documentsLast7Days,
      documentsLast30Days,
      sharesLast7Days,
      sharesLast30Days,
      verifiedUsers,
      bannedUsers,
      adminUsers,
    ] = await Promise.all([
      statsRepository.getTotalUsers(),
      statsRepository.getTotalDocuments(),
      statsRepository.getTotalShares(),
      statsRepository.getUsersCreatedSince(7),
      statsRepository.getUsersCreatedSince(30),
      statsRepository.getDocumentsCreatedSince(7),
      statsRepository.getDocumentsCreatedSince(30),
      statsRepository.getSharesCreatedSince(7),
      statsRepository.getSharesCreatedSince(30),
      statsRepository.getVerifiedUsers(),
      statsRepository.getBannedUsers(),
      statsRepository.getAdminUsers(),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          verified: verifiedUsers,
          banned: bannedUsers,
          admins: adminUsers,
          last7Days: usersLast7Days,
          last30Days: usersLast30Days,
        },
        documents: {
          total: totalDocuments,
          last7Days: documentsLast7Days,
          last30Days: documentsLast30Days,
        },
        shares: {
          total: totalShares,
          last7Days: sharesLast7Days,
          last30Days: sharesLast30Days,
        },
      },
    });
  } catch (error) {
    console.error("❌ Erreur récupération statistiques:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

