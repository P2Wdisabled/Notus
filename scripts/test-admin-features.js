const { query } = require("../src/lib/database");

async function testAdminFeatures() {
  try {
    console.log("🧪 Test des fonctionnalités admin...\n");

    // 1. Vérifier la structure de la base de données
    console.log("1. Vérification de la structure de la base de données...");
    const tableInfo = await query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('is_admin', 'is_banned')
      ORDER BY column_name
    `);

    if (tableInfo.rows.length === 2) {
      console.log("✅ Colonnes admin présentes dans la table users");
      tableInfo.rows.forEach((col) => {
        console.log(
          `   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`
        );
      });
    } else {
      console.log("❌ Colonnes admin manquantes");
      return;
    }

    // 2. Lister les utilisateurs existants
    console.log("\n2. Utilisateurs existants:");
    const users = await query(`
      SELECT id, email, username, first_name, last_name, is_admin, is_banned, created_at
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    if (users.rows.length > 0) {
      users.rows.forEach((user) => {
        console.log(
          `   - ${user.first_name} ${user.last_name} (${user.email})`
        );
        console.log(
          `     Admin: ${user.is_admin ? "Oui" : "Non"}, Banni: ${
            user.is_banned ? "Oui" : "Non"
          }`
        );
      });
    } else {
      console.log("   Aucun utilisateur trouvé");
    }

    // 3. Vérifier les admins existants
    console.log("\n3. Administrateurs existants:");
    const admins = await query(`
      SELECT id, email, username, first_name, last_name
      FROM users 
      WHERE is_admin = TRUE
      ORDER BY created_at DESC
    `);

    if (admins.rows.length > 0) {
      admins.rows.forEach((admin) => {
        console.log(
          `   - ${admin.first_name} ${admin.last_name} (${admin.email})`
        );
      });
    } else {
      console.log("   Aucun administrateur trouvé");
      console.log(
        "   💡 Utilisez: node scripts/promote-admin.js <email> pour promouvoir un utilisateur"
      );
    }

    // 4. Vérifier les utilisateurs bannis
    console.log("\n4. Utilisateurs bannis:");
    const bannedUsers = await query(`
      SELECT id, email, username, first_name, last_name
      FROM users 
      WHERE is_banned = TRUE
      ORDER BY created_at DESC
    `);

    if (bannedUsers.rows.length > 0) {
      bannedUsers.rows.forEach((user) => {
        console.log(
          `   - ${user.first_name} ${user.last_name} (${user.email})`
        );
      });
    } else {
      console.log("   Aucun utilisateur banni");
    }

    console.log("\n✅ Test terminé avec succès!");
    console.log("\n📋 Instructions d'utilisation:");
    console.log("1. Connectez-vous à l'application");
    console.log(
      "2. Utilisez le bouton 'Devenir Admin' dans le footer pour vous promouvoir"
    );
    console.log("3. Le bouton 'Backoffice' apparaîtra dans la navigation");
    console.log("4. Accédez à /admin pour gérer les utilisateurs");
  } catch (error) {
    console.error("❌ Erreur lors du test:", error.message);
  }
}

testAdminFeatures().then(() => {
  process.exit(0);
});
