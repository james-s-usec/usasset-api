import { apiService } from './api';
import type { AssetDocument, AssetNotes, AssetDocumentation } from '../types/document.types';

class DocumentService {
  // Get all documents for an asset
  async getAssetDocuments(projectId: string, assetId: string): Promise<AssetDocument[]> {
    const response = await apiService.get<{ data: AssetDocument[] }>(
      `/projects/${projectId}/assets/${assetId}/documents`
    );
    return response.data;
  }

  // Get complete documentation with stats
  async getAssetDocumentation(projectId: string, assetId: string): Promise<AssetDocumentation> {
    const response = await apiService.get<{ data: AssetDocumentation }>(
      `/projects/${projectId}/assets/${assetId}/documentation`
    );
    return response.data;
  }

  // Upload document to asset
  async uploadAssetDocument(
    projectId: string,
    assetId: string,
    file: File,
    fileType: string
  ): Promise<AssetDocument> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiService.postFormData<{ data: AssetDocument }>(
      `/projects/${projectId}/assets/${assetId}/documents?file_type=${fileType}`,
      formData
    );
    return response.data;
  }

  // Delete asset document
  async deleteAssetDocument(
    projectId: string,
    assetId: string,
    documentId: string
  ): Promise<void> {
    await apiService.delete(
      `/projects/${projectId}/assets/${assetId}/documents/${documentId}`
    );
  }

  // Get asset notes
  async getAssetNotes(projectId: string, assetId: string): Promise<AssetNotes> {
    const response = await apiService.get<{ data: AssetNotes }>(
      `/projects/${projectId}/assets/${assetId}/notes`
    );
    return response.data;
  }

  // Update asset notes
  async updateAssetNotes(
    projectId: string,
    assetId: string,
    notes: Partial<AssetNotes>
  ): Promise<AssetNotes> {
    const response = await apiService.put<{ data: AssetNotes }>(
      `/projects/${projectId}/assets/${assetId}/notes`,
      notes
    );
    return response.data;
  }
}

export const documentService = new DocumentService();