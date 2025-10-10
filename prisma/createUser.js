// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'relando.vrapi@dela-tech.com';
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log('🚫 Default admin already exists.');
    return;
  }

  const hashedPassword = await bcrypt.hash('Relando12!', 10);
  const user = await prisma.user.create({
    data: {
      username: 'Relando Vrapi',
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
