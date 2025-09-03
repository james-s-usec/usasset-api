export interface Asset {
  id: string;
  assetTag: string;
  name: string;
  manufacturer?: string;
  modelNumber?: string;
  serialNumber?: string;
  status?: 'ACTIVE' | 'MAINTENANCE' | 'RETIRED' | 'DISPOSED';
  location?: string;
  projectId?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAssetData {
  assetTag: string;
  name: string;
  manufacturer?: string;
  modelNumber?: string;
  serialNumber?: string;
  status?: 'ACTIVE' | 'MAINTENANCE' | 'RETIRED' | 'DISPOSED';
  location?: string;
  projectId?: string;
}

export interface UpdateAssetData {
  assetTag?: string;
  name?: string;
  manufacturer?: string;
  modelNumber?: string;
  serialNumber?: string;
  status?: 'ACTIVE' | 'MAINTENANCE' | 'RETIRED' | 'DISPOSED';
  location?: string;
  projectId?: string;
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