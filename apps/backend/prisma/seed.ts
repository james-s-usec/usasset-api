import { PrismaClient, UserRole } from '@prisma/client';

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

  // Create default folders
  const defaultFolders = [
    { name: 'Calculations', description: 'Engineering calculations and analysis', color: '#2196F3' },
    { name: 'Controls', description: 'Control systems and automation', color: '#FF9800' },
    { name: 'Cost Estimates', description: 'Project cost estimates and budgets', color: '#4CAF50' },
    { name: 'Drawings', description: 'Technical drawings and schematics', color: '#9C27B0' },
    { name: 'Field', description: 'Field reports and documentation', color: '#607D8B' },
    { name: 'For Encore', description: 'Documents for Encore review', color: '#E91E63' },
    { name: 'Issues Log', description: 'Issue tracking and resolution', color: '#F44336' },
    { name: 'Photos', description: 'Project photos and images', color: '#00BCD4' },
    { name: 'Submittals', description: 'Contractor submittals and approvals', color: '#8BC34A' },
  ];

  const createdFolders = [];
  for (const folderData of defaultFolders) {
    const folder = await prisma.folder.upsert({
      where: { name: folderData.name },
      update: {},
      create: {
        ...folderData,
        is_default: true, // Mark as system folder
      },
    });
    createdFolders.push(folder);
  }

  console.log('✅ Seeded folders:', createdFolders.map(f => f.name).join(', '));
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