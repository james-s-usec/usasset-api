import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { AssetStatus, AssetCondition } from '@prisma/client';

/**
 * Safe asset response DTO with all comprehensive fields exposed
 * Excludes only sensitive audit fields (is_deleted)
 */
export class SafeAssetDto {
  @ApiProperty({ description: 'Asset unique identifier' })
  @Expose()
  public id!: string;

  @ApiProperty({ description: 'Asset tag identifier' })
  @Expose()
  public assetTag!: string;

  @ApiProperty({ description: 'Asset name' })
  @Expose()
  public name!: string;

  @ApiPropertyOptional({ description: 'Asset manufacturer' })
  @Expose()
  public manufacturer?: string;

  @ApiPropertyOptional({ description: 'Asset model number' })
  @Expose()
  public modelNumber?: string;

  @ApiPropertyOptional({ description: 'Asset serial number' })
  @Expose()
  public serialNumber?: string;

  @ApiPropertyOptional({ description: 'Asset status', enum: AssetStatus })
  @Expose()
  public status?: AssetStatus;

  @ApiPropertyOptional({ description: 'Asset condition', enum: AssetCondition })
  @Expose()
  public condition?: AssetCondition;

  @ApiPropertyOptional({ description: 'Asset location' })
  @Expose()
  public location?: string;

  @ApiPropertyOptional({ description: 'Project ID this asset belongs to' })
  @Expose()
  public projectId?: string;

  // Enhanced identification
  @ApiPropertyOptional({ description: 'Asset description' })
  @Expose()
  public description?: string;

  @ApiPropertyOptional({ description: 'Catalog name' })
  @Expose()
  public catalogName?: string;

  @ApiPropertyOptional({ description: 'Catalog item ID' })
  @Expose()
  public catalogItemId?: string;

  // Categorization fields
  @ApiPropertyOptional({ description: 'Trade/Department responsible' })
  @Expose()
  public trade?: string;

  @ApiPropertyOptional({ description: 'Asset title/role' })
  @Expose()
  public title?: string;

  @ApiPropertyOptional({ description: 'Preconstruction system' })
  @Expose()
  public preconSystem?: string;

  @ApiPropertyOptional({ description: 'Operations system' })
  @Expose()
  public operationsSystem?: string;

  @ApiPropertyOptional({ description: 'Drawing abbreviation' })
  @Expose()
  public drawingAbbreviation?: string;

  @ApiPropertyOptional({ description: 'Preconstruction tag' })
  @Expose()
  public preconTag?: string;

  @ApiPropertyOptional({ description: 'System type ID' })
  @Expose()
  public systemTypeId?: string;

  @ApiPropertyOptional({ description: 'System category' })
  @Expose()
  public systemCategory?: string;

  @ApiPropertyOptional({ description: 'Asset category' })
  @Expose()
  public assetCategory?: string;

  @ApiPropertyOptional({ description: 'Asset category name' })
  @Expose()
  public assetCategoryName?: string;

  @ApiPropertyOptional({ description: 'Asset type' })
  @Expose()
  public assetType?: string;

  @ApiPropertyOptional({ description: 'Generic type' })
  @Expose()
  public type?: string;

  @ApiPropertyOptional({ description: 'Equipment name ID' })
  @Expose()
  public equipNameId?: string;

  @ApiPropertyOptional({ description: 'Sub system type' })
  @Expose()
  public subSystemType?: string;

  @ApiPropertyOptional({ description: 'Sub system ID' })
  @Expose()
  public subSystemId?: string;

  @ApiPropertyOptional({ description: 'Sub system class' })
  @Expose()
  public subSystemClass?: string;

  @ApiPropertyOptional({ description: 'Sub system classification' })
  @Expose()
  public subSystemClassification?: string;

  @ApiPropertyOptional({ description: 'Class ID' })
  @Expose()
  public classId?: string;

  @ApiPropertyOptional({ description: 'Equipment served by' })
  @Expose()
  public equipServedBy?: string;

  // Location fields
  @ApiPropertyOptional({ description: 'Customer name' })
  @Expose()
  public customerName?: string;

  @ApiPropertyOptional({ description: 'Property name' })
  @Expose()
  public propertyName?: string;

  @ApiPropertyOptional({ description: 'Building name' })
  @Expose()
  public buildingName?: string;

