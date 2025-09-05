import { PrismaClient, UserRole, ProjectStatus, PipelinePhase, RuleType, AssetStatus, AssetCondition, FileType } from '@prisma/client';

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

  // Create sample projects FIRST
  const sampleProjects = [
    { 
      name: 'Edwards Pavillion', 
      description: 'Healthcare facility asset management project',
      status: 'ACTIVE',
      owner_id: tomPoeling.id // Assign to Tom Poeling as project owner
    },
    { 
      name: 'Shaw Cancer Center', 
      description: 'Cancer treatment facility asset tracking and management',
      status: 'ACTIVE',
      owner_id: jamesSwanson.id // Assign to James Swanson as project owner
    },
    { 
      name: 'Wichita Animal Hospital', 
      description: 'Veterinary hospital equipment and asset management',
      status: 'ACTIVE',
      owner_id: tomPoeling.id // Assign to Tom Poeling as project owner
    },
  ];

  const createdProjects = [];
  for (const projectData of sampleProjects) {
    // Check if project already exists by name
    let project = await prisma.project.findFirst({
      where: { name: projectData.name }
    });
    
    if (!project) {
      project = await prisma.project.create({
        data: {
          ...projectData,
          status: ProjectStatus.ACTIVE,
          created_by: 'system',
        },
      });
    }
    createdProjects.push(project);
  }

  console.log('✅ Seeded projects:', createdProjects.map(p => p.name).join(', '));

  // Create sample assets (after projects are created)
  const sampleAssets = [
    // Edwards Pavillion Assets
    {
      assetTag: 'HVAC-001',
      name: 'Main Chiller Unit',
      manufacturer: 'Carrier',
      modelNumber: 'Carrier-30GT-150',
      serialNumber: 'GT150-2024-001',
      status: AssetStatus.ACTIVE,
      condition: AssetCondition.EXCELLENT,
      location: 'Mechanical Room A',
      description: 'Primary chiller for building cooling',
      projectId: null, // Will be set after projects are created
      buildingName: 'Edwards Pavillion',
      floor: 'Basement',
      assetCategory: 'HVAC',
      assetType: 'Chiller',
      installDate: new Date('2024-01-15'),
      purchaseCost: 125000.00,
      motorHp: 150.0,
      btuRating: 500000,
      note1Subject: 'Installation Notes',
      note1: 'Installed with custom mounting due to space constraints. Requires annual maintenance.',
    },
    {
      assetTag: 'HVAC-002',
      name: 'Rooftop Unit #1',
      manufacturer: 'Trane',
      modelNumber: 'Trane-RTU-50',
      serialNumber: 'RTU50-2024-002',
      status: AssetStatus.ACTIVE,
      condition: AssetCondition.GOOD,
      location: 'Rooftop East',
      description: 'Rooftop HVAC unit serving patient areas',
      projectId: null,
      buildingName: 'Edwards Pavillion',
      floor: 'Roof',
      assetCategory: 'HVAC',
      assetType: 'Rooftop Unit',
      installDate: new Date('2024-02-20'),
      purchaseCost: 35000.00,
      motorHp: 25.0,
      filterType: 'MERV 13',
      filterQuantity: 4,
      note1Subject: 'Maintenance Schedule',
      note1: 'Filter change required every 3 months. Belt inspection quarterly.',
    },
    {
      assetTag: 'ELEC-001',
      name: 'Main Electrical Panel',
      manufacturer: 'GE',
      modelNumber: 'GE-MP-400A',
      serialNumber: 'MP400-2024-003',
      status: AssetStatus.ACTIVE,
      condition: AssetCondition.EXCELLENT,
      location: 'Electrical Room',
      description: 'Main electrical distribution panel',
      projectId: null,
      buildingName: 'Edwards Pavillion',
      floor: 'Basement',
      assetCategory: 'Electrical',
      assetType: 'Distribution Panel',
      installDate: new Date('2023-12-10'),
      purchaseCost: 15000.00,
      voltage: 480,
      amperage: 400.0,
    },
    // Shaw Cancer Center Assets
    {
      assetTag: 'HVAC-101',
      name: 'Operating Room HVAC',
      manufacturer: 'Johnson Controls',
      modelNumber: 'JC-OR-HVAC-100',
      serialNumber: 'OR100-2024-004',
      status: AssetStatus.ACTIVE,
      condition: AssetCondition.NEW,
      location: 'OR Suite 1',
      description: 'Specialized HVAC for operating room positive pressure',
      projectId: null,
      buildingName: 'Shaw Cancer Center',
      floor: '2nd Floor',
      assetCategory: 'HVAC',
      assetType: 'Medical HVAC',
      installDate: new Date('2024-03-01'),
      purchaseCost: 85000.00,
      motorHp: 15.0,
      filterType: 'HEPA',
      note1Subject: 'Medical Requirements',
      note1: 'Must maintain positive pressure differential. HEPA filters replaced monthly.',
    },
    {
      assetTag: 'MED-001',
      name: 'MRI Cooling System',
      manufacturer: 'Siemens',
      modelNumber: 'Siemens-MRI-Cool-3T',
      serialNumber: 'MRI3T-2024-005',
      status: AssetStatus.ACTIVE,
      condition: AssetCondition.NEW,
      location: 'MRI Room',
      description: 'Dedicated cooling system for 3T MRI machine',
      projectId: null,
      buildingName: 'Shaw Cancer Center',
      floor: '1st Floor',
      assetCategory: 'Medical Equipment',
      assetType: 'Cooling System',
      installDate: new Date('2024-04-15'),
      purchaseCost: 450000.00,
      note1Subject: 'Critical System',
      note1: 'System failure will damage MRI equipment. 24/7 monitoring required.',
    },
    // Wichita Animal Hospital Assets
    {
      assetTag: 'HVAC-201',
      name: 'Kennel Ventilation System',
      manufacturer: 'Carrier',
      modelNumber: 'Carrier-KV-500',
      serialNumber: 'KV500-2024-006',
      status: AssetStatus.ACTIVE,
      condition: AssetCondition.GOOD,
      location: 'Kennel Area',
      description: 'Specialized ventilation for animal kennel areas',
      projectId: null,
      buildingName: 'Wichita Animal Hospital',
      floor: '1st Floor',
      assetCategory: 'HVAC',
      assetType: 'Ventilation System',
      installDate: new Date('2024-05-10'),
      purchaseCost: 25000.00,
      motorHp: 10.0,
      filterType: 'MERV 11',
      note1Subject: 'Animal Safety',
      note1: 'System designed for animal odor control and air quality. Extra filtration required.',
    },
  ];

  const createdAssets = [];
  for (const assetData of sampleAssets) {
    // Find the matching project and assign the projectId
    const matchingProject = createdProjects.find(p => {
      if (assetData.assetTag.startsWith('HVAC-00') || assetData.assetTag.startsWith('ELEC-')) {
        return p.name === 'Edwards Pavillion';
      } else if (assetData.assetTag.startsWith('HVAC-10') || assetData.assetTag.startsWith('MED-')) {
        return p.name === 'Shaw Cancer Center';
      } else if (assetData.assetTag.startsWith('HVAC-20')) {
        return p.name === 'Wichita Animal Hospital';
      }
      return false;
    });

    // Check if asset already exists by assetTag
    let asset = await prisma.asset.findFirst({
      where: { assetTag: assetData.assetTag }
    });
    
    if (!asset) {
      const { projectId, ...createData } = assetData; // Extract projectId
      
      asset = await prisma.asset.create({
        data: {
          ...createData,
          ...(matchingProject && { projectId: matchingProject.id }), // Only add projectId if we have a project
        },
      });
    }
    createdAssets.push(asset);
  }

  console.log('✅ Seeded assets:', createdAssets.map(a => `${a.assetTag} (${a.name})`).join(', '));

  // Create project-scoped folders (realistic folder structures for each project type)
  const projectFolders = [
    // Edwards Pavillion (Healthcare Facility) - 7 folders
    { projectName: 'Edwards Pavillion', name: 'Calculations', description: 'HVAC load calculations and engineering analysis', color: '#2196F3' },
    { projectName: 'Edwards Pavillion', name: 'Drawings', description: 'Architectural and mechanical drawings', color: '#9C27B0' },
    { projectName: 'Edwards Pavillion', name: 'Photos', description: 'Construction and equipment photos', color: '#00BCD4' },
    { projectName: 'Edwards Pavillion', name: 'Controls', description: 'Building automation and control systems', color: '#FF9800' },
    { projectName: 'Edwards Pavillion', name: 'Submittals', description: 'Contractor submittals and shop drawings', color: '#8BC34A' },
    { projectName: 'Edwards Pavillion', name: 'Commissioning', description: 'Commissioning reports and testing', color: '#607D8B' },
    { projectName: 'Edwards Pavillion', name: 'As-Built', description: 'As-built drawings and documentation', color: '#795548' },
    
    // Shaw Cancer Center (Medical Facility) - 7 folders
    { projectName: 'Shaw Cancer Center', name: 'Calculations', description: 'Engineering calculations and analysis', color: '#2196F3' },
    { projectName: 'Shaw Cancer Center', name: 'Medical Equipment', description: 'Medical equipment specifications and manuals', color: '#E91E63' },
    { projectName: 'Shaw Cancer Center', name: 'HVAC Systems', description: 'Clean room and medical HVAC documentation', color: '#4CAF50' },
    { projectName: 'Shaw Cancer Center', name: 'Electrical', description: 'Medical electrical and backup power systems', color: '#FFC107' },
    { projectName: 'Shaw Cancer Center', name: 'Safety Systems', description: 'Fire safety and emergency systems', color: '#F44336' },
    { projectName: 'Shaw Cancer Center', name: 'Compliance', description: 'Healthcare compliance and regulatory docs', color: '#9C27B0' },
    { projectName: 'Shaw Cancer Center', name: 'Commissioning', description: 'Medical equipment commissioning', color: '#607D8B' },
    
    // Wichita Animal Hospital (Veterinary Facility) - 6 folders
    { projectName: 'Wichita Animal Hospital', name: 'Photos', description: 'Site and equipment photos', color: '#00BCD4' },
    { projectName: 'Wichita Animal Hospital', name: 'HVAC', description: 'Kennel ventilation and climate control', color: '#4CAF50' },
    { projectName: 'Wichita Animal Hospital', name: 'Plumbing', description: 'Water systems and drainage', color: '#2196F3' },
    { projectName: 'Wichita Animal Hospital', name: 'Equipment', description: 'Veterinary equipment documentation', color: '#E91E63' },
    { projectName: 'Wichita Animal Hospital', name: 'Construction', description: 'Construction documents and permits', color: '#795548' },
    { projectName: 'Wichita Animal Hospital', name: 'Inspections', description: 'Building and safety inspections', color: '#FF9800' },
  ];

  // Create project-scoped folders (NEW: true project-scoped implementation)
  const createdFolders = [];
  for (const folderData of projectFolders) {
    // Find the matching project for this folder
    const matchingProject = createdProjects.find(p => p.name === folderData.projectName);
    if (!matchingProject) {
      console.log(`⚠️  Skipping folder for unknown project: ${folderData.projectName}`);
      continue;
    }

    // Check if folder already exists for this project
    let folder = await prisma.folder.findFirst({
      where: { 
        name: folderData.name,
        project_id: matchingProject.id 
      }
    });
    
    if (!folder) {
      folder = await prisma.folder.create({
        data: {
          name: folderData.name, // Clean name without project prefix
          description: folderData.description,
          color: folderData.color,
          is_default: false, // These are project-specific, not system folders
          project_id: matchingProject.id, // Required project association
        },
      });
    }
    createdFolders.push(folder);
  }

  console.log('✅ Seeded project folders:', createdFolders.map(f => f.name).join(', '));

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

  // Create sample ETL pipeline rules (one of each type for CLEAN phase)
  const pipelineRules = [
    {
      name: 'Trim Whitespace from Text Fields',
      description: 'Remove leading and trailing whitespace from all text fields',
      phase: PipelinePhase.CLEAN,
      type: RuleType.TRIM,
      target: 'name,manufacturer,description',
      config: {
        sides: 'both',
        customChars: ' \t\n\r'
      },
      priority: 10,
      is_active: true
    },
    {
      name: 'Standardize Manufacturer Names',
      description: 'Replace common manufacturer name variations with standard names',
      phase: PipelinePhase.CLEAN,
      type: RuleType.REGEX_REPLACE,
      target: 'manufacturer',
      config: {
        pattern: '\\b(carrier|CARRIER|Carrier Corp\\.?)\\b',
        replacement: 'Carrier',
        flags: 'gi'
      },
      priority: 20,
      is_active: true
    },
    {
      name: 'Fix Common Misspellings',
      description: 'Replace exact matches of common misspellings',
      phase: PipelinePhase.CLEAN,
      type: RuleType.EXACT_REPLACE,
      target: 'description,name',
      config: {
        replacements: [
          { from: 'HVAC Unit', to: 'HVAC Unit' },
          { from: 'Air Conditioner', to: 'Air Conditioning Unit' },
          { from: 'Boiler', to: 'Boiler System' }
        ]
      },
      priority: 30,
      is_active: true
    },
    {
      name: 'Remove Duplicate Values in Fields',
      description: 'Remove duplicate comma-separated values within single fields',
      phase: PipelinePhase.CLEAN,
      type: RuleType.REMOVE_DUPLICATES,
      target: 'description',
      config: {
        delimiter: ',',
        caseSensitive: false
      },
      priority: 40,
      is_active: true
    }
  ];

  const createdRules = [];
  for (const ruleData of pipelineRules) {
    // Check if rule already exists by name
    let rule = await prisma.pipelineRule.findFirst({
      where: { name: ruleData.name }
    });
    
    if (!rule) {
      rule = await prisma.pipelineRule.create({
        data: {
          ...ruleData,
          created_by: 'system',
        },
      });
    }
    createdRules.push(rule);
  }

  console.log('✅ Seeded pipeline rules:', createdRules.map(r => r.name).join(', '));
  console.log('🌱 Database seeding completed!');
  console.log('📊 Summary:');
  console.log(`   • Users: ${6} (${3} development + ${3} production)`);
  console.log(`   • Projects: ${createdProjects.length}`);
  console.log(`   • Assets: ${createdAssets.length} (properly distributed across projects)`);
  console.log(`   • Project folders: ${createdFolders.length} (realistic folder structures per project type)`);
  console.log(`   • Asset column aliases: ${createdAliases.length}`);
  console.log(`   • Pipeline rules: ${createdRules.length}`);
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