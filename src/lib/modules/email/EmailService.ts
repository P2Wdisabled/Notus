import { EmailService as BaseEmailService } from "../../services/EmailService";

export class EmailManagementService {
  private emailService: BaseEmailService;

  constructor() {
    this.emailService = new BaseEmailService();
  }

  async sendVerificationEmail(email: string, token: string, firstName: string): Promise<{ success: boolean; error?: string }> {
    return await this.emailService.sendVerificationEmail(email, token, firstName);
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<{ success: boolean; error?: string }> {
    return await this.emailService.sendWelcomeEmail(email, firstName);
  }

  async sendBanNotificationEmail(email: string, firstName: string): Promise<{ success: boolean; error?: string }> {
    return await this.emailService.sendBanNotificationEmail(email, firstName);
  }

  async sendUnbanNotificationEmail(email: string, firstName: string): Promise<{ success: boolean; error?: string }> {
    return await this.emailService.sendUnbanNotificationEmail(email, firstName);
  }

  async sendPasswordResetEmail(email: string, token: string, firstName: string): Promise<{ success: boolean; error?: string }> {
    return await this.emailService.sendPasswordResetEmail(email, token, firstName);
  }

  generateVerificationToken(): string {
    return this.emailService.generateVerificationToken();
  }
}
