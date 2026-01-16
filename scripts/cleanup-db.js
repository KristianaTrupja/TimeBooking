/**
 * Cleanup script to remove old constraints before schema push
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  console.log('🧹 Cleaning up database constraints...\n');

  try {
    // Drop old unique constraint if exists
    console.log('📝 Dropping old unique constraint...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE Projects DROP INDEX IF EXISTS Projects_company_project_key
    `);
    console.log('   ✅ Old unique constraint removed\n');

    // Check current indexes
    console.log('🔍 Current indexes on Projects table:');
    const indexes = await prisma.$queryRaw`
      SHOW INDEX FROM Projects
    `;
    
    indexes.forEach(idx => {
      console.log(`   - ${idx.Key_name} (${idx.Column_name})`);
    });

    console.log('\n✅ Cleanup completed!');
    console.log('   You can now run: npx prisma db push --accept-data-loss');

  } catch (error) {
    console.error('\n❌ Cleanup failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
