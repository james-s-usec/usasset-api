import { apiService } from '../../services/api';
import type { CreateAssetData, UpdateAssetData, AssetApiResponse, SingleAssetApiResponse } from './types';

export class AssetService {
  private static readonly BASE_PATH = '/api/assets';

  static async getAssets(page = 1, limit = 10): Promise<AssetApiResponse> {
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
}