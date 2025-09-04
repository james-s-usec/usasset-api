import type { ColDef, ColGroupDef } from 'ag-grid-community';

// Column category definitions for modular management
export interface ColumnCategory {
  id: string;
  name: string;
  enabled: boolean;
  columns: ColDef[];
}

// Status cell renderer function name - will be handled by component
const statusCellRenderer = 'statusRenderer';

// Standard value formatter for null/undefined values
const nullValueFormatter = (params: { value?: unknown }): string => params.value ? String(params.value) : '-';

// Date formatter for consistent date display
const dateFormatter = (params: { value?: string | Date }): string => {
  return params.value ? new Date(params.value).toLocaleDateString() : '-';
};

// Currency formatter for cost fields
const currencyFormatter = (params: { value?: number }): string => {
  return params.value ? `$${params.value.toLocaleString()}` : '-';
};

// Number formatter with appropriate decimal places
const numberFormatter = (params: { value?: number | string }, decimals: number = 2): string => {
  return params.value !== null && params.value !== undefined 
    ? Number(params.value).toFixed(decimals) 
    : '-';
};

// Core columns that are always visible
export const coreColumns: ColDef[] = [
  {
    headerName: 'Asset Tag',
    field: 'assetTag',
    sortable: true,
    filter: true,
    flex: 1,
    minWidth: 120,
    pinned: 'left',
    lockPinned: true,
  },
  {
    headerName: 'Name',
    field: 'name',
    sortable: true,
    filter: true,
    flex: 2,
    minWidth: 180,
  },
  {
    headerName: 'Status',
    field: 'status',
    sortable: true,
    filter: true,
    flex: 1,
    minWidth: 100,
    cellRenderer: statusCellRenderer,
  },
  {
    headerName: 'Condition',
    field: 'condition',
    sortable: true,
    filter: true,
    flex: 1,
    minWidth: 100,
    valueFormatter: nullValueFormatter,
  },
];

// Action column that's always pinned right
export const actionColumn: ColDef = {
  headerName: 'Actions',
  cellRenderer: 'actionsRenderer', // Custom renderer passed from component
  flex: 1,
  minWidth: 140,
  sortable: false,
  filter: false,
  pinned: 'right',
  lockPinned: true,
};

