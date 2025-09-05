import React, { useMemo, useCallback } from "react";
import { Box, Button } from "@mui/material";
import type { ICellRendererParams } from "ag-grid-community";
import type { Asset } from "../types";

interface ActionsCellRendererProps {
  onEdit: (asset: Asset) => void;
  onDelete: (id: string) => Promise<void>;
  onViewDocuments?: (asset: Asset) => void;
}

const ActionButton: React.FC<{ 
  onClick: () => void; 
  color?: "primary" | "info" | "error"; 
  children: React.ReactNode; 
}> = ({ onClick, color, children }) => (
  <Button size="small" variant="outlined" color={color} onClick={onClick}>
    {children}
  </Button>
);

export const useActionsCellRenderer = ({ onEdit, onDelete, onViewDocuments }: ActionsCellRendererProps): ((params: ICellRendererParams<Asset>) => React.ReactElement) => {
  return useCallback((params: ICellRendererParams<Asset>) => {
    if (!params.data) return <Box />;
    
    return (
      <Box sx={{ display: "flex", gap: 1, alignItems: "center", height: "100%" }}>
        <ActionButton onClick={() => onEdit(params.data!)}>Edit</ActionButton>
        {onViewDocuments && (
          <ActionButton onClick={() => onViewDocuments(params.data!)} color="info">
            Documents
          </ActionButton>
        )}
        <ActionButton onClick={() => onDelete(params.data!.id)} color="error">
          Delete
        </ActionButton>
      </Box>
    );
  }, [onEdit, onDelete, onViewDocuments]);
};

export const useStatusCellRenderer = (): ((params: ICellRendererParams) => React.ReactElement) => {
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

export const useGridComponents = (actionsCellRenderer: (params: ICellRendererParams<Asset>) => React.ReactElement, statusCellRenderer: (params: ICellRendererParams) => React.ReactElement): { actionsRenderer: (params: ICellRendererParams<Asset>) => React.ReactElement; statusRenderer: (params: ICellRendererParams) => React.ReactElement } => {
  return useMemo(() => ({
    actionsRenderer: actionsCellRenderer,
    statusRenderer: statusCellRenderer,
  }), [actionsCellRenderer, statusCellRenderer]);
};
