import { useMemo, useState } from 'react';
import type { GridReadyEvent, ColDef, ICellRendererParams } from 'ag-grid-community';
import type { Asset } from '../types';
import { useActionsCellRenderer, useStatusCellRenderer, useGridComponents } from '../components/useGridRenderers';
import { columnCategories, getEnabledColumns, type ColumnCategory } from '../columnConfig';

interface UseAssetGridLogicProps {
  onEdit: (asset: Asset) => void;
  onDelete: (id: string) => Promise<void>;
}

export interface UseAssetGridLogicResult {
  columnDefs: ColDef[];
  components: {
    actionsRenderer: (params: ICellRendererParams) => React.ReactElement;
    statusRenderer: (params: ICellRendererParams) => React.ReactElement;
  };
  onGridReady: (params: GridReadyEvent) => void;
  categories: ColumnCategory[];
  updateCategories: (categories: ColumnCategory[]) => void;
}

export const useAssetGridLogic = ({ onEdit, onDelete }: UseAssetGridLogicProps): UseAssetGridLogicResult => {
  const actionsCellRenderer = useActionsCellRenderer({ onEdit, onDelete });
  const statusCellRenderer = useStatusCellRenderer();
  const components = useGridComponents(actionsCellRenderer, statusCellRenderer);

  // State for managing column categories
  const [categories, setCategories] = useState<ColumnCategory[]>(() => columnCategories);

  // Generate column definitions from enabled categories
  const columnDefs = useMemo((): ColDef[] => {
    return getEnabledColumns(categories);
  }, [categories]);

  // Update categories function
  const updateCategories = (newCategories: ColumnCategory[]): void => {
    setCategories(newCategories);
  };

  const onGridReady = (params: GridReadyEvent): void => {
    params.api.sizeColumnsToFit();
  };

  return { columnDefs, components, onGridReady, categories, updateCategories };
};