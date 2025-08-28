import { PrismaClient, UserRole } from '../generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@usasset.com' },
    update: {},
    create: {
      email: 'admin@usasset.com',
      name: 'Admin User',
      role: UserRole.ADMIN,
      created_by: 'system',
    },
  });

  // Create super admin user
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@usasset.com' },
    update: {},
    create: {
      email: 'superadmin@usasset.com',
      name: 'Super Admin User',
      role: UserRole.SUPER_ADMIN,
      created_by: 'system',
    },
  });

  // Create regular user
  const user = await prisma.user.upsert({
    where: { email: 'user@usasset.com' },
    update: {},
    create: {
      email: 'user@usasset.com',
      name: 'Regular User',
      role: UserRole.USER,
      created_by: 'system',
    },
  });

  console.log('✅ Seeded users:', { admin, superAdmin, user });
  console.log('🌱 Database seeding completed!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });