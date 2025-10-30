import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { PrismaUserRepository } from "@/lib/repositories/PrismaUserRepository";
import { EmailService } from "@/lib/services/EmailService";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }

    // Read and validate body
    let password = "";
    try {
      const body = await request.json();
      password = String(body?.password || "").trim();
    } catch (_) {}
    if (!password) {
      return NextResponse.json({ success: false, error: "Mot de passe requis" }, { status: 400 });
    }

    const userId = parseInt(session.user.id);

    const userRepo = new PrismaUserRepository();
    const userRes = await userRepo.getUserById(userId);
    if (!userRes.success || !userRes.user) {
      return NextResponse.json({ success: false, error: "Utilisateur introuvable" }, { status: 404 });
    }

    // Verify password against stored hash
    const user = userRes.user;
    if (!user.password_hash) {
      return NextResponse.json({ success: false, error: "Compte OAuth sans mot de passe" }, { status: 400 });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return NextResponse.json({ success: false, error: "Mot de passe invalide" }, { status: 401 });
    }

    // Immediate deletion: archive documents, archive user, then delete user
    await prisma.$transaction(async (tx) => {
      // 1) Archive user's documents into trash_documents before user deletion (to avoid CASCADE loss)
      const docs = await tx.document.findMany({ where: { user_id: user.id } });
      if (docs.length > 0) {
        await tx.trashDocument.createMany({
          data: docs.map((d) => ({
            original_id: d.id,
            user_id: d.user_id,
            title: d.title,
            content: d.content,
            tags: d.tags,
            created_at: d.created_at,
            updated_at: d.updated_at,
            deleted_at: new Date(),
          })),
        });
      }

      // 2) Archive the user (for 30 days reactivation window)
      await tx.deletedAccount.create({
        data: {
          original_user_id: user.id,
          email: user.email,
          username: user.username || null,
          first_name: user.first_name || null,
          last_name: user.last_name || null,
          provider: user.provider || null,
          provider_id: user.provider_id || null,
          profile_image: user.profile_image || null,
          banner_image: user.banner_image || null,
          is_admin: user.is_admin,
          is_banned: user.is_banned,
          user_snapshot: user as any,
          // expires_at defaults to 30 days in DB
        },
      });

      // 3) Delete the user (documents and shares will cascade)
      await tx.user.delete({ where: { id: user.id } });
    });

    // Send notification email that deletion is completed and reactivation window exists
    const emailService = new EmailService();
    await emailService.sendDeletionCompletedEmail(
      user.email,
      user.first_name || "Utilisateur"
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Erreur API delete-account:", error);
    return NextResponse.json({ success: false, error: "Erreur interne du serveur" }, { status: 500 });
  }
}