  @ApiPropertyOptional({ description: 'Floor' })
  @Expose()
  public floor?: string;

  @ApiPropertyOptional({ description: 'Floor name' })
  @Expose()
  public floorName?: string;

  @ApiPropertyOptional({ description: 'Area' })
  @Expose()
  public area?: string;

  @ApiPropertyOptional({ description: 'Room number' })
  @Expose()
  public roomNumber?: string;

  @ApiPropertyOptional({ description: 'Asset location description' })
  @Expose()
  public assetLocation?: string;

  @ApiPropertyOptional({ description: 'Property zone served' })
  @Expose()
  public propertyZoneServed?: string;

  @ApiPropertyOptional({ description: 'X coordinate', type: 'number' })
  @Expose()
  public xCoordinate?: number;

  @ApiPropertyOptional({ description: 'Y coordinate', type: 'number' })
  @Expose()
  public yCoordinate?: number;

  // TCO & Cost fields
  @ApiPropertyOptional({ description: 'Initial purchase cost', type: 'number' })
  @Expose()
  public purchaseCost?: number;

  @ApiPropertyOptional({ description: 'Installation cost', type: 'number' })
  @Expose()
  public installationCost?: number;

  @ApiPropertyOptional({
    description: 'Annual maintenance cost',
    type: 'number',
  })
  @Expose()
  public annualMaintenanceCost?: number;

  @ApiPropertyOptional({
    description: 'Estimated annual operating cost',
    type: 'number',
  })
  @Expose()
  public estimatedAnnualOperatingCost?: number;

  @ApiPropertyOptional({
    description: 'Expected disposal cost',
    type: 'number',
  })
  @Expose()
  public disposalCost?: number;

  @ApiPropertyOptional({
    description: 'Expected salvage value',
    type: 'number',
  })
  @Expose()
  public salvageValue?: number;

  @ApiPropertyOptional({ description: 'Calculated TCO', type: 'number' })
  @Expose()
  public totalCostOfOwnership?: number;

  @ApiPropertyOptional({ description: 'Depreciation method' })
  @Expose()
  public depreciationMethod?: string;

  @ApiPropertyOptional({ description: 'Current book value', type: 'number' })
  @Expose()
  public currentBookValue?: number;

  // Energy fields
  @ApiPropertyOptional({
    description: 'Rated power in kilowatts',
    type: 'number',
  })
  @Expose()
  public ratedPowerKw?: number;

  @ApiPropertyOptional({
    description: 'Actual measured power in kilowatts',
    type: 'number',
  })
  @Expose()
  public actualPowerKw?: number;

  @ApiPropertyOptional({
    description: 'Average daily operating hours',
    type: 'number',
  })
  @Expose()
  public dailyOperatingHours?: number;

  @ApiPropertyOptional({
    description: 'Estimated annual kWh consumption',
    type: 'number',
  })
  @Expose()
  public estimatedAnnualKwh?: number;

  @ApiPropertyOptional({ description: 'Voltage', type: 'integer' })
  @Expose()
  public voltage?: number;

  @ApiPropertyOptional({ description: 'BTU rating', type: 'integer' })
  @Expose()
  public btuRating?: number;

  // Lifecycle dates
  @ApiPropertyOptional({ description: 'Installation date' })
  @Expose()
  public installDate?: Date;

  @ApiPropertyOptional({ description: 'Manufacture date' })
  @Expose()
  public manufactureDate?: Date;

  @ApiPropertyOptional({
    description: 'Service life in years',
    type: 'integer',
  })
  @Expose()
  public serviceLife?: number;

  @ApiPropertyOptional({
    description: 'Expected lifetime in years',
    type: 'integer',
  })
  @Expose()
  public expectedLifetime?: number;

  // Size & measurement
  @ApiPropertyOptional({ description: 'Equipment size' })
  @Expose()
  public equipmentSize?: string;

  @ApiPropertyOptional({ description: 'Size' })
  @Expose()
  public size?: string;

  @ApiPropertyOptional({ description: 'Unit of measurement' })
  @Expose()
  public unit?: string;

  @ApiPropertyOptional({ description: 'Quantity', type: 'integer' })
  @Expose()
  public quantity?: number;

