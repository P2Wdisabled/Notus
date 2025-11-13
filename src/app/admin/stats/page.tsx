import { Card } from "@/components/ui";
import { BaseRepository } from "@/lib/repositories/BaseRepository";
import StatCard from "@/components/admin/StatCard";

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

async function getStats() {
  try {
    const statsRepository = new StatsRepository();
    
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

    return {
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
    };
  } catch (error) {
    console.error("❌ Erreur récupération stats:", error);
    return null;
  }
}

export default async function AdminStatsPage() {
  const stats = await getStats();

  return (
    <main className="space-y-6">
      <header className="text-center pt-10">
        <h1 className="text-3xl font-bold text-foreground">
          Statistiques de l'application
        </h1>
        <p className="mt-2 text-muted-foreground">
          Vue d'ensemble des données de Notus
        </p>
      </header>

      {!stats ? (
        <section className="max-w-4xl mx-auto">
          <Card className="bg-background">
            <Card.Content className="p-8 text-center">
              <p className="text-muted-foreground">
                Impossible de charger les statistiques
              </p>
            </Card.Content>
          </Card>
        </section>
      ) : (
        <>
          {/* Statistiques utilisateurs */}
          <section className="max-w-4xl mx-auto">
            <Card className="bg-background">
              <Card.Header>
                <Card.Title className="text-foreground text-2xl font-semibold">
                  Utilisateurs
                </Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title="Total utilisateurs"
                    value={stats.users.total}
                    icon="users"
                  />
                  <StatCard
                    title="Utilisateurs vérifiés"
                    value={stats.users.verified}
                    icon="circleCheck"
                    subtitle={`${Math.round((stats.users.verified / stats.users.total) * 100) || 0}% du total`}
                  />
                  <StatCard
                    title="Utilisateurs bannis"
                    value={stats.users.banned}
                    icon="alert"
                  />
                  <StatCard
                    title="Administrateurs"
                    value={stats.users.admins}
                    icon="shieldCheck"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <StatCard
                    title="Nouveaux utilisateurs (7 jours)"
                    value={stats.users.last7Days}
                    icon="users"
                  />
                  <StatCard
                    title="Nouveaux utilisateurs (30 jours)"
                    value={stats.users.last30Days}
                    icon="users"
                  />
                </div>
              </Card.Content>
            </Card>
          </section>

          {/* Statistiques documents */}
          <section className="max-w-4xl mx-auto">
            <Card className="bg-background">
              <Card.Header>
                <Card.Title className="text-foreground text-2xl font-semibold">
                  Documents
                </Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard
                    title="Total documents"
                    value={stats.documents.total}
                    icon="document"
                  />
                  <StatCard
                    title="Documents créés (7 jours)"
                    value={stats.documents.last7Days}
                    icon="document"
                  />
                  <StatCard
                    title="Documents créés (30 jours)"
                    value={stats.documents.last30Days}
                    icon="document"
                  />
                </div>
              </Card.Content>
            </Card>
          </section>

          {/* Statistiques partages */}
          <section className="max-w-4xl mx-auto">
            <Card className="bg-background">
              <Card.Header>
                <Card.Title className="text-foreground text-2xl font-semibold">
                  Partages
                </Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard
                    title="Total partages"
                    value={stats.shares.total}
                    icon="share"
                  />
                  <StatCard
                    title="Partages créés (7 jours)"
                    value={stats.shares.last7Days}
                    icon="share"
                  />
                  <StatCard
                    title="Partages créés (30 jours)"
                    value={stats.shares.last30Days}
                    icon="share"
                  />
                </div>
              </Card.Content>
            </Card>
          </section>
        </>
      )}
    </main>
  );
}