// Column categories for modular management
export const columnCategories: ColumnCategory[] = [
  {
    id: 'identification',
    name: 'Identification',
    enabled: true,
    columns: [
      {
        headerName: 'Manufacturer',
        field: 'manufacturer',
        sortable: true,
        filter: true,
        flex: 1,
        minWidth: 130,
        valueFormatter: nullValueFormatter,
      },
      {
        headerName: 'Model',
        field: 'modelNumber',
        sortable: true,
        filter: true,
        flex: 1,
        minWidth: 120,
        valueFormatter: nullValueFormatter,
      },
      {
        headerName: 'Serial Number',
        field: 'serialNumber',
        sortable: true,
        filter: true,
        flex: 1,
        minWidth: 130,
        valueFormatter: nullValueFormatter,
      },
      {
        headerName: 'Description',
        field: 'description',
        sortable: true,
        filter: true,
        flex: 2,
        minWidth: 200,
        valueFormatter: nullValueFormatter,
      },
      {
        headerName: 'Catalog Name',
        field: 'catalogName',
        sortable: true,
        filter: true,
        flex: 1,
        minWidth: 150,
        valueFormatter: nullValueFormatter,
      },
    ],
  },
  {
    id: 'categorization',
    name: 'Categorization',
    enabled: false, // Hidden by default due to many fields
    columns: [
      {
        headerName: 'Trade',
        field: 'trade',
        sortable: true,
        filter: true,
        flex: 1,
        minWidth: 120,
        valueFormatter: nullValueFormatter,
      },
      {
        headerName: 'Asset Category',
        field: 'assetCategory',
        sortable: true,
        filter: true,
        flex: 1,
        minWidth: 150,
        valueFormatter: nullValueFormatter,
      },
      {
        headerName: 'Asset Type',
        field: 'assetType',
        sortable: true,
        filter: true,
        flex: 1,
        minWidth: 130,
        valueFormatter: nullValueFormatter,
      },
      {
        headerName: 'System Category',
        field: 'systemCategory',
        sortable: true,
        filter: true,
        flex: 1,
        minWidth: 150,
        valueFormatter: nullValueFormatter,
      },
      {
        headerName: 'Sub System Type',
        field: 'subSystemType',
        sortable: true,
        filter: true,
        flex: 1,
        minWidth: 150,
        valueFormatter: nullValueFormatter,
      },
    ],
  },
  {
    id: 'location',
    name: 'Location',
    enabled: true,
    columns: [
      {
        headerName: 'Location',
        field: 'location',
        sortable: true,
        filter: true,
        flex: 1.5,
        minWidth: 160,
        valueFormatter: nullValueFormatter,
      },
      {
        headerName: 'Building',
        field: 'buildingName',
        sortable: true,
        filter: true,
        flex: 1,
        minWidth: 130,
        valueFormatter: nullValueFormatter,
      },
      {
        headerName: 'Floor',
        field: 'floor',
        sortable: true,
        filter: true,
        flex: 1,
        minWidth: 100,
        valueFormatter: nullValueFormatter,
      },
      {
        headerName: 'Room',
        field: 'roomNumber',
        sortable: true,
        filter: true,
        flex: 1,
        minWidth: 100,
        valueFormatter: nullValueFormatter,
      },
      {
        headerName: 'Area',
        field: 'area',
        sortable: true,
        filter: true,
        flex: 1,
        minWidth: 120,
        valueFormatter: nullValueFormatter,
      },
    ],
  },
  {
    id: 'financial',
    name: 'Financial/TCO',
    enabled: false, // Hidden by default - show on demand
    columns: [
      {
        headerName: 'Purchase Cost',
        field: 'purchaseCost',
        sortable: true,
        filter: 'agNumberColumnFilter',
        flex: 1,
        minWidth: 130,
        valueFormatter: currencyFormatter,
        type: 'numericColumn',
      },
      {
        headerName: 'Installation Cost',
        field: 'installationCost',
        sortable: true,
        filter: 'agNumberColumnFilter',
        flex: 1,
        minWidth: 140,
        valueFormatter: currencyFormatter,
        type: 'numericColumn',
      },
      {
        headerName: 'Annual Maintenance',
        field: 'annualMaintenanceCost',
        sortable: true,
        filter: 'agNumberColumnFilter',
        flex: 1,
        minWidth: 150,
        valueFormatter: currencyFormatter,
        type: 'numericColumn',
      },
      {
        headerName: 'Total Cost of Ownership',
        field: 'totalCostOfOwnership',
        sortable: true,
        filter: 'agNumberColumnFilter',
        flex: 1,
        minWidth: 180,
        valueFormatter: currencyFormatter,
        type: 'numericColumn',
      },
    ],
  },
  {
    id: 'energy',
    name: 'Energy & Technical',
    enabled: false, // Hidden by default
    columns: [
      {
        headerName: 'Rated Power (kW)',
        field: 'ratedPowerKw',
        sortable: true,
        filter: 'agNumberColumnFilter',
        flex: 1,
        minWidth: 130,
        valueFormatter: (params) => numberFormatter(params, 2),
        type: 'numericColumn',
      },
      {
        headerName: 'Actual Power (kW)',
        field: 'actualPowerKw',
        sortable: true,
        filter: 'agNumberColumnFilter',
        flex: 1,
        minWidth: 140,
        valueFormatter: (params) => numberFormatter(params, 2),
        type: 'numericColumn',
      },
      {
        headerName: 'Annual kWh',
        field: 'estimatedAnnualKwh',
        sortable: true,
        filter: 'agNumberColumnFilter',
        flex: 1,
        minWidth: 130,
        valueFormatter: (params) => numberFormatter(params, 0),
        type: 'numericColumn',
      },
      {
        headerName: 'Voltage',
        field: 'voltage',
        sortable: true,
        filter: 'agNumberColumnFilter',
        flex: 1,
        minWidth: 100,
        valueFormatter: (params) => params.value ? `${params.value}V` : '-',
        type: 'numericColumn',
      },
      {
        headerName: 'BTU Rating',
        field: 'btuRating',
        sortable: true,
        filter: 'agNumberColumnFilter',
        flex: 1,
        minWidth: 120,
        valueFormatter: (params) => params.value ? `${params.value.toLocaleString()} BTU` : '-',
        type: 'numericColumn',
      },
    ],
  },
  {
    id: 'lifecycle',
    name: 'Lifecycle',
    enabled: false, // Hidden by default
    columns: [
      {
        headerName: 'Install Date',
        field: 'installDate',
        sortable: true,
        filter: 'agDateColumnFilter',
        flex: 1,
        minWidth: 120,
        valueFormatter: dateFormatter,
      },
      {
        headerName: 'Manufacture Date',
        field: 'manufactureDate',
        sortable: true,
        filter: 'agDateColumnFilter',
        flex: 1,
        minWidth: 140,
        valueFormatter: dateFormatter,
      },
      {
        headerName: 'Service Life (Years)',
        field: 'serviceLife',
        sortable: true,
        filter: 'agNumberColumnFilter',
        flex: 1,
        minWidth: 150,
        valueFormatter: (params) => params.value ? `${params.value} years` : '-',
        type: 'numericColumn',
      },
    ],
  },
  {
    id: 'physical',
    name: 'Physical Properties',
    enabled: false, // Hidden by default
    columns: [
      {
        headerName: 'Size',
        field: 'size',
        sortable: true,
        filter: true,
        flex: 1,
        minWidth: 100,
        valueFormatter: nullValueFormatter,
      },
      {
        headerName: 'Weight',
        field: 'weight',
        sortable: true,
        filter: 'agNumberColumnFilter',
        flex: 1,
        minWidth: 100,
        valueFormatter: (params) => params.value ? `${params.value} lbs` : '-',
        type: 'numericColumn',
      },
      {
        headerName: 'Square Feet',
        field: 'squareFeet',
        sortable: true,
        filter: 'agNumberColumnFilter',
        flex: 1,
        minWidth: 120,
        valueFormatter: (params) => params.value ? `${params.value} sq ft` : '-',
        type: 'numericColumn',
      },
      {
        headerName: 'Quantity',
        field: 'quantity',
        sortable: true,
        filter: 'agNumberColumnFilter',
        flex: 1,
        minWidth: 100,
        valueFormatter: (params) => numberFormatter(params, 0),
        type: 'numericColumn',
      },
    ],
  },
  {
    id: 'vendor',
    name: 'Vendor & Service',
    enabled: false, // Hidden by default
    columns: [
      {
        headerName: 'Vendor',
        field: 'vendor',
        sortable: true,
        filter: true,
        flex: 1,
        minWidth: 130,
        valueFormatter: nullValueFormatter,
      },
      {
        headerName: 'Service ID',
        field: 'serviceId',
        sortable: true,
        filter: true,
        flex: 1,
        minWidth: 130,
        valueFormatter: nullValueFormatter,
      },
    ],
  },
  {
    id: 'metadata',
    name: 'Metadata',
    enabled: true, // Always show timestamps
    columns: [
      {
        headerName: 'Created',
        field: 'created_at',
        sortable: true,
        filter: 'agDateColumnFilter',
        flex: 1,
        minWidth: 110,
        valueFormatter: dateFormatter,
      },
      {
        headerName: 'Updated',
        field: 'updated_at',
        sortable: true,
        filter: 'agDateColumnFilter',
        flex: 1,
        minWidth: 110,
        valueFormatter: dateFormatter,
      },
    ],
  },
];

