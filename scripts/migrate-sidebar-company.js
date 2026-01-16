/**
 * Migration script to add companyId to SidebarProject
 * Run with: node scripts/migrate-sidebar-company.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrate() {
  console.log('🚀 Starting SidebarProject company migration...\n');

  try {
    // Step 1: Get all unique company names from SidebarProject using raw SQL
    console.log('📊 Step 1: Finding unique company names in SidebarProject...');
    const uniqueCompaniesResult = await prisma.$queryRaw`
      SELECT DISTINCT company FROM SidebarProject 
      WHERE company IS NOT NULL AND company != ''
    `;

    const uniqueCompanies = uniqueCompaniesResult.map(row => row.company);
    console.log(`   Found ${uniqueCompanies.length} unique companies: ${uniqueCompanies.join(', ')}\n`);

    // Step 2: Ensure all companies exist in Company table
    console.log('📝 Step 2: Ensuring companies exist...');
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

    // Step 3: Add companyId column if it doesn't exist (ALTER TABLE if needed)
    console.log('\n🔧 Step 3: Checking companyId column...');
    
    // Check if column exists
    const columnCheck = await prisma.$queryRaw`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'SidebarProject'
        AND COLUMN_NAME = 'companyId'
    `;

    if (columnCheck.length === 0) {
      console.log('   Adding companyId column...');
      await prisma.$executeRaw`
        ALTER TABLE SidebarProject ADD COLUMN companyId INT NULL
      `;
      console.log('   ✅ Column added');
    } else {
      console.log('   ⏭️  Column already exists');
    }

    // Step 4: Link all sidebar projects to their companies using raw SQL
    console.log('\n🔗 Step 4: Linking sidebar projects to companies...');
    
    const result = await prisma.$executeRaw`
      UPDATE SidebarProject sp
      INNER JOIN Company c ON sp.company = c.name
      SET sp.companyId = c.id
      WHERE sp.companyId IS NULL
    `;

    console.log(`   ✅ Linked ${result} sidebar projects to companies\n`);

    // Step 5: Verify
    console.log('🔍 Step 5: Verifying migration...');
    
    const nullCountResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM SidebarProject WHERE companyId IS NULL
    `;
    const nullCompanyIds = Number(nullCountResult[0].count);

    const companies = await prisma.company.findMany();
    
    const linkedCountResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM SidebarProject WHERE companyId IS NOT NULL
    `;
    const sidebarWithCompany = Number(linkedCountResult[0].count);

    console.log(`   Companies in database: ${companies.length}`);
    console.log(`   Sidebar projects linked: ${sidebarWithCompany}`);
    console.log(`   Sidebar projects with NULL companyId: ${nullCompanyIds}`);

    if (nullCompanyIds === 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log('   You can now run: npx prisma db push --accept-data-loss');
    } else {
      console.log('\n⚠️  Warning: Some sidebar projects still have NULL companyId');
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
