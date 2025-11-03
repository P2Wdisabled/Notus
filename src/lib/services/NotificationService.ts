import { NotificationRepository } from "../repositories/NotificationRepository";

export class NotificationService {
    private notificationRepository: NotificationRepository;

    constructor() {
        this.notificationRepository = new NotificationRepository();
    }

    async initializeTables(): Promise<void> {
        await this.notificationRepository.initializeTables();
    }

    async sendNotification(id_sender: number | null, id_receiver: number, message: object | string) {
        if (!process.env.DATABASE_URL) {
            return { success: true };
        }

        try {
            await this.notificationRepository.initializeTables();
            return await this.notificationRepository.createNotification(id_sender, id_receiver, message);
        } catch (error) {
            console.error("❌ Erreur sendNotification:", error);
            return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
        }
    }

    async getNotificationsForUser(id_receiver: number, limit = 50, offset = 0, onlyUnread = false) {
        try {
            return await this.notificationRepository.getUserNotifications(id_receiver, limit, offset, onlyUnread);
        } catch (error) {
            console.error("❌ Erreur getNotificationsForUser:", error);
            return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
        }
    }

    async markNotificationAsRead(notificationId: number) {
        try {
            return await this.notificationRepository.markAsRead(notificationId);
        } catch (error) {
            console.error("❌ Erreur markNotificationAsRead:", error);
            return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
        }
    }

    async markAllAsRead(id_receiver: number) {
        try {
            return await this.notificationRepository.markAllAsRead(id_receiver);
        } catch (error) {
            console.error("❌ Erreur markAllAsRead:", error);
            return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
        }
    }

    async deleteNotification(notificationId: number) {
        try {
            return await this.notificationRepository.deleteNotification(notificationId);
        } catch (error) {
            console.error("❌ Erreur deleteNotification:", error);
            return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
        }
    }

    async sendPasswordChangeNotification(id_receiver: number) {
        // system notification: sender null
        const messageText = "Votre mot de passe a été modifié.";
        try {
            return await this.notificationRepository.createNotification(null, id_receiver, messageText);
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
        }
    }
}