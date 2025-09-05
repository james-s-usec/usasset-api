import { PrismaClient, UserRole, ProjectStatus } from '@prisma/client';

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

  // Create production users
  const tomPoeling = await prisma.user.upsert({
    where: { email: 'Tom.Poeling@USEngineering.com' },
    update: {},
    create: {
      email: 'Tom.Poeling@USEngineering.com',
      name: 'Tom Poeling',
      role: UserRole.ADMIN,
      created_by: 'system',
    },
  });

  const leviMorgan = await prisma.user.upsert({
    where: { email: 'Levi.Morgan@USEngineering.com' },
    update: {},
    create: {
      email: 'Levi.Morgan@USEngineering.com',
      name: 'Levi Morgan',
      role: UserRole.USER,
      created_by: 'system',
    },
  });

  const jamesSwanson = await prisma.user.upsert({
    where: { email: 'James.Swanson@USEngineering.com' },
    update: {},
    create: {
      email: 'James.Swanson@USEngineering.com',
      name: 'James Swanson',
      role: UserRole.SUPER_ADMIN,
      created_by: 'system',
    },
  });

  console.log('✅ Seeded users:', { admin, superAdmin, user, tomPoeling, leviMorgan, jamesSwanson });

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

  // Create sample projects
  const sampleProjects = [
    { 
      name: 'Edwards Pavillion', 
      description: 'Healthcare facility asset management project',
      status: ProjectStatus.ACTIVE,
      owner_id: tomPoeling.id // Assign to Tom Poeling as project owner
    },
    { 
      name: 'Shaw Cancer Center', 
      description: 'Cancer treatment facility asset tracking and management',
      status: ProjectStatus.ACTIVE,
      owner_id: jamesSwanson.id // Assign to James Swanson as project owner
    },
    { 
      name: 'Wichita Animal Hospital', 
      description: 'Veterinary hospital equipment and asset management',
      status: ProjectStatus.ACTIVE,
      owner_id: tomPoeling.id // Assign to Tom Poeling as project owner
    },
  ];

  const createdProjects = [];
  for (const projectData of sampleProjects) {
    const project = await prisma.project.upsert({
      where: { name: projectData.name },
      update: {},
      create: {
        ...projectData,
        created_by: 'system',
      },
    });
    createdProjects.push(project);
  }

  console.log('✅ Seeded projects:', createdProjects.map(p => p.name).join(', '));

  // Create asset column aliases for CSV import mapping
  const assetAliases = [
    // Core identification fields
    { asset_field: 'name', csv_alias: 'Asset Name', confidence: 1.0 },
    { asset_field: 'name', csv_alias: 'name', confidence: 1.0 },
    { asset_field: 'assetTag', csv_alias: 'ID', confidence: 1.0 },
    { asset_field: 'assetTag', csv_alias: 'Asset ID', confidence: 1.0 },
    { asset_field: 'description', csv_alias: 'Description', confidence: 1.0 },
    { asset_field: 'description', csv_alias: 'Title', confidence: 0.8 },

    // Category and type fields
    { asset_field: 'category', csv_alias: 'category', confidence: 1.0 },
    { asset_field: 'assetCategory', csv_alias: 'Asset Category Name', confidence: 1.0 },
    { asset_field: 'status', csv_alias: 'status', confidence: 1.0 },
    { asset_field: 'type', csv_alias: 'type', confidence: 1.0 },
    { asset_field: 'type', csv_alias: 'Type', confidence: 1.0 },

    // Manufacturer and model fields  
    { asset_field: 'manufacturer', csv_alias: 'manufacturer', confidence: 1.0 },
    { asset_field: 'modelNumber', csv_alias: 'model', confidence: 1.0 },
    { asset_field: 'serialNumber', csv_alias: 'Serial Number', confidence: 1.0 },

    // Location fields from Shaw.csv
    { asset_field: 'buildingName', csv_alias: 'Building Name', confidence: 1.0 },
    { asset_field: 'floorName', csv_alias: 'Floor Name', confidence: 1.0 },
    { asset_field: 'roomNumber', csv_alias: 'Room Number', confidence: 1.0 },
    { asset_field: 'area', csv_alias: 'Area', confidence: 1.0 },
    { asset_field: 'squareFeet', csv_alias: 'Square Feet', confidence: 1.0 },

    // Coordinate fields
    { asset_field: 'xCoordinate', csv_alias: 'X Coordinate', confidence: 1.0 },
    { asset_field: 'yCoordinate', csv_alias: 'Y Coordinate', confidence: 1.0 },

    // Date and lifecycle fields
    { asset_field: 'installDate', csv_alias: 'Installation Date', confidence: 1.0 },
    { asset_field: 'warrantyExpirationDate', csv_alias: 'Warranty Expiration Date', confidence: 1.0 },
    { asset_field: 'observedRemainingLife', csv_alias: 'Observed Remaining Life', confidence: 1.0 },
    { asset_field: 'serviceLife', csv_alias: 'Service Life', confidence: 1.0 },
    { asset_field: 'estimatedReplacementDate', csv_alias: 'Estimated Replacement Date', confidence: 1.0 },

    // Motor and mechanical fields specific to Shaw.csv
    { asset_field: 'motorHp', csv_alias: 'Motor Size', confidence: 0.9 },
    { asset_field: 'supplyFanMotorSize', csv_alias: 'Supply Fan Motor Size', confidence: 1.0 },
    { asset_field: 'returnFanMotorSize', csv_alias: 'Return Fan Motor Size', confidence: 1.0 },
    { asset_field: 'beltSize', csv_alias: 'Belt Size', confidence: 1.0 },
    { asset_field: 'beltQuantity', csv_alias: 'Belt Quantity', confidence: 1.0 },
    { asset_field: 'filterType', csv_alias: 'Filter Type', confidence: 1.0 },
    { asset_field: 'filterSize', csv_alias: 'Filter Size', confidence: 1.0 },
    { asset_field: 'filterQuantity', csv_alias: 'Filter Quantity', confidence: 1.0 },

    // Cost and catalog fields
    { asset_field: 'purchaseCost', csv_alias: 'Cost', confidence: 1.0 },
    { asset_field: 'vendor', csv_alias: 'Catalog Name', confidence: 0.8 },
    { asset_field: 'vendorWebsite', csv_alias: 'Website', confidence: 1.0 },
    { asset_field: 'quantity', csv_alias: 'Quantity', confidence: 1.0 },

    // Status and verification
    { asset_field: 'verified', csv_alias: 'Verified', confidence: 1.0 },

    // Additional common variations
    { asset_field: 'assetTag', csv_alias: 'Asset Tag', confidence: 1.0 },
    { asset_field: 'name', csv_alias: 'Equipment Name', confidence: 0.9 },
    { asset_field: 'buildingName', csv_alias: 'Building', confidence: 0.9 },
    { asset_field: 'floor', csv_alias: 'Floor', confidence: 1.0 },
    { asset_field: 'roomNumber', csv_alias: 'Room', confidence: 0.9 },
    { asset_field: 'condition', csv_alias: 'Condition', confidence: 1.0 },
    { asset_field: 'purchaseDate', csv_alias: 'Purchase Date', confidence: 1.0 },
    { asset_field: 'modelNumber', csv_alias: 'Model Number', confidence: 1.0 },
    { asset_field: 'assetLocation', csv_alias: 'Location', confidence: 0.8 },
  ];

  const createdAliases = [];
  for (const aliasData of assetAliases) {
    const alias = await prisma.assetColumnAlias.upsert({
      where: { csv_alias: aliasData.csv_alias },
      update: { 
        asset_field: aliasData.asset_field,
        confidence: aliasData.confidence,
      },
      create: {
        ...aliasData,
        created_by: 'system',
      },
    });
    createdAliases.push(alias);
  }

  console.log('✅ Seeded asset column aliases:', createdAliases.length);
  console.log('🌱 Database seeding completed!');
  console.log('📊 Summary:');
  console.log(`   • Users: ${6} (${3} development + ${3} production)`);
  console.log(`   • Projects: ${createdProjects.length}`);
  console.log(`   • Folders: ${createdFolders.length}`);
  console.log(`   • Asset column aliases: ${createdAliases.length}`);
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