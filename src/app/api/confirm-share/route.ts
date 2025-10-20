import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { DocumentService } from "@/lib/services/DocumentService";

const secret = process.env.SHARE_INVITE_SECRET || process.env.AUTH_SECRET!;

const documentService = new DocumentService();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    if (!token) {
      return NextResponse.json({ success: false, error: "Token manquant" }, { status: 400 });
    }

    let payload: any;
    try {
      payload = jwt.verify(token, secret);
    } catch (err) {
      return NextResponse.json({ success: false, error: "Token invalide ou expiré" }, { status: 400 });
    }

    const { id_doc, email, permission } = payload;
    if (!id_doc || !email) {
      return NextResponse.json({ success: false, error: "Données du token incomplètes" }, { status: 400 });
    }

    // Insert share only if not already present
    const addRes = await documentService.addShare(id_doc, email, permission);
    if (!addRes.success) {
      return NextResponse.json({ success: false, error: addRes.error || "Erreur lors de l'ajout du partage" }, { status: 500 });
    }

    // Optionally, redirect to a success page or return JSON
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/`);
  } catch (error) {
    return NextResponse.json({ success: false, error: "Erreur interne du serveur" }, { status: 500 });
  }
}
