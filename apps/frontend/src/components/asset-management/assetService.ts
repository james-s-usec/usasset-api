import { apiService } from '../../services/api';
import type { CreateAssetData, UpdateAssetData, AssetApiResponse, SingleAssetApiResponse, Asset } from './types';

export interface BulkUpdateRequest {
  assets: Array<{
    id: string;
    [key: string]: unknown;
  }>;
}

export interface BulkDeleteRequest {
  ids: string[];
  hardDelete?: boolean;
}

export interface BulkOperationResult {
  successful: number;
  failed: number;
  total: number;
  errors: Array<{
    id: string;
    error: string;
  }>;
  successfulIds: string[];
}

export class AssetService {
  private static readonly BASE_PATH = '/api/assets';

  static async getAssets(page = 1, limit = 100): Promise<AssetApiResponse> {
    return apiService.get<AssetApiResponse>(`${this.BASE_PATH}?page=${page}&limit=${limit}`);
  }

  static async getAsset(id: string): Promise<SingleAssetApiResponse> {
    return apiService.get<SingleAssetApiResponse>(`${this.BASE_PATH}/${id}`);
  }

  static async createAsset(data: CreateAssetData): Promise<SingleAssetApiResponse> {
    return apiService.post<SingleAssetApiResponse>(this.BASE_PATH, data);
  }

  static async updateAsset(id: string, data: UpdateAssetData): Promise<SingleAssetApiResponse> {
    return apiService.patch<SingleAssetApiResponse>(`${this.BASE_PATH}/${id}`, data);
  }

  static async deleteAsset(id: string): Promise<void> {
    return apiService.delete<void>(`${this.BASE_PATH}/${id}`);
  }

  // Bulk operations
  static async bulkUpdateAssets(updates: Partial<Asset>, assetIds: string[]): Promise<BulkOperationResult> {
    const request: BulkUpdateRequest = {
      assets: assetIds.map(id => ({ id, ...updates }))
    };
    const response = await apiService.patch<{data: BulkOperationResult}>(`${this.BASE_PATH}/bulk`, request);
    return response.data;
  }

  static async bulkDeleteAssets(assetIds: string[], hardDelete = false): Promise<BulkOperationResult> {
    const request: BulkDeleteRequest = {
      ids: assetIds,
      hardDelete
    };
    
    // Use the private request method for DELETE with body
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${this.BASE_PATH}/bulk`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }
}