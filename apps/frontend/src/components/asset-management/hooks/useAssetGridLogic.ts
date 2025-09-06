import { useMemo, useState, useCallback } from 'react';
import type { GridReadyEvent, ColDef, ICellRendererParams, GridApi } from 'ag-grid-community';
import type { Asset } from '../types';
import { useActionsCellRenderer, useStatusCellRenderer, useGridComponents } from '../components/useGridRenderers';
import { columnCategories, getEnabledColumns, type ColumnCategory } from '../columnConfig';

interface UseAssetGridLogicProps {
  onEdit: (asset: Asset) => void;
  onDelete: (id: string) => Promise<void>;
  onViewDocuments?: (asset: Asset) => void;
}

export interface UseAssetGridLogicResult {
  columnDefs: ColDef[];
  components: {
    actionsRenderer: (params: ICellRendererParams<Asset>) => React.ReactElement;
    statusRenderer: (params: ICellRendererParams) => React.ReactElement;
  };
  onGridReady: (params: GridReadyEvent) => void;
  categories: ColumnCategory[];
  updateCategories: (categories: ColumnCategory[]) => void;
  selectedAssets: Asset[];
  onSelectionChanged: (selectedAssets: Asset[]) => void;
  gridApi: GridApi<Asset> | null;
  selectAll: () => void;
  clearSelection: () => void;
}

// Custom hook for managing grid state and categories
const useGridState = (): {
  categories: ColumnCategory[];
  selectedAssets: Asset[];
  gridApi: GridApi<Asset> | null;
  updateCategories: (categories: ColumnCategory[]) => void;
  onSelectionChanged: (selectedRows: Asset[]) => void;
  setGridApi: (api: GridApi<Asset>) => void;
} => {
  const [categories, setCategories] = useState<ColumnCategory[]>(() => columnCategories);
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);
  const [gridApi, setGridApi] = useState<GridApi<Asset> | null>(null);

  const updateCategories = useCallback((newCategories: ColumnCategory[]): void => {
    setCategories(newCategories);
  }, []);

  const onSelectionChanged = useCallback((selectedRows: Asset[]): void => {
    setSelectedAssets(selectedRows);
  }, []);

  return {
    categories,
    selectedAssets,
    gridApi,
    updateCategories,
    onSelectionChanged,
    setGridApi
  };
};

// Custom hook for grid operations
const useGridOperations = (gridApi: GridApi<Asset> | null): {
  selectAll: () => void;
  clearSelection: () => void;
  onGridReady: (params: GridReadyEvent) => void;
} => {
  const selectAll = useCallback((): void => {
    gridApi?.selectAll();
  }, [gridApi]);

  const clearSelection = useCallback((): void => {
    gridApi?.deselectAll();
  }, [gridApi]);

  const onGridReady = useCallback((params: GridReadyEvent): void => {
    params.api.sizeColumnsToFit();
  }, []);

  return { selectAll, clearSelection, onGridReady };
};

export const useAssetGridLogic = ({ onEdit, onDelete, onViewDocuments }: UseAssetGridLogicProps): UseAssetGridLogicResult => {
  const components = useGridComponents(
    useActionsCellRenderer({ onEdit, onDelete, onViewDocuments }),
    useStatusCellRenderer()
  );

  const gridState = useGridState();
  const gridOperations = useGridOperations(gridState.gridApi);
  
  const columnDefs = useMemo((): ColDef[] => getEnabledColumns(gridState.categories), [gridState.categories]);
  
  const onGridReady = useCallback((params: GridReadyEvent): void => {
    gridState.setGridApi(params.api);
    gridOperations.onGridReady(params);
  }, [gridState, gridOperations]);

  return { 
    columnDefs, 
    components, 
    onGridReady, 
    categories: gridState.categories, 
    updateCategories: gridState.updateCategories,
    selectedAssets: gridState.selectedAssets,
    onSelectionChanged: gridState.onSelectionChanged,
    gridApi: gridState.gridApi,
    selectAll: gridOperations.selectAll,
    clearSelection: gridOperations.clearSelection
  };
};