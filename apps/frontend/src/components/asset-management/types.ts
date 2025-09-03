export interface Asset {
  id: string;
  assetTag: string;
  name: string;
  
  // Enhanced identification
  manufacturer?: string;
  modelNumber?: string;
  serialNumber?: string;
  description?: string;
  catalogName?: string;
  catalogItemId?: string;
  
  // Status and core info
  status?: 'ACTIVE' | 'MAINTENANCE' | 'RETIRED' | 'DISPOSED';
  location?: string;
  projectId?: string;
  
  // Categorization fields (19 fields)
  trade?: string;
  title?: string;
  preconSystem?: string;
  operationsSystem?: string;
  drawingAbbreviation?: string;
  preconTag?: string;
  systemTypeId?: string;
  systemCategory?: string;
  assetCategory?: string;
  assetCategoryName?: string;
  assetType?: string;
  type?: string;
  equipNameId?: string;
  subSystemType?: string;
  subSystemId?: string;
  subSystemClass?: string;
  subSystemClassification?: string;
  classId?: string;
  equipServedBy?: string;
  
  // Location fields (12 fields)
  customerName?: string;
  propertyName?: string;
  buildingName?: string;
  floor?: string;
  floorName?: string;
  area?: string;
  roomNumber?: string;
  assetLocation?: string;
  propertyZoneServed?: string;
  xCoordinate?: number;
  yCoordinate?: number;
  
  // TCO & Cost fields (9 fields)
  purchaseCost?: number;
  installationCost?: number;
  annualMaintenanceCost?: number;
  estimatedAnnualOperatingCost?: number;
  disposalCost?: number;
  salvageValue?: number;
  totalCostOfOwnership?: number;
  depreciationMethod?: string;
  currentBookValue?: number;
  
  // Energy fields (15 fields)
  ratedPowerKw?: number;
  actualPowerKw?: number;
  dailyOperatingHours?: number;
  estimatedAnnualKwh?: number;
  voltage?: number;
  btuRating?: number;
  
  // Lifecycle dates (8 fields)
  installDate?: string;
  manufactureDate?: string;
  serviceLife?: number;
  expectedLifetime?: number;
  
  // Size & measurement (8 fields)
  equipmentSize?: string;
  size?: string;
  unit?: string;
  quantity?: number;
  squareFeet?: number;
  weight?: number;
  
  // Vendor & service (3 fields)
  vendor?: string;
  vendorWebsite?: string;
  serviceId?: string;
  
  // Status & metadata (2 fields)
  verified?: boolean;
  ownerId?: string;
  
  // Notes (1 field)
  notes?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface CreateAssetData {
  assetTag: string;
  name: string;
  
  // Enhanced identification
  manufacturer?: string;
  modelNumber?: string;
  serialNumber?: string;
  description?: string;
  catalogName?: string;
  catalogItemId?: string;
  
  // Status and core info
  status?: 'ACTIVE' | 'MAINTENANCE' | 'RETIRED' | 'DISPOSED';
  location?: string;
  projectId?: string;
  
  // Categorization fields
  trade?: string;
  title?: string;
  preconSystem?: string;
  operationsSystem?: string;
  drawingAbbreviation?: string;
  preconTag?: string;
  systemTypeId?: string;
  systemCategory?: string;
  assetCategory?: string;
  assetCategoryName?: string;
  assetType?: string;
  type?: string;
  equipNameId?: string;
  subSystemType?: string;
  subSystemId?: string;
  subSystemClass?: string;
  subSystemClassification?: string;
  classId?: string;
  equipServedBy?: string;
  
  // Location fields
  customerName?: string;
  propertyName?: string;
  buildingName?: string;
  floor?: string;
  floorName?: string;
  area?: string;
  roomNumber?: string;
  assetLocation?: string;
  propertyZoneServed?: string;
  xCoordinate?: number;
  yCoordinate?: number;
  
  // TCO & Cost fields
  purchaseCost?: number;
  installationCost?: number;
  annualMaintenanceCost?: number;
  estimatedAnnualOperatingCost?: number;
  disposalCost?: number;
  salvageValue?: number;
  totalCostOfOwnership?: number;
  depreciationMethod?: string;
  currentBookValue?: number;
  
  // Energy fields
  ratedPowerKw?: number;
  actualPowerKw?: number;
  dailyOperatingHours?: number;
  estimatedAnnualKwh?: number;
  voltage?: number;
  btuRating?: number;
  
  // Lifecycle dates
  installDate?: string;
  manufactureDate?: string;
  serviceLife?: number;
  expectedLifetime?: number;
  
  // Size & measurement
  equipmentSize?: string;
  size?: string;
  unit?: string;
  quantity?: number;
  squareFeet?: number;
  weight?: number;
  
  // Vendor & service
  vendor?: string;
  vendorWebsite?: string;
  serviceId?: string;
  
  // Status & metadata
  verified?: boolean;
  ownerId?: string;
  
  // Notes
  notes?: string;
}

export interface UpdateAssetData {
  assetTag?: string;
  name?: string;
  
  // Enhanced identification
  manufacturer?: string;
  modelNumber?: string;
  serialNumber?: string;
  description?: string;
  catalogName?: string;
  catalogItemId?: string;
  
  // Status and core info
  status?: 'ACTIVE' | 'MAINTENANCE' | 'RETIRED' | 'DISPOSED';
  location?: string;
  projectId?: string;
  
  // All comprehensive fields (same as CreateAssetData)
  trade?: string;
  title?: string;
  preconSystem?: string;
  operationsSystem?: string;
  drawingAbbreviation?: string;
  preconTag?: string;
  systemTypeId?: string;
  systemCategory?: string;
  assetCategory?: string;
  assetCategoryName?: string;
  assetType?: string;
  type?: string;
  equipNameId?: string;
  subSystemType?: string;
  subSystemId?: string;
  subSystemClass?: string;
  subSystemClassification?: string;
  classId?: string;
  equipServedBy?: string;
  customerName?: string;
  propertyName?: string;
  buildingName?: string;
  floor?: string;
  floorName?: string;
  area?: string;
  roomNumber?: string;
  assetLocation?: string;
  propertyZoneServed?: string;
  xCoordinate?: number;
  yCoordinate?: number;
  purchaseCost?: number;
  installationCost?: number;
  annualMaintenanceCost?: number;
  estimatedAnnualOperatingCost?: number;
  disposalCost?: number;
  salvageValue?: number;
  totalCostOfOwnership?: number;
  depreciationMethod?: string;
  currentBookValue?: number;
  ratedPowerKw?: number;
  actualPowerKw?: number;
  dailyOperatingHours?: number;
  estimatedAnnualKwh?: number;
  voltage?: number;
  btuRating?: number;
  installDate?: string;
  manufactureDate?: string;
  serviceLife?: number;
  expectedLifetime?: number;
  equipmentSize?: string;
  size?: string;
  unit?: string;
  quantity?: number;
  squareFeet?: number;
  weight?: number;
  vendor?: string;
  vendorWebsite?: string;
  serviceId?: string;
  verified?: boolean;
  ownerId?: string;
  notes?: string;
}

export interface AssetApiResponse {
  success: true;
  data: {
    assets: Asset[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  correlationId: string;
  timestamp: string;
}

export interface SingleAssetApiResponse {
  success: true;
  data: Asset;
  correlationId: string;
  timestamp: string;
}