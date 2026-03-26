const { PrismaClient, UserRole } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function main() {
  // Hash the password using argon2
  const hashedPassword = await argon2.hash('ci-seed-password', {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 4,
  });

  await prisma.user.upsert({
    where: { email: 'admin@gaia.local' },
    update: {
      username: 'admin',
      role: UserRole.ADMIN,
      status: 1,
      password: hashedPassword,
    },
    create: {
      username: 'admin',
      email: 'admin@gaia.local',
      password: hashedPassword,
      role: UserRole.ADMIN,
      status: 1,
      encryptedMasterKey: 'ci-seed-master-key',
    },
  });

  console.log('✓ Admin user seeded successfully');
  console.log('  Email: admin@gaia.local');
  console.log('  Password: ci-seed-password');
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
