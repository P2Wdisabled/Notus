import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { EmailService } from "@/lib/services/EmailService";
import { PrismaUserRepository } from "@/lib/repositories/PrismaUserRepository";
import { NotificationService } from "@/lib/services/NotificationService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/../lib/auth";

const secret = process.env.SHARE_INVITE_SECRET || process.env.AUTH_SECRET!;

export async function POST(request: Request) {
  const body = await request.json();
  console.log("BODY", body);

  const { documentId, email, permission, inviterName, docTitle } = body;

  if (!documentId || !email || !docTitle) {
    return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
  }

  const token = jwt.sign({ id_doc: documentId, email, permission }, secret, { expiresIn: "2d" });
  const confirmUrl = `${process.env.NEXTAUTH_URL}/api/confirm-share?token=${token}`;

  const emailService = new EmailService();
  const emailResult = await emailService.sendShareInviteEmail(
    email,
    confirmUrl,
    inviterName || "Un utilisateur",
    docTitle
  );

  console.log("RESEND_API_KEY", process.env.RESEND_API_KEY);
  console.log("EMAIL_FROM", process.env.EMAIL_FROM);

  if (!emailResult.success) {
    return NextResponse.json({ success: false, error: emailResult.error }, { status: 500 });
  }

  // Try to create an in-app notification if the user exists
  try {
    const userRepo = new PrismaUserRepository();
    const userResult = await userRepo.getUserByEmail(email);
    if (userResult.success && userResult.user) {
      const notifSvc = new NotificationService();
      // derive sender id from session if available (more reliable than trusting client data)
      let senderId: number | null = null;
      try {
        const session = await getServerSession(authOptions);
        if (session?.user?.id) {
          senderId = parseInt(String(session.user.id), 10);
        }
      } catch (e) {
        // ignore — best-effort
      }

      // message can be structured; NotificationRepository stringifies it
      await notifSvc.sendNotification(senderId, userResult.user.id, {
        type: "share-invite",
        from: inviterName || "Un utilisateur",
        documentId,
        documentTitle: docTitle,
        url: confirmUrl,
      });
    }
  } catch (e) {
    // Non-fatal: log and continue
    console.warn("Could not create in-app notification for invite:", e);
  }

  return NextResponse.json({ success: true, message: "Invitation envoyée !" });
}

