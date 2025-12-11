import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { EmailService } from "@/lib/services/EmailService";
import { PrismaUserRepository } from "@/lib/repositories/PrismaUserRepository";
import { NotificationService } from "@/lib/services/NotificationService";
import { DocumentService } from "@/lib/services/DocumentService";
import { requireAuth, requireDocumentOwnership } from "@/lib/security/routeGuards";

const secret = process.env.SHARE_INVITE_SECRET || process.env.AUTH_SECRET!;
const documentService = new DocumentService();

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { documentId, email, permission, inviterName, docTitle } = body;

    if (!documentId || !email || !docTitle) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 400 }
      );
    }

    const docId = parseInt(String(documentId));
    if (!Number.isFinite(docId)) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 400 }
      );
    }

    const ownershipCheck = await requireDocumentOwnership(docId, authResult.userId);
    if (ownershipCheck) {
      return ownershipCheck;
    }

    // Normaliser l'email fourni pour la comparaison
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedAuthEmail = authResult.email.toLowerCase().trim();

    // Empêcher l'auto-invitation
    if (normalizedEmail === normalizedAuthEmail) {
      return NextResponse.json(
        { success: false, error: "Vous ne pouvez pas vous inviter vous-même." },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur avec cet email existe avant d'envoyer le mail
    const userRepo = new PrismaUserRepository();
    const userResult = await userRepo.getUserByEmail(normalizedEmail);
    if (!userResult.success || !userResult.user) {
      return NextResponse.json(
        { success: false, error: "Vous ne pouvez pas envoyer de mail à cet utilisateur." },
        { status: 404 }
      );
    }

    const token = jwt.sign({ id_doc: docId, email: normalizedEmail, permission }, secret, { expiresIn: "2d" });
    const confirmUrl = `${process.env.NEXTAUTH_URL}/api/confirm-share?token=${token}`;

    const emailService = new EmailService();
    const emailResult = await emailService.sendShareInviteEmail(
      normalizedEmail,
      confirmUrl,
      inviterName || "Un utilisateur",
      docTitle
    );

    if (!emailResult.success) {
      return NextResponse.json({ success: false, error: "Accès refusé" }, { status: 500 });
    }

    try {
      const notifSvc = new NotificationService();
      const senderId = authResult.userId;

      // message can be structured; NotificationRepository stringifies it
      await notifSvc.sendNotification(senderId, userResult.user.id, {
        type: "share-invite",
        from: inviterName || "Un utilisateur",
        documentId: docId,
        documentTitle: docTitle,
        url: confirmUrl,
      });
    } catch (e) {
      console.warn("Could not create in-app notification for invite:", e);
    }

    return NextResponse.json({ success: true, message: "Invitation envoyée !" });
  } catch (error) {
    console.error("❌ Erreur API invite-share:", error);
    return NextResponse.json(
      { success: false, error: "Accès refusé" },
      { status: 500 }
    );
  }
}

