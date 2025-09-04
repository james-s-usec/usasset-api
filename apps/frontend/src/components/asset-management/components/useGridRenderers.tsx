import React, { useMemo, useCallback } from "react";
import { Box, Button } from "@mui/material";
import type { ICellRendererParams } from "ag-grid-community";
import type { Asset } from "../types";

interface ActionsCellRendererProps {
  onEdit: (asset: Asset) => void;
  onDelete: (id: string) => Promise<void>;
}

export const useActionsCellRenderer = ({ onEdit, onDelete }: ActionsCellRendererProps): ((params: ICellRendererParams<Asset>) => JSX.Element) => {
  return useCallback((params: ICellRendererParams<Asset>) => (
    <Box sx={{ display: "flex", gap: 1, alignItems: "center", height: "100%" }}>
      <Button 
        size="small" 
        variant="outlined"
        onClick={() => params.data && onEdit(params.data)}
      >
        Edit
      </Button>
      <Button 
        size="small" 
        variant="outlined" 
        color="error"
        onClick={() => params.data && onDelete(params.data.id)}
      >
        Delete
      </Button>
    </Box>
  ), [onEdit, onDelete]);
};

export const useStatusCellRenderer = (): ((params: ICellRendererParams) => JSX.Element) => {
  return useCallback((params: ICellRendererParams) => {
    const status = params.value || "ACTIVE";
    const colors = {
      ACTIVE: "#4caf50",
      MAINTENANCE: "#ff9800",
      RETIRED: "#9e9e9e",
      DISPOSED: "#f44336",
    };
    return (
      <Box 
        sx={{ 
          display: "inline-flex",
          alignItems: "center",
          px: 1,
          py: 0.5,
          borderRadius: 1,
          backgroundColor: colors[status as keyof typeof colors] + "20",
          color: colors[status as keyof typeof colors],
          fontSize: "0.75rem",
          fontWeight: "medium",
        }}
      >
        {status}
      </Box>
    );
  }, []);
};

export const useGridComponents = (actionsCellRenderer: (params: ICellRendererParams<Asset>) => JSX.Element, statusCellRenderer: (params: ICellRendererParams) => JSX.Element): { actionsRenderer: (params: ICellRendererParams<Asset>) => JSX.Element; statusRenderer: (params: ICellRendererParams) => JSX.Element } => {
  return useMemo(() => ({
    actionsRenderer: actionsCellRenderer,
    statusRenderer: statusCellRenderer,
  }), [actionsCellRenderer, statusCellRenderer]);
};
