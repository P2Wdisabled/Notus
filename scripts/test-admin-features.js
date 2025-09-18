const { query } = require("../src/lib/database");

async function testAdminFeatures() {
  try {
    // 1. Vérifier la structure de la base de données
    const tableInfo = await query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('is_admin', 'is_banned')
      ORDER BY column_name
    `);

    if (tableInfo.rows.length !== 2) {
      console.error("❌ Colonnes admin manquantes");
      return;
    }

    // 2. Lister les utilisateurs existants
    const users = await query(`
      SELECT id, email, username, first_name, last_name, is_admin, is_banned, created_at
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    // 3. Vérifier les admins existants
    const admins = await query(`
      SELECT id, email, username, first_name, last_name
      FROM users 
      WHERE is_admin = TRUE
      ORDER BY created_at DESC
    `);

    // 4. Vérifier les utilisateurs bannis
    const bannedUsers = await query(`
      SELECT id, email, username, first_name, last_name
      FROM users 
      WHERE is_banned = TRUE
      ORDER BY created_at DESC
    `);
  } catch (error) {
    console.error("❌ Erreur lors du test:", error.message);
  }
}

testAdminFeatures().then(() => {
  process.exit(0);
});
