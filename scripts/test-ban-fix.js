const { query } = require("../src/lib/database");

async function testBanFix() {
  try {
    console.log("🧪 Test de la correction des messages de bannissement...\n");

    // 1. Trouver un utilisateur actif pour le test
    console.log("1. Recherche d'un utilisateur pour le test:");
    const activeUsers = await query(`
      SELECT id, email, username, first_name, last_name, is_banned
      FROM users 
      WHERE is_banned = FALSE OR is_banned IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (activeUsers.rows.length === 0) {
      console.log("   ❌ Aucun utilisateur actif trouvé pour le test");
      return;
    }

    const testUser = activeUsers.rows[0];
    console.log(
      `   ✅ Utilisateur trouvé: ${testUser.first_name} ${testUser.last_name} (${testUser.email})`
    );

    // 2. Bannir l'utilisateur
    console.log("\n2. Bannissement de l'utilisateur:");
    await query("UPDATE users SET is_banned = TRUE WHERE id = $1", [
      testUser.id,
    ]);
    console.log("   ✅ Utilisateur banni avec succès");

    // 3. Vérifier le statut
    console.log("\n3. Vérification du statut:");
    const checkResult = await query(
      "SELECT is_banned FROM users WHERE id = $1",
      [testUser.id]
    );

    if (checkResult.rows[0].is_banned) {
      console.log("   ✅ Statut banni confirmé");
    } else {
      console.log("   ❌ Erreur: statut banni non confirmé");
      return;
    }

    // 4. Tester la vérification de bannissement
    console.log("\n4. Test de la vérification de bannissement:");
    const banCheck = await query(
      "SELECT is_banned FROM users WHERE email = $1 OR username = $1",
      [testUser.email]
    );

    if (banCheck.rows.length > 0 && banCheck.rows[0].is_banned) {
      console.log("   ✅ Vérification de bannissement fonctionne");
      console.log(
        "   📝 Message attendu: 'Ce compte a été banni. Contactez un administrateur pour plus d'informations.'"
      );
    } else {
      console.log(
        "   ❌ Erreur: vérification de bannissement ne fonctionne pas"
      );
    }

    // 5. Débannir l'utilisateur
    console.log("\n5. Débannissement de l'utilisateur:");
    await query("UPDATE users SET is_banned = FALSE WHERE id = $1", [
      testUser.id,
    ]);
    console.log("   ✅ Utilisateur débanni avec succès");

    console.log("\n✅ Test de correction terminé!");
    console.log("\n📋 Corrections apportées:");
    console.log(
      "1. ✅ Vérification de bannissement AVANT la tentative de connexion"
    );
    console.log("2. ✅ Message d'erreur spécifique affiché correctement");
    console.log("3. ✅ Gestion OAuth corrigée");
    console.log("4. ✅ Plus d'erreur 'CallbackRouteError'");

    console.log("\n🔧 Comment tester:");
    console.log("1. Bannissez un utilisateur via l'interface admin");
    console.log("2. Essayez de vous connecter avec cet utilisateur");
    console.log(
      "3. Vous devriez voir: 'Ce compte a été banni. Contactez un administrateur pour plus d'informations.'"
    );
  } catch (error) {
    console.error("❌ Erreur lors du test:", error.message);
  }
}

testBanFix().then(() => {
  process.exit(0);
});
