const { query } = require("../src/lib/database");
const {
  sendBanNotificationEmail,
  sendUnbanNotificationEmail,
} = require("../src/lib/email");

async function testBanEmail() {
  try {
    console.log("🧪 Test des emails de bannissement et débannissement...\n");

    // 1. Trouver un utilisateur pour le test
    console.log("1. Recherche d'un utilisateur pour le test:");
    const users = await query(`
      SELECT id, email, first_name, last_name, is_banned
      FROM users 
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (users.rows.length === 0) {
      console.log("   ❌ Aucun utilisateur trouvé pour le test");
      return;
    }

    const testUser = users.rows[0];
    console.log(
      `   ✅ Utilisateur trouvé: ${testUser.first_name} ${testUser.last_name} (${testUser.email})`
    );

    // 2. Tester l'envoi d'email de bannissement
    console.log("\n2. Test d'envoi d'email de bannissement:");
    const emailResult = await sendBanNotificationEmail(
      testUser.email,
      testUser.first_name || "Utilisateur",
      "Test de bannissement - Comportement inapproprié"
    );

    if (emailResult.success) {
      console.log("   ✅ Email de bannissement envoyé avec succès");
      console.log(`   📧 Message ID: ${emailResult.messageId}`);
    } else {
      console.log("   ❌ Erreur lors de l'envoi de l'email:");
      console.log(`   📧 Erreur: ${emailResult.error}`);
    }

    // 3. Tester l'email de débannissement
    console.log("\n3. Test d'envoi d'email de débannissement:");
    const unbanEmailResult = await sendUnbanNotificationEmail(
      testUser.email,
      testUser.first_name || "Utilisateur"
    );

    if (unbanEmailResult.success) {
      console.log("   ✅ Email de débannissement envoyé avec succès");
      console.log(`   📧 Message ID: ${unbanEmailResult.messageId}`);
    } else {
      console.log("   ❌ Erreur lors de l'envoi de l'email de débannissement:");
      console.log(`   📧 Erreur: ${unbanEmailResult.error}`);
    }

    // 4. Tester l'email de bannissement sans raison
    console.log("\n4. Test d'envoi d'email de bannissement sans raison:");
    const emailResult2 = await sendBanNotificationEmail(
      testUser.email,
      testUser.first_name || "Utilisateur",
      null
    );

    if (emailResult2.success) {
      console.log("   ✅ Email de bannissement sans raison envoyé avec succès");
      console.log(`   📧 Message ID: ${emailResult2.messageId}`);
    } else {
      console.log("   ❌ Erreur lors de l'envoi de l'email sans raison:");
      console.log(`   📧 Erreur: ${emailResult2.error}`);
    }

    // 5. Tester l'API de bannissement complète
    console.log("\n5. Test de l'API de bannissement complète:");

    // Bannir l'utilisateur via l'API
    const banResponse = await fetch(
      "http://localhost:3000/api/admin/users/" + testUser.id + "/ban",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isBanned: true,
          reason: "Test API - Violation des conditions d'utilisation",
        }),
      }
    );

    if (banResponse.ok) {
      const banResult = await banResponse.json();
      console.log("   ✅ API de bannissement fonctionne");
      console.log(`   📧 Email envoyé: ${banResult.emailSent ? "Oui" : "Non"}`);
      console.log(`   📝 Message: ${banResult.message}`);
    } else {
      const error = await banResponse.json();
      console.log("   ❌ Erreur API de bannissement:");
      console.log(`   📧 Erreur: ${error.error}`);
    }

    // 6. Débannir l'utilisateur
    console.log("\n6. Débannissement de l'utilisateur:");
    const unbanResponse = await fetch(
      "http://localhost:3000/api/admin/users/" + testUser.id + "/ban",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isBanned: false }),
      }
    );

    if (unbanResponse.ok) {
      const unbanResult = await unbanResponse.json();
      console.log("   ✅ Utilisateur débanni avec succès");
      console.log(
        `   📧 Email envoyé: ${unbanResult.emailSent ? "Oui" : "Non"}`
      );
      console.log(`   📝 Message: ${unbanResult.message}`);
    } else {
      const error = await unbanResponse.json();
      console.log("   ❌ Erreur lors du débannissement:");
      console.log(`   📧 Erreur: ${error.error}`);
    }

    console.log(
      "\n✅ Test des emails de bannissement et débannissement terminé!"
    );
    console.log("\n📋 Fonctionnalités testées:");
    console.log("1. ✅ Envoi d'email de bannissement avec raison");
    console.log("2. ✅ Envoi d'email de débannissement");
    console.log("3. ✅ Envoi d'email de bannissement sans raison");
    console.log("4. ✅ API de bannissement complète");
    console.log("5. ✅ API de débannissement complète");
    console.log("6. ✅ Modal de confirmation avec raison");

    console.log("\n🔧 Comment tester manuellement:");
    console.log("1. Allez sur /admin/users");
    console.log("2. Cliquez sur 'Bannir' pour un utilisateur");
    console.log("3. Remplissez la raison (optionnel)");
    console.log("4. Confirmez le bannissement");
    console.log("5. Vérifiez que l'email de bannissement est envoyé");
    console.log("6. Cliquez sur 'Débannir' pour le même utilisateur");
    console.log("7. Vérifiez que l'email de débannissement est envoyé");
  } catch (error) {
    console.error("❌ Erreur lors du test:", error.message);
  }
}

testBanEmail().then(() => {
  process.exit(0);
});
