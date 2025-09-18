require("dotenv").config();
const { query } = require("../src/lib/database");

async function fixAcceptDate() {
  try {
    // 1. Vérifier si la colonne existe
    const tableInfo = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'terms_accepted_at'
    `);

    if (tableInfo.rows.length === 0) {
      // Ajouter la colonne
      await query(`
        ALTER TABLE users 
        ADD COLUMN terms_accepted_at TIMESTAMP
      `);
    }

    // 2. Compter les utilisateurs sans date d'acceptation
    const usersWithoutTerms = await query(`
      SELECT COUNT(*) as count
      FROM users 
      WHERE terms_accepted_at IS NULL
    `);

    const totalUsers = await query(`
      SELECT COUNT(*) as count
      FROM users
    `);

    if (parseInt(usersWithoutTerms.rows[0].count) === 0) {
      return;
    }

    // 3. Effectuer la migration
    const migrationResult = await query(`
      UPDATE users 
      SET terms_accepted_at = created_at
      WHERE terms_accepted_at IS NULL
    `);

    // 4. Vérifier le résultat
    const verificationResult = await query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(terms_accepted_at) as users_with_terms,
        COUNT(*) - COUNT(terms_accepted_at) as users_without_terms
      FROM users
    `);

    // 5. Afficher quelques exemples
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
  } catch (error) {
    console.error("❌ Erreur lors du fix:", error.message);
    console.error("Stack trace:", error.stack);
  }
}

fixAcceptDate().then(() => {
  process.exit(0);
});
