import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { EmailService } from "@/lib/services/EmailService";

const secret = process.env.SHARE_INVITE_SECRET || process.env.AUTH_SECRET!;

export async function POST(request: Request) {
  const body = await request.json(); // Read once!
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

  return NextResponse.json({ success: true, message: "Invitation envoyée !" });
}

