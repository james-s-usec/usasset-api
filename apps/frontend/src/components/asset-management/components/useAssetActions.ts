import { useCallback } from "react";
import { AssetService } from "../assetService";
import type { Asset } from "../types";

export const useAssetActions = (fetchAssets: () => Promise<void>): { handleAdd: () => void; handleEdit: (asset: Asset) => void; handleDelete: (id: string) => Promise<void> } => {
  const handleAdd = useCallback((): void => {
    alert("Add asset functionality coming soon!");
  }, []);

  const handleEdit = useCallback((asset: Asset): void => {
    alert(`Edit asset functionality coming soon for ${asset.name}!`);
  }, []);

  const handleDelete = useCallback(async (id: string): Promise<void> => {
    if (window.confirm("Are you sure you want to delete this asset?")) {
      try {
        await AssetService.deleteAsset(id);
        await fetchAssets();
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : "Failed to delete asset");
      }
    }
  }, [fetchAssets]);

  return { handleAdd, handleEdit, handleDelete };
};
