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
const useGridState = () => {
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
const useGridOperations = (gridApi: GridApi<Asset> | null) => {
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
  const actionsCellRenderer = useActionsCellRenderer({ onEdit, onDelete, onViewDocuments });
  const statusCellRenderer = useStatusCellRenderer();
  const components = useGridComponents(actionsCellRenderer, statusCellRenderer);

  const {
    categories,
    selectedAssets,
    gridApi,
    updateCategories,
    onSelectionChanged,
    setGridApi
  } = useGridState();

  const { selectAll, clearSelection, onGridReady: handleGridReady } = useGridOperations(gridApi);

  const columnDefs = useMemo((): ColDef[] => {
    return getEnabledColumns(categories);
  }, [categories]);

  const onGridReady = useCallback((params: GridReadyEvent): void => {
    setGridApi(params.api);
    handleGridReady(params);
  }, [handleGridReady, setGridApi]);

  return { 
    columnDefs, 
    components, 
    onGridReady, 
    categories, 
    updateCategories,
    selectedAssets,
    onSelectionChanged,
    gridApi,
    selectAll,
    clearSelection
  };
};