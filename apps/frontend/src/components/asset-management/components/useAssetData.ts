import { useState, useCallback } from "react";
import { AssetService } from "../assetService";
import type { Asset } from "../types";

export const useAssetData = () => {
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
      setError(err instanceof Error ? err.message : "Failed to fetch assets");
    } finally {
      setLoading(false);
    }
  }, []);

  return { assets, loading, error, fetchAssets };
};