  @ApiPropertyOptional({ description: 'Square feet', type: 'number' })
  @Expose()
  public squareFeet?: number;

  @ApiPropertyOptional({ description: 'Weight', type: 'number' })
  @Expose()
  public weight?: number;

  // Vendor & service
  @ApiPropertyOptional({ description: 'Vendor name' })
  @Expose()
  public vendor?: string;

  @ApiPropertyOptional({ description: 'Vendor website' })
  @Expose()
  public vendorWebsite?: string;

  @ApiPropertyOptional({ description: 'Service contract ID' })
  @Expose()
  public serviceId?: string;

  // Status & metadata
  @ApiPropertyOptional({ description: 'Data verified flag', type: 'boolean' })
  @Expose()
  public verified?: boolean;

  @ApiPropertyOptional({ description: 'Owner ID' })
  @Expose()
  public ownerId?: string;

  // Notes
  @ApiPropertyOptional({ description: 'General notes' })
  @Expose()
  public notes?: string;

  // Technical specification fields (missing from current DTO)
  @ApiPropertyOptional({ description: 'Motor horsepower', type: 'number' })
  @Expose()
  public motorHp?: number;

  @ApiPropertyOptional({
    description: 'Estimated operating hours per year',
    type: 'number',
  })
  @Expose()
  public estimatedOperatingHours?: number;

  @ApiPropertyOptional({ description: 'Number of circuits', type: 'number' })
  @Expose()
  public numberOfCircuits?: number;

  @ApiPropertyOptional({ description: 'Supply fan motor size' })
  @Expose()
  public supplyFanMotorSize?: string;

  @ApiPropertyOptional({ description: 'Return fan motor size' })
  @Expose()
  public returnFanMotorSize?: string;

  @ApiPropertyOptional({ description: 'Belt size' })
  @Expose()
  public beltSize?: string;

  @ApiPropertyOptional({ description: 'Belt quantity', type: 'number' })
  @Expose()
  public beltQuantity?: number;

  @ApiPropertyOptional({ description: 'Filter type' })
  @Expose()
  public filterType?: string;

  @ApiPropertyOptional({ description: 'Filter size' })
  @Expose()
  public filterSize?: string;

  @ApiPropertyOptional({ description: 'Filter quantity', type: 'number' })
  @Expose()
  public filterQuantity?: number;

  @ApiPropertyOptional({ description: 'Refrigerant type' })
  @Expose()
  public refrigerant?: string;

  @ApiPropertyOptional({ description: 'Refrigerant default description' })
  @Expose()
  public refrigerantDefaultDescription?: string;

  @ApiPropertyOptional({ description: 'Refrigerant description' })
  @Expose()
  public refrigerantDescription?: string;

  @ApiPropertyOptional({ description: 'Refrigerant quantity', type: 'number' })
  @Expose()
  public refrigerantQuantity?: number;

  @ApiPropertyOptional({ description: 'Rating name' })
  @Expose()
  public ratingName?: string;

  @ApiPropertyOptional({ description: 'Rating value' })
  @Expose()
  public ratingValue?: string;

  // Energy calculation fields (missing)
  @ApiPropertyOptional({ description: 'Power factor', type: 'number' })
  @Expose()
  public powerFactor?: number;

  @ApiPropertyOptional({ description: 'Operating amperage', type: 'number' })
  @Expose()
  public amperage?: number;

  @ApiPropertyOptional({ description: 'Electrical phase', type: 'number' })
  @Expose()
  public phase?: number;

  @ApiPropertyOptional({ description: 'Load factor', type: 'number' })
  @Expose()
  public loadFactor?: number;

  @ApiPropertyOptional({ description: 'Energy efficiency rating' })
  @Expose()
  public energyEfficiencyRating?: string;

  @ApiPropertyOptional({
    description: 'Energy efficiency value',
    type: 'number',
  })
  @Expose()
  public energyEfficiencyValue?: number;

  @ApiPropertyOptional({ description: 'Peak demand in kW', type: 'number' })
  @Expose()
  public peakDemandKw?: number;

  @ApiPropertyOptional({ description: 'Gas consumption rate', type: 'number' })
  @Expose()
  public gasConsumptionRate?: number;

  @ApiPropertyOptional({
    description: 'Annual gas consumption',
    type: 'number',
  })
  @Expose()
  public annualGasConsumption?: number;