// Helper function to get enabled columns
export const getEnabledColumns = (categories: ColumnCategory[]): ColDef[] => {
  const enabledColumns: ColDef[] = [...coreColumns];
  
  categories.forEach(category => {
    if (category.enabled) {
      enabledColumns.push(...category.columns);
    }
  });
  
  enabledColumns.push(actionColumn);
  return enabledColumns;
};

// Column group definitions for organizing columns in the header
export const createColumnGroups = (categories: ColumnCategory[]): (ColDef | ColGroupDef)[] => {
  const groups: (ColDef | ColGroupDef)[] = [...coreColumns];
  
  categories.forEach(category => {
    if (category.enabled && category.columns.length > 0) {
      groups.push({
        headerName: category.name,
        children: category.columns,
        headerClass: 'ag-header-group-custom',
      });
    }
  });
  
  groups.push(actionColumn);
  return groups;
};

// Default column configuration
export const defaultColDef: ColDef = {
  resizable: true,
  sortable: true,
  filter: true,
  flex: 1,
  minWidth: 100,
};

// Column type definitions for AG-Grid
export const columnTypes = {
  numericColumn: {
    filter: 'agNumberColumnFilter',
    cellClass: 'ag-right-aligned-cell',
    headerClass: 'ag-right-aligned-header',
  },
};