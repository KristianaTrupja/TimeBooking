/**
 * Migration script to populate Company table and link Projects
 * Run with: node scripts/migrate-company.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrate() {
  console.log('🚀 Starting Company migration...\n');

  try {
    // Step 1: Get all unique company names from Projects using raw SQL
    console.log('📊 Step 1: Finding unique company names...');
    const uniqueCompaniesResult = await prisma.$queryRaw`
      SELECT DISTINCT company FROM Projects 
      WHERE company IS NOT NULL AND company != ''
    `;

    const uniqueCompanies = uniqueCompaniesResult.map(row => row.company);
    console.log(`   Found ${uniqueCompanies.length} unique companies: ${uniqueCompanies.join(', ')}\n`);

    // Step 2: Create companies that don't exist
    console.log('📝 Step 2: Creating companies...');
    for (const companyName of uniqueCompanies) {
      const existing = await prisma.company.findUnique({
        where: { name: companyName }
      });

      if (!existing) {
        await prisma.company.create({
          data: { name: companyName }
        });
        console.log(`   ✅ Created company: ${companyName}`);
      } else {
        console.log(`   ⏭️  Company already exists: ${companyName}`);
      }
    }

    // Step 3: Link all projects to their companies using raw SQL
    console.log('\n🔗 Step 3: Linking projects to companies...');
    
    const result = await prisma.$executeRaw`
      UPDATE Projects p
      INNER JOIN Company c ON p.company = c.name
      SET p.companyId = c.id
      WHERE p.companyId IS NULL
    `;

    console.log(`   ✅ Linked ${result} projects to companies\n`);

    // Step 4: Verify
    console.log('🔍 Step 4: Verifying migration...');
    
    const nullCountResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM Projects WHERE companyId IS NULL
    `;
    const nullCompanyIds = Number(nullCountResult[0].count);

    const companies = await prisma.company.findMany();
    
    const linkedCountResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM Projects WHERE companyId IS NOT NULL
    `;
    const projectsWithCompany = Number(linkedCountResult[0].count);

    console.log(`   Companies created: ${companies.length}`);
    console.log(`   Projects linked: ${projectsWithCompany}`);
    console.log(`   Projects with NULL companyId: ${nullCompanyIds}`);

    if (nullCompanyIds === 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log('   You can now run: npx prisma db push');
    } else {
      console.log('\n⚠️  Warning: Some projects still have NULL companyId');
      console.log('   Please check your data and try again.');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrate()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
