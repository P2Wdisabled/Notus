import { prisma } from "../src/lib/prisma";

async function main() {
  try {
    console.log("🔄 Mise à jour des triggers PostgreSQL...");

    // Créer la fonction de mise à jour automatique pour les users
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION update_users_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Créer la fonction de mise à jour automatique pour les documents
    // Ne met pas à jour updated_at si seul le champ favori a été modifié
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION update_documents_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Ne pas mettre à jour updated_at si seul le champ favori a changé
        IF (OLD.favori IS DISTINCT FROM NEW.favori) AND
           (OLD.title IS NOT DISTINCT FROM NEW.title) AND
           (OLD.content IS NOT DISTINCT FROM NEW.content) AND
           (OLD.tags IS NOT DISTINCT FROM NEW.tags) AND
           (OLD.user_id IS NOT DISTINCT FROM NEW.user_id) THEN
          -- Seul favori a changé, préserver updated_at
          NEW.updated_at = OLD.updated_at;
        ELSE
          -- D'autres champs ont changé, mettre à jour updated_at
          NEW.updated_at = CURRENT_TIMESTAMP;
        END IF;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Supprimer l'ancien trigger pour users
    await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS update_users_updated_at ON users;`);

    // Créer le nouveau trigger pour users
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_users_updated_at_column();
    `);

    // Supprimer l'ancien trigger pour documents
    await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;`);

    // Créer le nouveau trigger pour documents
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER update_documents_updated_at
        BEFORE UPDATE ON documents
        FOR EACH ROW
        EXECUTE FUNCTION update_documents_updated_at_column();
    `);

    console.log("✅ Triggers mis à jour avec succès");
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour des triggers:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();

