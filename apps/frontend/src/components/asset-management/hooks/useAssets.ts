import { useState, useCallback } from 'react';
import type { Asset } from '../types';
import { AssetService } from '../assetService';

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

  return {
    assets,
    loading,
    error,
    fetchAssets,
    deleteAsset,
  };
};