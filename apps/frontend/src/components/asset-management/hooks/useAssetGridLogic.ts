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

export const useAssetGridLogic = ({ onEdit, onDelete, onViewDocuments }: UseAssetGridLogicProps): UseAssetGridLogicResult => {
  const actionsCellRenderer = useActionsCellRenderer({ onEdit, onDelete, onViewDocuments });
  const statusCellRenderer = useStatusCellRenderer();
  const components = useGridComponents(actionsCellRenderer, statusCellRenderer);

  // State for managing column categories and selection
  const [categories, setCategories] = useState<ColumnCategory[]>(() => columnCategories);
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);
  const [gridApi, setGridApi] = useState<GridApi<Asset> | null>(null);

  // Generate column definitions from enabled categories
  const columnDefs = useMemo((): ColDef[] => {
    return getEnabledColumns(categories);
  }, [categories]);

  // Update categories function
  const updateCategories = (newCategories: ColumnCategory[]): void => {
    setCategories(newCategories);
  };

  // Selection handling
  const onSelectionChanged = useCallback((selectedRows: Asset[]): void => {
    setSelectedAssets(selectedRows);
  }, []);

  // Bulk selection functions
  const selectAll = useCallback((): void => {
    gridApi?.selectAll();
  }, [gridApi]);

  const clearSelection = useCallback((): void => {
    gridApi?.deselectAll();
  }, [gridApi]);

  const onGridReady = (params: GridReadyEvent): void => {
    setGridApi(params.api);
    params.api.sizeColumnsToFit();
  };

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