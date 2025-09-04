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
  status?: 'ACTIVE' | 'MAINTENANCE' | 'RETIRED' | 'DISPOSED' | 'INACTIVE' | 'LOST' | 'STOLEN';
  condition?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL' | 'UNKNOWN' | 'NOT_APPLICABLE';
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
  
  // Energy fields (comprehensive - 30+ fields)
  ratedPowerKw?: number;
  actualPowerKw?: number;
  dailyOperatingHours?: number;
  estimatedAnnualKwh?: number;
  voltage?: number;
  btuRating?: number;
  
  // Additional energy calculation fields
  powerFactor?: number;
  amperage?: number;
  phase?: number;
  loadFactor?: number;
  energyEfficiencyRating?: string;
  energyEfficiencyValue?: number;
  peakDemandKw?: number;
  gasConsumptionRate?: number;
  annualGasConsumption?: number;
  annualOperatingDays?: number;
  annualCarbonEmissions?: number;
  estimatedAnnualElectricityCost?: number;
  estimatedAnnualGasCost?: number;
  totalAnnualEnergyCost?: number;
  estimatedOperatingHours?: number;
  
  // Lifecycle dates (comprehensive - 12+ fields)
  installDate?: string;
  manufactureDate?: string;
  serviceLife?: number;
  expectedLifetime?: number;
  industryServiceLife?: number;
  observedRemainingLife?: number;
  estimatedReplacementDate?: string;
  warrantyExpirationDate?: string;
  
  // Size & measurement (comprehensive - 10+ fields)
  equipmentSize?: string;
  size?: string;
  unit?: string;
  quantity?: number;
  squareFeet?: number;
  weight?: number;
  assetSizeRounded?: string;
  idUnit?: string;
  
  // Vendor & service (3 fields)
  vendor?: string;
  vendorWebsite?: string;
  serviceId?: string;
  
  // Status & metadata (2 fields)
  verified?: boolean;
  ownerId?: string;
  
  // Technical specifications (missing HVAC/mechanical fields)
  motorHp?: number;
  numberOfCircuits?: number;
  supplyFanMotorSize?: string;
  returnFanMotorSize?: string;
  beltSize?: string;
  beltQuantity?: number;
  filterType?: string;
  filterSize?: string;
  filterQuantity?: number;
  refrigerant?: string;
  refrigerantDefaultDescription?: string;
  refrigerantDescription?: string;
  refrigerantQuantity?: number;
  ratingName?: string;
  ratingValue?: string;
  
  // Structured notes system (6 note fields)
  notes?: string;
  note1Subject?: string;
  note1?: string;
  note2Subject?: string;
  note2?: string;
  note3Subject?: string;
  note3?: string;
  note4Subject?: string;
  note4?: string;
  note5Subject?: string;
  note5?: string;
  note6Subject?: string;
  note6?: string;
  
  // Legacy integration fields (6 fields)
  legacyBranchId?: string;
  legacyClientSiteEquipmentRn?: string;
  legacyClientSiteEquipmentName?: string;
  legacyInternalAssetId?: string;
  legacyUsAssetId?: string;
  legacyUseAssetId?: string;
  
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
  status?: 'ACTIVE' | 'MAINTENANCE' | 'RETIRED' | 'DISPOSED' | 'INACTIVE' | 'LOST' | 'STOLEN';
  condition?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL' | 'UNKNOWN' | 'NOT_APPLICABLE';
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
  
  // Energy calculation fields (comprehensive)
  ratedPowerKw?: number;
  actualPowerKw?: number;
  dailyOperatingHours?: number;
  estimatedAnnualKwh?: number;
  voltage?: number;
  btuRating?: number;
  powerFactor?: number;
  amperage?: number;
  phase?: number;
  loadFactor?: number;
  energyEfficiencyRating?: string;
  energyEfficiencyValue?: number;
  peakDemandKw?: number;
  gasConsumptionRate?: number;
  annualGasConsumption?: number;
  annualOperatingDays?: number;
  annualCarbonEmissions?: number;
  estimatedAnnualElectricityCost?: number;
  estimatedAnnualGasCost?: number;
  totalAnnualEnergyCost?: number;
  estimatedOperatingHours?: number;

  // Lifecycle dates (comprehensive)
  installDate?: string;
  manufactureDate?: string;
  serviceLife?: number;
  expectedLifetime?: number;
  industryServiceLife?: number;
  observedRemainingLife?: number;
  estimatedReplacementDate?: string;
  warrantyExpirationDate?: string;

  // Size & measurement (comprehensive)
  equipmentSize?: string;
  size?: string;
  unit?: string;
  quantity?: number;
  squareFeet?: number;
  weight?: number;
  assetSizeRounded?: string;
  idUnit?: string;

  // Technical specifications (HVAC/mechanical)
  motorHp?: number;
  numberOfCircuits?: number;
  supplyFanMotorSize?: string;
  returnFanMotorSize?: string;
  beltSize?: string;
  beltQuantity?: number;
  filterType?: string;
  filterSize?: string;
  filterQuantity?: number;
  refrigerant?: string;
  refrigerantDefaultDescription?: string;
  refrigerantDescription?: string;
  refrigerantQuantity?: number;
  ratingName?: string;
  ratingValue?: string;

  // Structured notes system
  notes?: string;
  note1Subject?: string;
  note1?: string;
  note2Subject?: string;
  note2?: string;
  note3Subject?: string;
  note3?: string;
  note4Subject?: string;
  note4?: string;
  note5Subject?: string;
  note5?: string;
  note6Subject?: string;
  note6?: string;

  // Legacy integration fields
  legacyBranchId?: string;
  legacyClientSiteEquipmentRn?: string;
  legacyClientSiteEquipmentName?: string;
  legacyInternalAssetId?: string;
  legacyUsAssetId?: string;
  legacyUseAssetId?: string;
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
  status?: 'ACTIVE' | 'MAINTENANCE' | 'RETIRED' | 'DISPOSED' | 'INACTIVE' | 'LOST' | 'STOLEN';
  condition?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL' | 'UNKNOWN' | 'NOT_APPLICABLE';
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