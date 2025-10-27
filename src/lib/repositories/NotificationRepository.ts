import { BaseRepository } from "./BaseRepository";
import { Notification } from "../types";

/**
 * Low-level DB operations for notifications.
 * All methods return a Database-like result object (success/error and data).
 */
export class NotificationRepository extends BaseRepository {
    async initializeTables(): Promise<void> {
        try {
            // Create notifications table if it doesn't exist
            await this.query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          id_sender INTEGER NULL,
          id_receiver INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          message JSONB NOT NULL,
          send_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          read_date TIMESTAMP NULL
        )
      `);

            // Index on receiver for fast reads
            await this.query(`CREATE INDEX IF NOT EXISTS idx_notifications_receiver ON notifications(id_receiver)`);
            // Optional index on send_date for sorting
            await this.query(`CREATE INDEX IF NOT EXISTS idx_notifications_send_date ON notifications(send_date DESC)`);
        } catch (error) {
            console.error("❌ Erreur lors de l'initialisation des tables notifications:", error);
            throw error;
        }
    }

    async createNotification(id_sender: number | null, id_receiver: number, message: object | string) {
        try {
            // Insert message as JSON
            const msg = typeof message === "string" ? message : JSON.stringify(message);
            const result = await this.query<Notification>(
                `INSERT INTO notifications (id_sender, id_receiver, message)
         VALUES ($1, $2, $3)
         RETURNING id, id_sender, id_receiver, message, send_date, read_date`,
                [id_sender, id_receiver, msg]
            );

            const row = result.rows[0];
            // Ensure message is returned as string to match types.ts Notification.message
            if (row && typeof row.message === "object") {
                row.message = JSON.stringify(row.message);
            }

            return { success: true, data: row };
        } catch (error) {
            console.error("❌ Erreur création notification:", error);
            return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
        }
    }

    async getUserNotifications(id_receiver: number, limit = 50, offset = 0, onlyUnread = false) {
        try {
            const params: unknown[] = [id_receiver, limit, offset];
            let query = `
            SELECT n.id, n.id_sender, n.id_receiver, n.message, n.send_date, n.read_date,
                   u.username AS sender_username, u.first_name AS sender_first_name, u.last_name AS sender_last_name,
                   u.profile_image AS sender_profile_image
            FROM notifications n
            LEFT JOIN users u ON n.id_sender = u.id
            WHERE n.id_receiver = $1
        `;

            if (onlyUnread) {
                query += ` AND n.read_date IS NULL`;
            }

            query += ` ORDER BY n.send_date DESC LIMIT $2 OFFSET $3`;

            const result = await this.query<
                Notification & { sender_username?: string; sender_first_name?: string; sender_last_name?: string }
            >(query, params);

            const rows = result.rows.map(r => {
                // Ensure message is returned as a string
                if (r.message && typeof r.message === "object") {
                    (r as any).message = JSON.stringify(r.message);
                }

                // Guarantee a sender_username field is present (null for system notifications)
                return {
                    ...r,
                    sender_username: (r as any).sender_username ?? null
                };
            });

            return { success: true, data: rows };
        } catch (error) {
            console.error("❌ Erreur récupération notifications:", error);
            return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
        }
    }

    async countUnread(id_receiver: number) {
        try {
            const result = await this.query<{ count: string }>(
                `SELECT COUNT(*)::text as count FROM notifications WHERE id_receiver = $1 AND read_date IS NULL`,
                [id_receiver]
            );
            const count = result.rows[0] ? parseInt(result.rows[0].count, 10) : 0;
            return { success: true, data: count };
        } catch (error) {
            console.error("❌ Erreur countUnread:", error);
            return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
        }
    }

    async markAsRead(notificationId: number) {
        try {
            const result = await this.query<{ id: number }>(
                `UPDATE notifications SET read_date = CURRENT_TIMESTAMP WHERE id = $1`,
                [notificationId,]
            );
            if (result.rows.length === 0) {
                return { success: false, error: "Notification non trouvée ou accès refusé" };
            }
            return { success: true, data: { id: result.rows[0].id } };
        } catch (error) {
            console.error("❌ Erreur markAsRead:", error);
            return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
        }
    }

    async markAllAsRead(id_receiver: number) {
        try {
            await this.query(`UPDATE notifications SET read_date = CURRENT_TIMESTAMP WHERE id_receiver = $1 AND read_date IS NULL`, [id_receiver]);
            return { success: true };
        } catch (error) {
            console.error("❌ Erreur markAllAsRead:", error);
            return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
        }
    }

    async deleteNotification(notificationId: number) {
        try {
            const result = await this.query<{ id: number }>(`DELETE FROM notifications WHERE id = $1 RETURNING id`, [notificationId]);
            if (result.rows.length === 0) {
                return { success: false, error: "Notification non trouvée ou accès refusé" };
            }
            return { success: true, data: { id: result.rows[0].id } };
        } catch (error) {
            console.error("❌ Erreur deleteNotification:", error);
            return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
        }
    }
}