import { useState, useCallback } from 'react';
import type { Asset } from '../types';
import { AssetService, type BulkOperationResult } from '../assetService';

/* eslint-disable max-lines-per-function, @typescript-eslint/explicit-function-return-type */
export const useAssets = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await AssetService.getAssets();
      setAssets(response.data.assets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAsset = useCallback(async (id: string): Promise<void> => {
    try {
      await AssetService.deleteAsset(id);
      fetchAssets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete asset');
    }
  }, [fetchAssets]);

  const bulkUpdateAssets = useCallback(async (
    updates: Partial<Asset>, 
    assetIds: string[]
  ): Promise<BulkOperationResult> => {
    try {
      setError(null);
      const result = await AssetService.bulkUpdateAssets(updates, assetIds);
      await fetchAssets(); // Refresh data after bulk update
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk update assets';
      setError(errorMessage);
      throw err;
    }
  }, [fetchAssets]);

  const bulkDeleteAssets = useCallback(async (
    assetIds: string[], 
    hardDelete = false
  ): Promise<BulkOperationResult> => {
    try {
      setError(null);
      const result = await AssetService.bulkDeleteAssets(assetIds, hardDelete);
      await fetchAssets(); // Refresh data after bulk delete
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk delete assets';
      setError(errorMessage);
      throw err;
    }
  }, [fetchAssets]);

  return {
    assets,
    loading,
    error,
    fetchAssets,
    deleteAsset,
    bulkUpdateAssets,
    bulkDeleteAssets,
  };
};