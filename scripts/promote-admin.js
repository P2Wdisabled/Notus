const { query } = require("../src/lib/database");

async function promoteUserToAdmin(email) {
  try {
    console.log(`🔍 Recherche de l'utilisateur avec l'email: ${email}`);

    // Trouver l'utilisateur par email
    const userResult = await query(
      "SELECT id, email, username, first_name, last_name, is_admin FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      console.log("❌ Utilisateur non trouvé avec cet email");
      return;
    }

    const user = userResult.rows[0];
    console.log(
      `👤 Utilisateur trouvé: ${user.first_name} ${user.last_name} (@${user.username})`
    );
    console.log(`📧 Email: ${user.email}`);
    console.log(`🔑 Statut admin actuel: ${user.is_admin ? "Oui" : "Non"}`);

    if (user.is_admin) {
      console.log("ℹ️  L'utilisateur est déjà administrateur");
      return;
    }

    // Promouvoir l'utilisateur
    const updateResult = await query(
      "UPDATE users SET is_admin = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, email, is_admin",
      [user.id]
    );

    if (updateResult.rows.length > 0) {
      console.log("✅ Utilisateur promu administrateur avec succès!");
      console.log(
        `🔑 Nouveau statut admin: ${
          updateResult.rows[0].is_admin ? "Oui" : "Non"
        }`
      );
    } else {
      console.log("❌ Erreur lors de la promotion");
    }
  } catch (error) {
    console.error("❌ Erreur:", error.message);
  }
}

// Récupérer l'email depuis les arguments de ligne de commande
const email = process.argv[2];

if (!email) {
  console.log("Usage: node scripts/promote-admin.js <email>");
  console.log("Exemple: node scripts/promote-admin.js user@example.com");
  process.exit(1);
}

promoteUserToAdmin(email).then(() => {
  process.exit(0);
});