  @ApiPropertyOptional({ description: 'Annual operating days', type: 'number' })
  @Expose()
  public annualOperatingDays?: number;

  @ApiPropertyOptional({
    description: 'Annual carbon emissions kg CO2',
    type: 'number',
  })
  @Expose()
  public annualCarbonEmissions?: number;

  @ApiPropertyOptional({
    description: 'Estimated annual electricity cost',
    type: 'number',
  })
  @Expose()
  public estimatedAnnualElectricityCost?: number;

  @ApiPropertyOptional({
    description: 'Estimated annual gas cost',
    type: 'number',
  })
  @Expose()
  public estimatedAnnualGasCost?: number;

  @ApiPropertyOptional({
    description: 'Total annual energy cost',
    type: 'number',
  })
  @Expose()
  public totalAnnualEnergyCost?: number;

  // Additional size fields
  @ApiPropertyOptional({ description: 'Asset size rounded up' })
  @Expose()
  public assetSizeRounded?: string;

  @ApiPropertyOptional({ description: 'ID unit' })
  @Expose()
  public idUnit?: string;

  // Additional lifecycle fields
  @ApiPropertyOptional({
    description: 'Industry service life years',
    type: 'number',
  })
  @Expose()
  public industryServiceLife?: number;

  @ApiPropertyOptional({
    description: 'Observed remaining life years',
    type: 'number',
  })
  @Expose()
  public observedRemainingLife?: number;

  @ApiPropertyOptional({ description: 'Estimated replacement date' })
  @Expose()
  public estimatedReplacementDate?: Date;

  @ApiPropertyOptional({ description: 'Warranty expiration date' })
  @Expose()
  public warrantyExpirationDate?: Date;

  // Structured notes (missing)
  @ApiPropertyOptional({ description: 'Note 1 subject' })
  @Expose()
  public note1Subject?: string;

  @ApiPropertyOptional({ description: 'Note 1 content' })
  @Expose()
  public note1?: string;

  @ApiPropertyOptional({ description: 'Note 2 subject' })
  @Expose()
  public note2Subject?: string;

  @ApiPropertyOptional({ description: 'Note 2 content' })
  @Expose()
  public note2?: string;

  @ApiPropertyOptional({ description: 'Note 3 subject' })
  @Expose()
  public note3Subject?: string;

  @ApiPropertyOptional({ description: 'Note 3 content' })
  @Expose()
  public note3?: string;

  @ApiPropertyOptional({ description: 'Note 4 subject' })
  @Expose()
  public note4Subject?: string;

  @ApiPropertyOptional({ description: 'Note 4 content' })
  @Expose()
  public note4?: string;

  @ApiPropertyOptional({ description: 'Note 5 subject' })
  @Expose()
  public note5Subject?: string;

  @ApiPropertyOptional({ description: 'Note 5 content' })
  @Expose()
  public note5?: string;

  @ApiPropertyOptional({ description: 'Note 6 subject' })
  @Expose()
  public note6Subject?: string;

  @ApiPropertyOptional({ description: 'Note 6 content' })
  @Expose()
  public note6?: string;

  // Legacy reference fields
  @ApiPropertyOptional({ description: 'Legacy branch ID' })
  @Expose()
  public legacyBranchId?: string;

  @ApiPropertyOptional({ description: 'Legacy client site equipment RN' })
  @Expose()
  public legacyClientSiteEquipmentRn?: string;

  @ApiPropertyOptional({ description: 'Legacy client site equipment name' })
  @Expose()
  public legacyClientSiteEquipmentName?: string;

  @ApiPropertyOptional({ description: 'Legacy internal asset ID' })
  @Expose()
  public legacyInternalAssetId?: string;

  @ApiPropertyOptional({ description: 'Legacy USAsset ID' })
  @Expose()
  public legacyUsAssetId?: string;

  @ApiPropertyOptional({ description: 'Legacy USE Asset ID' })
  @Expose()
  public legacyUseAssetId?: string;

  // Timestamps
  @ApiProperty({ description: 'Asset creation timestamp' })
  @Expose()
  public created_at!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  public updated_at!: Date;

  // Explicitly excluded: is_deleted and other sensitive audit fields
}
