const { PrismaClient, UserRole } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: 'admin@gaia.local' },
    update: {
      username: 'admin',
      role: UserRole.ADMIN,
      status: 1,
    },
    create: {
      username: 'admin',
      email: 'admin@gaia.local',
      password: 'ci-seed-password',
      role: UserRole.ADMIN,
      status: 1,
      encryptedMasterKey: 'ci-seed-master-key',
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Seed failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
