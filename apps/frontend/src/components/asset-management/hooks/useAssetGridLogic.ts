import { useMemo } from 'react';
import type { GridReadyEvent, ColDef, ICellRendererParams } from 'ag-grid-community';
import type { Asset } from '../types';
import { useActionsCellRenderer, useStatusCellRenderer, useGridComponents } from '../components/useGridRenderers';

interface UseAssetGridLogicProps {
  onEdit: (asset: Asset) => void;
  onDelete: (id: string) => Promise<void>;
}

export const useAssetGridLogic = ({ onEdit, onDelete }: UseAssetGridLogicProps): { columnDefs: ColDef[]; components: { actionsRenderer: (params: ICellRendererParams) => React.ReactElement; statusRenderer: (params: ICellRendererParams) => React.ReactElement }; onGridReady: (params: GridReadyEvent) => void } => {
  const actionsCellRenderer = useActionsCellRenderer({ onEdit, onDelete });
  const statusCellRenderer = useStatusCellRenderer();
  const components = useGridComponents(actionsCellRenderer, statusCellRenderer);

  const columnDefs = useMemo((): ColDef[] => [
    { headerName: "Name", field: "name", sortable: true, filter: true },
    { headerName: "Category", field: "category", sortable: true, filter: true },
    { headerName: "Status", field: "status", cellRenderer: "statusRenderer" },
    { headerName: "Location", field: "location", sortable: true, filter: true },
    { headerName: "Actions", cellRenderer: "actionsRenderer", sortable: false, filter: false, width: 150 }
  ], []);

  const onGridReady = (params: GridReadyEvent): void => {
    params.api.sizeColumnsToFit();
  };

  return { columnDefs, components, onGridReady };
};