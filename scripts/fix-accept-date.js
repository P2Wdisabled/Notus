require("dotenv").config();
const { query } = require("../src/lib/database");

async function fixAcceptDate() {
  try {
    console.log(
      "🔧 Fix des dates d'acceptation des conditions d'utilisation...\n"
    );

    // 1. Vérifier si la colonne existe
    console.log("1. Vérification de la structure de la base de données:");
    const tableInfo = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'terms_accepted_at'
    `);

    if (tableInfo.rows.length === 0) {
      console.log("   ❌ Colonne 'terms_accepted_at' non trouvée.");
      console.log("   🔧 Ajout de la colonne...");

      // Ajouter la colonne
      await query(`
        ALTER TABLE users 
        ADD COLUMN terms_accepted_at TIMESTAMP
      `);

      console.log("   ✅ Colonne 'terms_accepted_at' ajoutée avec succès");
    } else {
      console.log("   ✅ Colonne 'terms_accepted_at' existe déjà");
    }

    // 2. Compter les utilisateurs sans date d'acceptation
    console.log("\n2. Analyse des utilisateurs existants:");
    const usersWithoutTerms = await query(`
      SELECT COUNT(*) as count
      FROM users 
      WHERE terms_accepted_at IS NULL
    `);

    const totalUsers = await query(`
      SELECT COUNT(*) as count
      FROM users
    `);

    console.log(`   📊 Total d'utilisateurs: ${totalUsers.rows[0].count}`);
    console.log(
      `   📊 Utilisateurs sans date d'acceptation: ${usersWithoutTerms.rows[0].count}`
    );

    if (parseInt(usersWithoutTerms.rows[0].count) === 0) {
      console.log(
        "   ✅ Tous les utilisateurs ont déjà une date d'acceptation"
      );
      return;
    }

    // 3. Effectuer la migration
    console.log("\n3. Ajout des dates d'acceptation...");
    const migrationResult = await query(`
      UPDATE users 
      SET terms_accepted_at = created_at
      WHERE terms_accepted_at IS NULL
    `);

    console.log(`   ✅ ${migrationResult.rowCount} utilisateurs mis à jour`);

    // 4. Vérifier le résultat
    console.log("\n4. Vérification du résultat:");
    const verificationResult = await query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(terms_accepted_at) as users_with_terms,
        COUNT(*) - COUNT(terms_accepted_at) as users_without_terms
      FROM users
    `);

    const stats = verificationResult.rows[0];
    console.log(`   📊 Total d'utilisateurs: ${stats.total_users}`);
    console.log(
      `   📊 Utilisateurs avec date d'acceptation: ${stats.users_with_terms}`
    );
    console.log(
      `   📊 Utilisateurs sans date d'acceptation: ${stats.users_without_terms}`
    );

    // 5. Afficher quelques exemples
    console.log("\n5. Exemples d'utilisateurs mis à jour:");
    const examples = await query(`
      SELECT 
        first_name, 
        last_name, 
        email, 
        created_at, 
        terms_accepted_at
      FROM users 
      WHERE terms_accepted_at IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 5
    `);

    examples.rows.forEach((user, index) => {
      console.log(
        `   ${index + 1}. ${user.first_name} ${user.last_name} (${user.email})`
      );
      console.log(
        `      Créé le: ${new Date(user.created_at).toLocaleString("fr-FR")}`
      );
      console.log(
        `      Accepté le: ${new Date(user.terms_accepted_at).toLocaleString(
          "fr-FR"
        )}`
      );
    });

    console.log("\n✅ Fix terminé avec succès!");
    console.log("\n📋 Résumé:");
    console.log("1. ✅ Colonne 'terms_accepted_at' ajoutée si nécessaire");
    console.log(
      "2. ✅ Tous les utilisateurs existants ont maintenant une date d'acceptation"
    );
    console.log(
      "3. ✅ La date d'acceptation est fixée à la date de création du compte"
    );
    console.log(
      "4. ✅ Les nouveaux utilisateurs devront accepter les conditions lors de l'inscription"
    );

    console.log("\n🔧 Prochaines étapes:");
    console.log("1. Testez l'inscription d'un nouvel utilisateur");
    console.log("2. Vérifiez que la case à cocher est obligatoire");
    console.log("3. Vérifiez l'affichage dans le backoffice");
  } catch (error) {
    console.error("❌ Erreur lors du fix:", error.message);
    console.error("Stack trace:", error.stack);
  }
}

fixAcceptDate().then(() => {
  process.exit(0);
});
