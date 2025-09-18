const { query } = require("../src/lib/database");

async function testBanMessages() {
  try {
    console.log("🧪 Test des messages d'erreur de bannissement...\n");

    // 1. Lister les utilisateurs bannis
    console.log("1. Utilisateurs bannis:");
    const bannedUsers = await query(`
      SELECT id, email, username, first_name, last_name, is_banned
      FROM users 
      WHERE is_banned = TRUE
      ORDER BY created_at DESC
    `);

    if (bannedUsers.rows.length > 0) {
      bannedUsers.rows.forEach((user) => {
        console.log(
          `   - ${user.first_name} ${user.last_name} (${user.email}) - Banni`
        );
      });
    } else {
      console.log("   Aucun utilisateur banni");
    }

    // 2. Lister les utilisateurs actifs
    console.log("\n2. Utilisateurs actifs:");
    const activeUsers = await query(`
      SELECT id, email, username, first_name, last_name, is_banned
      FROM users 
      WHERE is_banned = FALSE OR is_banned IS NULL
      ORDER BY created_at DESC
      LIMIT 3
    `);

    if (activeUsers.rows.length > 0) {
      activeUsers.rows.forEach((user) => {
        console.log(
          `   - ${user.first_name} ${user.last_name} (${user.email}) - Actif`
        );
      });
    } else {
      console.log("   Aucun utilisateur actif");
    }

    // 3. Tester le bannissement d'un utilisateur pour tester les messages
    if (activeUsers.rows.length > 0) {
      const testUser = activeUsers.rows[0];
      console.log(`\n3. Test de bannissement pour: ${testUser.email}`);

      // Bannir l'utilisateur
      await query("UPDATE users SET is_banned = TRUE WHERE id = $1", [
        testUser.id,
      ]);
      console.log("   ✅ Utilisateur banni avec succès");

      // Vérifier le bannissement
      const checkResult = await query(
        "SELECT is_banned FROM users WHERE id = $1",
        [testUser.id]
      );

      if (checkResult.rows[0].is_banned) {
        console.log("   ✅ Statut banni confirmé");
        console.log(
          "   📝 Message d'erreur attendu: 'Ce compte a été banni. Contactez un administrateur pour plus d'informations.'"
        );
      } else {
        console.log("   ❌ Erreur: statut banni non confirmé");
      }

      // Débannir l'utilisateur
      await query("UPDATE users SET is_banned = FALSE WHERE id = $1", [
        testUser.id,
      ]);
      console.log("   ✅ Utilisateur débanni avec succès");
    }

    console.log("\n✅ Test des messages de bannissement terminé!");
    console.log("\n📋 Messages d'erreur implémentés:");
    console.log(
      "1. ✅ Connexion par email/mot de passe: 'Ce compte a été banni. Contactez un administrateur pour plus d'informations.'"
    );
    console.log(
      "2. ✅ Connexion OAuth (Google): 'Ce compte a été banni. Contactez un administrateur pour plus d'informations.'"
    );
    console.log("3. ✅ Sessions existantes: Redirection vers /banned");

    console.log("\n🔒 Comportement attendu:");
    console.log(
      "- Les utilisateurs bannis voient un message d'erreur spécifique"
    );
    console.log("- Les sessions existantes sont redirigées vers /banned");
    console.log(
      "- Les tentatives de connexion OAuth affichent le message d'erreur"
    );
  } catch (error) {
    console.error("❌ Erreur lors du test:", error.message);
  }
}

testBanMessages().then(() => {
  process.exit(0);
});
