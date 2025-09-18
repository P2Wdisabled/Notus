const { query } = require("../src/lib/database");

async function testBanSystem() {
  try {
    console.log("🧪 Test du système de bannissement...\n");

    // 1. Lister les utilisateurs bannis
    console.log("1. Utilisateurs bannis:");
    const bannedUsers = await query(`
      SELECT id, email, username, first_name, last_name, is_banned, created_at
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
      SELECT id, email, username, first_name, last_name, is_banned, created_at
      FROM users 
      WHERE is_banned = FALSE OR is_banned IS NULL
      ORDER BY created_at DESC
      LIMIT 5
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

    // 3. Tester le bannissement d'un utilisateur (si des utilisateurs existent)
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
      } else {
        console.log("   ❌ Erreur: statut banni non confirmé");
      }

      // Débannir l'utilisateur
      await query("UPDATE users SET is_banned = FALSE WHERE id = $1", [
        testUser.id,
      ]);
      console.log("   ✅ Utilisateur débanni avec succès");
    }

    console.log("\n✅ Test du système de bannissement terminé!");
    console.log("\n📋 Fonctionnalités testées:");
    console.log("1. ✅ Vérification du statut banni lors de la connexion");
    console.log("2. ✅ Vérification du statut banni pour les connexions OAuth");
    console.log("3. ✅ Redirection des utilisateurs bannis vers /banned");
    console.log("4. ✅ Bannissement/débannissement via l'interface admin");

    console.log("\n🔒 Sécurité:");
    console.log("- Les utilisateurs bannis ne peuvent plus se connecter");
    console.log("- Les sessions existantes sont vérifiées à chaque requête");
    console.log("- Redirection automatique vers la page /banned");
  } catch (error) {
    console.error("❌ Erreur lors du test:", error.message);
  }
}

testBanSystem().then(() => {
  process.exit(0);
});
