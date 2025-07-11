// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'jetmir.ahmati@dela-tech.com';
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log('🚫 Default admin already exists.');
    return;
  }

  const hashedPassword = await bcrypt.hash('Admin123.', 10);
  const user = await prisma.user.create({
    data: {
      username: 'jetmir',
      email,
      password: hashedPassword,
      role: 'admin',
    },
  });

  console.log(' Default admin user created:', user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
